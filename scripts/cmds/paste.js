
const axios = require("axios");
const fs = require("fs").promises;

module.exports = {
  config: {
    name: "paste",
    version: "1.0",
    author: "GoatMart",
    countDown: 5,
    role: 0,
    category: "utility",
    longDescription: {
      en: "Upload commands or code to get a shareable link",
      },
    guide: "Reply to a message containing code",
  },

  onStart: async function ({ api, event }) {
    try {
      if (!event.messageReply?.body) {
        return api.sendMessage(
          "Please reply to a message.",
          event.threadID,
          event.messageID
        );
      }

      const code = event.messageReply.body;
      const response = await axios.post(
        `https://gbin.onrender.com/v1/paste`,
        {
          code: code,
          title: "Create Paste",
          language: "text"
        },
        {
          headers: {
            "Content-Type": "application/json",
          }
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
      console.error("Error creating code paste:", error.message || error);
      return api.sendMessage(
        "Failed to create code paste link. Please try again.",
        event.threadID,
        event.messageID
      );
    }
  }
};
