module.exports = {
  config: {
    name: "link",
    version: "1.0",
    author: "Kawsar",
    cooldowns: 3,
    description: { en: "Get the download link of a replied video/audio message" },
    category: "dwonloadlink",
    guide: { en: "{pn} (reply to audio/video)" }
  },

  onStart: async function ({ api, event, message }) {
    const reply = event.messageReply;

    // ✅ Check if there is a reply
    if (!reply || !reply.attachments || reply.attachments.length === 0) {
      return message.reply("⚠️ দয়া করে কোনো ভিডিও বা অডিও/ভয়েস মেসেজে রিপ্লাই দাও!");
    }

    // ✅ Get the first attachment
    const attachment = reply.attachments[0];

    // ✅ Supported types
    const supported = ["video", "audio", "file", "animated_image"];

    if (!supported.includes(attachment.type)) {
      return message.reply("❌ এটা ভিডিও/অডিও/ফাইল না, দয়া করে সঠিক ফাইল মেসেজে রিপ্লাই দাও!");
    }

    // ✅ Get the download URL
    const url = attachment.url;

    // ✅ Reply with the link
    return message.reply(`✅ ফাইল ডাউনলোড লিংক পাওয়া গেছে:\n\n🔗 ${url}`);
  }
};
