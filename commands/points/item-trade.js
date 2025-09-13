import {
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
  } from "discord.js";
  import { db } from "../../firestore.js";
  
  export const data = new SlashCommandBuilder()
    .setName("item-trade")
    .setDescription("ユーザーとアイテムを交換します")
    .addUserOption((option) =>
      option.setName("user").setDescription("交換相手").setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("give_item").setDescription("自分が渡すアイテム名").setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("give_amount")
        .setDescription("渡す数量 (1以上)")
        .setMinValue(1)
        .setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("take_item").setDescription("相手から欲しいアイテム名").setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("take_amount")
        .setDescription("もらう数量 (1以上)")
        .setMinValue(1)
        .setRequired(true)
    );
  
  export async function execute(interaction) {
    const guildId = interaction.guildId;
    const fromUser = interaction.user;
    const toUser = interaction.options.getUser("user");
  
    if (fromUser.id === toUser.id) {
      await interaction.reply("❌ 自分自身とトレードはできません。");
      return;
    }
  
    const giveItem = interaction.options.getString("give_item");
    const giveAmount = interaction.options.getInteger("give_amount");
    const takeItem = interaction.options.getString("take_item");
    const takeAmount = interaction.options.getInteger("take_amount");
  
    const fromRef = db
      .collection("servers")
      .doc(guildId)
      .collection("userItems")
      .doc(fromUser.id);
    const toRef = db
      .collection("servers")
      .doc(guildId)
      .collection("userItems")
      .doc(toUser.id);
  
    const fromSnap = await fromRef.get();
    const toSnap = await toRef.get();
    const fromData = fromSnap.exists ? fromSnap.data() : {};
    const toData = toSnap.exists ? toSnap.data() : {};
  
    if ((fromData[giveItem] || 0) < giveAmount) {
      await interaction.reply(`❌ あなたは **${giveItem}** を ${giveAmount} 個持っていません。`);
      return;
    }
  
    if ((toData[takeItem] || 0) < takeAmount) {
      await interaction.reply(`❌ ${toUser.username} は **${takeItem}** を ${takeAmount} 個持っていません。`);
      return;
    }
  
    const embed = new EmbedBuilder()
      .setTitle("🔄 トレードリクエスト")
      .setDescription(
        `${fromUser.username} が以下の条件でトレードを提案しました：\n\n` +
          `➡️ ${fromUser.username} → ${toUser.username} : **${giveItem} × ${giveAmount}**\n` +
          `⬅️ ${toUser.username} → ${fromUser.username} : **${takeItem} × ${takeAmount}**\n\n` +
          `このトレードを承認しますか？`
      )
      .setColor("#00CED1");
  
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(
          `trade_accept_${fromUser.id}_${toUser.id}_${giveItem}_${giveAmount}_${takeItem}_${takeAmount}_${guildId}`
        )
        .setLabel("✅ 承認")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(
          `trade_decline_${fromUser.id}_${toUser.id}_${giveItem}_${giveAmount}_${takeItem}_${takeAmount}_${guildId}`
        )
        .setLabel("❌ 拒否")
        .setStyle(ButtonStyle.Danger)
    );
  
    try {
      await toUser.send({ embeds: [embed], components: [row] });
      await interaction.reply(`📩 ${toUser.username} にトレード申請を送りました！`);
    } catch {
      await interaction.reply(`❌ ${toUser.username} はDMを受け取れないため、トレードできません。`);
    }
  }
  
  // ボタン処理
  export async function handleButton(interaction, client) {
    if (!interaction.isButton()) return;
    if (!interaction.customId.startsWith("trade_")) return;
  
    const [
      action,
      fromId,
      toId,
      giveItem,
      giveAmountStr,
      takeItem,
      takeAmountStr,
      guildId,
    ] = interaction.customId.split("_");
    const giveAmount = parseInt(giveAmountStr, 10);
    const takeAmount = parseInt(takeAmountStr, 10);
  
    if (interaction.user.id !== toId) {
      await interaction.reply({
        content: "❌ あなたはこのトレードの対象ではありません。",
        ephemeral: true,
      });
      return;
    }
  
    const fromRef = db
      .collection("servers")
      .doc(guildId)
      .collection("userItems")
      .doc(fromId);
    const toRef = db
      .collection("servers")
      .doc(guildId)
      .collection("userItems")
      .doc(toId);
  
    if (action === "trade" && interaction.customId.startsWith("trade_accept")) {
      try {
        await db.runTransaction(async (t) => {
          const fromSnap = await t.get(fromRef);
          const toSnap = await t.get(toRef);
          const fromData = fromSnap.exists ? fromSnap.data() : {};
          const toData = toSnap.exists ? toSnap.data() : {};
  
          if ((fromData[giveItem] || 0) < giveAmount) {
            throw new Error(
              `申請者がもう **${giveItem}** を ${giveAmount} 個持っていません。`
            );
          }
          if ((toData[takeItem] || 0) < takeAmount) {
            throw new Error(
              `あなたはもう **${takeItem}** を ${takeAmount} 個持っていません。`
            );
          }
  
          fromData[giveItem] -= giveAmount;
          toData[takeItem] -= takeAmount;
          if (fromData[giveItem] === 0) delete fromData[giveItem];
          if (toData[takeItem] === 0) delete toData[takeItem];
  
          fromData[takeItem] = (fromData[takeItem] || 0) + takeAmount;
          toData[giveItem] = (toData[giveItem] || 0) + giveAmount;
  
          t.set(fromRef, fromData);
          t.set(toRef, toData);
        });
  
        await interaction.update({
          embeds: [
            new EmbedBuilder()
              .setTitle("✅ トレード成立")
              .setDescription(
                `**${giveItem} × ${giveAmount}** と **${takeItem} × ${takeAmount}** を交換しました！`
              )
              .setColor("#32CD32"),
          ],
          components: [],
        });
  
        const fromUser = await client.users.fetch(fromId);
        await fromUser.send(
          `✅ ${interaction.user.username} がトレードを承認しました！\n**${giveItem} × ${giveAmount}** ↔ **${takeItem} × ${takeAmount}** の交換が完了しました。`
        );
      } catch (err) {
        await interaction.update({
          embeds: [
            new EmbedBuilder()
              .setTitle("⚠️ トレード失敗")
              .setDescription(err.message)
              .setColor("#FF0000"),
          ],
          components: [],
        });
      }
    }
  
    if (action === "trade" && interaction.customId.startsWith("trade_decline")) {
      await interaction.update({
        embeds: [
          new EmbedBuilder()
            .setTitle("❌ トレード拒否")
            .setDescription(`${interaction.user.username} がトレードを拒否しました。`)
            .setColor("#808080"),
        ],
        components: [],
      });
  
      const fromUser = await client.users.fetch(fromId);
      await fromUser.send(`❌ ${interaction.user.username} がトレードを拒否しました。`);
    }
  }
  