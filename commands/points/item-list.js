import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { db } from '../../firestore.js';

export const data = new SlashCommandBuilder()
  .setName('item-list')
  .setDescription('アイテム一覧を表示します');

export async function execute(interaction) {
  const guildId = interaction.guildId;

  const snapshot = await db.collection('servers').doc(guildId).collection('items').get();

  if (snapshot.empty) {
    await interaction.reply('📦 アイテムはまだ登録されていません。');
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle(`📦 ${interaction.guild.name} アイテムショップ`)
    .setColor('#00BFFF');

  let desc = '';
  snapshot.forEach(doc => {
    const item = doc.data();
    desc += `**${item.name}** — ${item.price}pt | 在庫: ${item.stock}\n`;
  });

  embed.setDescription(desc);

  await interaction.reply({ embeds: [embed] });
}
