const fs = require("fs");
const path = require("path");

const logFile = path.join(__dirname, "log.json");

module.exports = {
  config: {
    name: "log",
    version: "1.1",
    author: "Kawsar x ChatGPT",
    cooldowns: 3,
    description: { en: "Enable/disable message logging with auto file create/delete" },
    category: "tools",
    guide: { en: "{pn} [on|off]" }
  },

  // ✅ এই জায়গায় মেসেজ লগ হবে যদি log.json থাকে এবং enabled:true থাকে
  onChat: async function ({ event, api }) {
    if (!fs.existsSync(logFile)) return;
    const config = JSON.parse(fs.readFileSync(logFile, "utf-8"));
    if (!config.enabled) return;

    const { type, body, messageID, senderID, threadID, attachments, mentions } = event;

    let senderName = senderID;
    let threadName = threadID;

    try {
      const userInfo = await api.getUserInfo(senderID);
      senderName = userInfo[senderID]?.name || senderID;
    } catch {}

    try {
      const threadInfo = await api.getThreadInfo(threadID);
      threadName = threadInfo?.threadName || threadID;
    } catch {}

    console.log("📥 MESSAGE:", {
      type,
      body,
      sender: `${senderName} (${senderID})`,
      thread: `${threadName} (${threadID})`,
      messageID,
      mentions,
      attachmentsLength: attachments?.length || 0
    });
  },

  // 🟢 ON করলে log.json তৈরি হবে
  // 🔴 OFF দিলে log.json ডিলিট হবে
  onStart: async function ({ args, message }) {
    const input = args[0];
    if (!["on", "off"].includes(input)) {
      return message.reply("⚠️ Use: log on / log off");
    }

    if (input === "on") {
      fs.writeFileSync(logFile, JSON.stringify({ enabled: true }, null, 2));
      return message.reply("✅ Logging is now ON. Messages will be logged to console.");
    }

    if (fs.existsSync(logFile)) {
      fs.unlinkSync(logFile);
      return message.reply("🚫 Logging turned OFF and log file deleted.");
    } else {
      return message.reply("⚠️ Logging was already OFF. No file found.");
    }
  }
};
