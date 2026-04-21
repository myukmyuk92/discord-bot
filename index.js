const express = require('express');
const { Client, GatewayIntentBits } = require('discord.js');

const app = express();
app.use(express.json());

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const TOKEN = process.env.TOKEN;
const FORUM_CHANNEL_ID = process.env.FORUM_CHANNEL_ID;

client.once('ready', () => {
  console.log('Bot起動');
});

app.post('/webhook', async (req, res) => {
  try {
    const { title, description, mention } = req.body;

    const channel = await client.channels.fetch(FORUM_CHANNEL_ID);

    await channel.threads.create({
      name: title,
      message: {
        content: mention,
        embeds: [{
          title: title,
          description: description,
          color: 0x00BFFF
        }]
      }
    });

    res.send('ok');
  } catch (err) {
    console.error(err);
    res.status(500).send('error');
  }
});

client.login(TOKEN);

app.listen(3000, () => {
  console.log('server running');
});
