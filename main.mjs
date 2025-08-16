import { Client, GatewayIntentBits, Routes, REST } from 'discord.js';
import dotenv from 'dotenv';
import express from 'express';
import { data as omikujiCommand, execute as omikujiExecute } from './commands/utils/omikuji.js'; // omikuji コマンドをインポート
import { pingCommand } from './commands/utils/ping.js'; // pingコマンドをインポート
import { handleMessageRoll } from './commands/utils/dirdice.js'; // dirdice.js からサイコロの処理をインポート
import { mentionCommand } from './commands/utils/mention.js'; // mentionコマンドをインポート
import { data as geoquizCommand, execute as geoquizExecute } from './commands/utils/geoquiz.js'; // geoquiz コマンドをインポート
import { data as recruitmentCommand } from './commands/manage/button.js';
import { data as alldeleteCommand } from './commands/manage/alldelete.js';  // alldelete.jsからalldeleteコマンドをインポート
import { data as banCommand } from './commands/manage/ban.js';  // ban.js から ban コマンドをインポート
import { data as kickCommand } from './commands/manage/kick.js';  // kick.js から kick コマンドをインポート
import { execute as messageExecute } from './commands/manage/message.js';  // message.js の実行部分をインポート
import { data as roleCommand } from './commands/manage/role.js';  // role.js から role コマンドをインポート
import { data as softbanCommand } from './commands/manage/softban.js';  // softban.js から softban コマンドをインポート

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
    recruitmentCommand,  // 募集コマンドを追加（button.js）
    alldeleteCommand,  // alldeleteコマンドを追加
    banCommand,  // banコマンドを追加
    kickCommand,  // kickコマンドを追加
    messageExecute,  // message.js コマンドを追加
    roleCommand,  // roleコマンドを追加
    softbanCommand,  // softbanコマンドを追加
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
    } else if (commandName === 'recruitment') {  // recruitmentコマンドの処理
        await recruitmentCommand.execute(interaction);  // recruitmentCommandのexecuteメソッドを呼び出す
    } else if (commandName === 'alldelete') {  // alldeleteコマンドの処理
        await alldeleteCommand.execute(interaction);  // alldeleteCommandのexecuteメソッドを呼び出す
    } else if (commandName === 'ban') {  // ban コマンドの処理
        await banCommand.execute(interaction);  // banCommand の execute メソッドを呼び出す
    } else if (commandName === 'kick') {  // kick コマンドの処理
        await kickCommand.execute(interaction);  // kickCommand の execute メソッドを呼び出す
    } else if (commandName === 'message') {  // message コマンドの処理
        await messageExecute(interaction);  // message.js の execute メソッドを呼び出す
    } else if (commandName === 'role') {
        await roleCommand.execute(interaction);  // role.js の execute メソッドを呼び出す
    } else if (commandName === 'softban') {
        await softbanCommand.execute(interaction);  // softban.js の execute メソッドを呼び出す
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
