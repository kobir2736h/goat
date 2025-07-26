const { exec } = require("child_process");

module.exports = {
  config: {
    name: "gemini",
    version: "1.0",
    author: "Kawsar",
    cooldowns: 3,
    description: { en: "Ask Gemini AI anything" },
    category: "ai",
    guide: { en: "{pn} your question" }
  },

  onStart: async function ({ message, args }) {
    const userInput = args.join(" ");
    if (!userInput) return message.reply("❌ Please provide a message to ask Gemini.");

    // 🟢 Render-compatible path: run from project root
    exec(`python3 gemini.py "${userInput.replace(/"/g, '\\"')}"`, (err, stdout, stderr) => {
      if (err || stderr) return message.reply("❌ Error:\n" + (stderr || err.message));
      message.reply(stdout.trim());
    });
  }
};
