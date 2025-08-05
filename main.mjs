import { Client, GatewayIntentBits, Routes, REST } from 'discord.js';
import dotenv from 'dotenv';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { data as omikujiCommand, execute as omikujiExecute } from './commands/utils/omikuji.js'; // omikuji コマンドをインポート
import { pingCommand } from './commands/ulits/ping.js';// pingコマンドをインポート
import { handleMessageRoll } from './commands/utils/dirdice.js'; // dirdice.js からサイコロの処理をインポート
import { mentionCommand } from './commands/ulits/mention.js'; // mentionコマンドをインポート
import sgMail from '@sendgrid/mail'; // SendGrid モジュールのインポート

// .env ファイルの読み込み
dotenv.config();

// SendGrid APIキーを設定
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

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
        description: 'Ping! Pong! と応答します。',
    },
    omikujiCommand,  // おみくじコマンドを追加
    mentionCommand,  // mentionコマンドを追加
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
client.once('ready', async () => {
    console.log(`🎉 ${client.user.tag} が正常に起動しました！`);

    // Botが起動した際にメールを送信
    await sendEmail(
        'recipient@example.com', // 宛先メールアドレス
        'Botが起動しました！', // メールの件名
        'Botが無事に起動しました！', // テキストメールの内容
        '<strong>Botが正常に起動しました！</strong>' // HTML形式のメール内容
    );
    console.log('起動通知のメールが送信されました！');
});

// スラッシュコマンドの処理
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'ping') {
        // スラッシュコマンドの「ping」に反応
        await pingCommand.execute(interaction);  // ここで pingCommand を実行
    } else if (commandName === 'おみくじ') {
        // おみくじコマンドの実行
        await omikujiExecute(interaction);
    } else if (commandName === 'roll') {
        // roll コマンドの処理
        await handleRollCommand(interaction);
    } else if (commandName === 'mention') {
        // mention コマンドの処理
        await mentionCommand.execute(interaction); // ここで mentionCommand を実行
    }
});

// サイコロコマンドの処理
async function handleRollCommand(interaction) {
    const dice = interaction.options.getString('dice');
    await handleMessageRoll(interaction);  // dirdice.js の handleMessageRoll を呼び出す
}

// メール送信関数 (SendGrid)
async function sendEmail(to, subject, text, html) {
    const msg = {
        to,  // 受信者のメールアドレス
        from: 'hapasup@gmail.com', // 送信者のメールアドレス（SendGridで設定したもの）
        subject,
        text,  // テキストメールの内容
        html,  // HTML形式メールの内容
    };

    try {
        await sgMail.send(msg);
        console.log('メールが正常に送信されました');
    } catch (error) {
        console.error('メール送信エラー:', error);
    }
}

// メッセージ処理（通常メッセージで「ping」に反応）
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;  // ボットメッセージを無視

    // スラッシュコマンドのメッセージは無視
    if (message.content.startsWith('/')) return;

    if (message.content.toLowerCase() === 'ping') {
        // 通常メッセージで「ping」に反応
        await message.reply('🏓 Pong!');
    }

    const dicePattern = /(dd\d+|(\d+)d(\d+))/i;
    const match = message.content.match(dicePattern);

    if (match) {
        await handleMessageRoll(message);  // dirdice.js の handleMessageRoll を呼び出す
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
