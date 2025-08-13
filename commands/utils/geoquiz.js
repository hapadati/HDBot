import pkg from 'discord.js';
const { SlashCommandBuilder, MessageActionRow, MessageButton, MessageAttachment } = pkg;
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

// `place.json` の内容を直接コード内に埋め込む
const placeQueries = {
  "北海道": [
    "Otaru Canal Hokkaido",
    "Odori Park Sapporo",
    "Niseko Ski Resort",
    "Lake Toya"
  ],
  "青森県": [
    "Hirosaki Castle",
    "Lake Towada",
    "Oirase Gorge",
    "Aomori Nebuta Matsuri"
  ],
  "岩手県": [
    "Chusonji Temple",
    "Morioka Castle",
    "Tono Folklore Village",
    "Hachimantai Plateau"
  ],
  "宮城県": [
    "Matsushima Bay",
    "Sendai Castle",
    "Zuihoden Mausoleum",
    "Aobayama"
  ],
  "秋田県": [
    "Lake Tazawa",
    "Kakunodate Samurai District",
    "Nyuto Onsen",
    "Akita Kanto Festival"
  ],
  "山形県": [
    "Ginzan Onsen",
    "Mount Zao",
    "Yamadera Temple",
    "Tendo Shogi Museum"
  ],
  "福島県": [
    "Ouchi-juku",
    "Mount Bandai",
    "Fukushima Prefectural Museum",
    "Aizu-Wakamatsu Castle"
  ],
  "茨城県": [
    "Hitachi Seaside Park",
    "Kairakuen Garden",
    "Oarai Isosaki Shrine",
    "Lake Kasumigaura"
  ],
  "栃木県": [
    "Nikko Toshogu Shrine",
    "Lake Chuzenji",
    "Kegon Falls",
    "Utsunomiya"
  ],
  "群馬県": [
    "Kusatsu Onsen",
    "Mount Tanigawa",
    "Ikaho Onsen",
    "Tomioka Silk Mill"
  ],
  "埼玉県": [
    "Kawagoe",
    "Saitama Super Arena",
    "Omiya Bonsai Village",
    "Kawagoe Castle"
  ],
  "千葉県": [
    "Naritasan Shinshoji Temple",
    "Tokyo Disneyland",
    "Katsuura Undersea Park",
    "Choshi Electric Railway"
  ],
  "東京都": [
    "Tokyo Tower",
    "Shibuya Crossing",
    "Senso-ji Temple",
    "Meiji Shrine"
  ],
  "神奈川県": [
    "Great Buddha of Kamakura",
    "Yokohama Landmark Tower",
    "Hakone Open-Air Museum",
    "Enoshima Island"
  ],
  "新潟県": [
    "Yahiko Shrine",
    "Niigata City Aquarium",
    "Naeba Ski Resort",
    "Sado Island"
  ],
  "富山県": [
    "Gokayama",
    "Kurobe Dam",
    "Tateyama Kurobe Alpine Route",
    "Toyama Glass Art Museum"
  ],
  "石川県": [
    "Kenrokuen Garden",
    "Kanazawa Castle",
    "21st Century Museum of Contemporary Art",
    "Shirakawa-go"
  ],
  "福井県": [
    "Tojinbo Cliffs",
    "Eiheiji Temple",
    "Fukui Prefectural Dinosaur Museum",
    "Kiyomizu-dera"
  ],
  "山梨県": [
    "Lake Kawaguchi Fuji",
    "Chureito Pagoda",
    "Kofu Castle",
    "Fujiyoshida Sengen Shrine"
  ],
  "長野県": [
    "Matsumoto Castle",
    "Jigokudani Monkey Park",
    "Kamikochi Valley",
    "Nagano Zenkoji Temple"
  ],
  "岐阜県": [
    "Shirakawa-go",
    "Gifu Castle",
    "Seki City",
    "Kinka Mountain"
  ],
  "静岡県": [
    "Mount Fuji",
    "Izu Peninsula",
    "Shizuoka Sengen Shrine",
    "Numazu"
  ],
  "愛知県": [
    "Nagoya Castle",
    "Atsuta Shrine",
    "Osu Shopping District",
    "Nagoya TV Tower"
  ],
  "三重県": [
    "Ise Grand Shrine",
    "Shima Spain Village",
    "Toba Aquarium",
    "Mie Prefectural Art Museum"
  ],
  "滋賀県": [
    "Hikone Castle",
    "Lake Biwa",
    "Enryakuji Temple",
    "Ukimido"
  ],
  "京都府": [
    "Fushimi Inari Shrine",
    "Kinkaku-ji",
    "Kiyomizu-dera",
    "Arashiyama Bamboo Grove"
  ],
  "大阪府": [
    "Dotonbori Osaka",
    "Osaka Castle",
    "Universal Studios Japan",
    "Umeda Sky Building"
  ],
  "兵庫県": [
    "Himeji Castle",
    "Kobe Harborland",
    "Mount Rokko",
    "Arima Onsen"
  ],
  "奈良県": [
    "Todai-ji Temple",
    "Nara Park",
    "Kasuga Taisha Shrine",
    "Kofuku-ji Temple"
  ],
  "和歌山県": [
    "Kumano Nachi Taisha",
    "Shirahama Beach",
    "Mount Koya",
    "Wakayama Castle"
  ],
  "鳥取県": [
    "Tottori Sand Dunes",
    "Mount Daisen",
    "Mizuki Shigeru Road",
    "Hakuto Shrine"
  ],
  "島根県": [
    "Izumo Taisha Shrine",
    "Matsue Castle",
    "Adachi Museum of Art",
    "Iwami Ginzan Silver Mine"
  ],
  "岡山県": [
    "Okayama Korakuen Garden",
    "Kurashiki Bikan Historical Quarter",
    "Okayama Castle",
    "Kibitsu Shrine"
  ],
  "広島県": [
    "Itsukushima Shrine",
    "Hiroshima Peace Memorial",
    "Hiroshima Castle",
    "Miyajima Island"
  ],
  "山口県": [
    "Kintai Bridge",
    "Akiyoshido Cave",
    "Hofu Tenmangu Shrine",
    "Shimonoseki"
  ],
  "徳島県": [
    "Iya Valley",
    "Ryozenji Temple",
    "Tokushima Awa Odori",
    "Myojin Pond"
  ],
  "香川県": [
    "Ritsurin Garden",
    "Kotohira-gu Shrine",
    "Takamatsu Castle",
    "Shodoshima Olive Park"
  ],
  "愛媛県": [
    "Dogo Onsen",
    "Matsuyama Castle",
    "Miyuki Park",
    "Ishiteji Temple"
  ],
  "高知県": [
    "Katsurahama Beach",
    "Shikoku Karst",
    "Kochi Castle",
    "Makino Botanical Garden"
  ],
  "福岡県": [
    "Dazaifu Tenmangu Shrine",
    "Fukuoka Tower",
    "Ohori Park",
    "Hakata Ramen Street"
  ],
  "佐賀県": [
    "Yoshinogari Ruins",
    "Saga Castle",
    "Moyama",
    "Karatake Shrine"
  ],
  "長崎県": [
    "Gunkanjima Island",
    "Nagasaki Peace Park",
    "Dejima Island",
    "Mount Inasa"
  ],
  "熊本県": [
    "Kumamoto Castle",
    "Mount Aso",
    "Suizenji Jojuen Garden",
    "Shimada Museum of Arts"
  ],
  "大分県": [
    "Beppu Onsen",
    "Takachiho Gorge",
    "Yufuin",
    "Oita Marine Palace Aquarium"
  ],
  "宮崎県": [
    "Takachiho Gorge",
    "Miyazaki Shrine",
    "Nichinan Coast",
    "Aoshima Island"
  ],
  "鹿児島県": [
    "Sakurajima Volcano",
    "Kagoshima Aquarium",
    "Ibusuki Onsen",
    "Kirishima Shrine"
  ],
  "沖縄県": [
    "Shurijo Castle",
    "Kokusai Street",
    "Okinawa Churaumi Aquarium",
    "Cape Manzamo"
  ]
};


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
