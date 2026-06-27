const { findUid } = global.utils;
const regExCheckURL = /^(http|https):\/\/[^ "]+$/;

module.exports = {
  config: {
    name: "uid",
    version: "2.1",
    author: "Kawsar",
    cooldowns: 5,
    description: {
      en: "View Facebook UID with contact card together"
    },
    category: "info",
    guide: {
      en: "{pn} [@mention | profile link | name]\nReply to message also works"
    }
  },

  onStart: async function ({ message, event, args, api }) {
    const { senderID, messageReply, mentions, threadID } = event;

    // 1️⃣ Reply দিলে
    if (messageReply)
      return api.shareContact(`${messageReply.senderID}`, messageReply.senderID, threadID);

    // 2️⃣ কিছু না দিলে নিজের
    if (!args[0] && Object.keys(mentions).length === 0)
      return api.shareContact(`${senderID}`, senderID, threadID);

    // 3️⃣ যদি profile link হয়
    if (regExCheckURL.test(args[0])) {
      try {
        const uid = await findUid(args[0]);
        return api.shareContact(`${uid}`, uid, threadID);
      } catch (e) {
        return message.reply(`❌ Error: ${e.message}`);
      }
    }

    // 4️⃣ Mention থাকলে
    if (Object.keys(mentions).length > 0) {
      const mentionID = Object.keys(mentions)[0];
      return api.shareContact(`${mentionID}`, mentionID, threadID);
    }

    // 5️⃣ নাম বা সরাসরি UID
    try {
      const id = isNaN(args[0]) ? await global.utils.getUID(args.join(" ")) : args[0];
      return api.shareContact(`${id}`, id, threadID);
    } catch (e) {
      return message.reply(`❌ Could not find UID: ${e.message}`);
    }
  }
};
