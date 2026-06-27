const axios = require("axios");
const rubishapi = global.GoatBot.config.rubishapi;

module.exports = {
  config: {
    name: "screenshot",
    aliases: ["ss"],
    author: "RUBISH",
    version: "2.0",
    cooldowns: 5,
    role: 2,
    shortDescription: {
      en: "Capture a screenshot of a website by url"
    },
    longDescription: {
      en: "This command enables you to capture a screenshot of a webpage by providing its URL."
    },
    category: "General",
    guide: {
      en: "{pn} <url> or reply an url"
    }
  },
  onStart: async function ({ api, event, args, message }) {
    let url;

    const setReactionInProgress = () => {
      api.setMessageReaction("⏳", event.messageID, (err) => {
        if (err) console.error(err);
      }, true);
    };

    const setReactionSuccess = () => {
      api.setMessageReaction("✅", event.messageID, (err) => {
        if (err) console.error(err);
      }, true);
    };

    setReactionInProgress();

    const extractUrl = (text) => {
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const urls = text.match(urlRegex);
      return urls ? urls[0] : null;
    };

    if (event.type === "message_reply") {
      const repliedText = event.messageReply.body;
      url = extractUrl(repliedText);
      if (!url) {
        return message.reply("⭕ | The replied message does not contain a valid URL.");
      }
    } else if (event.type === "message_url" && event.messageURL) {
      url = event.messageURL;
    } else {
      if (args.length === 0) {
        return message.reply("⚠️ | Please provide or reply with a URL.");
      }
      url = args[0];
    }

    try {
      const response = await axios.get(`https://rubish-apihub.onrender.com/Rubish/screenshot?url=${encodeURIComponent(url)}&apikey=rubish69`);

      const { imageURL } = response.data;

      const imageResponse = await axios.get(imageURL, { responseType: "stream" });

      await message.reply({
        body: `
✅ | Screenshot Captured

▣ URL ⇾ ${url}

▣ Image URL ⇾ ${imageURL}`,
        attachment: imageResponse.data
      });

      setReactionSuccess(); 

    } catch (error) {
      message.reply(`Error: ${error.message}`);
    }
  }
};
