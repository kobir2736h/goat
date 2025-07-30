const axios = require("axios");

module.exports = {
  config: {
    name: "imgur",
    aliases:  ["i"],
    version: "6.9",
    author: "GoatMart",
    countDown: 5,
    role: 0,
    category: "attachment",
    longDescription: {
      en: "Convert image/video/audio/gifs  into link.",
    },
    guide: "Reply to [image, video, audio, gifs]",
  },

  onStart: async function ({ api, event }) {
    try {
      const attachment = event.messageReply?.attachments?.[0];

      if (!attachment || !attachment.url) {
        return api.sendMessage(
          "Please reply to an image, video or audio.",
          event.threadID,
          event.messageID
        );
      }

      const url = attachment.url;
      const response = await axios.post(
        `https://gbin.onrender.com/v1/upload`,
        { url },
        {
          headers: {
            "Content-Type": "application/json",
          },
          maxContentLength: 1024 * 1024 * 1024, 
          timeout: 30000 
        }
      );

      if (response.data && response.data.link) {
        return api.sendMessage(
          `${response.data.link}`,
          event.threadID,
          event.messageID
        );
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Error uploading media:", error.message || error);
      return api.sendMessage(
        "Failed to convert media into a link. Please try again.",
        event.threadID,
        event.messageID
      );
    }
  }
};
