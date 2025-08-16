const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('ユーザーをサーバーからバンします')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('バンするユーザー')
        .setRequired(true)),
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return interaction.reply({ content: 'あなたにはこの操作を行う権限がありません。', ephemeral: true });
    }

    const member = await interaction.guild.members.fetch(user.id);
    if (member && member.bannable) {
      await member.ban({ reason: 'バンされました' });
      return interaction.reply(`${user.tag} さんがバンされました。`);
    } else {
      return interaction.reply({ content: 'そのユーザーをバンできません。', ephemeral: true });
    }
  },
};
