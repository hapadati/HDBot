import { SlashCommandBuilder } from 'discord.js';
import { db } from '../../firestore.js';

export const data = new SlashCommandBuilder()
  .setName('item-add')
  .setDescription('新しいアイテムを追加します（管理者専用）')
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
  const name = interaction.options.getString('name');
  const price = interaction.options.getInteger('price');
  const stock = interaction.options.getInteger('stock');
  const guildId = interaction.guildId;

  const ref = db.collection('servers').doc(guildId).collection('items').doc(name);

  await ref.set({ name, price, stock });

  await interaction.reply(`🛒 アイテム **${name}** を追加しました！ (価格: ${price}pt, 在庫: ${stock})`);
}
