import { SlashCommandBuilder } from 'discord.js';
import { db } from '../../firestore.js';

export const data = new SlashCommandBuilder()
  .setName('item-add')
  .setDescription('新しいアイテムを追加します（管理者専用）')
  .addStringOption(option =>
    option.setName('mid')
      .setDescription('アイテムID (英数字のみ)')
      .setRequired(true))
  .addStringOption(option =>
    option.setName('name')
      .setDescription('アイテム名')
      .setRequired(true))
  .addIntegerOption(option =>
    option.setName('price')
      .setDescription('価格 (1以上)')
      .setMinValue(1)
      .setRequired(true))
  .addIntegerOption(option =>
    option.setName('stock')
      .setDescription('在庫数 (0以上)')
      .setMinValue(0)
      .setRequired(true))
  .setDefaultMemberPermissions(0);

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true }); // 先に応答確保

  try {
    const mid = interaction.options.getString('mid');
    const name = interaction.options.getString('name');
    const price = interaction.options.getInteger('price');
    const stock = interaction.options.getInteger('stock');
    const guildId = interaction.guildId;

    // MIDの英数字チェック
    if (!/^[a-zA-Z0-9]+$/.test(mid)) {
      await interaction.editReply('❌ MIDは英数字のみ指定してください。');
      return;
    }

    const ref = db.collection('servers').doc(guildId).collection('items').doc(mid);
    const doc = await ref.get();

    if (doc.exists) {
      await interaction.editReply(
        `❌ MID \`${mid}\` のアイテムはすでに存在します。別のIDを指定してください。`
      );
      return;
    }

    await ref.set({
      mid,
      name,
      price,
      stock,
    });

    await interaction.editReply(
      `🛒 アイテム **${name}** を追加しました！\nID: \`${mid}\`, 価格: ${price}pt, 在庫: ${stock}`
    );
  } catch (err) {
    console.error('item-add Error:', err);
    await interaction.editReply('⚠️ エラーが発生しました。');
  }
}
