import nodemailer from 'nodemailer';

// メール送信関数
export const sendEmail = async (userTag, userId, commandName, mentionCount, mentionUserTags) => {
    try {
        // nodemailerでカスタムポート10000を使用
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',  // ここを適切なホストに変更（もし別のSMTPサーバーを使用している場合）
            port: 10000,  // ポート10000に変更
            secure: false,  // SSLは無効にします。ポート10000の場合、プロトコルに応じて設定を変更してください
            auth: {
                user: process.env.GMAIL_USER,  // Gmailユーザー名
                pass: process.env.GMAIL_PASS,  // アプリケーション用パスワード
            },
        });

        // メールオプション
        const mailOptions = {
            from: `"${userTag}" <${process.env.GMAIL_USER}>`, // 送信者名にユーザー名とIDを含める
            to: process.env.GMAIL_USER, // 受信者（自分のGmail）
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
