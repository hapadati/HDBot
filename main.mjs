import { Client, GatewayIntentBits, Routes, REST } from 'discord.js';
import dotenv from 'dotenv';
import express from 'express';
import { data as omikujiCommand, execute as omikujiExecute } from './commands/utils/omikuji.js'; // omikuji コマンドをインポート
import { pingCommand } from './commands/utils/ping.js'; // pingコマンドをインポート
import { handleMessageRoll } from './commands/utils/dirdice.js'; // dirdice.js からサイコロの処理をインポート
import { mentionCommand } from './commands/utils/mention.js'; // mentionコマンドをインポート
import { data as geoquizCommand, execute as geoquizExecute } from './commands/utils/geoquiz.js'; // geoquiz コマンドをインポート

// .env ファイルの読み込み
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
        description: 'Ping! Pong! と応答します。',
    },
    omikujiCommand,  // おみくじコマンドを追加
    mentionCommand,  // mentionコマンドを追加
    geoquizCommand,  // geoquizコマンドを追加
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
    } else if (commandName === 'mention') {
        // mention コマンドの処理
        await mentionCommand.execute(interaction); // ここで mentionCommand を実行
    } else if (commandName === 'geoquiz') {
        // geoquiz コマンドの実行
        await geoquizExecute(interaction); // geoquiz の処理（実装済み）
    }
});

// サイコロコマンドの処理
async function handleRollCommand(interaction) {
    const dice = interaction.options.getString('dice');
    await handleMessageRoll(interaction);  // dirdice.js の handleMessageRoll を呼び出す
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
console.log('🔑 Discord Token (最初の5文字だけ表示):', process.env.DISCORD_TOKEN?.slice(0, 5));

client.login(process.env.DISCORD_TOKEN)
    .then(() => {
        console.log("✅ Discord にログイン成功しました！");
    })
    .catch(error => {
        console.error('❌ Discord にログイン失敗:', error);
        process.exit(1);
    });


// Express Webサーバーの設定（Render用）
const app = express();
const port = process.env.PORT || 10000;

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
