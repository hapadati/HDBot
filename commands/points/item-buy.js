import { SlashCommandBuilder } from 'discord.js';
import { db } from '../../firestore.js';

export const data = new SlashCommandBuilder()
  .setName('item-buy')
  .setDescription('アイテムを購入します')
  .addStringOption(option =>
    option.setName('name')
      .setDescription('購入するアイテム名')
      .setRequired(true));

export async function execute(interaction) {
  const name = interaction.options.getString('name');
  const guildId = interaction.guildId;
  const userId = interaction.user.id;

  const itemRef = db.collection('servers').doc(guildId).collection('items').doc(name);
  const userRef = db.collection('servers').doc(guildId).collection('points').doc(userId);

  const itemDoc = await itemRef.get();
  if (!itemDoc.exists) {
    await interaction.reply('❌ 指定されたアイテムは存在しません。');
    return;
  }

  const item = itemDoc.data();
  if (item.stock <= 0) {
    await interaction.reply(`❌ ${item.name} は在庫切れです。`);
    return;
  }

  const userDoc = await userRef.get();
  const current = userDoc.exists ? userDoc.data().points : 0;

  if (current < item.price) {
    await interaction.reply(`❌ ポイントが足りません。必要: ${item.price}pt, あなたの所持: ${current}pt`);
    return;
  }

  await userRef.set({ points: current - item.price }, { merge: true });
  await itemRef.set({ ...item, stock: item.stock - 1 });

  await interaction.reply(`✅ ${interaction.user.username} が **${item.name}** を購入しました！ (-${item.price}pt)`);
}
