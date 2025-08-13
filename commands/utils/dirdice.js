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

// dd形式ダイスの判定処理
export function handleDdDice(dice, rolls, modifier = 0) {
    try {
        let target = parseInt(dice.slice(2));
        if (isNaN(target)) throw new Error('ターゲット値が無効です'); // エラーチェック

        target = eval(`${target} ${modifier >= 0 ? '+' : ''}${modifier}`);

        const randomRoll = Math.floor(Math.random() * 100) + 1;
        let resultMessage = '';
        let embedColor = 0x000000;

        if (randomRoll <= target) {
            if (randomRoll <= 5) {
                resultMessage = `圧倒的成功！出目: ${randomRoll} / 目標: ${target}`;
                embedColor = 0x00ff00;
            } else {
                resultMessage = `成功！出目: ${randomRoll} / 目標: ${target}`;
                embedColor = 0x0077ff;
            }
        } else {
            if (randomRoll >= 96) {
                resultMessage = `圧倒的失敗！出目: ${randomRoll} / 目標: ${target}`;
                embedColor = 0xff0000;
            } else {
                resultMessage = `失敗！出目: ${randomRoll} / 目標: ${target}`;
                embedColor = 0xff0000;
            }
        }

        return { resultMessage, embedColor };

    } catch (error) {
        console.error('❌ ddダイスエラー:', error); // エラーログ
        return { resultMessage: `❌ エラー: ${error.message}`, embedColor: 0xff0000 }; // エラーメッセージ
    }
}


// 通常のダイスの処理
export function handleNormalDice(dice, rolls, modifier = 0) {
    const total = rolls.reduce((a, b) => a + b, 0);
    const modifiedTotal = eval(`${total} ${modifier >= 0 ? '+' : ''}${modifier}`);
    const resultDescription = rolls.join(', ') + ` (合計: ${total}${modifier ? ` → 修正後: ${modifiedTotal}` : ''})`;
    let resultMessage = `出目: ${resultDescription}`;
    let embedColor = 0x000000;

    if (dice === '1d100') {
        const roll = modifiedTotal;
        if (roll === 1) {
            resultMessage += ' (1クリティカル！)';
            embedColor = 0x00ff00;
        } else if (roll <= 5) {
            resultMessage += ' (クリティカル！)';
            embedColor = 0x00ff00;
        } else if (roll <= 10) {
            resultMessage += ' (スペシャル)';
            embedColor = 0x0000ff;
        } else if (roll >= 96 && roll <= 99) {
            resultMessage += ' (ファンブル)';
            embedColor = 0xff0000;
        } else if (roll === 100) {
            resultMessage += ' (100ファンブル)';
            embedColor = 0xff0000;
        }
    }
    return { resultMessage, embedColor };
}

// 特別ダイス：接待/虐待
export function applySpecialDice(diceType) {
    let roll;
    if (diceType === 'settai') {
        roll = Math.floor(Math.random() * 5) + 1;
    } else if (diceType === 'gyakutai') {
        roll = Math.floor(Math.random() * 5) + 96;
    }
    return roll;
}

export function getSettaiGyakutaiResult(diceType) {
    let resultMessage = '';
    let embedColor = 0x000000;

    const roll = applySpecialDice(diceType);

    if (diceType === 'settai') {
        resultMessage = `接待ダイス！出目: ${roll}（プレイヤーに優しい！）`;
        embedColor = 0x00ff00;
    } else if (diceType === 'gyakutai') {
        resultMessage = `虐待ダイス！出目: ${roll}（あまりにも過酷！）`;
        embedColor = 0xff0000;
    }

    return { resultMessage, embedColor };
}

// ddX形式ダイスの判定処理 (追加)
export function handleDdXDice(dice) {
    const target = parseInt(dice.slice(2)); // ddXのXを取得
    const randomRoll = Math.floor(Math.random() * 100) + 1;
    let resultMessage = '';
    let embedColor = 0x000000;

    if (randomRoll <= target) {
        if (randomRoll <= 5) {
            resultMessage = `圧倒的成功！出目: ${randomRoll} / 目標: ${target}`;
            embedColor = 0x00ff00;
        } else {
            resultMessage = `成功！出目: ${randomRoll} / 目標: ${target}`;
            embedColor = 0x0077ff;
        }
    } else {
        if (randomRoll >= 96) {
            resultMessage = `圧倒的失敗！出目: ${randomRoll} / 目標: ${target}`;
            embedColor = 0xff0000;
        } else {
            resultMessage = `失敗！出目: ${randomRoll} / 目標: ${target}`;
            embedColor = 0xff0000;
        }
    }
    return { resultMessage, embedColor };
}

// バラバラダイスの処理（XbY形式）
export function rollBaraBaraDice(counts) {
    const rolls = [];
    for (const [sides, count] of counts) {
        for (let i = 0; i < count; i++) {
            rolls.push(Math.floor(Math.random() * sides) + 1);
        }
    }
    return rolls;
}

// バラバラダイスの成功数判定
export function handleBaraBaraSuccess(rolls, successValue) {
    const successCount = rolls.filter(roll => roll <= successValue).length;
    return successCount;
}

// バラバラダイスの出目結果と成功数を含むメッセージ
export function handleBaraBaraDice(diceString, rolls, successValue) {
    const rollResults = rolls.join(', ');  // 出目のリスト
    let resultMessage = `出目: ${rollResults}`;

    if (successValue !== undefined) {
        const successCount = handleBaraBaraSuccess(rolls, successValue);
        resultMessage += ` --> 成功数: ${successCount}`;
    }

    return resultMessage;
}

// エモクロアダイス (XdmY形式)
export function rollEmocroaDice(count, successValue) {
    const rolls = [];
    let successCount = 0;

    for (let i = 0; i < count; i++) {
        const roll = Math.floor(Math.random() * 10) + 1;  // 10面ダイスを振る
        rolls.push(roll);

        // クリティカル/エラーダイスの処理
        if (roll === 1) {
            successCount += 2;  // 1は成功数+2
        } else if (roll === 10) {
            successCount -= 1;  // 10は成功数-1
        } else if (roll <= successValue) {
            successCount += 1;  // 成功値以下の出目は成功数+1
        }
    }

    return { rolls, successCount };
}

// エモクロアダイスの結果を含むメッセージ
export function handleEmocroaDice(diceString, rolls, successCount) {
    const rollResults = rolls.join(', ');  // 出目のリスト
    let resultMessage = `出目: ${rollResults} --> 成功数: ${successCount}`;
    return resultMessage;
}

// ダイス式のパース関数（エモクロアダイス対応）
function parseEmocroaExpression(dice) {
    try {
        const match = dice.match(/^(\d+)dm(\d+)$/);  // XdmY形式に対応
        if (!match) throw new Error('無効なエモクロアダイスの書式です'); // エラーチェック

        const count = parseInt(match[1]);
        const successValue = parseInt(match[2]);

        return { count, successValue };

    } catch (error) {
        console.error('❌ エモクロアダイスのパースエラー:', error); // エラーログ
        return null; // 無効な入力は null を返す
    }
}


// バラバラダイスのパース関数（XbY形式）
function parseBaraBaraExpression(dice) {
    try {
        const match = dice.match(/^(\d+)b(\d+)(?:\s+(\d+))?$/);  // XbY (Z)形式
        if (!match) throw new Error('無効なバラバラダイスの書式です'); // エラーチェック

        const counts = [
            [parseInt(match[2]), parseInt(match[1])]
        ];

        const successValue = match[3] ? parseInt(match[3]) : undefined;
        return { counts, successValue };

    } catch (error) {
        console.error('❌ バラバラダイスのパースエラー:', error); // エラーログ
        return null; // 無効な入力は null を返す
    }
}


// ddX形式のパース関数（追加）
function parseDdExpression(dice) {
    try {
        const match = dice.match(/^dd(\d+)$/);  // ddX形式に対応
        if (!match) throw new Error('無効なddX形式です'); // エラーチェック

        const target = parseInt(match[1]);
        if (isNaN(target)) throw new Error('ddXターゲットが無効です'); // エラーチェック
        return { target };

    } catch (error) {
        console.error('❌ ddX形式のパースエラー:', error); // エラーログ
        return null; // 無効な入力は null を返す
    }
}


// ダイスアニメーションの表示関数
async function showRollingEmbed(message, diceResultCallback, originalDiceText) {
    const rollingEmbed = new EmbedBuilder()
        .setTitle(`${message.author.username} のサイコロ振り中...`)
        .setColor(0xffff00)
        .setDescription(`振っています... ${originalDiceText}`);

    const rollingMessage = await message.reply({ embeds: [rollingEmbed] });

    const maxRoll = 100;  // 表示用に汎用的に
    const rollingStages = 15;

    for (let i = 0; i < rollingStages; i++) {
        const randomRoll = Math.floor(Math.random() * maxRoll) + 1;
        rollingEmbed.setDescription(`振っています... ${originalDiceText} ${randomRoll}`);
        await rollingMessage.edit({ embeds: [rollingEmbed] });
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    const { resultMessage, embedColor } = await diceResultCallback();
    const finalEmbed = new EmbedBuilder()
        .setTitle(`${message.author.username} のサイコロ結果`)
        .setDescription(resultMessage)
        .setColor(embedColor)
        .setFooter({ text: 'サイコロ結果' })
        .setTimestamp();

    await rollingMessage.edit({ embeds: [finalEmbed] });
}

// ダイスコマンドのメイン処理
export async function handleMessageRoll(message) {
    try {
        const input = message.content.trim();
        let rolls = [];
        let resultMessage = '';
        let embedColor = 0x000000;

        // 接待/虐待ダイスの処理
        if (input === 'settai' || input === 'gyakutai') {
            const { resultMessage: specialResult, embedColor: specialColor } = getSettaiGyakutaiResult(input);
            resultMessage = specialResult;
            embedColor = specialColor;
            await message.reply({ embeds: [new EmbedBuilder().setDescription(resultMessage).setColor(embedColor)] });
            return;
        }

        // エモクロアダイス (XdmY形式) の処理
        const parsedEmocroa = parseEmocroaExpression(input);
        if (parsedEmocroa) {
            const { count, successValue } = parsedEmocroa;
            const { rolls, successCount } = rollEmocroaDice(count, successValue);

            const diceResultCallback = async () => {
                return { resultMessage: handleEmocroaDice(input, rolls, successCount), embedColor: 0x0000ff };
            };

            await showRollingEmbed(message, diceResultCallback, input);
            return;
        }

        // バラバラダイス (XbY形式) の処理
        const parsedBaraBara = parseBaraBaraExpression(input);
        if (parsedBaraBara) {
            const { counts, successValue } = parsedBaraBara;
            const rolls = rollBaraBaraDice(counts);
            const resultMessage = handleBaraBaraDice(input, rolls, successValue);

            await message.reply({ embeds: [new EmbedBuilder().setDescription(resultMessage).setColor(0x0000ff)] });
            return;
        }

        // ddX形式の処理（追加）
        const parsedDd = parseDdExpression(input);
        if (parsedDd) {
            const { target } = parsedDd;

            const diceResultCallback = async () => {
                const { resultMessage, embedColor } = handleDdXDice(input);
                return { resultMessage, embedColor };
            };

            await showRollingEmbed(message, diceResultCallback, input);
            return;
        }

        // 通常のd形式ダイスの処理（追加）
        const parsedNormal = parseNormalDiceExpression(input);
        if (parsedNormal) {
            const { count, sides, modifier } = parsedNormal;
            const rolls = rollNormalDice(count, sides);
            const resultMessage = handleNormalDice(input, rolls, modifier);

            await message.reply({ embeds: [new EmbedBuilder().setDescription(resultMessage).setColor(0x0000ff)] });
            return;
        }

        // 入力が無効な場合のエラーハンドリング
        throw new Error('無効なダイスの書式です。例えば、2d6や1d100+10、dd20などが正しい書式です。');

    } catch (error) {
        console.error('❌ サイコロ処理エラー:', error); // エラーログ
        await message.reply({ embeds: [new EmbedBuilder().setDescription(`❌ エラー: ${error.message}`).setColor(0xff0000)] }); // エラーメッセージ
    }
}
