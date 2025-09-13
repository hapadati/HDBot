import pkg from 'discord.js';
const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  InteractionResponseFlags, // ← ここ
} = pkg;
import { db } from "../../firestore.js";

export const data = new SlashCommandBuilder()
  .setName("item-list")
  .setDescription("アイテムショップと自分の持ち物を表示します");

const selectedItems = new Map();

// --------------------
// Slash コマンド実行
// --------------------
export async function execute(interaction) {
  console.log("[execute] called by", interaction.user.tag, "in guild", interaction.guildId);
  const guildId = interaction.guildId;
  const userId = interaction.user.id;

  await interaction.deferReply();
  console.log("[execute] deferred reply");

  const { embed, rows } = await buildShopEmbed(guildId, interaction.guild?.name ?? "?", userId);
  console.log("[execute] buildShopEmbed finished, rows:", rows.length);
  await interaction.followUp({ embeds: [embed], components: rows });
}

// --------------------
// ショップ embed 作成
// --------------------
async function buildShopEmbed(guildId, guildName, userId) {
  console.log("[buildShopEmbed] start for guild:", guildId, "guildName:", guildName, "user:", userId);
  const snapshot = await db.collection("servers").doc(guildId).collection("items").get();
  console.log("[buildShopEmbed] snapshot size:", snapshot.size);

  const embed = new EmbedBuilder()
    .setTitle(`🛒 ${guildName} ショップ`)
    .setColor("#00BFFF");

  if (snapshot.empty) {
    console.log("[buildShopEmbed] no items in shop");
    embed.setDescription("📦 ショップにアイテムはまだ登録されていません。");
    return { embed, rows: [buildToggleRow()] };
  }

  let desc = "";
  const options = [];

  snapshot.forEach(doc => {
    const item = doc.data();
    const mid = item.mid ?? doc.id;
    console.log("[buildShopEmbed] found item:", item.name, "mid:", mid, "price:", item.price, "stock:", item.stock);
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

  const limitedOptions = options.slice(0, 25);
  const rows = [];

  if (limitedOptions.length > 0) {
    console.log("[buildShopEmbed] options available:", limitedOptions.length);
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
    console.log("[buildShopEmbed] no purchasable options");
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
  console.log("[buildShopEmbed] returning rows:", rows.length);
  return { embed, rows };
}

// --------------------
// 持ち物 embed 作成
// --------------------
async function buildInventoryEmbed(guildId, userId, username) {
  console.log("[buildInventoryEmbed] start for user:", userId, "guild:", guildId);
  const ref = db.collection("servers").doc(guildId).collection("userItems").doc(userId);
  const snap = await ref.get();
  console.log("[buildInventoryEmbed] userItems exists:", snap.exists);
  const data = snap.exists ? snap.data() : {};

  const pointsSnap = await db.collection("servers").doc(guildId).collection("points").doc(userId).get();
  const points = pointsSnap.exists ? pointsSnap.data().points : 0;
  console.log("[buildInventoryEmbed] points:", points);

  const embed = new EmbedBuilder()
    .setTitle(`🎒 ${username} の持ち物`)
    .setColor("#FFD700")
    .setFooter({ text: `所持ポイント: ${points}pt` });

  let desc = "";
  for (const [item, amount] of Object.entries(data)) {
    console.log("[buildInventoryEmbed] item:", item, "amount:", amount);
    if (amount > 0) desc += `**${item}** × ${amount}\n`;
  }
  embed.setDescription(desc || "❌ アイテムを持っていません。");

  return { embed, rows: [buildToggleRow()] };
}

// --------------------
// 切り替えボタン
// --------------------
function buildToggleRow() {
  console.log("[buildToggleRow] called");
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("toggle_shop").setLabel("🛒 ショップへ").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("toggle_inventory").setLabel("🎒 持ち物へ").setStyle(ButtonStyle.Secondary)
  );
}

// --------------------
// コンポーネント処理
// --------------------
export async function handleComponent(interaction) {
  console.log("[handleComponent] fired:", interaction.customId,
    "type:",
    interaction.isButton() ? "button" :
    interaction.isStringSelectMenu() ? "select" :
    interaction.isModalSubmit() ? "modal" : "unknown");

  const guildId = interaction.guildId;
  const userId = interaction.user.id;
  const key = `${guildId}_${userId}`;

  try {
    // ---------- ボタン ----------
    if (interaction.isButton()) {
      console.log("[handleComponent] button pressed:", interaction.customId);

      if (interaction.customId === "toggle_shop") {
        const { embed, rows } = await buildShopEmbed(guildId, interaction.guild.name, userId);
        console.log("[handleComponent] toggle_shop updating message");
        return await interaction.update({ embeds: [embed], components: rows });
      }

      if (interaction.customId === "toggle_inventory") {
        const { embed, rows } = await buildInventoryEmbed(guildId, userId, interaction.user.username);
        console.log("[handleComponent] toggle_inventory updating message");
        return await interaction.update({ embeds: [embed], components: rows });
      }

      if (interaction.customId.startsWith("buy_confirm_")) {
        const mid = selectedItems.get(key);
        console.log("[handleComponent] buy_confirm pressed, mid:", mid);
        if (!mid) return interaction.reply({ content: "❌ アイテムを選択してください。", flags: InteractionResponseFlags.Ephemeral});

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
        console.log("[handleComponent] showing modal");
        return await interaction.showModal(modal);
      }

      if (interaction.customId.startsWith("buy_confirm_disabled_")) {
        console.log("[handleComponent] disabled buy button pressed");
        return await interaction.reply({ content: "❌ 購入できるアイテムがありません。", flags: InteractionResponseFlags.Ephemeral });
      }
    }

    // ---------- セレクト ----------
    if (interaction.isStringSelectMenu() && interaction.customId.startsWith("buy_select_")) {
      console.log("[handleComponent] select menu value:", interaction.values);
      selectedItems.set(key, interaction.values[0]);
      return await interaction.deferUpdate();
    }

    // ---------- モーダル ----------
    if (interaction.isModalSubmit() && interaction.customId.startsWith("buy_modal_")) {
      const mid = selectedItems.get(key);
      console.log("[handleComponent] modal submit, mid:", mid);
      if (!mid) return await interaction.reply({ content: "❌ アイテムが選択されていません。", flags: InteractionResponseFlags.Ephemeral });

      const raw = interaction.fields.getTextInputValue("amount");
      console.log("[handleComponent] modal amount input:", raw);
      const amount = parseInt(raw, 10);
      if (isNaN(amount) || amount <= 0) {
        console.log("[handleComponent] invalid amount:", raw);
        return await interaction.reply({ content: "❌ 正しい数値を入力してください。", flags: InteractionResponseFlags.Ephemeral });
      }

      const itemRef = db.collection("servers").doc(guildId).collection("items").doc(mid);
      const pointsRef = db.collection("servers").doc(guildId).collection("points").doc(userId);
      const userItemsRef = db.collection("servers").doc(guildId).collection("userItems").doc(userId);

      try {
        console.log("[handleComponent] starting transaction");
        await db.runTransaction(async t => {
          // 📌 すべての読み取りを最初に行う
          const [itemSnap, pointsSnap, userItemsSnap] = await Promise.all([
            t.get(itemRef),
            t.get(pointsRef),
            t.get(userItemsRef),
          ]);
      
          console.log("[handleComponent] transaction item exists:", itemSnap.exists);
          if (!itemSnap.exists) throw new Error("ITEM_NOT_FOUND");
          const item = itemSnap.data();
          console.log("[handleComponent] transaction item data:", item);
      
          if (item.stock < amount) {
            console.log("[handleComponent] OUT_OF_STOCK", item.stock, amount);
            throw new Error("OUT_OF_STOCK");
          }
      
          const currentPoints = pointsSnap.exists ? pointsSnap.data().points : 0;
          console.log("[handleComponent] currentPoints:", currentPoints);
          const totalPrice = item.price * amount;
          if (currentPoints < totalPrice) {
            console.log("[handleComponent] INSUFFICIENT_POINTS", currentPoints, totalPrice);
            throw new Error("INSUFFICIENT_POINTS");
          }
      
          const userItems = userItemsSnap.exists ? userItemsSnap.data() : {};
          console.log("[handleComponent] updating userItems:", userItems);
      
          // 📌 書き込みはここから
          t.update(itemRef, { stock: item.stock - amount });
          t.set(pointsRef, { points: currentPoints - totalPrice }, { merge: true });
          t.set(
            userItemsRef,
            { ...userItems, [item.name]: (userItems[item.name] || 0) + amount },
            { merge: true }
          );
        });
        console.log("[handleComponent] transaction committed");
      } catch (err) {
        console.error("[handleComponent] purchase transaction error:", err);
        if (err.message === "ITEM_NOT_FOUND") {
          return await interaction.reply({ content: "❌ アイテムが存在しません。", flags: InteractionResponseFlags.Ephemeral });
        }
        if (err.message === "OUT_OF_STOCK") {
          const latestSnap = await itemRef.get();
          const latestStock = latestSnap.exists ? latestSnap.data().stock : 0;
          return await interaction.reply({ content: `❌ 在庫不足 (${latestStock}個)`, flags: InteractionResponseFlags.Ephemeral });
        }
        if (err.message === "INSUFFICIENT_POINTS") {
          const pointsSnap = await pointsRef.get();
          const currentPoints = pointsSnap.exists ? pointsSnap.data().points : 0;
          const itemSnap = await itemRef.get();
          const totalPrice = itemSnap.exists ? itemSnap.data().price * amount : "？";
          return await interaction.reply({ content: `❌ 所持ポイント不足 (${currentPoints}/${totalPrice}pt)`, flags: InteractionResponseFlags.Ephemeral });
        }
        return await interaction.reply({ content: "❌ 購入処理中にエラーが発生しました。もう一度お試しください。", flags: InteractionResponseFlags.Ephemeral });
      }

      selectedItems.delete(key);
      console.log("[handleComponent] deleted selectedItems key:", key);

      await interaction.reply({ content: `✅ **${mid}** を ${amount} 個購入しました！`, flags: InteractionResponseFlags.Ephemeral });
      const { embed, rows } = await buildShopEmbed(guildId, interaction.guild.name, userId);
      console.log("[handleComponent] sending followUp after purchase");
      return await interaction.followUp({ embeds: [embed], components: rows, flags: InteractionResponseFlags.Ephemeral });
    }
  } catch (err) {
    console.error("[handleComponent] CATCH error:", err);
    if (!interaction.replied && !interaction.deferred) {
      return await interaction.reply({ content: "❌ 内部エラーが発生しました。", flags: InteractionResponseFlags.Ephemeral });
    } else {
      return await interaction.followUp({ content: "❌ 内部エラーが発生しました。", flags: InteractionResponseFlags.Ephemeral });
    }
  }
}
