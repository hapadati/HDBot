// commands/utils/roll.js
import { EmbedBuilder } from 'discord.js';

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

// roll コマンドの実行処理
export async function handleRollCommand(interaction) {
    const dice = interaction.options.getString('dice');
    let rolls;
    let resultMessage = '';
    let embedColor = 0x000000; // 黒色デフォルト

    try {
        // サイコロを振る
        rolls = rollDice(dice);
        const total = rolls.reduce((a, b) => a + b, 0);
        const resultDescription = rolls.join(', ') + ` (合計: ${total})`;

        // `dd〇〇` の場合、成功/失敗判定
        if (dice.startsWith('dd')) {
            const target = parseInt(dice.slice(2));

            if (rolls[0] <= target) {
                resultMessage = `成功！出目: ${rolls[0]}`;
                embedColor = 0x0077ff; // 青
            } else {
                resultMessage = `失敗！出目: ${rolls[0]}`;
                embedColor = 0xff0000; // 赤
            }
        } else {
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
        const embed = new EmbedBuilder()
            .setTitle(`${interaction.user.username} のサイコロ結果`)
            .setDescription(resultMessage)
            .setColor(embedColor)
            .setFooter({ text: 'サイコロ結果' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    } catch (error) {
        console.error('❌ サイコロエラー:', error);
        await interaction.reply(`❌ エラーが発生しました: ${error.message}`);
    }
}
