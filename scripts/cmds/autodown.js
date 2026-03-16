const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const { downloadVideo } = require("priyansh-all-dl");

let autoDownloadEnabled = true;
const processedMessages = new Set();

module.exports = {
  config: {
    name: "autodown",
    aliases: ["autodl"],
    version: "2.0.1",
    author: "Nazrul",
    role: 0,
    description: "Auto detect and download media",
    category: "download",
    guide: { en: "{p}autodown on/off" }
  },

  onStart: async function () {},

  onChat: async function ({ api, event }) {

    const { messageID, threadID, senderID, body } = event;

    if (senderID == api.getCurrentUserID()) return;

    if (body?.startsWith("autodown")) {
      const cmd = body.split(" ")[1];

      if (cmd === "on") {
        autoDownloadEnabled = true;
        return api.sendMessage("✅ Auto download enabled", threadID, messageID);
      }

      if (cmd === "off") {
        autoDownloadEnabled = false;
        return api.sendMessage("❌ Auto download disabled", threadID, messageID);
      }
    }

    if (!autoDownloadEnabled) return;

    if (processedMessages.has(messageID)) return;
    processedMessages.add(messageID);

    const url = body?.match(/https?:\/\/[^\s]+/)?.[0];
    if (!url) return;

    try {

      api.setMessageReaction("⏳", messageID, () => {}, true);

      const data = await downloadVideo(url);

      const videoLink =
        data?.["720p"] ||
        data?.["360p"] ||
        data?.video ||
        data?.url;

      if (!videoLink) throw new Error("No video");

      const filePath = path.join(__dirname, `video_${Date.now()}.mp4`);

      const res = await axios({
        url: videoLink,
        method: "GET",
        responseType: "stream"
      });

      const writer = fs.createWriteStream(filePath);
      res.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      await api.sendMessage({
        body: "📥 Video Downloaded",
        attachment: fs.createReadStream(filePath)
      }, threadID, messageID);

      fs.unlinkSync(filePath);

      api.setMessageReaction("✅", messageID, () => {}, true);

    } catch (e) {
      console.log(e);
      api.setMessageReaction("❌", messageID, () => {}, true);
    }
  }
};
