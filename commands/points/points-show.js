import { SlashCommandBuilder } from 'discord.js';
import { db } from '../../firestore.js';

export const data = new SlashCommandBuilder()
  .setName('points-show')
  .setDescription('自分または指定ユーザーのポイントを確認します')
  .addUserOption(option =>
    option.setName('user')
      .setDescription('確認するユーザー（省略可能）'));

export async function execute(interaction) {
  const target = interaction.options.getUser('user') || interaction.user;
  const guildId = interaction.guildId;

  if (!guildId) {
    await interaction.reply("❌ このコマンドはサーバー内でのみ使用できます。");
    return;
  }

  const ref = db.collection('servers').doc(guildId).collection('points').doc(target.id);
  const doc = await ref.get();
  const points = doc.exists ? (doc.data().points ?? 0) : 0; // undefined 対策

  await interaction.reply(`💰 ${target.username} のポイント: **${points}pt**`);
}
