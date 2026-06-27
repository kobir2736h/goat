const fs = require("fs");
const path = require("path");

const configPath = path.join(__dirname, "..", "..", "config.dev.json");

module.exports = {
  config: {
    name: "log2",
    version: "1.0",
    author: "Kawsar",
    cooldowns: 3,
    description: { en: "Enable/disable all logging" },
    category: "config",
    guide: { en: "{pn} — toggle logging system on/off" }
  },

  onStart: async function ({ message }) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

      // toggle disableAll
      const current = config.logEvents.disableAll;
      config.logEvents.disableAll = !current;

      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");

      return message.reply(
        `✅ | Logging system is now ${!current ? "🔴 Disabled" : "🟢 Enabled"}`
      );
    } catch (e) {
      return message.reply("❌ | Failed to toggle logging.");
    }
  }
};
