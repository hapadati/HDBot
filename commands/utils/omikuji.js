import { SlashCommandBuilder } from 'discord.js';
import fs from 'fs';
import path from 'path';

// コマンドの定義
export const data = new SlashCommandBuilder()
    .setName('おみくじ')
    .setDescription('おみくじを引いて運勢を見よう！');

// コマンドの実行
export async function execute(interaction) {
    const result = getRandomFortune();
    const customMessage = getCustomMessage(result);

    await interaction.reply(`${interaction.user.username}さん、おめでとう！
あなたは「${result.name}」です！
${customMessage.text}
(${customMessage.index}/${customMessage.total})`);
}

// 運勢をランダムに選ぶ
function getRandomFortune() {
    const fortunes = [
        { name: '越吉', probability: 0.01 },
        { name: '超吉', probability: 0.1 },
        { name: '大大吉', probability: 2 },
        { name: '大吉', probability: 8.89 },
        { name: '吉', probability: 3 },
        { name: '中吉', probability: 16 },
        { name: '小吉', probability: 30 },
        { name: '末吉', probability: 39 },
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

// 運勢に応じたメッセージを取得
function getCustomMessage(fortune) {
    // import.meta.url を使って現在のファイルのパスを取得
    const __filename = new URL(import.meta.url).pathname;
    const __dirname = path.dirname(__filename);  // ディレクトリパスを取得

    // おみくじファイルが格納されている親ディレクトリのパス
    const fortuneDir = path.join(__dirname, 'omikuji', fortune.name);

    // 1つの関数でファイルをランダムに選ぶ処理
    const getRandomMessageFromFiles = (dirPath) => {
        // 指定されたディレクトリ内の全ての .txt ファイルを取得
        const files = fs.readdirSync(dirPath).filter(file => file.endsWith('.txt'));

        if (files.length === 0) {
            return { text: '運命に身を任せてみよう！', index: 1, total: 1 };
        }

        // ランダムにファイルを選択
        const randomFile = files[Math.floor(Math.random() * files.length)];
        const filePath = path.join(dirPath, randomFile);

        // ファイルの内容を読み込んでメッセージを設定
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const messages = fileContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);

        // ランダムにメッセージを選択
        const index = Math.floor(Math.random() * messages.length);
        return { text: messages[index], index: index + 1, total: messages.length };
    };

    // 越吉、超吉、大大吉などの運勢は、それぞれのディレクトリ内でランダムにファイルを選ぶ
    return getRandomMessageFromFiles(fortuneDir);
}
