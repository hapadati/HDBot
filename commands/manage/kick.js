const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('ユーザーをサーバーからキックします')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('キックするユーザー')
        .setRequired(true)),
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
      return interaction.reply({ content: 'あなたにはこの操作を行う権限がありません。', ephemeral: true });
    }

    const member = await interaction.guild.members.fetch(user.id);
    if (member && member.kickable) {
      await member.kick('キックされました');
      return interaction.reply(`${user.tag} さんがキックされました。`);
    } else {
      return interaction.reply({ content: 'そのユーザーをキックできません。', ephemeral: true });
    }
  },
};
