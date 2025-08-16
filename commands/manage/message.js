import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js'; // EmbedBuilderに変更

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
        // チャンネルを取得
        const channel = await client.channels.fetch(channelId);

        // チャンネルが見つかった場合、メッセージを取得
        const targetMessage = await channel.messages.fetch(messageId);

        // 埋め込みメッセージを作成（MessageEmbed → EmbedBuilderに変更）
        const embed = new EmbedBuilder()
          .setTitle(`メッセージ内容`)
          .setDescription(targetMessage.content)
          .addFields(
            { name: '送信者', value: targetMessage.author.tag, inline: true },
            { name: '送信日時', value: targetMessage.createdAt.toLocaleString(), inline: true }
          )
          .setColor('#00ff00')
          .setTimestamp(targetMessage.createdAt);

        // 埋め込みメッセージを送信
        await message.reply({ embeds: [embed] });

      } catch (error) {
        // エラーハンドリング
        if (error.message === 'Unknown Message') {
          // メッセージが削除されている場合
          await message.reply('指定されたメッセージは削除されたため、表示できませんでした。');
        } else if (error.message.includes('Missing Access')) {
          // Botにアクセス権限がない場合
          await message.reply('指定されたメッセージを取得するための権限がありません。');
        } else if (error.message.includes('Unknown Channel')) {
          // チャンネルが存在しない場合
          await message.reply('指定されたチャンネルが存在しません。');
        } else {
          // その他のエラー
          await message.reply('メッセージを取得する際に予期しないエラーが発生しました。');
          console.error('メッセージ取得エラー:', error);
        }
      }
    }
  }
});

client.login('YOUR_BOT_TOKEN');
