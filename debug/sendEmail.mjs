import nodemailer from 'nodemailer';

// メール送信関数
export const sendEmail = async (userTag, userId, commandName, mentionCount, mentionUserTags) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_PASS,
            },
        });

        const mailOptions = {
            from: `"${userTag}" <${process.env.GMAIL_USER}>`, // 送信者名にユーザー名とIDを含める
            to: process.env.GMAIL_USER, // 自分のGmailアドレスに送信
            subject: 'コマンド使用通知',
            text: `ユーザー: <@${userId}>\n使用したコマンド: /${commandName}\nメンション数: ${mentionCount}\nメンションされたユーザー: ${mentionUserTags.join(', ')}`,
        };

        // メール送信処理
        const info = await transporter.sendMail(mailOptions);
        console.log('📧 メールを送信しました', info);
    } catch (error) {
        console.error('❌ メール送信エラー:', error);
    }
};