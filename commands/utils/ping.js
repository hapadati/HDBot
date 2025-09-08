// 📂 commands/utils/ping.js
import { SlashCommandBuilder } from 'discord.js';

export const pingCommand = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Ping! Pong! と応答します。'),
  async execute(interaction) {
    await interaction.reply('🏓 Pong!');
    console.log(`📝 ${interaction.user.tag} が /ping コマンドを使用`);
  },
};
