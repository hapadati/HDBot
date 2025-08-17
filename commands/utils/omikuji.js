import { SlashCommandBuilder } from 'discord.js';
import fs from 'fs';
import path from 'path';

// コマンドの定義
export const data = new SlashCommandBuilder()
    .setName('おみくじ')
    .setDescription("おみくじを引いて運勢を見よう！Let's play Omikuji!");

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
    // Windows 対応の __dirname 取得処理
    const rawPath = decodeURIComponent(new URL(import.meta.url).pathname);
    const __filename = process.platform === 'win32' && rawPath.startsWith('/')
        ? rawPath.slice(1)
        : rawPath;
    const __dirname = path.dirname(__filename);

    const fortuneDir = path.join(__dirname, 'omikuji', fortune.name);

    const getRandomMessageFromFiles = (dirPath) => {
        if (!fs.existsSync(dirPath)) {
            console.warn(`❗️ フォルダが存在しません: ${dirPath}`);
            return { text: '運命に身を任せてみよう！', index: 1, total: 1 };
        }

        const files = fs.readdirSync(dirPath)
            .filter(file => file.endsWith('.txt'))
            .sort((a, b) => {
                const numA = parseInt(path.basename(a, '.txt'), 10);
                const numB = parseInt(path.basename(b, '.txt'), 10);
                return numA - numB;
            });

        if (files.length === 0) {
            return { text: '運命に身を任せてみよう！', index: 1, total: 1 };
        }

        const randomIndex = Math.floor(Math.random() * files.length);
        const randomFile = files[randomIndex];
        const filePath = path.join(dirPath, randomFile);
        const fileContent = fs.readFileSync(filePath, 'utf-8').trim();

        const fileNumber = parseInt(path.basename(randomFile, '.txt'), 10);

        return {
            text: fileContent,
            index: fileNumber,
            total: files.length
        };
    };

    return getRandomMessageFromFiles(fortuneDir);
}
export const omikujiCommand = { data, execute };
