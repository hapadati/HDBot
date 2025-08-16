const { Client, GatewayIntentBits, MessageEmbed } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ]
});

client.on('messageCreate', async (message) => {
  // Botが送信したメッセージを無視
  if (message.author.bot) return;

  // メッセージ内にURL（メッセージリンク）が含まれているかチェック
  const messageLinkRegex = /https:\/\/discord\.com\/channels\/(\d+)\/(\d+)\/(\d+)/g;
  const matches = message.content.match(messageLinkRegex);

  if (matches) {
    // メッセージリンクが存在する場合、そのリンクを展開
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
          // メッセージが削除されている場合
          message.reply('指定されたメッセージは削除されたため、表示できませんでした。');
        } else if (error.message.includes('Missing Access')) {
          // Botにアクセス権限がない場合
          message.reply('指定されたメッセージを取得するための権限がありません。');
        } else {
          // その他のエラー
          message.reply('メッセージを取得する際に予期しないエラーが発生しました。');
          console.error('メッセージ取得エラー:', error);
        }
      }
    }
  }
});

client.login('YOUR_BOT_TOKEN');
