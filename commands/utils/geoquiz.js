import {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from 'discord.js';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

// ✅ 地理データ（日本 / 世界）
const placeQueries = {
  japan: {
    "北海道": [ "Otaru Canal Hokkaido", "Odori Park Sapporo", "Niseko Ski Resort", "Lake Toya" ], 
    "青森県": [ "Hirosaki Castle", "Lake Towada", "Oirase Gorge", "Aomori Nebuta Matsuri" ], 
    "岩手県": [ "Chusonji Temple", "Morioka Castle", "Tono Folklore Village", "Hachimantai Plateau" ], 
    "宮城県": [ "Matsushima Bay", "Sendai Castle", "Zuihoden Mausoleum", "Aobayama" ], 
    "秋田県": [ "Lake Tazawa", "Kakunodate Samurai District", "Nyuto Onsen", "Akita Kanto Festival" ], 
    "山形県": [ "Ginzan Onsen", "Mount Zao", "Yamadera Temple", "Tendo Shogi Museum" ], 
    "福島県": [ "Ouchi-juku", "Mount Bandai", "Fukushima Prefectural Museum", "Aizu-Wakamatsu Castle" ], 
    "茨城県": [ "Hitachi Seaside Park", "Kairakuen Garden", "Oarai Isosaki Shrine", "Lake Kasumigaura" ], 
    "栃木県": [ "Nikko Toshogu Shrine", "Lake Chuzenji", "Kegon Falls", "Utsunomiya" ], 
    "群馬県": [ "Kusatsu Onsen", "Mount Tanigawa", "Ikaho Onsen", "Tomioka Silk Mill" ], 
    "埼玉県": [ "Kawagoe", "Saitama Super Arena", "Omiya Bonsai Village", "Kawagoe Castle" ], 
    "千葉県": [ "Naritasan Shinshoji Temple", "Tokyo Disneyland", "Katsuura Undersea Park", "Choshi Electric Railway" ], 
    "東京都": [ "Tokyo Tower", "Shibuya Crossing", "Senso-ji Temple", "Meiji Shrine" ], 
    "神奈川県": [ "Great Buddha of Kamakura", "Yokohama Landmark Tower", "Hakone Open-Air Museum", "Enoshima Island" ], 
    "新潟県": [ "Yahiko Shrine", "Niigata City Aquarium", "Naeba Ski Resort", "Sado Island" ], 
    "富山県": [ "Gokayama", "Kurobe Dam", "Tateyama Kurobe Alpine Route", "Toyama Glass Art Museum" ], 
    "石川県": [ "Kenrokuen Garden", "Kanazawa Castle", "21st Century Museum of Contemporary Art", "Shirakawa-go" ], 
    "福井県": [ "Tojinbo Cliffs", "Eiheiji Temple", "Fukui Prefectural Dinosaur Museum", "Kiyomizu-dera" ], 
    "山梨県": [ "Lake Kawaguchi Fuji", "Chureito Pagoda", "Kofu Castle", "Fujiyoshida Sengen Shrine" ], 
    "長野県": [ "Matsumoto Castle", "Jigokudani Monkey Park", "Kamikochi Valley", "Nagano Zenkoji Temple" ], 
    "岐阜県": [ "Shirakawa-go", "Gifu Castle", "Seki City", "Kinka Mountain" ], 
    "静岡県": [ "Mount Fuji", "Izu Peninsula", "Shizuoka Sengen Shrine", "Numazu" ], 
    "愛知県": [ "Nagoya Castle", "Atsuta Shrine", "Osu Shopping District", "Nagoya TV Tower" ], 
    "三重県": [ "Ise Grand Shrine", "Shima Spain Village", "Toba Aquarium", "Mie Prefectural Art Museum" ], 
    "滋賀県": [ "Hikone Castle", "Lake Biwa", "Enryakuji Temple", "Ukimido" ], 
    "京都府": [ "Fushimi Inari Shrine", "Kinkaku-ji", "Kiyomizu-dera", "Arashiyama Bamboo Grove" ], 
    "大阪府": [ "Dotonbori Osaka", "Osaka Castle", "Universal Studios Japan", "Umeda Sky Building" ], 
    "兵庫県": [ "Himeji Castle", "Kobe Harborland", "Mount Rokko", "Arima Onsen" ], 
    "奈良県": [ "Todai-ji Temple", "Nara Park", "Kasuga Taisha Shrine", "Kofuku-ji Temple" ], 
    "和歌山県": [ "Kumano Nachi Taisha", "Shirahama Beach", "Mount Koya", "Wakayama Castle" ], 
    "鳥取県": [ "Tottori Sand Dunes", "Mount Daisen", "Mizuki Shigeru Road", "Hakuto Shrine" ], 
    "島根県": [ "Izumo Taisha Shrine", "Matsue Castle", "Adachi Museum of Art", "Iwami Ginzan Silver Mine" ], 
    "岡山県": [ "Okayama Korakuen Garden", "Kurashiki Bikan Historical Quarter", "Okayama Castle", "Kibitsu Shrine" ], 
    "広島県": [ "Itsukushima Shrine", "Hiroshima Peace Memorial", "Hiroshima Castle", "Miyajima Island" ], 
    "山口県": [ "Kintai Bridge", "Akiyoshido Cave", "Hofu Tenmangu Shrine", "Shimonoseki" ], 
    "徳島県": [ "Iya Valley", "Ryozenji Temple", "Tokushima Awa Odori", "Myojin Pond" ], 
    "香川県": [ "Ritsurin Garden", "Kotohira-gu Shrine", "Takamatsu Castle", "Shodoshima Olive Park" ], 
    "愛媛県": [ "Dogo Onsen", "Matsuyama Castle", "Miyuki Park", "Ishiteji Temple" ], 
    "高知県": [ "Katsurahama Beach", "Shikoku Karst", "Kochi Castle", "Makino Botanical Garden" ], 
    "福岡県": [ "Dazaifu Tenmangu Shrine", "Fukuoka Tower", "Ohori Park", "Hakata Ramen Street" ], 
    "佐賀県": [ "Yoshinogari Ruins", "Saga Castle", "Moyama", "Karatake Shrine" ], 
    "長崎県": [ "Gunkanjima Island", "Nagasaki Peace Park", "Dejima Island", "Mount Inasa" ], 
    "熊本県": [ "Kumamoto Castle", "Mount Aso", "Suizenji Jojuen Garden", "Shimada Museum of Arts" ], 
    "大分県": [ "Beppu Onsen", "Takachiho Gorge", "Yufuin", "Oita Marine Palace Aquarium" ], 
    "宮崎県": [ "Takachiho Gorge", "Miyazaki Shrine", "Nichinan Coast", "Aoshima Island" ], 
    "鹿児島県": [ "Sakurajima Volcano", "Kagoshima Aquarium", "Ibusuki Onsen", "Kirishima Shrine" ], 
    "沖縄県": [ "Shurijo Castle", "Kokusai Street", "Okinawa Churaumi Aquarium", "Cape Manzamo" ],
  },
  world: {
    "フランス": ["Eiffel Tower", "Louvre Museum", "Paris"],
    "アメリカ": ["Statue of Liberty", "Grand Canyon", "New York"],
    "ブラジル": ["Christ the Redeemer", "Rio de Janeiro"],
    "エジプト": ["Pyramids of Giza", "Sphinx"],
    "日本": ["Mount Fuji", "Tokyo", "Kyoto"], // 世界モードにも含める
    // 追加可
  },
};

const getRandomPlace = (mode) => {
  const options = Object.keys(placeQueries[mode]);
  const location = options[Math.floor(Math.random() * options.length)];
  const query = placeQueries[mode][location][Math.floor(Math.random() * placeQueries[mode][location].length)];
  return { location, query };
};

const shuffleArray = arr => [...arr].sort(() => Math.random() - 0.5);

const getImage = async (query) => {
  try {
    const res = await axios.get('https://api.unsplash.com/photos/random', {
      params: {
        client_id: ACCESS_KEY,
        query,
        orientation: 'landscape',
        content_filter: 'high',
      },
    });
    return res.data?.urls?.regular || null;
  } catch (e) {
    console.error('Unsplash error:', e.message);
    return null;
  }
};

// ✅ スラッシュコマンド定義
export const data = new SlashCommandBuilder()
  .setName('geoquiz')
  .setDescription('地理クイズ（都道府県 / 世界）')
  .addStringOption(option =>
    option.setName('mode')
      .setDescription('モードを選択')
      .setRequired(true)
      .addChoices(
        { name: '日本', value: 'japan' },
        { name: '世界', value: 'world' }
      )
  );

export async function execute(interaction) {
  await interaction.deferReply();

  const mode = interaction.options.getString('mode');
  const { location: correct, query } = getRandomPlace(mode);
  const imageUrl = await getImage(query);

  if (!imageUrl) {
    await interaction.editReply('画像が取得できませんでした。');
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle('この場所はどこ？🌍')
    .setImage(imageUrl)
    .setColor(0x00AE86);

  const otherChoices = Object.keys(placeQueries[mode]).filter(l => l !== correct);
  const choices = shuffleArray([correct, ...shuffleArray(otherChoices).slice(0, 4)]); // 5択

  const row = new ActionRowBuilder().addComponents(
    choices.map(choice =>
      new ButtonBuilder()
        .setCustomId(choice)
        .setLabel(choice)
        .setStyle(ButtonStyle.Primary)
    )
  );

  await interaction.editReply({
    content: 'この画像はどこ？',
    embeds: [embed],
    components: [row],
  });

  const collector = interaction.channel.createMessageComponentCollector({
    filter: i => i.user.id === interaction.user.id,
    time: 30_000,
  });

  collector.on('collect', async btn => {
    await btn.deferUpdate();
    if (btn.customId === correct) {
      updateScore(interaction.guild.id, interaction.user.id);
      await btn.followUp({ content: `🎉 正解！ **${correct}**`, ephemeral: true });
    } else {
      await btn.followUp({ content: `😢 不正解！正解は **${correct}**`, ephemeral: true });
    }

    await interaction.editReply({ components: [] });
    collector.stop();
  });

}

export const geoquizCommand = { data, execute };