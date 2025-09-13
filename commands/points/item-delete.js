import { SlashCommandBuilder } from 'discord.js';
import { db } from '../../firestore.js';

export const data = new SlashCommandBuilder()
  .setName('item-delete')
  .setDescription('アイテムを削除します（管理者専用）')
  .addStringOption(option =>
    option.setName('mid')
      .setDescription('削除するアイテムのID (MID)')
      .setRequired(true))
  .addBooleanOption(option =>
    option.setName('force')
      .setDescription('在庫があっても強制削除するか (デフォルト: false)'))
  .setDefaultMemberPermissions(0);

export async function execute(interaction) {
  const mid = interaction.options.getString('mid');
  const force = interaction.options.getBoolean('force') || false;
  const guildId = interaction.guildId;

  try {
    const ref = db.collection('servers').doc(guildId).collection('items').doc(mid);
    const doc = await ref.get();

    if (!doc.exists) {
      await interaction.reply(`❌ ID \`${mid}\` のアイテムは存在しません。`);
      return;
    }

    const item = doc.data();

    if (item.stock > 0 && !force) {
      await interaction.reply(
        `⚠️ **${item.name}** (ID: \`${mid}\`) にはまだ在庫(${item.stock})があります。\n強制削除する場合は \`force: true\` を指定してください。`
      );
      return;
    }

    await ref.delete();
    await interaction.reply(`🗑️ アイテム **${item.name}** (ID: \`${mid}\`) を削除しました。`);
  } catch (error) {
    console.error('アイテム削除エラー:', error);
    await interaction.reply('❌ アイテム削除中にエラーが発生しました。');
  }
}
