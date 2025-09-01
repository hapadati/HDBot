import {
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    ComponentType,
  } from 'discord.js';
  
  // ✅ 画像付き地理データ
  const imageBank = {
    japan: {
  
      "北海道": [
          { name: "Otaru Canal Hokkaido", url: "https://i.postimg.cc/bYD2pkyp/image.jpg"},
          { name: "Susukino", url: "https://i.postimg.cc/tCG8900k/Sususkino.jpg"},
          { name: "Lake Toya", url: "https://i.postimg.cc/MTGrrxQZ/Touyako.jpg"} ], 
      "青森県": [ 
         {name: "Hirosaki Castle", url: "https://i.postimg.cc/26MdCfVx/Hirosaki-castle.jpg"},
         {name: "Ooma", url: "https://i.postimg.cc/1tctHfdT/Oma.jpg"},
         {name: "Oirase Gorge", url: "https://i.postimg.cc/fL2xK2p1/oirase.jpg"},
         {name: "Aomori Nebuta Matsuri", url: "https://i.postimg.cc/xC10Qt8f/image.jpg"}], 
      "岩手県": [
         {name: "Chusonji Temple", url: "https://i.postimg.cc/FsthfSxN/konjikido.jpg"},
         {name: "Morioka Castle", url: "https://i.postimg.cc/L6m0069j/Morioka-castle.jpg"},
         {name: "Tono Folklore Village", url: "https://i.postimg.cc/DyRJtbnD/image.jpg"},
         {name: "Hachimantai Plateau", url: "https://i.postimg.cc/HksZhx4f/image.jpg"}], 
      "宮城県": [ 
         {name: "Matsushima Bay", url: "https://i.postimg.cc/BZPX2crz/Matushima.jpg"},
         {name: "Sendai Castle", url: "https://i.postimg.cc/2y0ckNCH/sendai-castle.jpg"},
         {name: "Zuihoden Mausoleum", url: "https://i.postimg.cc/3Nf1MjZV/image.jpg"},
         {name: "Tanabata Festival", url: "https://i.postimg.cc/kXdK4p2s/image.jpg"}], 
      "秋田県": [
         {name: "Lake Tazawa", url: "https://i.postimg.cc/KcJF64DS/tazawa-lake.jpg"},
         {name: "Godzilla Rock", url: "https://i.postimg.cc/pT37vbrj/image.jpg"},
         {name: "Hiyama Waterfall", url: "https://i.postimg.cc/sfSHWL1n/image.jpg"},
         {name: "Hachimantai Dragon Eye", url: "https://i.postimg.cc/RVdRQxmT/image.jpg"}], 
      "山形県": [
         {name:"Ginzan Onsen", url: "https://i.postimg.cc/Y97GsjfL/image.jpg"},
         {name:"Mount Zao", url: "https://i.postimg.cc/yxbNsN9P/image.jpg"},
         {name:"Tarumizu Ruins", url: "https://i.postimg.cc/44qZfqqB/image.jpg"},
         {name: "Uriwari sekitei Park", url: "https://i.postimg.cc/tTr6npW1/image.jpg"}], 
      "福島県": [
        {name: "Tsuruga Castle", url: "https://i.postimg.cc/tTr6npW1/image.jpg"},
        {name: "Abukumado Limestone Cave", url: "https://i.postimg.cc/Kv7LS68g/image.jpg"},
        {name: "Lake Inawashiro", url: "https://i.postimg.cc/nzwscTfB/image.jpg"}], 
      "茨城県": [
        {name:"Hitachi Seaside Park", url: "https://i.postimg.cc/RVf0jKGs/Hitachi-seaside-park.jpg"},
        {name: "Kairakuen Garden", url: "https://i.postimg.cc/NGX9w3jk/kairakuen.png"},
        {name: "Oarai Isosaki Shrine", url: "https://i.postimg.cc/0N1XVRjX/Oarai-isosaki-castle.jpg"},
        {name: "Kasumigaura Comprehensive Park", url: "https://i.postimg.cc/hjd96hY9/Kasumigaura-Comprehensive-Park.jpg"}], 
      "栃木県": [
        {name: "Nikko Toshogu Shrine", url: "https://i.postimg.cc/xTxB94Ct/Nikko-Toshogu-shrine.jpg"},
        {name: "Lake Chuzenji", url: "https://i.postimg.cc/rsFcPRnm/Lake-chuzen.jpg"},
        {name: "Otome Falls", url: "https://i.postimg.cc/YSYpGHLp/Otome-fall.jpg"}], 
      "群馬県": [
        {name: "Kusatsu Onsen", url: "https://i.postimg.cc/mgWpZW43/Kusatsu-onsen.jpg"},
        {name: "Mount Tanigawa", url: "https://i.postimg.cc/28WBYVC6/Mountain-Tanigawa.jpg"},
        {name: "Ikaho Onsen", url: "https://i.postimg.cc/25LyD5pG/Ikaho-Onsen.jpg"},
        {name: "Tomioka Silk Mill", url: "https://i.postimg.cc/5yZVSRMb/image.jpg"}], 
      "埼玉県": [
        {name: "Saitama Super Arena", url: "https://i.postimg.cc/Yqz7W8sK/Saitama-Super-Arena.jpg"},
        {name: "Lake Tama", url: "https://i.postimg.cc/Y9XHPSQr/Lake-Tama.jpg"},
        {name:"Kawagoe Toki No Kane", url: "https://i.postimg.cc/pTV98p2R/Kawagoe-Toki-No-Kane.jpg"}], 
      "千葉県": [
        {name: "Naritasan Shinshoji Temple", url: "https://i.postimg.cc/fTPLHMNj/image.jpg"},
        {name: "Tokyo Disneyland", url: "https://i.postimg.cc/tTDRFjk6/Tokyo-Disney-Land.jpg"},
        {name: "Katsuura Undersea Park", url: "https://i.postimg.cc/pLNvhrv7/Katsuura-Undersea-Park.jpg"}], 
      "東京都": [
        {name: "Tokyo Tower", url: "https://i.postimg.cc/HLpfX7hS/Tokyo-Tower.jpg"},
        {name: "Shibuya Crossing", url: "https://i.postimg.cc/jjLWhvC2/Shibuya-Crossing.jpg"},
        {name: "Senso-ji Temple", url: "https://i.postimg.cc/wjVNT7R5/Sensoji-Temple.jpg"},
        {name:"Nihonbashi", url: "https://i.postimg.cc/9FHwdGGt/Nihonbashi.jpg"}], 
      "神奈川県": [
        {name:"Great Buddha of Kamakura", url: "https://i.postimg.cc/FKbLLHKp/Great-Buddha-of-Kamakura.jpg"},
        {name: "Yokohama Night View", url: "https://i.postimg.cc/fRyKhXBd/Yokohama-Night-Viwe.jpg"},
        {name: "Odawara Castle", url: "https://i.postimg.cc/qRPcs5TX/Odawara-Castle.jpg"},
        {name: "Yokohama Red Brick Warehouse", url: "https://i.postimg.cc/qRPcs5TX/Odawara-Castle.jpg"}], 
      "新潟県": [
        {name: "Yahiko Shrine", url: "https://i.postimg.cc/JnVcJFm3/Yahiko-shrine.jpg"},
        {name: "Tunnel of Light", url: "https://i.postimg.cc/FzgVZVGf/Tunnel-of-Light.jpg"},
        {name: "Sado Island", url: "https://i.postimg.cc/W3ynz4z3/image.jpg"}], 
      "富山県": [
        {name: "Kurobe Dam", url: "https://i.postimg.cc/9F9hWR0D/Kurobe-Dam.jpg"},
        {name: "John's Travelogue Kurobe Gorge Railway", url: "https://i.postimg.cc/Vkcc5f0D/John-s-Travelogue-Kurobe-Gorge-Railway.jpg"}], 
      "石川県": [
        {name: "Kenrokuen Garden", url: "https://i.postimg.cc/tgvq10jJ/image.jpg"},
        {name: "Kanazawa Castle", url: "https://i.postimg.cc/CLCwGngW/image.jpg"},
        {name: "21st Century Museum of Contemporary Art", url: "https://i.postimg.cc/VNJyVdxs/21.jpg"}],
      "福井県": [
        {name: "Tojinbo Cliffs", url: "https://i.postimg.cc/wxSWJjyP/Tojinbo-cliffs.jpg"},
        {name: "Eiheiji Temple", url: "https://i.postimg.cc/KjdtMj05/Eiheiji-temple.jpg"},
        {name: "Fukui Prefectural Dinosaur Museum", url: "https://i.postimg.cc/KzpPmJLw/Fukui-Prefectural-Dinosaur-Museum.jpg"}],
      "山梨県": [
        {name: "Lake Kawaguchi Fuji", url: "https://i.postimg.cc/6QwLc7tj/Lake-Kawaguchi.webp"},
        {name: "Chureito Pagoda", url: "https://i.postimg.cc/YqYdxBQS/chureito-pagoda.jpg"}],
      "長野県": [
        {name: "Matsumoto Castle", url: "https://i.postimg.cc/6p2tc0Bc/Matsumoto-Castle.webp"},
        {name: "Jigokudani Monkey Park", url: "https://i.postimg.cc/BnrsVK60/Jidokudani-Monkey-Park.jpg"}],
      "岐阜県": [
        {name: "Shirakawa-go", url: "https://i.postimg.cc/DZdXZhDS/Shirakawago.jpg"},
        {name: "Gifu Castle", url: "https://i.postimg.cc/TPv1WSng/Gifu-Castle.jpg"},
        {name: "Gifu", url: "https://i.postimg.cc/1XvVGHyP/Gifu.webp"}],
      "静岡県": [
        {name: "Mount Fuji", url: "https://i.postimg.cc/63WBwNN6/Mt-Fuji.jpg"},
        {name: "Izu Peninsula", url: "https://i.postimg.cc/W46sQ1Cf/image.jpg"}],
      "愛知県": [
        {name: "Nagoya Castle", url: "https://i.postimg.cc/nrPJxjHp/Nagoya-Castle.jpg"},
        {name: "Atsuta Shrine", url: "https://i.postimg.cc/zDSHNJZW/Atsuta-Shrine.jpg"},
        {name: "Nagoya Science Museum", url: "https://i.postimg.cc/hPNB3dy0/Nagoya-city-science-museum.jpg"}], 
      },
    world: {
      "フランス": [
        {name: "Eiffel Tower", url: "https://i.postimg.cc/1tMbLSVG/eiffel-tower.jpg"},
        {name: "Louvre Museum", url: "https://i.postimg.cc/Kzmdqjjc/Lourve-Museum.jpg"},
        {name: "Paris", url: "https://i.postimg.cc/8c09zbHs/paris.jpg"},],
      "アメリカ": [
        {name: "Statue of Liberty", url: "https://i.postimg.cc/4d3WH9nc/new-york.jpg"},
        {name: "Grand Canyon", url: "https://i.postimg.cc/BvphvgZs/grand-canyon.jpg"},
        {name: "New York", url: "https://i.postimg.cc/zf8t5Mr0/statue-of-liberty.jpg"}],
      "ブラジル": [
        {name: "Christ the Redeemer", url: "https://i.postimg.cc/sDSPHchm/Christ-the-Redeemer.jpg"},
        {name: "Rio de Janeiro", url: "https://i.postimg.cc/fLJmcjsx/Rio-de-Janeiro.jpg"}],
      "エジプト": [
        {name: "Pyramids of Giza", url: "https://i.postimg.cc/MTFJnxZW/Pyramids-of-Giza.jpg"},
        {name: "Sphinx", url: "https://i.postimg.cc/vBBd8Dsq/sphinx.jpg"}],
      "日本": [
        {name: "Aomori Nebuta Festival", url: "https://i.postimg.cc/xC10Qt8f/image.jpg"},
        {name: "Tokyo", url: "https://i.postimg.cc/HLpfX7hS/Tokyo-Tower.jpg"},
        {name: "Kamakura", url: "https://i.postimg.cc/FKbLLHKp/Great-Buddha-of-Kamakura.jpg"}],
      "イタリア": [
        {name: "Colosseum", url: "https://i.postimg.cc/LstTbVgL/Colosseum.jpg"},
        {name: "Venice", url: "https://i.postimg.cc/KzjB7XLq/florence.jpg"},
        {name: "Florence", url: "https://i.postimg.cc/xCzc59xd/venice.jpg"}],
      "イギリス": [
        {name: "Big Ben", url: "https://i.postimg.cc/pTPp7qQN/Bigben.jpg"},
        {name: "London Eye", url: "https://i.postimg.cc/s24LP43H/london-eye.jpg"},
        {name: "Stonehenge", url: "https://i.postimg.cc/BZVVC6G3/stonehenge.jpg"},],
//      "ドイツ": [
//        {name: "Brandenburg Gate", url: ""},
//        {name: "Neuschwanstein Castle", url: ""},
//        {name: "Berlin", url: ""}],
//      "オーストラリア": [
//        {name: "Sydney Opera House", url: ""},
//        {name: "Great Barrier Reef", url: ""}],
  
    },
  };
  
  // ✅ ランダムに画像を選ぶ関数
  const getRandomPlace = (mode) => {
    const locations = Object.keys(imageBank[mode]);
    const location = locations[Math.floor(Math.random() * locations.length)];
    const candidates = imageBank[mode][location];
    const selected = candidates[Math.floor(Math.random() * candidates.length)];
    return { location, name: selected.name, imageUrl: selected.url };
  };
  
  const shuffleArray = arr => [...arr].sort(() => Math.random() - 0.5);
  
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
  
  // ✅ クイズ実行ロジック
  export async function execute(interaction) {
    try {
      await interaction.deferReply();
  
      if (!interaction.channel || !interaction.channel.isTextBased()) {
        await interaction.editReply('このチャンネルではクイズを実行できません。');
        return;
      }
  
      const mode = interaction.options.getString('mode');
      const { location: correct, name, imageUrl } = getRandomPlace(mode);
  
      if (!imageUrl) {
        await interaction.editReply('画像が取得できませんでした。');
        return;
      }
  
      const embed = new EmbedBuilder()
        .setTitle('この場所はどこ？🌍')
        .setImage(imageUrl)
        .setColor(0x00AE86);
  
      const otherChoices = shuffleArray(
        Object.keys(imageBank[mode]).filter(loc => loc !== correct)
      ).slice(0, 4);
  
      const choices = shuffleArray([correct, ...otherChoices]);
  
      const row = new ActionRowBuilder().addComponents(
        choices.map(choice =>
          new ButtonBuilder()
            .setCustomId(`geoquiz_${choice}`)
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
        filter: i =>
          i.user.id === interaction.user.id &&
          i.customId.startsWith('geoquiz_'),
        componentType: ComponentType.Button,
        time: 300_000,
      });
  
      collector.on('collect', async btn => {
        await btn.deferUpdate();
        const selected = btn.customId.replace('geoquiz_', '');
        if (selected === correct) {
          await btn.followUp({ content: `🎉 正解！ **${correct}**`, ephemeral: false });
        } else {
          await btn.followUp({ content: `😢 不正解！正解は **${correct}**`, ephemeral: false });
        }
  
        await interaction.editReply({ components: [] });
        collector.stop();
      });
  
    } catch (error) {
      console.error('❌ コマンド実行中にエラー:', error);
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ content: '❌ エラーが発生しました。' });
      } else {
        await interaction.reply({ content: '❌ エラーが発生しました。', ephemeral: true });
      }
    }
  }
  
  export const geoquizCommand = { data, execute };
  