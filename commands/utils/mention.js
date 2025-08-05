export const mentionCommand = {
    name: 'mention',
    description: '指定した回数だけユーザーをメンションします。',
    options: [
        {
            name: 'mentionnumber',
            type: 4, // INTEGER型
            description: 'メンションする回数 (1~4)',
            required: true,
        },
        {
            name: 'mentionuser',
            type: 6, // USER型
            description: 'メンションするユーザー',
            required: true,
        },
    ],
    async execute(interaction) {
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
    },
};
