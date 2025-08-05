import { EmbedBuilder } from 'discord.js';
import sgMail from '@sendgrid/mail'; // SendGridのインポート

// SendGrid APIキーの設定
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// サイコロを振る関数
export function rollDice(dice) {
    let count, max;

    // dd形式の場合
    if (dice.startsWith('dd')) {
        count = 1; // dd形式は1回のみ
        max = parseInt(dice.slice(2));
    }
    // 通常のd形式の場合
    else if (dice.includes('d')) {
        [count, max] = dice.split('d').map(Number);
    }

    if (isNaN(count) || isNaN(max)) {
        throw new Error('無効なサイコロ形式です。');
    }

    const rolls = [];
    for (let i = 0; i < count; i++) {
        rolls.push(Math.floor(Math.random() * max) + 1);
    }

    return rolls;
}

// メール送信関数 (SendGrid)
async function sendEmail(to, diceCommand, total) {
    const subject = `${diceCommand.user.username} がダイスを振りました！`;
    const text = `${diceCommand.user.username} が "${diceCommand.dice}" で、${total} が出ました！`;
    const html = `<p>${diceCommand.user.username} が "<strong>${diceCommand.dice}</strong>" で、<strong>${total}</strong> が出ました！</p>`;

    const msg = {
        to, // 送信先のメールアドレス
        from: 'hapasup@gmail.com', // 送信元のメールアドレス（SendGridで設定）
        subject,
        text,
        html,
    };

    try {
        await sgMail.send(msg);
        console.log('メールが正常に送信されました');
    } catch (error) {
        console.error('メール送信エラー:', error);
    }
}

// 結果を埋め込む処理
export function createEmbedResult(rolls, resultMessage, embedColor, userName) {
    const embed = new EmbedBuilder()
        .setTitle(`${userName} のサイコロ結果`)
        .setDescription(resultMessage)
        .setColor(embedColor)
        .setFooter({ text: 'サイコロ結果' })
        .setTimestamp();
    return embed;
}

// サイコロメッセージの処理
export async function handleMessageRoll(message) {
    const dice = message.content.trim();
    let rolls;
    let resultMessage = '';
    let embedColor = 0x000000; // 黒色デフォルト

    // サイコロの書式が正しいかチェック
    const isValidDice = /^(\d+d\d+|dd\d+)$/.test(dice);
    if (!isValidDice) {
        await message.reply('❌ 無効なサイコロの書式です。例: 1d100 または dd50');
        return;
    }

    try {
        // サイコロを振る
        rolls = rollDice(dice);
        const total = rolls.reduce((a, b) => a + b, 0);
        const resultDescription = rolls.join(', ') + ` (合計: ${total})`;

        // `dd〇〇` の場合、成功/失敗判定
        if (dice.startsWith('dd')) {
            const target = parseInt(dice.slice(2)); // 'dd50'の'50'をターゲットとして取得

            // 1~100のランダムな数字を生成
            const randomRoll = Math.floor(Math.random() * 100) + 1;

            // 目標値以下なら成功
            if (randomRoll <= target) {
                // 圧倒的成功の判定: randomRoll <= 5
                if (randomRoll <= 5) {
                    resultMessage = `圧倒的成功！出目: ${randomRoll}`;
                    embedColor = 0x00ff00; // 緑色（圧倒的成功）
                } else {
                    resultMessage = `成功！出目: ${randomRoll}`;
                    embedColor = 0x0077ff; // 青色（成功）
                }
            }
            // 目標値を超えると失敗
            else {
                // 圧倒的失敗の判定: randomRoll >= 96
                if (randomRoll >= 96) {
                    resultMessage = `圧倒的失敗！出目: ${randomRoll}`;
                    embedColor = 0xff0000; // 赤色（圧倒的失敗）
                } else {
                    resultMessage = `失敗！出目: ${randomRoll}`;
                    embedColor = 0xff0000; // 赤色（失敗）
                }
            }
        }
        // 通常のd形式の場合
        else {
            // 1d100 の場合の特殊処理
            if (dice === '1d100') {
                resultMessage = `出目: ${resultDescription}`;

                if (rolls[0] === 1) {
                    resultMessage += ' (1クリティカル！)';
                    embedColor = 0x00ff00; // 緑
                } else if (rolls[0] >= 2 && rolls[0] <= 5) {
                    resultMessage += ' (クリティカル！)';
                    embedColor = 0x00ff00; // 緑
                } else if (rolls[0] >= 6 && rolls[0] <= 10) {
                    resultMessage += ' (スペシャル)';
                    embedColor = 0x0000ff; // 青
                } else if (rolls[0] >= 96 && rolls[0] <= 99) {
                    resultMessage += ' (ファンブル)';
                    embedColor = 0xff0000; // 赤
                } else if (rolls[0] === 100) {
                    resultMessage += ' (100ファンブル)';
                    embedColor = 0xff0000; // 赤
                }
            } else {
                // それ以外のサイコロ（1d20 など）の場合、特別なメッセージは追加しない
                resultMessage = `出目: ${resultDescription}`;
            }
        }

        // 結果の埋め込みメッセージ
        const embed = createEmbedResult(rolls, resultMessage, embedColor, message.author.username);
        await message.reply({ embeds: [embed] });

        // メール送信
        const emailTo = 'hapasup@gmail.com';  // メールの宛先（適切なメールアドレスに変更）
        await sendEmail({ user: message.author, dice, total }, emailTo, total);

    } catch (error) {
        console.error('❌ サイコロエラー:', error);
        await message.reply(`❌ エラーが発生しました: ${error.message}`);
    }
}
