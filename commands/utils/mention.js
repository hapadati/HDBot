import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('mention')
    .setDescription('指定した回数だけユーザーをメンションします。')
    .addIntegerOption(option =>
        option.setName('mentionnumber')
            .setDescription('メンションする回数 (1~4)')
            .setRequired(true)
    )
    .addUserOption(option =>
        option.setName('mentionuser')
            .setDescription('メンションするユーザー')
            .setRequired(true)
    );

export async function execute(interaction) {
    const mentionNumber = interaction.options.getInteger('mentionnumber');
    const mentionUser = interaction.options.getUser('mentionuser');

    if (!mentionUser) {
        return interaction.reply('❌ 有効なユーザーを指定してください。');
    }

    if (mentionNumber < 1 || mentionNumber > 4) {
        return interaction.reply('❌ メンション数は1〜4の間で指定してください。');
    }

    const mentionTags = Array(mentionNumber).fill(`<@${mentionUser.id}>`);
    const mentionMessage = mentionTags
        .map((tag) => `${tag}さん！@${interaction.user.tag}にメンションされました`)
        .join('\n');

    await interaction.reply(mentionMessage);
    console.log(`📝 ${interaction.user.tag} が /mention コマンドを使用`);
}

export const mentionCommand = { data, execute };

