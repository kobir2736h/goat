const axios = require("axios");

module.exports = {
  config: {
    name: "tn",
    version: "2.0",
    author: "Kawsar",
    cooldowns: 3,
    description: { en: "Auto translate Bangla ↔ English using Google Translate" },
    category: "translate",
    guide: { en: "{pn} [text]" }
  },

  onStart: async function ({ message, args }) {
    if (args.length === 0) return message.reply("❌ অনুবাদের জন্য কিছু লিখো!");

    const input = args.join(" ");

    try {
      // Google Translate API call
      const res = await axios.get(`https://translate.googleapis.com/translate_a/single`, {
        params: {
          client: "gtx",
          sl: "auto",       // source language auto-detect
          tl: "bn",         // default target Bangla
          dt: "t",
          q: input
        }
      });

      const detectedLang = res.data[2]; // auto-detected language code
      let targetLang = "bn";

      if (detectedLang === "bn") {
        targetLang = "en"; // If input is Bangla, translate to English
      }

      // If target lang changed, re-translate
      if (targetLang !== "bn") {
        const again = await axios.get(`https://translate.googleapis.com/translate_a/single`, {
          params: {
            client: "gtx",
            sl: "auto",
            tl: targetLang,
            dt: "t",
            q: input
          }
        });
        const result = again.data[0].map(item => item[0]).join("");
        return message.reply(`${result}`);
      }

      // original bangla output
      const translatedText = res.data[0].map(item => item[0]).join("");
      return message.reply(`${translatedText}`);
    } catch (err) {
      console.error(err);
      return message.reply("⚠️ অনুবাদ করতে সমস্যা হয়েছে, আবার চেষ্টা করুন।");
    }
  }
};
