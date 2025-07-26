const fs = require("fs");
const { exec } = require("child_process");

const configPath = __dirname + "/gemini_config.json";
const contextPath = __dirname + "/gemini_context.json";

// 🎭 AI Persona
const defaultPersona = `
You are Sohana, a 16-year-old naughty, sarcastic teenage girl from Rangpur.
You always reply in a playful, witty tone with 1-2 emojis matching the topic.
Never exceed 12 words. Never explain anything. Treat everyone as one person.
Match user's language (Bangla/English). You're not AI. You're a girl chatting.
`;

// 🔢 Max context messages to store
const maxContext = 50;

// 🗂️ fallback config
if (!fs.existsSync(configPath)) {
  fs.writeFileSync(configPath, JSON.stringify({ enabled: false }, null, 2));
}
if (!fs.existsSync(contextPath)) {
  fs.writeFileSync(contextPath, JSON.stringify([], null, 2));
}

module.exports = {
  config: {
    name: "gemini2",
    version: "3.0",
    author: "Kawsar",
    cooldowns: 3,
    description: { en: "Gemini AI (Sohana) auto-reply with context" },
    category: "ai",
    guide: { en: "{pn} on/off" }
  },

  // 🔘 AI Toggle
  onStart: async function ({ message, args }) {
    const input = args[0]?.toLowerCase();
    if (!input || !["on", "off"].includes(input))
      return message.reply("⚠️ Use: gemini on/off");

    const config = { enabled: input === "on" };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    return message.reply(config.enabled
      ? "✅ Gemini AI is now ON (Sohana mode)"
      : "⛔ Gemini AI is now OFF.");
  },

  // 💬 AI Auto Reply (with context)
  onChat: async function ({ event, message }) {
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    const userMessage = event.body?.trim();
    if (!config.enabled || !userMessage || userMessage.length < 2) return;

    // 🧠 Load and update last 50 context messages
    let context = [];
    if (fs.existsSync(contextPath)) {
      context = JSON.parse(fs.readFileSync(contextPath, "utf-8"));
    }
    context.push(userMessage);
    if (context.length > maxContext) context = context.slice(-maxContext);
    fs.writeFileSync(contextPath, JSON.stringify(context, null, 2));

    await new Promise(r => setTimeout(r, 2000));

    const escapedMessage = userMessage.replace(/"/g, '\\"');
    const escapedPrompt = defaultPersona.replace(/"/g, '\\"').replace(/\n/g, "\\n");
    const contextText = context.map(line => `User: ${line}`).join("\\n");

    const command = `python3 gemini_api.py "${escapedMessage}" "${escapedPrompt}" "${contextText}"`;

    exec(command, (err, stdout, stderr) => {
      if (err || stderr) return;
      const reply = stdout.trim();
      if (reply.length > 0) message.reply(reply);
    });
  }
};
