import pkg from 'discord.js';
import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const { SlashCommandBuilder, MessageAttachment, MessageActionRow, MessageButton } = pkg;
const ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

// 都道府県と観光地のクエリデータをJSONから読み込む関数
function loadPlaceQueries() {
  const filePath = path.join(__dirname, '..', '..', 'geoquiz', 'places.json');
  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
}

const placeQueries = loadPlaceQueries();

// 都道府県一覧（placeQueriesのキーを利用）
const PREFECTURES = Object.keys(placeQueries);

// ランダムな都道府県を1つ選ぶ関数
function getRandomPrefecture() {
  return PREFECTURES[Math.floor(Math.random() * PREFECTURES.length)];
}

// 配列をシャッフル
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// 画像取得
async function getImage(query) {
  try {
    const response = await axios.get('https://api.unsplash.com/photos/random', {
      params: {
        client_id: ACCESS_KEY,
        query: query,
        orientation: 'landscape',
        content_filter: 'high',
      },
    });
    return response.data?.[0]?.urls?.regular || null;
  } catch (error) {
    console.error('画像の取得に失敗しました:', error);
    return null;
  }
}

export const data = new SlashCommandBuilder()
  .setName('geoquiz')
  .setDescription('日本の都道府県を当てるクイズ！');

export async function execute(interaction) {
  // 正解の都道府県
  const correct = getRandomPrefecture();

  // 正解の観光地クエリをランダムに選ぶ
  const randomIndex = Math.floor(Math.random() * placeQueries[correct].length);
  const imageQuery = placeQueries[correct][randomIndex];

  // 不正解の選択肢（ランダムで2つ）
  const incorrect = PREFECTURES.filter(p => p !== correct);
  shuffleArray(incorrect);
  const choices = shuffleArray([correct, incorrect[0], incorrect[1]]); // 正解＋ランダム2つをシャッフル

  // 画像取得
  const imageUrl = await getImage(imageQuery);

  if (!imageUrl) {
    await interaction.reply('画像の取得に失敗しました。');
    return;
  }

  const imageAttachment = new MessageAttachment(imageUrl); // 画像URLをAttachmentに変換

  const row = new MessageActionRow().addComponents(
    choices.map(choice =>
      new MessageButton()
        .setCustomId(choice)
        .setLabel(choice)
        .setStyle('PRIMARY')
    )
  );

  await interaction.reply({
    content: `この写真はどの都道府県でしょうか？`,
    files: [imageAttachment], // 画像をAttachmentとして送信
    components: [row],
  });

  const filter = i => i.isButton() && i.user.id === interaction.user.id; // ボタンを押したユーザーをチェック

  const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });

  collector.on('collect', async (buttonInteraction) => {
    if (buttonInteraction.customId === correct) {
      await buttonInteraction.reply({ content: '正解です！🎉', ephemeral: true });
    } else {
      await buttonInteraction.reply({ content: `残念！正解は ${correct} でした。`, ephemeral: true });
    }
  });

  collector.on('end', async () => {
    if (!collector.collected.size) {
      await interaction.followUp({
        content: '時間切れです！正解は ' + correct + ' でした。',
        ephemeral: true,
      });
    }
  });
}
