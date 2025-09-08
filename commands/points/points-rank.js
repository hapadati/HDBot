import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { db } from '../../firestore.js';

export const data = new SlashCommandBuilder()
  .setName('points-rank')
  .setDescription('サーバー内のポイントランキングを表示します');

export async function execute(interaction) {
  const guildId = interaction.guildId;

  const snapshot = await db.collection('servers')
    .doc(guildId)
    .collection('points')
    .orderBy('points', 'desc')
    .limit(10)
    .get();

  if (snapshot.empty) {
    await interaction.reply('📊 このサーバーにはまだポイントデータがありません！');
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle(`🏆 ${interaction.guild.name} ランキング TOP10`)
    .setColor('#FFD700');

  let desc = '';
  let rank = 1;
  snapshot.forEach(doc => {
    const data = doc.data();
    desc += `**${rank}.** <@${doc.id}> — ${data.points}pt\n`;
    rank++;
  });

  embed.setDescription(desc);

  await interaction.reply({ embeds: [embed] });
}
