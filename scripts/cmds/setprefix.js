module.exports = {
  config: {
    name: "setprefix",
    version: "1.0",
    author: "Kawsar",
    role: 2,
    category: "change",
    shortDescription: "Change global or group prefix",
    guide: {
      en: "{pn} <newPrefix>\n{pn} group <newPrefix>"
    }
  },

  onStart: async function ({ api, event, args, threadsData }) {
    if (!args[0]) {
      return api.sendMessage(
        "✅ ||⇨ 𝐬𝐞𝐭𝐩𝐫𝐞𝐟𝐢𝐱 <𝐧𝐞𝐰𝐏𝐫𝐞𝐟𝐢𝐱> ➤ 𝐆𝐥𝐨𝐛𝐚𝐥 \n ✅ ||⇨ 𝐬𝐞𝐭𝐩𝐫𝐞𝐟𝐢𝐱 𝐠𝐫𝐨𝐮𝐩 <𝐧𝐞𝐰𝐏𝐫𝐞𝐟𝐢𝐱> ➤ 𝐓𝐡𝐢𝐬 𝐆𝐫𝐨𝐮𝐩",
        event.threadID,
        event.messageID
      );
    }

    // group prefix change
    if (args[0].toLowerCase() === "group") {
      const groupPrefix = args[1];
      if (!groupPrefix)
        return api.sendMessage("⚠️  ||⇨ 𝐏𝐥𝐞𝐚𝐬𝐞 𝐩𝐫𝐨𝐯𝐢𝐝𝐞 𝐚 𝐩𝐫𝐞𝐟𝐢𝐱 𝐟𝐨𝐫 𝐭𝐡𝐢𝐬 𝐠𝐫𝐨𝐮𝐩.", event.threadID, event.messageID);
      await threadsData.set(event.threadID, groupPrefix, "data.prefix");
      return api.sendMessage(`✅  ||⇨ 𝐆𝐫𝐨𝐮𝐩 𝐏𝐫𝐞𝐟𝐢𝐱 ➤ ”${groupPrefix}”`, event.threadID, event.messageID);
    }

    // global prefix change (RAM only)
    const input = args[0];
    global.GoatBot.config.prefix = input;

    return api.sendMessage(`✅  ||⇨ 𝐍𝐞𝐰 𝐏𝐫𝐞𝐟𝐢𝐱 ➤ ”${input}”`, event.threadID, event.messageID);
  }
};
