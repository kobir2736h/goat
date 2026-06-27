const axios = require("axios");
const path = require("path");

module.exports = {
  config: {
    name: "pinterest",
    version: "1.0",
    author: "حسين يعقوبي",
    role: 0,
    countDown: 60,
    longDescription: {
      en: "This command allows you to search for images on Pinterest based on a specific query and retrieve a certain number of images."
    },
    category: "picture",
    guide: {
      en: "{pn} cat - 6: {pn} Cat"
    }
  },

  onStart: async function ({ api, event, args }) {
    try {
      api.setMessageReaction("⏱️", event.messageID, (err) => {}, true);
      const fs = require("fs-extra");

      // Translate search term from Arabic to English
      const translationResponse = await axios.get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=ar&tl=en&dt=t&q=${encodeURIComponent(args.join(" "))}`);
      const translatedText = translationResponse.data[0][0][0];
      
      // Use translated text for Pinterest API search
      const pinterestResponse = await axios.get(`https://smfahim.xyz/pin?title=${encodeURIComponent(translatedText)}&search=9`);
      const data = pinterestResponse.data.data.slice(0, 9); // Limit to 9 images

      const imgData = [];
      
      for (let i = 0; i < data.length; i++) {
        const imgResponse = await axios.get(data[i], { responseType: "arraybuffer" });
        const imgPath = path.join(__dirname, "cache", `${i + 1}.jpg`);
        await fs.outputFile(imgPath, imgResponse.data);

        imgData.push(fs.createReadStream(imgPath));
      }

      // Send the images as an attachment
      await api.sendMessage({
        attachment: imgData,
        body: `📸 | Search results for: ${args.join(" ")}`
      }, event.threadID, event.messageID);

      api.setMessageReaction("✅", event.messageID, (err) => {}, true);

      // Clean up the cache folder
      await fs.remove(path.join(__dirname, "cache"));
    } catch (error) {
      console.error(error);
      return api.sendMessage(
        `❌ | An error occurred while processing your request.`,
        event.threadID,
        event.messageID
      );
    }
  }
};
