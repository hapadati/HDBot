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
  const { embed, components } = await buildShopEmbed(guildId, interaction.guild.name, userId);

  await interaction.reply({
    embeds: [embed],
    components: [row, ...components], // メニューと購入ボタン
    ephemeral: false,
  });
}

// ショップ埋め込み + 購入ボタン
async function buildShopEmbed(guildId, guildName, userId) {
  const snapshot = await db.collection("servers").doc(guildId).collection("items").get();

  const embed = new EmbedBuilder()
    .setTitle(`🛒 ${guildName} ショップ`)
    .setColor("#00BFFF");

  if (snapshot.empty) {
    embed.setDescription("📦 ショップにアイテムはまだ登録されていません。");
    return { embed, components: [] };
  }

  let desc = "";
  const buttonRows = [];

  snapshot.forEach((doc) => {
    const item = doc.data();
    desc += `**${item.name}** (ID: \`${item.mid}\`) — ${item.price}pt | 在庫: ${item.stock}\n`;

    const button = new ButtonBuilder()
      .setCustomId(`buy_${guildId}_${userId}_${item.mid}`)
      .setLabel(`${item.name} を購入`)
      .setStyle(ButtonStyle.Primary)
      .setDisabled(item.stock <= 0);

    buttonRows.push(new ActionRowBuilder().addComponents(button));
  });

  embed.setDescription(desc);
  return { embed, components: buttonRows };
}

// 持ち物埋め込み
async function buildInventoryEmbed(guildId, userId, username) {
  const ref = db.collection("servers").doc(guildId).collection("userItems").doc(userId);
  const snap = await ref.get();
  const data = snap.exists ? snap.data() : {};

  const embed = new EmbedBuilder()
    .setTitle(`🎒 ${username} の持ち物`)
    .setColor("#FFD700");

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
    await interaction.reply({ content: "❌ このメニューはあなたのものではありません。", ephemeral: true });
    return;
  }

  const selected = interaction.values[0];
  if (selected === "shop") {
    const { embed, components } = await buildShopEmbed(guildId, interaction.guild.name, userId);
    await interaction.update({ embeds: [embed], components: [interaction.message.components[0], ...components] });
  } else if (selected === "inventory") {
    const embed = await buildInventoryEmbed(guildId, userId, interaction.user.username);
    await interaction.update({ embeds: [embed], components: [interaction.message.components[0]] }); // メニューのみ
  }
}

// 購入ボタン処理
export async function handleButton(interaction) {
  if (!interaction.isButton()) return;
  if (!interaction.customId.startsWith("buy_")) return;

  const [, guildId, userId, mid] = interaction.customId.split("_");

  if (interaction.user.id !== userId) {
    await interaction.reply({ content: "❌ このボタンはあなた専用です。", ephemeral: true });
    return;
  }

  const itemRef = db.collection("servers").doc(guildId).collection("items").doc(mid);
  const itemDoc = await itemRef.get();

  if (!itemDoc.exists) {
    await interaction.reply({ content: "❌ このアイテムは存在しません。", ephemeral: true });
    return;
  }

  const item = itemDoc.data();
  if (item.stock <= 0) {
    await interaction.reply({ content: "❌ 在庫切れです。", ephemeral: true });
    return;
  }

  // TODO: ポイント減算処理とユーザーインベントリ更新をここで実装する
  await itemRef.update({ stock: item.stock - 1 });

  await interaction.reply({
    content: `✅ ${item.name} を購入しました！（残り在庫: ${item.stock - 1}）`,
    ephemeral: true,
  });
}
