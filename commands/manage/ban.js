const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('指定したユーザーをサーバーからバンします')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('バンするユーザー')
        .setRequired(true)),

  async execute(interaction) {
    const user = interaction.options.getUser('user');

    // コマンド実行者がBAN権限を持っているか確認
    if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return interaction.reply({ content: 'あなたにはこの操作を行う権限がありません。', ephemeral: true });
    }

    try {
      // ユーザーをサーバーから取得
      const member = await interaction.guild.members.fetch(user.id);
      
      // ユーザーが存在してバンできるか確認
      if (member && member.bannable) {
        await member.ban({ reason: 'ユーザーがサーバーの規則に違反したためバンされました。' });
        return interaction.reply(`${user.tag} さんがサーバーからバンされました。`);
      } else {
        return interaction.reply({ content: 'そのユーザーをバンできません。管理者権限やボットの権限が不足している場合があります。', ephemeral: true });
      }
    } catch (error) {
      console.error(error);
      return interaction.reply({ content: 'バン処理中にエラーが発生しました。', ephemeral: true });
    }
  },
};
