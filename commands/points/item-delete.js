import { SlashCommandBuilder } from 'discord.js';
import { db } from '../../firestore.js';

export const data = new SlashCommandBuilder()
  .setName('item-delete')
  .setDescription('アイテムを削除します（管理者専用）')
  .addStringOption(option =>
    option.setName('name')
      .setDescription('削除するアイテム名')
      .setRequired(true))
  .addBooleanOption(option =>
    option.setName('force')
      .setDescription('在庫があっても強制削除するか (true/false)'))
  .setDefaultMemberPermissions(0);

export async function execute(interaction) {
  const name = interaction.options.getString('name');
  const force = interaction.options.getBoolean('force') || false;
  const guildId = interaction.guildId;

  const ref = db.collection('servers').doc(guildId).collection('items').doc(name);
  const doc = await ref.get();

  if (!doc.exists) {
    await interaction.reply('❌ 指定されたアイテムは存在しません。');
    return;
  }

  const item = doc.data();

  if (item.stock > 0 && !force) {
    await interaction.reply(`⚠️ ${item.name} にはまだ在庫(${item.stock})があります。強制削除する場合は \`force: true\` を指定してください。`);
    return;
  }

  await ref.delete();
  await interaction.reply(`🗑️ アイテム **${name}** を削除しました。`);
}
