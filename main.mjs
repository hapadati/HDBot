// main.mjs
import { Client, GatewayIntentBits, Routes, EmbedBuilder } from 'discord.js';
import dotenv from 'dotenv';
import express from 'express';
import { REST } from '@discordjs/rest';
import nodemailer from 'nodemailer';

dotenv.config();

// コマンドのインポート
import { pingCommand } from './commands/utils/ping.js';
import { mentionCommand } from './commands/utils/mention.js'; 
import { handleRollCommand } from './commands/utils/roll.js';
import { handleMessageRoll } from './commands/utils/dirdice.js';

// Discord Botクライアントを作成
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
    pingCommand,
    mentionCommand,
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
        sendErrorEmail('Slash Command Registration Error', `エラー内容:\n${error.message}\n${error.stack}`);
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

    try {
        if (commandName === 'ping') {
            await interaction.deferReply(); // 応答を遅延させる
            await pingCommand.execute(interaction);
            await interaction.editReply("Pong!");
        } else if (commandName === 'mention') {
            await interaction.deferReply();
            await mentionCommand.execute(interaction);
            await interaction.editReply("Mention received!");
        } else if (commandName === 'roll') {
            await interaction.deferReply();
            await handleRollCommand(interaction);
            await interaction.editReply("Rolling done!");
        }
    } catch (error) {
        console.error('❌ コマンド実行エラー:', error);
        sendErrorEmail('Command Execution Error', `エラー内容:\n${error.message}\n${error.stack}`);
    }
});

// メッセージ処理（DMおよびサーバー内メッセージに対応）
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const dicePattern = /(dd\d+|(\d+)d(\d+))/i;
    const match = message.content.match(dicePattern);

    if (match) {
        try {
            await handleRollCommand(message);
        } catch (error) {
            console.error('❌ サイコロエラー:', error);
            sendErrorEmail('Dice Roll Error', `エラー内容:\n${error.message}\n${error.stack}`);
        }
    }
});

// エラーハンドリング
client.on('error', (error) => { 
    console.error('❌ Discord クライアントエラー:', error); 
    sendErrorEmail('Discord Client Error', `エラー内容:\n${error.message}\n${error.stack}`);
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
        sendErrorEmail('Login Error', `エラー内容:\n${error.message}\n${error.stack}`);
        process.exit(1);
    });

// エラーメール送信関数
async function sendErrorEmail(subject, message) {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    const mailOptions = {
        from: process.env.SMTP_USER,
        to: process.env.NOTIFY_EMAIL,
        subject: subject,
        text: message,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('✅ エラーメールを送信しました');
    } catch (error) {
        console.error('❌ エラーメール送信エラー:', error);
    }
}
