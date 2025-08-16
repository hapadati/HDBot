const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');

// 応募者リスト
let applicants = [];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('recruitment')
    .setDescription('指定したロールを対象に募集を行う')
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('応募を対象とするロール')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('duration')
        .setDescription('募集の終了時間（例: 1s, 30m, 2h, 3d, 1w, 2y）')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('winners')
        .setDescription('抽選する人数')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('title')
        .setDescription('募集のタイトル（指定しなければユーザー名を使います）')
    ),

  async execute(interaction) {
    const role = interaction.options.getRole('role');
    const durationStr = interaction.options.getString('duration');
    const winnersCount = interaction.options.getInteger('winners');
    const title = interaction.options.getString('title') || interaction.user.username;

    // 終了時間の計算
    const duration = parseDuration(durationStr);

    if (duration === null) {
      return interaction.reply('終了時間の形式が正しくありません。例: 1s, 30m, 2h, 3d, 1w, 2y');
    }

    // 募集開始の埋め込みメッセージ
    const embed = new MessageEmbed()
      .setTitle(title)
      .setDescription(`応募するには以下のボタンをクリックしてください。`)
      .setColor('#00FF00')
      .addField('募集期間', `終了時間: ${new Date(Date.now() + duration * 1000).toLocaleString()}`, true)
      .addField('応募対象', role.toString(), true)
      .addField('作成者', interaction.user.username, true)
      .setTimestamp();

    // 応募ボタン
    const row = new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setCustomId('apply_button')
          .setLabel('応募する')
          .setStyle('PRIMARY')
      );

    // 募集メッセージ送信
    const recruitmentMessage = await interaction.reply({
      content: '募集が開始されました！',
      embeds: [embed],
      components: [row],
      fetchReply: true
    });

    // 収集する時間（指定された秒数後）
    setTimeout(async () => {
      if (applicants.length === 0) {
        return interaction.channel.send('応募者がいませんでした。');
      }

      // 指定された人数分の抽選
      const winners = getRandomWinners(applicants, winnersCount);

      if (winners.length === 0) {
        return interaction.channel.send('抽選対象者が足りません。');
      }

      // 結果の埋め込み
      const resultEmbed = new MessageEmbed()
        .setTitle('抽選結果')
        .setDescription(`指定された人数（${winnersCount}人）の抽選が完了しました！`)
        .setColor('#FF0000')
        .addField('抽選結果', winners.join('\n'))
        .setTimestamp();

      // 結果を送信
      await interaction.channel.send({ embeds: [resultEmbed] });

      // 応募者リストをリセット
      applicants = [];
      await recruitmentMessage.delete(); // 募集メッセージを削除
    }, duration * 1000); // 終了時間後に実行

    // ボタンのインタラクションを受け取る
    const filter = i => i.customId === 'apply_button' && i.member.roles.cache.has(role.id);
    const collector = interaction.channel.createMessageComponentCollector({ filter, time: duration * 1000 });

    collector.on('collect', async (i) => {
      if (!applicants.includes(i.user.username)) {
        applicants.push(i.user.username); // 応募者リストに追加
        await i.reply({ content: '応募が完了しました！', ephemeral: true });
      } else {
        await i.reply({ content: 'すでに応募しています。', ephemeral: true });
      }
    });

    collector.on('end', async () => {
      if (applicants.length === 0) {
        await interaction.channel.send('応募者がいませんでした。');
      }
    });
  },
};

// 時間文字列（s, m, h, d, w, y）を秒数に変換する関数
function parseDuration(durationStr) {
  const regex = /^(\d+)([smhdwy])$/;
  const match = durationStr.match(regex);

  if (!match) return null;

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const units = {
    s: 1,        // 秒
    m: 60,       // 分
    h: 3600,     // 時間
    d: 86400,    // 日
    w: 604800,   // 週
    y: 31536000, // 年
  };

  return value * units[unit];
}

// 重複しないようにランダムに抽選を行う関数
function getRandomWinners(applicants, winnersCount) {
  const winners = [];
  const copyOfApplicants = [...applicants];

  for (let i = 0; i < winnersCount; i++) {
    if (copyOfApplicants.length === 0) break;

    const randomIndex = Math.floor(Math.random() * copyOfApplicants.length);
    winners.push(copyOfApplicants.splice(randomIndex, 1)[0]);
  }

  return winners;
}
