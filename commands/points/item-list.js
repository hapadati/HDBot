import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
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
    ephemeral: false, // 全員に見せるなら false、自分だけなら true
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
  snapshot.forEach((doc) => {
    const item = doc.data();
    // MIDも表示する
    desc += `**${item.name}** (ID: \`${item.mid}\`) — ${item.price}pt | 在庫: ${item.stock}\n`;
  });

  embed.setDescription(desc);
  return embed;
}

// 持ち物埋め込み
async function buildInventoryEmbed(guildId, userId, username) {
  const ref = db.collection("servers").doc(guildId).collection("userItems").doc(userId);
  const snap = await ref.get();
  const data = snap.exists ? snap.data() : {};

  const embed = new EmbedBuilder()
    .setTitle(`🎒 ${username} の持ち物`)
    .setColor("#FFD700");

  // 「数量 > 0」のアイテムだけを残す
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

  // 他人が勝手に操作できないように
  if (interaction.user.id !== userId) {
    await interaction.reply({
      content: "❌ このメニューはあなたのものではありません。",
      ephemeral: true,
    });
    return;
  }

  const selected = interaction.values[0];
  if (selected === "shop") {
    const embed = await buildShopEmbed(guildId, interaction.guild.name);
    await interaction.update({ embeds: [embed] });
  } else if (selected === "inventory") {
    const embed = await buildInventoryEmbed(guildId, userId, interaction.user.username);
    await interaction.update({ embeds: [embed] });
  }
}
