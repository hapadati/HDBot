// 必要なライブラリを読み込み
import { Client, GatewayIntentBits, Routes, EmbedBuilder } from 'discord.js';
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
    {
        name: 'roll',
        description: 'サイコロを振る (例: 1d100 または dd50)',
        options: [
            {
                name: 'dice',
                type: 3, // String type
                description: 'サイコロの回数と最大の目 (例: 3d6, dd50)',
                required: true,
            },
        ],
    },  // roll コマンド
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

// サイコロを振る関数
function rollDice(dice) {
    const [count, max] = dice.split('d').map(Number);

    if (isNaN(count) || isNaN(max)) {
        throw new Error('無効なサイコロ形式です。');
    }

    const rolls = [];
    for (let i = 0; i < count; i++) {
        rolls.push(Math.floor(Math.random() * max) + 1);
    }

    return rolls;
}

// roll コマンドの実行処理
async function handleRollCommand(interaction) {
    const dice = interaction.options.getString('dice');
    let rolls;
    let resultMessage = '';
    let embedColor = 0x000000; // 黒色デフォルト

    try {
        // サイコロを振る
        rolls = rollDice(dice);
        const total = rolls.reduce((a, b) => a + b, 0);
        const resultDescription = rolls.join(', ') + ` (合計: ${total})`;

        // `dd〇〇` の場合、成功/失敗判定
        if (dice.startsWith('dd')) {
            const target = parseInt(dice.slice(2));

            if (rolls[0] <= target) {
                resultMessage = `成功！出目: ${rolls[0]}`;
                embedColor = 0x0077ff; // 青
            } else {
                resultMessage = `失敗！出目: ${rolls[0]}`;
                embedColor = 0xff0000; // 赤
            }
        } else {
            resultMessage = `出目: ${resultDescription}`;

            // 1d100 の場合の特殊処理
            if (rolls[0] === 1) {
                resultMessage += ' (圧倒的成功！)';
                embedColor = 0x00ff00; // 緑
            } else if (rolls[0] >= 96) {
                resultMessage += ' (圧倒的失敗！)';
                embedColor = 0xff0000; // 赤
            } else if (rolls[0] <= 5) {
                resultMessage += ' (圧倒的成功！)';
                embedColor = 0x00ff00; // 緑
            } else if (rolls[0] >= 96) {
                resultMessage += ' (圧倒的失敗！)';
                embedColor = 0xff0000; // 赤
            } else {
                resultMessage += ' (成功)';
                embedColor = 0x0077ff; // 青
            }
        }

        // 結果の埋め込みメッセージ
        const embed = new EmbedBuilder()
            .setTitle(`${interaction.user.username} のサイコロ結果`)
            .setDescription(resultMessage)
            .setColor(embedColor)
            .setFooter({ text: 'サイコロ結果' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    } catch (error) {
        console.error('❌ サイコロエラー:', error);
        await interaction.reply(`❌ エラーが発生しました: ${error.message}`);
    }
}

// Botが起動完了したときの処理
client.once('ready', () => {
    console.log(`🎉 ${client.user.tag} が正常に起動しました！`);
    console.log(`📊 ${client.guilds.cache.size} つのサーバーに参加中`);
});

// スラッシュコマンドの処理
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'ping') {
        await pingCommand.execute(interaction); // インポートしたコマンドのexecuteを呼び出す
    } else if (commandName === 'mention') {
        await mentionCommand.execute(interaction); // mentionコマンドの処理
    } else if (commandName === 'roll') {
        await handleRollCommand(interaction); // rollコマンドの処理
    }
});

// 🔽 通常のメッセージで手動の ping / mention にも反応させる
client.on('messageCreate', async (message) => {
    // Bot自身や他のBotのメッセージは無視
    if (message.author.bot) return;

    const content = message.content.trim().toLowerCase();

    if (content === 'ping') {
        await message.reply('🏓 Pong!');
    }

    if (content === 'mention') {
        await message.reply(`👋 ${message.author} が呼びました！`);
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
