import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fs from 'fs';
import path from 'path';

const FILE_PATH = path.resolve('./data/leaderboard.json');

function loadLeaderboard() {
  try {
    if (!fs.existsSync(FILE_PATH)) return {};
    return JSON.parse(fs.readFileSync(FILE_PATH, 'utf-8'));
  } catch {
    return {};
  }
}

export const data = new SlashCommandBuilder()
  .setName('geoleaderboard')
  .setDescription('地理クイズのサーバー内ランキングを表示します');

export async function execute(interaction) {
  const data = loadLeaderboard();
  const guildId = interaction.guild.id;
  const scores = data[guildId] || {};

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) {
    await interaction.reply('📊 ランキングはまだありません。');
    return;
  }

  const lines = sorted.map(([userId, score], i) => {
    const user = interaction.guild.members.cache.get(userId);
    return `${i + 1}. **${user?.user?.tag || 'Unknown'}** - ${score} 正解`;
  });

  const embed = new EmbedBuilder()
    .setTitle('🌍 地理クイズ ランキング')
    .setDescription(lines.slice(0, 10).join('\n')) // 最初の10人
    .setColor(0x3498db);

  await interaction.reply({ embeds: [embed] });
}

export const geoleaderboardCommand = { data, execute };
