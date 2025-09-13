// main.mjs
import { Client, GatewayIntentBits, REST, Routes } from 'discord.js';
import { logToSheets } from './logger.js';
import dotenv from 'dotenv';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM 用 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .env 読み込み
dotenv.config();

// Discord クライアント
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages,
    ],
});

// ==========================
// 📂 コマンド読み込み
// ==========================
import { omikujiCommand } from './commands/utils/omikuji.js';
import { pingCommand } from './commands/utils/ping.js';
import { handleMessageRoll } from './commands/utils/dirdice.js';
import { mentionCommand } from './commands/utils/mention.js';
import { recruitmentCommand } from './commands/manage/button.js';
import { alldeleteCommand } from './commands/manage/alldelete.js';
import { banCommand } from './commands/manage/ban.js';
import { kickCommand } from './commands/manage/kick.js';
import { roleCommand } from './commands/manage/role.js';
import { softbanCommand } from './commands/manage/softban.js';
import { timeoutCommand } from './commands/manage/timeout.js';
import { geoquizCommand } from './commands/utils/geoquiz.js';
import { execute, handleComponent } from "./commands/points/item-list.js"; // パスは調整

// 基本コマンド
const rawCommands = [
    omikujiCommand,
    mentionCommand,
    recruitmentCommand,
    alldeleteCommand,
    banCommand,
    kickCommand,
    roleCommand,
    softbanCommand,
    timeoutCommand,
    geoquizCommand,
    handleComponent,
];

// 📂 points コマンドの自動読み込み
const pointsCommands = [];
const pointsPath = path.join(__dirname, 'commands', 'points');

if (fs.existsSync(pointsPath)) {
    const pointFiles = fs.readdirSync(pointsPath).filter(file => file.endsWith('.js'));

    for (const file of pointFiles) {
        const filePath = path.join(pointsPath, file);
        const command = await import(filePath);

        if (command?.data && typeof command.execute === 'function') {
            pointsCommands.push(command);
            console.log(`✅ 読み込み成功: points/${file}`);
        } else {
            console.warn(`⚠️ 読み込み失敗: points/${file}`);
        }
    }
}

// ==========================
// 📂 スラッシュコマンド登録
// ==========================
const commands = [
    pingCommand.data.toJSON(), // 固定コマンド
    ...rawCommands.map(cmd => cmd.data.toJSON()),
    ...pointsCommands.map(cmd => cmd.data.toJSON()),
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );

        console.log('✅ Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error('❌ コマンド登録エラー:', error);
    }
})();

// ==========================
// 📂 Interaction 処理
// ==========================
client.on('interactionCreate', async (interaction) => {
    try {
      // スラッシュコマンドの処理
      if (interaction.isChatInputCommand()) {
        const { commandName } = interaction;
  
        // 基本コマンド
        switch (commandName) {
          case 'ping':
            await pingCommand.execute(interaction);
            break;
          case 'おみくじ':
            await omikujiCommand.execute(interaction);
            break;
          case 'mention':
            await mentionCommand.execute(interaction);
            break;
          case 'recruitment':
            await recruitmentCommand.execute(interaction);
            break;
          case 'alldelete':
            await alldeleteCommand.execute(interaction);
            break;
          case 'ban':
            await banCommand.execute(interaction);
            break;
          case 'kick':
            await kickCommand.execute(interaction);
            break;
          case 'role':
            await roleCommand.execute(interaction);
            break;
          case 'softban':
            await softbanCommand.execute(interaction);
            break;
          case 'timeout':
            await timeoutCommand.execute(interaction);
            break;
          case 'geoquiz':
            await geoquizCommand.execute(interaction);
            break;
        }
  
        // points コマンド
        const found = pointsCommands.find(cmd => cmd.data.name === commandName);
        if (found) {
          await found.execute(interaction);
        }
  
        // ログ送信
        await logToSheets({
          serverId: interaction.guildId,
          userId: interaction.user.id,
          channelId: interaction.channelId,
          level: "INFO",
          timestamp: interaction.createdAt.toISOString(),
          cmd: interaction.commandName,
          message: "Slash command executed",
        });
      }
  
      // 🔽 コンポーネント（ボタン・セレクト・モーダル）の処理を追加
      if (interaction.isButton() || interaction.isStringSelectMenu() || interaction.isModalSubmit()) {
        console.log("[interactionCreate] Component interaction detected:", interaction.customId);
        await handleComponent(interaction);
      }
    } catch (err) {
      console.error("❌ interactionCreate error:", err);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: "⚠️ エラーが発生しました。", ephemeral: true });
      }
    }
  });
  
// ==========================
// 📂 メッセージイベント
// ==========================
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // 「ping」に反応
    if (message.content.toLowerCase() === 'ping') {
        await message.reply('🏓 Pong!');
    }

    // ( ´◔‸◔`) 顔文字反応
    const faceRegexTuna = /\(\s?´◔‸◔`\s?\)/;
    if (faceRegexTuna.test(message.content)) {
        const replies = [
            'つなしないよ、HDBotだけ見て！',
            '( ´◔‸◔`)👐まのﾎﾞﾝ',
            '( ´◔‸◔`)👐🌻',
        ];
        const randomReply = replies[Math.floor(Math.random() * replies.length)];
        await message.reply(randomReply);
    }

    // ダイスコマンド
    const dicePattern = /(dd\d+|(\d+)d(\d+))/i;
    if (dicePattern.test(message.content)) {
        await handleMessageRoll(message);
    }

    // ログ送信
    await logToSheets({
        serverId: message.guildId,
        userId: message.author.id,
        channelId: message.channelId,
        level: "INFO",
        timestamp: message.createdAt.toISOString(),
        cmd: "message",
        message: message.content,
    });
});

// ==========================
// 📂 起動処理
// ==========================
client.once('ready', () => {
    console.log(`✅ Discord にログイン成功: ${client.user.tag}`);
    logToSheets({
        serverId: "system",
        userId: "system",
        channelId: "system",
        level: "INFO",
        timestamp: new Date().toISOString(),
        cmd: "startup",
        message: `${client.user.tag} が起動しました`,
    });
});

// Discord にログイン
if (!process.env.DISCORD_TOKEN) {
    console.error('❌ DISCORD_TOKEN が設定されていません');
    process.exit(1);
}

client.login(process.env.DISCORD_TOKEN);

// ==========================
// 📂 Express Web サーバー
// ==========================
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.json({
        status: 'Bot is running! 🤖',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});

app.listen(port, () => {
    console.log(`🌐 Web サーバー起動: http://localhost:${port}`);
});
