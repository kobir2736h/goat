const axios = require("axios"), ok = "xyz";

module.exports = {
  config: {
    name: "imgbb",
    aliases: [],
    version: "1.0",
    author: "Fahim_Noob",
    countDown: 5,
    role: 0,
    longDescription: { en: "Upload image to imgbb and get the URL." },
    category: "attachment",
  },
  onStart: async function({ message, event }) {
    try {
      if (!event.messageReply || !event.messageReply.attachments || !event.messageReply.attachments[0]) {
        return message.reply("⚠ | Please reply to an image to upload it.");
      }

      const imageUrl = event.messageReply.attachments[0].url;
      const response = await axios.get(`https://smfahim.${ok}/imgbb?url=${encodeURIComponent(imageUrl)}`);
      const data = response.data;

      if (data.status_code === 200 && data.success?.message === "image uploaded") {
        message.reply(`${data.image.url}`);
      } else {
        message.reply("❌ | Image upload failed.");
      }
    } catch (error) {
      message.reply("❌ | There was an error uploading the image.");
      console.error(error);
    }
  }
};
