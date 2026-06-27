module.exports = {
  config: {
    name: "u",
    version: "1.2",
    author: "NTKhang",
    countDown: 5,
    role: 0,
    usePrefix: false, // ✅ এই লাইনটা যোগ করা হলো no-prefix চালু করার জন্য
    description: {
      vi: "Gỡ tin nhắn của bot",
      en: "Unsend bot's message"
    },
    category: "box chat",
    guide: {
      vi: "reply tin nhắn muốn gỡ của bot và gọi lệnh {pn}",
      en: "reply the message you want to unsend and call the command {pn}"
    }
  },

  langs: {
    vi: {
      syntaxError: "Vui lòng reply tin nhắn muốn gỡ của bot"
    },
    en: {
      syntaxError: "Please reply the message you want to unsend"
    }
  },

  // ✅ মূল কাজ: reply করা মেসেজটা যদি বট পাঠায়, তাহলে সেটা unsend করবে
  onStart: async function ({ message, event, api, getLang }) {
    if (!event.messageReply || event.messageReply.senderID != api.getCurrentUserID())
      return message.reply(getLang("syntaxError"));

    message.unsend(event.messageReply.messageID);
  },

  // ✅ no-prefix trigger detect করতে onChat block
  onChat: async function ({ event, api, message, getLang }) {
    const body = (event.body || "").toLowerCase().trim();
    const triggers = ["unsend"];
    if (triggers.includes(body)) {
      if (!event.messageReply || event.messageReply.senderID != api.getCurrentUserID())
        return message.reply(getLang("syntaxError"));

      message.unsend(event.messageReply.messageID);
    }
  }
};
