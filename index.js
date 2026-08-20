const express = require('express');
const { Client, GatewayIntentBits } = require('discord.js');

const app = express();
app.use(express.json());

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const TOKEN = process.env.TOKEN;
const FORUM_CHANNEL_ID = process.env.FORUM_CHANNEL_ID;

// Discord Botの準備完了
client.once('ready', () => {
  console.log(`Bot起動: ${client.user.tag}`);
});

// Render起動確認用
app.get('/', (req, res) => {
  if (client.isReady()) {
    res.status(200).send('Bot ready');
  } else {
    res.status(200).send('Server awake, Bot starting');
  }
});

// Discordフォーラム投稿
app.post('/webhook', async (req, res) => {
  try {
    // Discord Botがまだログイン完了していない場合
    if (!client.isReady()) {
      console.log('Botがまだ準備中です');
      return res.status(503).send('Bot is starting');
    }

    const { title, description, mention } = req.body;

    const channel = await client.channels.fetch(FORUM_CHANNEL_ID);

    if (!channel) {
      console.log('フォーラムチャンネルが見つかりません');
      return res.status(404).send('Forum channel not found');
    }

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

    console.log(`投稿成功: ${title}`);

    res.status(200).send('ok');

  } catch (err) {
    console.error('投稿エラー:', err);
    res.status(500).send('error');
  }
});

// Renderが指定するポートを使う
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
});

// Discordへログイン
client.login(TOKEN)
  .then(() => {
    console.log('Discordログイン要求成功');
  })
  .catch((err) => {
    console.error('Discordログイン失敗:', err);
  });
