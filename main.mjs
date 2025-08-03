// 必要なライブラリを読み込み
import { Client, GatewayIntentBits, Routes } from 'discord.js';
import dotenv from 'dotenv';
import express from 'express';
import { REST } from '@discordjs/rest';

// コマンドのインポート
import { pingCommand } from './commands/utils/ping.js';
import { mentionCommand } from './commands/utils/mention.js'; // mentionコマンドのインポート

// .envファイルから環境変数を読み込み
dotenv.config();

// Discord Botクライアントを作成
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,             // サーバー情報取得
        GatewayIntentBits.GuildMessages,      // メッセージ取得
        GatewayIntentBits.MessageContent,     // メッセージ内容取得
        GatewayIntentBits.GuildMembers,       // メンバー情報取得
    ],
});

// スラッシュコマンドの設定
const commands = [
    pingCommand,  // ping コマンド
    mentionCommand,  // mention コマンドを追加
];

// REST APIを使って、スラッシュコマンドをDiscordに登録
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

// スラッシュコマンドの同期処理
(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        // グローバルにコマンドを登録（または特定のギルドでのみ）
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
    console.log(`📊 ${client.guilds.cache.size} つのサーバーに参加中`);
});

// スラッシュコマンドの処理
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    // コマンド名に基づいて適切な処理を呼び出し
    if (commandName === 'ping') {
        await pingCommand.execute(interaction); // インポートしたコマンドのexecuteを呼び出す
    } else if (commandName === 'mention') {
        await mentionCommand.execute(interaction); // mentionコマンドの処理
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
if (!process.env.DISCORD_TOKEN) {
    console.error('❌ DISCORD_TOKEN が .env ファイルに設定されていません！');
    process.exit(1);
}

console.log('🔄 Discord に接続中...');
client.login(process.env.DISCORD_TOKEN)
    .catch(error => {
        console.error('❌ ログインに失敗しました:', error);
        process.exit(1);
    });

// Express Webサーバーの設定（Render用）
const app = express();
const port = process.env.PORT || 3000;

// ヘルスチェック用エンドポイント
app.get('/', (req, res) => {
    res.json({
        status: 'Bot is running! 🤖',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// サーバー起動
app.listen(port, () => {
    console.log(`🌐 Web サーバーがポート ${port} で起動しました`);
});
