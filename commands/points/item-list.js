import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
} from "discord.js";
import { db } from "../../firestore.js";

export const data = new SlashCommandBuilder()
  .setName("item-list")
  .setDescription("アイテムショップと自分の持ち物を表示します");

export async function execute(interaction) {
  const guildId = interaction.guildId;
  const userId = interaction.user.id;

  const { embed, rows } = await buildShopEmbed(guildId, interaction.guild.name, userId);
  await interaction.reply({
    embeds: [embed],
    components: rows,
  });
}

// 🛒 ショップ表示
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

  snapshot.forEach((doc) => {
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

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(`buy_select_${guildId}_${userId}`)
    .setPlaceholder("購入するアイテムを選んでください")
    .addOptions(options);

  const rowSelect = new ActionRowBuilder().addComponents(selectMenu);

  const rowBuy = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`buy_confirm_${guildId}_${userId}`)
      .setLabel("🛍️ 購入する")
      .setStyle(ButtonStyle.Success)
  );

  return { embed, rows: [rowSelect, rowBuy, buildToggleRow()] };
}

// 🎒 持ち物表示
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

  let desc = "";
  for (const [item, amount] of ownedItems) {
    desc += `**${item}** × ${amount}\n`;
  }

  embed.setDescription(desc || "❌ アイテムを持っていません。");

  return { embed, rows: [buildToggleRow()] };
}

// 切り替えボタン
function buildToggleRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("toggle_shop").setLabel("🛒 ショップへ").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("toggle_inventory").setLabel("🎒 持ち物へ").setStyle(ButtonStyle.Secondary)
  );
}

// 選択したアイテムを保持
const selectedItems = new Map();

// 切り替え・購入処理
export async function handleComponent(interaction) {
  const guildId = interaction.guildId;
  const userId = interaction.user.id;

  if (interaction.isButton()) {
    if (interaction.customId === "toggle_shop") {
      const { embed, rows } = await buildShopEmbed(guildId, interaction.guild.name, userId);
      await interaction.update({ embeds: [embed], components: rows });
    } else if (interaction.customId === "toggle_inventory") {
      const { embed, rows } = await buildInventoryEmbed(guildId, userId, interaction.user.username);
      await interaction.update({ embeds: [embed], components: rows });
    } else if (interaction.customId.startsWith("buy_confirm_")) {
      const mid = selectedItems.get(userId);
      if (!mid) {
        await interaction.reply({ content: "❌ 購入するアイテムを選択してください。", ephemeral: true });
        return;
      }

      const itemRef = db.collection("servers").doc(guildId).collection("items").doc(mid);
      const itemSnap = await itemRef.get();
      if (!itemSnap.exists) {
        await interaction.reply({ content: "❌ アイテムが存在しません。", ephemeral: true });
        return;
      }

      const item = itemSnap.data();

      if (item.stock <= 0) {
        await interaction.reply({ content: `❌ **${item.name}** は在庫切れです。`, ephemeral: true });
        return;
      }

      const pointsRef = db.collection("servers").doc(guildId).collection("points").doc(userId);
      const pointsSnap = await pointsRef.get();
      const points = pointsSnap.exists ? pointsSnap.data().balance : 0;

      if (points < item.price) {
        await interaction.reply({ content: `❌ 所持ポイントが足りません。(${points}pt / ${item.price}pt)`, ephemeral: true });
        return;
      }

      // トランザクションで在庫・ポイント・userItemsを更新
      await db.runTransaction(async (t) => {
        t.update(itemRef, { stock: item.stock - 1 });
        t.set(pointsRef, { balance: points - item.price }, { merge: true });

        const userItemsRef = db.collection("servers").doc(guildId).collection("userItems").doc(userId);
        const userItemsSnap = await t.get(userItemsRef);
        const userItems = userItemsSnap.exists ? userItemsSnap.data() : {};
        const newAmount = (userItems[item.name] || 0) + 1;
        t.set(userItemsRef, { ...userItems, [item.name]: newAmount });
      });

      selectedItems.delete(userId);

      await interaction.reply({ content: `✅ **${item.name}** を購入しました！`, ephemeral: true });

      // 更新したショップ表示
      const { embed, rows } = await buildShopEmbed(guildId, interaction.guild.name, userId);
      await interaction.editReply({ embeds: [embed], components: rows });
    }
  } else if (interaction.isStringSelectMenu() && interaction.customId.startsWith("buy_select_")) {
    selectedItems.set(userId, interaction.values[0]);
    await interaction.reply({ content: "✅ 購入するアイテムを選択しました。", ephemeral: true });
  }
}
