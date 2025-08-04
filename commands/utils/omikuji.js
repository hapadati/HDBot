// commands/utils/omikuji.js
import { SlashCommandBuilder } from 'discord.js';
import fs from 'fs';
import path from 'path';

export const data = new SlashCommandBuilder()
    .setName('おみくじ')
    .setDescription('おみくじを引いて運勢を見よう！');

export async function execute(interaction) {
    const result = getRandomFortune();
    const customMessage = getCustomMessage(result);

    await interaction.reply(`${interaction.user.username}さん、おめでとう！
あなたは「${result.name}」です！
${customMessage.text}
(${customMessage.index}/${customMessage.total})`);
}

function getRandomFortune() {
    const fortunes = [
        { name: '越吉', probability: 0.001 },
        { name: '超吉', probability: 0.01 },
        { name: '大大吉', probability: 0.1 },
        { name: '大吉', probability: 0.889 },
        { name: '吉', probability: 3 },
        { name: '中吉', probability: 16 },
        { name: '小吉', probability: 30 },
        { name: '末吉', probability: 49 },
        { name: '小凶', probability: 0.89 },
        { name: '凶', probability: 0.1 },
        { name: '大凶', probability: 0.01 }
    ];

    const rand = Math.random() * 100;
    let sum = 0;
    for (const fortune of fortunes) {
        sum += fortune.probability;
        if (rand <= sum) {
            return fortune;
        }
    }
}

function getCustomMessage(fortune) {
    // メッセージを格納しているディレクトリのパス
    const fortuneDir = path.join(__dirname, 'omikuji');

    // おみくじの種類に応じたファイル名を設定
    const fileName = `${fortune.name}.txt`;
    const filePath = path.join(fortuneDir, fileName);

    // ファイルが存在する場合はメッセージを読み込み、存在しない場合はデフォルトメッセージを設定
    let messages = ['運命に身を任せてみよう！'];

    if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        messages = fileContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    }

    // ランダムにメッセージを選択
    const index = Math.floor(Math.random() * messages.length);
    return { text: messages[index], index: index + 1, total: messages.length };
}
