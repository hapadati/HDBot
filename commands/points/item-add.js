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
  const mid = interaction.options.getString('mid');
  const name = interaction.options.getString('name');
  const price = interaction.options.getInteger('price');
  const stock = interaction.options.getInteger('stock');
  const guildId = interaction.guildId;

  // 英数字チェック
  if (!/^[a-zA-Z0-9]+$/.test(mid)) {
    await interaction.reply({
      content: '❌ MIDは英数字のみ指定してください。',
      ephemeral: true,
    });
    return;
  }

  const ref = db.collection('servers').doc(guildId).collection('items').doc(mid);

  const doc = await ref.get();
  if (doc.exists) {
    await interaction.reply({
      content: `❌ MID \`${mid}\` のアイテムはすでに存在します。別のIDを指定してください。`,
      ephemeral: true,
    });
    return;
  }

  await ref.set({
    mid,
    name,
    price,
    stock,
  });

  await interaction.reply(
    `🛒 アイテム **${name}** を追加しました！\nID: \`${mid}\`, 価格: ${price}pt, 在庫: ${stock}`
  );
}
