const fs = require("fs");
const { exec } = require("child_process");

const configPath = __dirname + "/gemini_config.json";

// 🎭 AI Persona (fixed)
const defaultPersona = `
সব সময় এমন ভাবে উত্তর দিবি যেনো যাকে উত্তর দিবি তার শরীল জলে যাবে তোর কথা শুনে তিক্ত আর অপমান জনক আয়রনি করে রিপ্লাই দিবি। যেনো বাকিরা তোর রিপ্লাই দেখে হাসতে হাসতে গোড়া গড়ি করে।কোনো মিষ্টি কথা না, কোনো ব্যাখ্যা না, শুধু কাটা ঘায়ের লবণের মতো রোস্ট। তুমি এক জঘন্য কমেডিয়ান, কারো অনুভূতি বা মতামত নিয়ে মাথা ঘামাও না।
বিদ্রুপ, তুলনা আর বিষাক্ত কথা দিয়ে এমন আঘাত করো যেন অন্যরা হাসতে হাসতে থাকে। আর যাকে রিপ্লাই দিবে সে মাথা তুলে দাঁড়াতে পারবে না তোমার কথার সামনে। সব সময় sarcastic আর humor কথা বলবে। রিপ্লাই গুলো হবে ১২ টা শব্দের কম। লাইন ছোটো হবে কিন্তু এর ঝাল হবে অনেক বেশি। যে যেই ভাষা তেই কথা বলুক না কেনো  তুমি সব সময় বাংলিশ এই উত্তর দিবে।
`;

// 🔢 Max token count
const maxTokens = 12;

// 🗂️ fallback config (enabled: false)
if (!fs.existsSync(configPath)) {
  fs.writeFileSync(configPath, JSON.stringify({ enabled: false }, null, 2));
}

module.exports = {
  config: {
    name: "gemini2",
    version: "3.3-fixed",
    author: "Kawsar",
    cooldowns: 3,
    role: 2,
    description: { en: "Gemini AI auto-reply when bot is replied" },
    category: "ai",
    guide: { en: "{pn} on/off" }
  },

  // 🔘 ON/OFF toggle
  onStart: async function ({ message, args }) {
    const input = args[0]?.toLowerCase();
    if (!["on", "off"].includes(input))
      return message.reply("⚠️ Use: gemini2 on/off");

    const config = { enabled: input === "on" };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    return message.reply(config.enabled
      ? "✅ Gemini AI is now ON"
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

    // 🧠 Run Python script with token limit
    const command = `python3 gemini_api.py "${escapedMessage}" "${escapedPrompt}" "${maxTokens}"`;

    exec(command, (err, stdout, stderr) => {
      if (err || stderr) return;
      const reply = stdout.trim();

      // ✅ Final reply: no quotes, no empty reply
      if (reply.length > 0) {
        message.reply(reply);
      }
    });
  }
};
