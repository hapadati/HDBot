// client.js

import { Client, GatewayIntentBits, Routes, REST } from 'discord.js';
import dotenv from 'dotenv';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { data as omikujiCommand, execute as omikujiExecute } from './commands/utils/omikuji.js'; // omikuji コマンドをインポート

dotenv.config();

// Discord Bot クライアントを作成
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages, // DMメッセージの取得
    ],
});

// スラッシュコマンドの設定
const commands = [
    {
        name: 'ping',
        description: 'Ping Pong!',
    },
    omikujiCommand,  // おみくじコマンドを追加
    {
        name: 'roll',
        description: 'サイコロを振る (例: 1d100 または dd50)',
        options: [
            {
                name: 'dice',
                type: 3,
                description: 'サイコロの回数と最大の目 (例: 3d6, dd50)',
                required: true,
            },
        ],
    },
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

// スラッシュコマンドの同期処理
(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error('❌ コマンド登録エラー:', error);
    }
})();

// Botが起動完了したときの処理
client.once('ready', () => {
    console.log(`🎉 ${client.user.tag} が正常に起動しました！`);
});

// スラッシュコマンドの処理
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'ping') {
        // スラッシュコマンドの「ping」に反応
        if (interaction.user.bot) return; // ボットからの「ping」は無視
        await interaction.reply('🏓 Pong!');
    } else if (commandName === 'おみくじ') {
        // おみくじコマンドの実行
        await omikujiExecute(interaction);
    } else if (commandName === 'roll') {
        // roll コマンドの処理
        await handleRollCommand(interaction);
    }
});

// サイコロコマンドの処理
async function handleRollCommand(interaction) {
    const dice = interaction.options.getString('dice');
    const [count, sides] = dice.split('d').map(Number);

    if (isNaN(count) || isNaN(sides) || count <= 0 || sides <= 0) {
        await interaction.reply('サイコロの数と面の数を正しく入力してください。例: 3d6');
        return;
    }

    const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
    const total = rolls.reduce((acc, curr) => acc + curr, 0);

    await interaction.reply(`サイコロの結果: ${rolls.join(', ')} (合計: ${total})`);
}

// メッセージ処理（通常メッセージで「ping」に反応）
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;  // ボットメッセージを無視

    if (message.content.toLowerCase() === 'ping') {
        // 通常メッセージで「ping」に反応
        await message.reply('🏓 Pong!');
    }

    const dicePattern = /(dd\d+|(\d+)d(\d+))/i;
    const match = message.content.match(dicePattern);

    if (match) {
        await handleRollCommand(message);
    }
});

// エラーハンドリング
client.on('error', (error) => {
    console.error('❌ Discord クライアントエラー:', error);
});

// プロセス終了時の処理
process.on('SIGINT', () => {
    console.log('🛑 Botを終了しています...');
    client.destroy();
    process.exit(0);
});

// Discord にログイン
client.login(process.env.DISCORD_TOKEN)
    .catch(error => {
        console.error('❌ ログインに失敗しました:', error);
        process.exit(1);
});

// Express Webサーバーの設定（Render用）
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.json({
        status: 'Bot is running! 🤖',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

app.listen(port, () => {
    console.log(`🌐 Web サーバーがポート ${port} で起動しました`);
});
