import { Client, GatewayIntentBits, Routes, EmbedBuilder } from 'discord.js';
import dotenv from 'dotenv';
import express from 'express';
import { REST } from '@discordjs/rest';

// コマンドのインポート
import { pingCommand } from './commands/utils/ping.js';
import { mentionCommand } from './commands/utils/mention.js'; 
import { handleRollCommand } from './commands/utils/roll.js';
import { handleMessageRoll } from './commands/utils/dirdice.js';
// import { sendEmail } from './debug/sendEmail.js';  // メール送信機能を一時的に削除

dotenv.config();

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
        await pingCommand.execute(interaction);
    } else if (commandName === 'mention') {
        const userTag = interaction.user.tag;
        const userId = interaction.user.id;
        const mentionCount = interaction.options.getInteger('count');
        const mentionUserTags = interaction.options.getString('mentionUsers').split(', ');

        // メール送信部分を削除
        // await sendEmail(userTag, userId, 'mention', mentionCount, mentionUserTags);

        await mentionCommand.execute(interaction);
    } else if (commandName === 'roll') {
        await handleRollCommand(interaction);
    }
});

// メッセージ処理（DMおよびサーバー内メッセージに対応）
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // サイコロの形式にマッチするメッセージの場合
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
