export const pingCommand = {
    name: 'ping',
    description: 'Ping! Pong! と応答します。',
    async execute(interaction) {
        await interaction.reply('🏓 Pong!');
        console.log(`📝 ${interaction.user.tag} が /ping コマンドを使用`);
        
        // メール送信機能を一時的に削除
        // await sendEmail(interaction.user.tag, 'ping');
    },
};
