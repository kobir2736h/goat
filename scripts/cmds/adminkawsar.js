const fs = require("fs-extra");
const { config } = global.GoatBot;
const { client } = global;

module.exports = {
  config: {
    name: "adminkawsar",
    version: "1.3",
    author: "Kawsar Fusion",
    cooldowns: 5,
    role: 2,
    description: {
      en: "Toggle global or box admin-only mode (box toggles on/off with no args)"
    },
    category: "owner",
    guide: {
      en: "{pn} — Toggle global admin-only mode on/off\n"
        + "{pn} box — Toggle admin-only mode on/off for this group"
    }
  },

  langs: {
    en: {
      turnedOnGlobal: "✅ Bot is now in GLOBAL admin-only mode.",
      turnedOffGlobal: "❎ Global admin-only mode disabled.",
      turnedOnBox: "✅ Only group admins can use bot in this group.",
      turnedOffBox: "❎ Everyone in this group can use bot.",
      syntaxError: "⚠️ Syntax error! Use: adminonly [box]"
    }
  },

  onStart: async function ({ args, event, message, threadsData, getLang }) {
    // যদি args না থাকে → global admin-only মোড টগল করো
    if (args.length === 0) {
      config.adminOnly.enable = !config.adminOnly.enable; // গ্লোবাল টগল
      fs.writeFileSync(client.dirConfig, JSON.stringify(config, null, 2));
      return message.reply(getLang(config.adminOnly.enable ? "turnedOnGlobal" : "turnedOffGlobal"));
    }

    // যদি args[0] === 'box' → ওই গ্রুপের box মোড টগল করো
    if (args.length === 1 && args[0] === "box") {
      // আগের স্টেট নিয়ে আসো, না থাকলে false ধরে নাও
      const current = await threadsData.get(event.threadID, "data.onlyAdminBox") || false;
      const newState = !current; // টগল স্টেট

      await threadsData.set(event.threadID, newState, "data.onlyAdminBox");
      return message.reply(getLang(newState ? "turnedOnBox" : "turnedOffBox"));
    }

    // অন্য কিছু হলে syntax error
    return message.reply(getLang("syntaxError"));
  }
};
