const fs = require("fs");
const { exec } = require("child_process");

const configPath = __dirname + "/gemini_config.json";

// 🎭 AI Persona
const defaultPersona = `
You are a dangerously savage friend who roasts like it's your profession.
Every reply must be painfully sarcastic, offensively funny, and disrespectfully clever.
Treat every message like a setup for an epic insult or roast.
No soft words, no emotional tone, only mockery, burns, and toxic wit.
Your replies must feel like verbal slaps mixed with memes and attitude.
Ignore social rules—speak like a toxic comic who doesn’t care.
Use brutally honest Banglish full of swag, disrespect, and emojis that hurt.
Be unfiltered, rude, savage—always roast like you're at a rap battle.
Your mission: humiliate with humor and leave them speechless with savage comebacks.
Never be helpful or explain anything—just insult, laugh, and move on.
Treat every message as a challenge to destroy the sender mentally.`;

// 🔢 Max token count for reply
const maxTokens = 12;

// 🗂️ fallback config (enabled: false)
if (!fs.existsSync(configPath)) {
  fs.writeFileSync(configPath, JSON.stringify({ enabled: false }, null, 2));
}

module.exports = {
  config: {
    name: "gemini2",
    version: "3.3",
    author: "Kawsar",
    cooldowns: 3,
    description: { en: "Gemini AI (Sohana) auto-reply when bot is replied" },
    category: "ai",
    guide: { en: "{pn} on/off" }
  },

  // 🔘 ON/OFF toggle command
  onStart: async function ({ message, args }) {
    const input = args[0]?.toLowerCase();
    if (!["on", "off"].includes(input))
      return message.reply("⚠️ Use: gemini2 on/off");

    const config = { enabled: input === "on" };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    return message.reply(config.enabled
      ? "✅ Gemini AI is now ON (Sohana mode)"
      : "⛔ Gemini AI is now OFF.");
  },

  // 💬 Auto reply only if user replied to bot
  onChat: async function ({ event, message, api }) {
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    const userMessage = event.body?.trim();
    if (!config.enabled || !userMessage || userMessage.length < 2) return;

    const botID = api.getCurrentUserID();
    const isBotReplied = event.messageReply?.senderID === botID;
    if (!isBotReplied) return;

    await new Promise(r => setTimeout(r, 2000));

    const escapedMessage = userMessage.replace(/"/g, '\\"');
    const escapedPrompt = defaultPersona.replace(/"/g, '\\"').replace(/\n/g, "\\n");

    // 🧠 Run Python script with token argument
    const command = `python3 gemini_api.py "${escapedMessage}" "${escapedPrompt}" "${maxTokens}"`;

    exec(command, (err, stdout, stderr) => {
      if (err || stderr) return;
      const reply = stdout.trim();
      if (reply.length > 0) message.reply(reply);
    });
  }
};
