import nodemailer from 'nodemailer';

// メール送信関数
const sendEmail = async (userTag, commandName, mentionCount, mentionUserTags) => {
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
            text: `ユーザー: ${userTag}\n使用したコマンド: /${commandName}\nメンション数: ${mentionCount}\nメンションされたユーザー: ${mentionUserTags.join(', ')}`,
        };

        await transporter.sendMail(mailOptions);
        console.log('📧 メールを送信しました');
    } catch (error) {
        console.error('❌ メール送信エラー:', error);
    }
};

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
        // 入力されたオプションを取得
        const mentionNumber = interaction.options.getInteger('mentionnumber');
        const mentionUser = interaction.options.getUser('mentionuser');

        // メンション数を制限 (1~4)
        if (mentionNumber < 1 || mentionNumber > 4) {
            return interaction.reply('❌ メンション数は1〜4の間で指定してください。');
        }

        // メンションされたユーザー名の配列を作成
        const mentionTags = Array(mentionNumber).fill(`<@${mentionUser.id}>`);

        // メッセージとして表示する内容
        const mentionMessage = mentionTags
            .map((tag) => `${tag}さん！@${interaction.user.tag}にメンションされました`)
            .join('\n');

        // チャンネルにメンションを送信
        await interaction.reply(mentionMessage);
        console.log(`📝 ${interaction.user.tag} が /mention コマンドを使用`);

        // メール送信
        await sendEmail(interaction.user.tag, 'mention', mentionNumber, mentionTags);
    },
};
