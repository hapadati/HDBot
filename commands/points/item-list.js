import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { db } from "../../firestore.js";

export const data = new SlashCommandBuilder()
  .setName("item-list")
  .setDescription("アイテムショップと自分の持ち物を表示します");

export async function execute(interaction) {
  const guildId = interaction.guildId;
  const userId = interaction.user.id;

  // メニュー
  const menu = new StringSelectMenuBuilder()
    .setCustomId(`itemlist_${guildId}_${userId}`)
    .setPlaceholder("表示する内容を選んでください")
    .addOptions(
      { label: "🛒 ショップ", value: "shop", description: "ショップのアイテム一覧を表示" },
      { label: "🎒 持ち物", value: "inventory", description: "自分の持ち物を表示" }
    );

  const row = new ActionRowBuilder().addComponents(menu);

  // 初期表示はショップ
  const shopEmbed = await buildShopEmbed(guildId, interaction.guild.name);

  await interaction.reply({
    embeds: [shopEmbed],
    components: [row],
    ephemeral: false,
  });
}

// ショップ埋め込み
async function buildShopEmbed(guildId, guildName) {
  const snapshot = await db.collection("servers").doc(guildId).collection("items").get();

  const embed = new EmbedBuilder()
    .setTitle(`🛒 ${guildName} ショップ`)
    .setColor("#00BFFF");

  if (snapshot.empty) {
    embed.setDescription("📦 ショップにアイテムはまだ登録されていません。");
    return embed;
  }

  let desc = "";
  const buttons = [];

  snapshot.forEach((doc) => {
    const item = doc.data();
    desc += `**${item.name}** (ID: \`${item.mid}\`) — ${item.price}pt | 在庫: ${item.stock}\n`;

    // 購入ボタン
    buttons.push(
      new ButtonBuilder()
        .setCustomId(`buy_${guildId}_${item.mid}`)
        .setLabel(`${item.name} を購入 (${item.price}pt)`)
        .setStyle(ButtonStyle.Primary)
        .setDisabled(item.stock <= 0)
    );
  });

  embed.setDescription(desc);

  const row = new ActionRowBuilder().addComponents(buttons.slice(0, 5)); // 5個まで

  return { embed, row };
}

// 持ち物埋め込み
async function buildInventoryEmbed(guildId, userId, username) {
  const ref = db.collection("servers").doc(guildId).collection("userItems").doc(userId);
  const snap = await ref.get();
  const data = snap.exists ? snap.data() : {};

  const pointsRef = db.collection("servers").doc(guildId).collection("points").doc(userId);
  const pointsSnap = await pointsRef.get();
  const points = pointsSnap.exists ? pointsSnap.data().balance : 0;

  const embed = new EmbedBuilder()
    .setTitle(`🎒 ${username} の持ち物`)
    .setColor("#FFD700")
    .setFooter({ text: `所持ポイント: ${points}pt` });

  const ownedItems = Object.entries(data).filter(([_, amount]) => amount > 0);

  if (ownedItems.length === 0) {
    embed.setDescription("❌ アイテムを持っていません。");
    return embed;
  }

  let desc = "";
  for (const [item, amount] of ownedItems) {
    desc += `**${item}** × ${amount}\n`;
  }

  embed.setDescription(desc);
  return embed;
}

// セレクトメニュー処理
export async function handleSelect(interaction) {
  if (!interaction.isStringSelectMenu()) return;
  if (!interaction.customId.startsWith("itemlist_")) return;

  const [, guildId, userId] = interaction.customId.split("_");

  if (interaction.user.id !== userId) {
    await interaction.reply({
      content: "❌ このメニューはあなたのものではありません。",
      ephemeral: true,
    });
    return;
  }

  const selected = interaction.values[0];
  if (selected === "shop") {
    const { embed, row } = await buildShopEmbed(guildId, interaction.guild.name);
    await interaction.update({ embeds: [embed], components: [row] });
  } else if (selected === "inventory") {
    const embed = await buildInventoryEmbed(guildId, userId, interaction.user.username);
    await interaction.update({ embeds: [embed], components: [] });
  }
}

// 購入処理
export async function handleBuy(interaction) {
  if (!interaction.isButton()) return;
  if (!interaction.customId.startsWith("buy_")) return;

  const [, guildId, mid] = interaction.customId.split("_");
  const userId = interaction.user.id;

  const itemRef = db.collection("servers").doc(guildId).collection("items").doc(mid);
  const itemSnap = await itemRef.get();
  if (!itemSnap.exists) {
    await interaction.reply({ content: "❌ アイテムが存在しません。", ephemeral: true });
    return;
  }
  const item = itemSnap.data();

  const pointsRef = db.collection("servers").doc(guildId).collection("points").doc(userId);
  const pointsSnap = await pointsRef.get();
  let balance = pointsSnap.exists ? pointsSnap.data().balance : 0;

  if (balance < item.price) {
    await interaction.reply({ content: "❌ ポイントが不足しています。", ephemeral: true });
    return;
  }
  if (item.stock <= 0) {
    await interaction.reply({ content: "❌ 在庫がありません。", ephemeral: true });
    return;
  }

  // 更新処理
  await pointsRef.set({ balance: balance - item.price }, { merge: true });
  await itemRef.update({ stock: item.stock - 1 });

  const userItemsRef = db.collection("servers").doc(guildId).collection("userItems").doc(userId);
  await db.runTransaction(async (t) => {
    const userItemsSnap = await t.get(userItemsRef);
    const items = userItemsSnap.exists ? userItemsSnap.data() : {};
    const currentAmount = items[item.name] || 0;
    items[item.name] = currentAmount + 1;
    t.set(userItemsRef, items);
  });

  await interaction.reply({
    content: `✅ ${item.name} を ${item.price}pt で購入しました！ 残りポイント: ${balance - item.price}pt`,
    ephemeral: true,
  });
}
