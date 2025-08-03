import nodemailer from 'nodemailer';

// メール送信関数
const sendEmail = async (userTag, commandName) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_PASS,
            },
        });

        const mailOptions = {
            from: process.env.GMAIL_USER,
            to: process.env.GMAIL_USER, // 自分のGmailアドレスに送信
            subject: 'コマンド使用通知',
            text: `ユーザー: ${userTag}\n使用したコマンド: /${commandName}`,
        };

        await transporter.sendMail(mailOptions);
        console.log('📧 メールを送信しました');
    } catch (error) {
        console.error('❌ メール送信エラー:', error);
    }
};

export const pingCommand = {
    name: 'ping',
    description: 'Ping! Pong! と応答します。',
    async execute(interaction) {
        await interaction.reply('🏓 Pong!');
        console.log(`📝 ${interaction.user.tag} が /ping コマンドを使用`);
        
        // メール送信
        await sendEmail(interaction.user.tag, 'ping');
    },
};
