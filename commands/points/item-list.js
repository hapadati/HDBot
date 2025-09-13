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

// 選択中アイテムを保持
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
    desc += `**${item.name}** (ID: \`${item.mid}\`) — ${item.price}pt | 在庫: ${item.stock}\n`;
    if (item.stock > 0) {
      options.push({
        label: `${item.name} (${item.price}pt)`,
        value: item.mid,
        description: `在庫: ${item.stock}`,
      });
    }
  });

  embed.setDescription(desc || " ");

  const rowSelect = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`buy_select_${guildId}_${userId}`)
      .setPlaceholder("購入するアイテムを選択してください")
      .addOptions(options)
  );

  const rowBuy = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`buy_confirm_${guildId}_${userId}`)
      .setLabel("🛍️ 購入する")
      .setStyle(ButtonStyle.Success)
  );

  return { embed, rows: [rowSelect, rowBuy, buildToggleRow()] };
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
  for (const [item, amount] of Object.entries(data)) if (amount > 0) desc += `**${item}** × ${amount}\n`;
  embed.setDescription(desc || "❌ アイテムを持っていません。");

  return { embed, rows: [buildToggleRow()] };
}

// --------------------
// 切替ボタン
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
      const mid = selectedItems.get(userId);
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
      return interaction.showModal(modal);
    }
  }

  // ---------- セレクト ----------
  if (interaction.isStringSelectMenu() && interaction.customId.startsWith("buy_select_")) {
    selectedItems.set(userId, interaction.values[0]);
    return await interaction.deferUpdate();
  }

  // ---------- モーダル ----------
  if (interaction.isModalSubmit() && interaction.customId.startsWith("buy_modal_")) {
    await interaction.deferReply({ ephemeral: true });

    const mid = selectedItems.get(userId);
    if (!mid) return interaction.followUp({ content: "❌ アイテムが選択されていません。", ephemeral: true });

    const amount = parseInt(interaction.fields.getTextInputValue("amount"));
    if (isNaN(amount) || amount <= 0) return interaction.followUp({ content: "❌ 正しい数値を入力してください。", ephemeral: true });

    const itemRef = db.collection("servers").doc(guildId).collection("items").doc(mid);
    const itemSnap = await itemRef.get();
    if (!itemSnap.exists) return interaction.followUp({ content: "❌ アイテムが存在しません。", ephemeral: true });

    const item = itemSnap.data();
    if (item.stock < amount) return interaction.followUp({ content: `❌ 在庫不足 (${item.stock}個)`, ephemeral: true });

    const pointsRef = db.collection("servers").doc(guildId).collection("points").doc(userId);
    const pointsSnap = await pointsRef.get();
    const points = pointsSnap.exists ? pointsSnap.data().balance : 0;
    const totalPrice = item.price * amount;

    if (points < totalPrice) return interaction.followUp({ content: `❌ 所持ポイント不足 (${points}/${totalPrice}pt)`, ephemeral: true });

    // トランザクション
    await db.runTransaction(async t => {
      t.update(itemRef, { stock: item.stock - amount });
      t.set(pointsRef, { balance: points - totalPrice }, { merge: true });
      const userItemsRef = db.collection("servers").doc(guildId).collection("userItems").doc(userId);
      const userItemsSnap = await t.get(userItemsRef);
      const userItems = userItemsSnap.exists ? userItemsSnap.data() : {};
      t.set(userItemsRef, { ...userItems, [item.name]: (userItems[item.name] || 0) + amount });
    });

    selectedItems.delete(userId);

    await interaction.reply({ content: `✅ **${item.name}** を ${amount} 個購入しました！`, ephemeral: true });
    const { embed, rows } = await buildShopEmbed(guildId, interaction.guild.name, userId);
    return await interaction.followUp({ embeds: [embed], components: rows });
  }
}
