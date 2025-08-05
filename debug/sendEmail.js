import nodemailer from 'nodemailer';

// エラーメール送信関数
export const sendErrorEmail = async (errorMessage, userTag, userId, diceCommand) => {
    try {
        // nodemailerでカスタムポート10000を使用
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',  // Gmailを使用する場合
            port: 10000,  // ポート10000に変更
            secure: false,  // SSL無効に設定
            auth: {
                user: process.env.GMAIL_USER,  // Gmailユーザー名
                pass: process.env.GMAIL_PASS,  // アプリケーション用パスワード
            },
        });

        // エラーメールの内容
        const mailOptions = {
            from: `"${userTag}" <${process.env.GMAIL_USER}>`, // 送信者名にユーザー名を含める
            to: process.env.GMAIL_USER, // 受信者（自分のGmail）
            subject: `【エラー通知】${userTag} がダイスコマンドでエラーを発生させました！`,
            text: `ユーザー: <@${userId}>\n` +
                  `使用したコマンド: /${diceCommand}\n\n` +
                  `エラー内容:\n` +
                  `${errorMessage}\n\n` +
                  `エラー通知をお知らせします。`,
            html: `<p><strong>${userTag}</strong>（<@${userId}>）がコマンド "<strong>/${diceCommand}</strong>" を使用中にエラーが発生しました。</p>` +
                  `<p><strong>エラー内容:</strong></p>` +
                  `<p>${errorMessage}</p>` +
                  `<p>このエラー通知をお知らせします。</p>`,
        };

        // メール送信処理
        const info = await transporter.sendMail(mailOptions);
        console.log('📧 エラーメールを送信しました', info);
    } catch (error) {
        console.error('❌ エラーメール送信エラー:', error);
    }
};
