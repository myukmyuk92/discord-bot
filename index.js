const express = require('express');
const {
  Client,
  GatewayIntentBits
} = require('discord.js');

const app = express();
app.use(express.json());

const TOKEN = process.env.TOKEN?.trim();
const FORUM_CHANNEL_ID = process.env.FORUM_CHANNEL_ID?.trim();

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// ==============================
// Discordイベント
// ==============================

client.once('ready', () => {
  console.log('================================');
  console.log(`✅ Bot起動完了: ${client.user.tag}`);
  console.log(`✅ Bot ID: ${client.user.id}`);
  console.log(`✅ 参加サーバー数: ${client.guilds.cache.size}`);
  console.log('================================');
});

client.on('error', (error) => {
  console.error('❌ Discord Client Error:', error);
});

client.on('warn', (warning) => {
  console.warn('⚠️ Discord Warning:', warning);
});

client.on('shardError', (error) => {
  console.error('❌ Discord Shard Error:', error);
});

client.on('shardReady', (shardId) => {
  console.log(`✅ Discord Shard Ready: ${shardId}`);
});

// ==============================
// Render起動確認
// ==============================

app.get('/', (req, res) => {
  res.status(200).send(
    client.isReady()
      ? 'Bot ready'
      : 'Server awake, Bot starting'
  );
});

// ==============================
// フォーラム投稿
// ==============================

app.post('/webhook', async (req, res) => {
  try {

    if (!client.isReady()) {
      console.log('⚠️ Botはまだ準備中です');
      return res.status(503).send('Bot is starting');
    }

    const { title, description, mention } = req.body;

    console.log(`📨 投稿要求受信: ${title}`);

    const channel =
      await client.channels.fetch(FORUM_CHANNEL_ID);

    await channel.threads.create({
      name: title,
      message: {
        content: mention || '',
        embeds: [{
          title: title,
          description: description,
          color: 0x00BFFF
        }]
      }
    });

    console.log(`✅ 投稿成功: ${title}`);

    res.status(200).send('ok');

  } catch (error) {

    console.error('❌ 投稿エラー:', error);

    res.status(500).send('error');
  }
});

// ==============================
// Webサーバー
// ==============================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Webサーバー起動: port ${PORT}`);
});

// ==============================
// Discord接続診断
// ==============================

async function startDiscordBot() {

  console.log('🔍 Discord接続診断開始');

  if (!TOKEN) {
    console.error('❌ TOKENが設定されていません');
    return;
  }

  // 10秒で打ち切る
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, 10000);

  try {

    console.log('🔍 Discord APIへ接続テスト中...');

    const response = await fetch(
      'https://discord.com/api/v10/users/@me',
      {
        method: 'GET',
        headers: {
          Authorization: `Bot ${TOKEN}`
        },
        signal: controller.signal
      }
    );

    clearTimeout(timeout);

    console.log(
      `🔍 Discord API HTTPステータス: ${response.status}`
    );

    if (!response.ok) {

      const text = await response.text();

      console.error('❌ Discord API認証失敗');
      console.error(text);

      return;
    }

    const botUser = await response.json();

    console.log(
      `✅ Botトークン認証成功: ${botUser.username}`
    );

  } catch (error) {

    clearTimeout(timeout);

    console.error(
      '❌ Discord APIへの接続テスト失敗'
    );

    console.error(error);

    return;
  }

  // ============================
  // Gatewayログイン
  // ============================

  try {

    console.log(
      '🔍 Discord Gatewayへ接続中...'
    );

    await client.login(TOKEN);

    console.log(
      '✅ client.login() 完了'
    );

  } catch (error) {

    console.error(
      '❌ Discord Gatewayログイン失敗'
    );

    console.error(error);
  }
}

startDiscordBot();
