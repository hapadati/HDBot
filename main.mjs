import { Client, GatewayIntentBits, Routes, REST } from 'discord.js';
import dotenv from 'dotenv';
import express from 'express';

// CommonJS の形でインポートする修正
import pkg from 'discord.js';
const { MessageEmbed, MessageActionRow, MessageButton, PermissionFlagsBits } = pkg;

import { data as omikujiCommand, execute as omikujiExecute } from './commands/utils/omikuji.js'; 
import { pingCommand } from './commands/utils/ping.js'; 
import { handleMessageRoll } from './commands/utils/dirdice.js'; 
import { mentionCommand } from './commands/utils/mention.js'; 
import { data as geoquizCommand, execute as geoquizExecute } from './commands/utils/geoquiz.js'; 
import { recruitmentCommand } from './commands/manage/button.js';

// 他のモジュールもすべて `import` に変更
import { alldeleteCommand } from './commands/manage/alldelete.js';  
import { banCommand } from './commands/manage/ban.js'; 
import { kickCommand } from './commands/manage/kick.js'; 
import { roleCommand } from './commands/manage/role.js'; 
import { softbanCommand } from './commands/manage/softban.js'; 
import { timeoutCommand } from './commands/manage/timeout.js'; 

dotenv.config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages,
    ],
});

// スラッシュコマンドの設定
import { SlashCommandBuilder } from 'discord.js';

// pingCommand も SlashCommandBuilder で定義すること！
const commands = [
    new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Ping! Pong! と応答します。')
        .toJSON(),

    omikujiCommand.data.toJSON(),
    mentionCommand.data.toJSON(),
    geoquizCommand.data.toJSON(),
    recruitmentCommand.data.toJSON(),
    alldeleteCommand.data.toJSON(),
    banCommand.data.toJSON(),
    kickCommand.data.toJSON(),
    roleCommand.data.toJSON(),
    softbanCommand.data.toJSON(),
    timeoutCommand.data.toJSON()
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

// スラッシュコマンドの処理
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    switch (commandName) {
        case 'ping':
            await pingCommand.execute(interaction);  // pingコマンド
            break;
        case 'おみくじ':
            await omikujiCommand.execute(interaction);  // おみくじコマンド
            break;
        case 'mention':
            await mentionCommand.execute(interaction);  // mentionコマンド
            break;
        case 'geoquiz':
            await geoquizCommand.execute(interaction);  // geoquizコマンド
            break;
        case 'recruitment':
            await recruitmentCommand.execute(interaction);  // recruitmentコマンド
            break;
        case 'alldelete':
            await alldeleteCommand.execute(interaction);  // alldeleteコマンド
            break;
        case 'ban':
            await banCommand.execute(interaction);  // banコマンド
            break;
        case 'kick':
            await kickCommand.execute(interaction);  // kickコマンド
            break;
        case 'role':
            await roleCommand.execute(interaction);  // roleコマンド
            break;
        case 'softban':
            await softbanCommand.execute(interaction);  // softbanコマンド
            break;
        default:
            console.log(`Unknown command: ${commandName}`);
    }
});

// サイコロコマンドの処理
async function handleRollCommand(interaction) {
    const dice = interaction.options.getString('dice');
    await handleMessageRoll(interaction);  // dirdice.js の handleMessageRoll を呼び出す
}

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
  
    // メッセージ内にURL（メッセージリンク）が含まれているかチェック
    const messageLinkRegex = /https:\/\/discord\.com\/channels\/(\d+)\/(\d+)\/(\d+)/g;
    const matches = message.content.match(messageLinkRegex);
  
    if (matches) {
        for (const match of matches) {
            const [fullMatch, guildId, channelId, messageId] = match.match(messageLinkRegex);
  
            try {
                // メッセージを取得
                const channel = await client.channels.fetch(channelId);
                const targetMessage = await channel.messages.fetch(messageId);
  
                // 埋め込みメッセージを作成
                const embed = new MessageEmbed()
                    .setTitle(`メッセージ内容`)
                    .setDescription(targetMessage.content)
                    .addField('送信者', targetMessage.author.tag, true)
                    .addField('送信日時', targetMessage.createdAt.toLocaleString(), true)
                    .setColor('#00ff00')
                    .setTimestamp(targetMessage.createdAt);
  
                // 埋め込みメッセージを送信
                message.reply({ embeds: [embed] });
            } catch (error) {
                if (error.message === 'Unknown Message') {
                    message.reply('指定されたメッセージは削除されたため、表示できませんでした。');
                } else if (error.message.includes('Missing Access')) {
                    message.reply('指定されたメッセージを取得するための権限がありません。');
                } else {
                    message.reply('メッセージを取得する際に予期しないエラーが発生しました。');
                    console.error('メッセージ取得エラー:', error);
                }
            }
        }
    }
});

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

if (!process.env.DISCORD_TOKEN) {
    console.error('❌ DISCORD_TOKEN が .env ファイルに設定されていません！');
    process.exit(1);
}

// プロセス終了時の処理
process.on('SIGINT', () => {
    console.log('🛑 Botを終了しています...');
    client.destroy();
    process.exit(0);
});

// Discord にログイン
console.log('🔑 Discord Token (最初の5文字だけ表示):', process.env.DISCORD_TOKEN?.slice(0, 5));

client.login(process.env.DISCORD_TOKEN)
    .catch(error => {
        console.error('❌ Discord にログイン失敗:', error);
        process.exit(1);
    });

client.once('ready', () => {
    console.log(`✅ Discord にログイン成功しました！`);
    console.log(`🎉 ${client.user.tag} が正常に起動しました！`);
    console.log(`📊 ${client.guilds.cache.size} つのサーバーに参加中`);
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
