import { EmbedBuilder } from 'discord.js';

// サイコロを振る関数
export function rollDice(count, max) {
    const rolls = [];
    for (let i = 0; i < count; i++) {
        rolls.push(Math.floor(Math.random() * max) + 1);
    }
    return rolls;
}

// dd形式や通常のd形式のダイス処理
export function rollNormalDice(dice) {
    let count, max;
    if (dice.startsWith('dd')) {
        count = 1;
        max = parseInt(dice.slice(2));
    } else if (dice.includes('d')) {
        [count, max] = dice.split('d').map(Number);
    }
    const rolls = [];
    for (let i = 0; i < count; i++) {
        rolls.push(Math.floor(Math.random() * max) + 1);
    }
    return rolls;
}

// dd〇〇 の判定
export function handleDdDice(dice, rolls) {
    const target = parseInt(dice.slice(2));
    const randomRoll = Math.floor(Math.random() * 100) + 1;
    let resultMessage = '';
    let embedColor = 0x000000;

    if (randomRoll <= target) {
        if (randomRoll <= 5) {
            resultMessage = `圧倒的成功！出目: ${randomRoll}`;
            embedColor = 0x00ff00; // 緑色（圧倒的成功）
        } else {
            resultMessage = `成功！出目: ${randomRoll}`;
            embedColor = 0x0077ff; // 青色（成功）
        }
    } else {
        if (randomRoll >= 96) {
            resultMessage = `圧倒的失敗！出目: ${randomRoll}`;
            embedColor = 0xff0000; // 赤色（圧倒的失敗）
        } else {
            resultMessage = `失敗！出目: ${randomRoll}`;
            embedColor = 0xff0000; // 赤色（失敗）
        }
    }
    return { resultMessage, embedColor };
}

// 通常のd形式の処理
export function handleNormalDice(dice, rolls) {
    const resultDescription = rolls.join(', ') + ` (合計: ${rolls.reduce((a, b) => a + b, 0)})`;
    let resultMessage = `出目: ${resultDescription}`;
    let embedColor = 0x000000;

    if (dice === '1d100') {
        if (rolls[0] === 1) {
            resultMessage += ' (1クリティカル！)';
            embedColor = 0x00ff00; // 緑
        } else if (rolls[0] <= 5) {
            resultMessage += ' (クリティカル！)';
            embedColor = 0x00ff00; // 緑
        } else if (rolls[0] <= 10) {
            resultMessage += ' (スペシャル)';
            embedColor = 0x0000ff; // 青
        } else if (rolls[0] >= 96 && rolls[0] <= 99) {
            resultMessage += ' (ファンブル)';
            embedColor = 0xff0000; // 赤
        } else if (rolls[0] === 100) {
            resultMessage += ' (100ファンブル)';
            embedColor = 0xff0000; // 赤
        }
    }
    return { resultMessage, embedColor };
}

// 特別ダイス：接待/虐待
export function applySpecialDice(diceType) {
    let roll;
    if (diceType === 'settai') {
        roll = Math.floor(Math.random() * 5) + 1; // 1〜5
    } else if (diceType === 'gyakutai') {
        roll = Math.floor(Math.random() * 5) + 96; // 96〜100
    }
    return roll;
}

export function getSettaiGyakutaiResult(diceType) {
    let resultMessage = '';
    let embedColor = 0x000000;

    const roll = applySpecialDice(diceType);

    if (diceType === 'settai') {
        resultMessage = `接待ダイス！出目: ${roll}（プレイヤーに優しい！）`;
        embedColor = 0x00ff00; // 緑色（接待）
    } else if (diceType === 'gyakutai') {
        resultMessage = `虐待ダイス！出目: ${roll}（あまりにも過酷！）`;
        embedColor = 0xff0000; // 赤色（虐待）
    }

    return { resultMessage, embedColor };
}

// ダイスコマンドのメイン処理
export async function handleMessageRoll(message) {
    const dice = message.content.trim();
    let rolls;
    let resultMessage = '';
    let embedColor = 0x000000; // 黒色デフォルト

    if (dice === 'settai' || dice === 'gyakutai') {
        const { resultMessage: specialResult, embedColor: specialColor } = getSettaiGyakutaiResult(dice);
        resultMessage = specialResult;
        embedColor = specialColor;
    } else if (/^(\d+d\d+|dd\d+)$/.test(dice)) {
        try {
            rolls = rollNormalDice(dice);
            if (dice.startsWith('dd')) {
                const { resultMessage: ddResult, embedColor: ddColor } = handleDdDice(dice, rolls);
                resultMessage = ddResult;
                embedColor = ddColor;
            } else {
                const { resultMessage: normalResult, embedColor: normalColor } = handleNormalDice(dice, rolls);
                resultMessage = normalResult;
                embedColor = normalColor;
            }
        } catch (error) {
            console.error('❌ サイコロエラー:', error);
            await message.reply(`❌ エラーが発生しました: ${error.message}`);
            return;
        }
    } else {
        await message.reply('❌ 無効なダイスの書式です。');
        return;
    }

    const embed = new EmbedBuilder()
        .setTitle(`${message.author.username} のサイコロ結果`)
        .setDescription(resultMessage)
        .setColor(embedColor)
        .setFooter({ text: 'サイコロ結果' })
        .setTimestamp();

    await message.reply({ embeds: [embed] });
}
