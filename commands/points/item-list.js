import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { db } from "../../firestore.js";

export const data = new SlashCommandBuilder()
  .setName("item-list")
  .setDescription("アイテムショップと自分の持ち物を表示します");

const selectedItems = new Map();

// --------------------
// Slash コマンド実行
// --------------------
export async function execute(interaction) {
  const guildId = interaction.guildId;
  const userId = interaction.user.id;

  await interaction.deferReply();

  const { embed, rows } = await buildShopEmbed(guildId, interaction.guild.name, userId);
  await interaction.followUp({ embeds: [embed], components: rows });
}

// --------------------
// ショップ embed 作成
// --------------------
async function buildShopEmbed(guildId, guildName, userId) {
  const snapshot = await db.collection("servers").doc(guildId).collection("items").get();
  const embed = new EmbedBuilder()
    .setTitle(`🛒 ${guildName} ショップ`)
    .setColor("#00BFFF");

  if (snapshot.empty) {
    embed.setDescription("📦 ショップにアイテムはまだ登録されていません。");
    return { embed, rows: [buildToggleRow()] };
  }

  let desc = "";
  const options = [];

  snapshot.forEach(doc => {
    const item = doc.data();
    // doc.id が mid で登録されている想定。もし mid が別フィールドなら doc.id を使うなど調整してください。
    const mid = item.mid ?? doc.id;
    desc += `**${item.name}** (ID: \`${mid}\`) — ${item.price}pt | 在庫: ${item.stock}\n`;
    if (item.stock > 0) {
      options.push({
        label: `${item.name} (${item.price}pt)`,
        value: mid,
        description: `在庫: ${item.stock}`,
      });
    }
  });

  embed.setDescription(desc || " ");

  // Discord のセレクトは最大 25 オプション
  const limitedOptions = options.slice(0, 25);

  const rows = [];

  if (limitedOptions.length > 0) {
    const rowSelect = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`buy_select_${guildId}_${userId}`)
        .setPlaceholder("購入するアイテムを選択してください")
        .addOptions(limitedOptions)
    );
    rows.push(rowSelect);

    const rowBuy = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`buy_confirm_${guildId}_${userId}`)
        .setLabel("🛍️ 購入する")
        .setStyle(ButtonStyle.Success)
    );
    rows.push(rowBuy);
  } else {
    // 購入可能アイテムが無い場合は購入ボタンを無効化して表示（セレクトは出さない）
    const rowBuyDisabled = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`buy_confirm_disabled_${guildId}_${userId}`)
        .setLabel("🛍️ 購入する（アイテムがありません）")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true)
    );
    rows.push(rowBuyDisabled);
  }

  rows.push(buildToggleRow());
  return { embed, rows };
}

// --------------------
// 持ち物 embed 作成
// --------------------
async function buildInventoryEmbed(guildId, userId, username) {
  const ref = db.collection("servers").doc(guildId).collection("userItems").doc(userId);
  const snap = await ref.get();
  const data = snap.exists ? snap.data() : {};

  const pointsSnap = await db.collection("servers").doc(guildId).collection("points").doc(userId).get();
  const points = pointsSnap.exists ? pointsSnap.data().balance : 0;

  const embed = new EmbedBuilder()
    .setTitle(`🎒 ${username} の持ち物`)
    .setColor("#FFD700")
    .setFooter({ text: `所持ポイント: ${points}pt` });

  let desc = "";
  for (const [item, amount] of Object.entries(data)) {
    if (amount > 0) desc += `**${item}** × ${amount}\n`;
  }
  embed.setDescription(desc || "❌ アイテムを持っていません。");

  return { embed, rows: [buildToggleRow()] };
}

// --------------------
// 切り替えボタン
// --------------------
function buildToggleRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("toggle_shop").setLabel("🛒 ショップへ").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("toggle_inventory").setLabel("🎒 持ち物へ").setStyle(ButtonStyle.Secondary)
  );
}

// --------------------
// コンポーネント処理
// --------------------
export async function handleComponent(interaction) {
  const guildId = interaction.guildId;
  const userId = interaction.user.id;
  const key = `${guildId}_${userId}`;

  try {
    // ---------- ボタン ----------
    if (interaction.isButton()) {
      if (interaction.customId === "toggle_shop") {
        const { embed, rows } = await buildShopEmbed(guildId, interaction.guild.name, userId);
        return await interaction.update({ embeds: [embed], components: rows });
      }

      if (interaction.customId === "toggle_inventory") {
        const { embed, rows } = await buildInventoryEmbed(guildId, userId, interaction.user.username);
        return await interaction.update({ embeds: [embed], components: rows });
      }

      if (interaction.customId.startsWith("buy_confirm_")) {
        const mid = selectedItems.get(key);
        if (!mid) return interaction.reply({ content: "❌ アイテムを選択してください。", ephemeral: true });

        const modal = new ModalBuilder()
          .setCustomId(`buy_modal_${guildId}_${userId}`)
          .setTitle("購入個数を入力");

        const amountInput = new TextInputBuilder()
          .setCustomId("amount")
          .setLabel("購入個数")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("例: 1")
          .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(amountInput));
        return await interaction.showModal(modal);
      }

      // 無効化された購入ボタンが押された場合（ただの保険）
      if (interaction.customId.startsWith("buy_confirm_disabled_")) {
        return await interaction.reply({ content: "❌ 購入できるアイテムがありません。", ephemeral: true });
      }
    }

    // ---------- セレクト ----------
    if (interaction.isStringSelectMenu() && interaction.customId.startsWith("buy_select_")) {
      // ここは deferUpdate で UI のままにする（選択は Map に保持）
      selectedItems.set(key, interaction.values[0]);
      return await interaction.deferUpdate();
    }

    // ---------- モーダル ----------
    if (interaction.isModalSubmit() && interaction.customId.startsWith("buy_modal_")) {
      const mid = selectedItems.get(key);
      if (!mid) return await interaction.reply({ content: "❌ アイテムが選択されていません。", ephemeral: true });

      const raw = interaction.fields.getTextInputValue("amount");
      const amount = parseInt(raw, 10);
      if (isNaN(amount) || amount <= 0) return await interaction.reply({ content: "❌ 正しい数値を入力してください。", ephemeral: true });

      const itemRef = db.collection("servers").doc(guildId).collection("items").doc(mid);
      const pointsRef = db.collection("servers").doc(guildId).collection("points").doc(userId);
      const userItemsRef = db.collection("servers").doc(guildId).collection("userItems").doc(userId);

      // トランザクション：ここで最新の在庫・所持ポイントを取得して検証・更新する
      try {
        await db.runTransaction(async t => {
          const itemSnap = await t.get(itemRef);
          if (!itemSnap.exists) throw new Error("ITEM_NOT_FOUND");
          const item = itemSnap.data();

          if (item.stock < amount) throw new Error("OUT_OF_STOCK");

          const pointsSnap = await t.get(pointsRef);
          const currentPoints = pointsSnap.exists ? pointsSnap.data().balance : 0;
          const totalPrice = item.price * amount;
          if (currentPoints < totalPrice) throw new Error("INSUFFICIENT_POINTS");

          // 更新処理
          t.update(itemRef, { stock: item.stock - amount });
          t.set(pointsRef, { balance: currentPoints - totalPrice }, { merge: true });

          const userItemsSnap = await t.get(userItemsRef);
          const userItems = userItemsSnap.exists ? userItemsSnap.data() : {};
          t.set(userItemsRef, { ...userItems, [item.name]: (userItems[item.name] || 0) + amount }, { merge: true });
        });
      } catch (err) {
        // トランザクション内で検出されたエラーのハンドリング
        if (err.message === "ITEM_NOT_FOUND") {
          return await interaction.reply({ content: "❌ アイテムが存在しません。", ephemeral: true });
        }
        if (err.message === "OUT_OF_STOCK") {
          // 在庫不足は最新在庫を読み直してユーザーに知らせる
          const latestSnap = await itemRef.get();
          const latestStock = latestSnap.exists ? latestSnap.data().stock : 0;
          return await interaction.reply({ content: `❌ 在庫不足 (${latestStock}個)`, ephemeral: true });
        }
        if (err.message === "INSUFFICIENT_POINTS") {
          const pointsSnap = await pointsRef.get();
          const currentPoints = pointsSnap.exists ? pointsSnap.data().balance : 0;
          const itemSnap = await itemRef.get();
          const totalPrice = itemSnap.exists ? itemSnap.data().price * amount : "？";
          return await interaction.reply({ content: `❌ 所持ポイント不足 (${currentPoints}/${totalPrice}pt)`, ephemeral: true });
        }

        // 予期せぬエラー
        console.error("purchase transaction error:", err);
        return await interaction.reply({ content: "❌ 購入処理中にエラーが発生しました。もう一度お試しください。", ephemeral: true });
      }

      // 正常終了
      selectedItems.delete(key);

      await interaction.reply({ content: `✅ **${mid}** を ${amount} 個購入しました！`, ephemeral: true });
      const { embed, rows } = await buildShopEmbed(guildId, interaction.guild.name, userId);
      return await interaction.followUp({ embeds: [embed], components: rows, ephemeral: true });
    }
  } catch (err) {
    console.error("handleComponent error:", err);
    if (!interaction.replied && !interaction.deferred) {
      return await interaction.reply({ content: "❌ 内部エラーが発生しました。", ephemeral: true });
    } else {
      // すでに deferred/replied の場合は followUp
      return await interaction.followUp({ content: "❌ 内部エラーが発生しました。", ephemeral: true });
    }
  }
}
