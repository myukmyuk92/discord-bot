const express = require('express');
const {
  Client,
  GatewayIntentBits,
  REST,
  Routes
} = require('discord.js');

const app = express();
app.use(express.json());

// ==============================
// 環境変数
// ==============================

const TOKEN = process.env.TOKEN?.trim();
const FORUM_CHANNEL_ID = process.env.FORUM_CHANNEL_ID?.trim();

if (!TOKEN) {
  console.error('❌ TOKEN が設定されていません');
}

if (!FORUM_CHANNEL_ID) {
  console.error('❌ FORUM_CHANNEL_ID が設定されていません');
}

// ==============================
// Discord Client
// ==============================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds
  ]
});

// ==============================
// Discordイベントログ
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

client.on('shardDisconnect', (event, shardId) => {
  console.error(
    `❌ Discord Shard Disconnect: shard=${shardId}, code=${event.code}`
  );
});

client.on('invalidated', () => {
  console.error('❌ Discordセッションが無効化されました');
});

// ==============================
// Render起動・Bot状態確認
// ==============================

app.get('/', (req, res) => {
  if (client.isReady()) {
    res.status(200).send('Bot ready');
  } else {
    res.status(200).send('Server awake, Bot starting');
  }
});

// ==============================
// Discordフォーラム投稿
// ==============================

app.post('/webhook', async (req, res) => {
  try {
    if (!client.isReady()) {
      console.log('⚠️ 投稿要求を受信しましたがBotはまだ準備中です');
      return res.status(503).send('Bot is starting');
    }

    const { title, description, mention } = req.body;

    console.log(`📨 投稿要求受信: ${title}`);

    const channel = await client.channels.fetch(FORUM_CHANNEL_ID);

    if (!channel) {
      console.error('❌ フォーラムチャンネルが見つかりません');
      return res.status(404).send('Forum channel not found');
    }

    const thread = await channel.threads.create({
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

    console.log(`✅ Discord投稿成功: ${thread.name}`);

    res.status(200).send('ok');

  } catch (error) {
    console.error('❌ Discord投稿エラー:', error);
    res.status(500).send('error');
  }
});

// ==============================
// Render Web Server
// ==============================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('================================');
  console.log(`✅ Webサーバー起動: port ${PORT}`);
  console.log('================================');
});

// ==============================
// Discord接続診断
// ==============================

async function startDiscordBot() {
  console.log('🔍 Discord接続診断開始');

  if (!TOKEN) {
    console.error('❌ TOKENがないためDiscordへ接続できません');
    return;
  }

  // ① REST APIでトークンが有効か確認
  try {
    console.log('🔍 Botトークン認証確認中...');

    const rest = new REST({
      version: '10'
    }).setToken(TOKEN);

    const botUser = await rest.get(
      Routes.user('@me')
    );

    console.log(`✅ Botトークン認証成功: ${botUser.username}`);
    console.log(`✅ Bot ID: ${botUser.id}`);

  } catch (error) {
    console.error('❌ Botトークン認証失敗');
    console.error(error);
    return;
  }

  // ② Discord Gatewayへログイン
  try {
    console.log('🔍 Discord Gatewayへ接続中...');

    await client.login(TOKEN);

    console.log('✅ client.login() 完了');

  } catch (error) {
    console.error('❌ Discord Gatewayログイン失敗');
    console.error(error);
  }

  // ③ 30秒後にもreadyでない場合
  setTimeout(() => {
    if (!client.isReady()) {
      console.error('❌ 30秒経過してもBotがReadyになっていません');
      console.error('❌ Gateway接続に問題がある可能性があります');
    }
  }, 30000);
}

startDiscordBot();
