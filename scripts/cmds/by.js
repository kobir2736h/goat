module.exports = {
  config: {
    name: "by",
    version: "1.4",
    author: "Kawsar",
    countDown: 5,
    role: 2,
    shortDescription: {
      en: "Kick or leave group"
    },
    description: {
      en: "Kick members if reply/mention or bot leaves group"
    },
    category: "group helper",
    guide: {
      en: "{pn} [reply | @mention | all | @everyone]"
    }
  },

  langs: {
    en: {
      kicked: "✅ Kicked %1 member(s).",
      leaveGroup: "👋 Bot left this group.",
      leaveAllDone: "✅ Left %1 group(s)."
    }
  },

  onStart: async function ({ api, event, args, message, getLang }) {
    const threadID = event.threadID;
    const botID = api.getCurrentUserID();
    const threadInfo = await api.getThreadInfo(threadID);
    const isBotAdmin = threadInfo.adminIDs.some(e => e.id === botID);
    const allMembers = threadInfo.participantIDs.filter(id => id !== botID);

    // 🧠 Step 1: যদি reply বা @mention থাকে → kick করো
    let targets = [];

    if (event.type === "message_reply") {
      targets.push(event.messageReply.senderID);
    }

    if (Object.keys(event.mentions).length > 0) {
      targets.push(...Object.keys(event.mentions));
    }

    if (targets.length > 0) {
      if (!isBotAdmin) return; // বট admin না হলে চুপ

      let kicked = 0;
      for (const id of targets) {
        try {
          await api.removeUserFromGroup(id, threadID);
          kicked++;
        } catch (e) {}
      }
      return message.reply(getLang("kicked", kicked));
    }

    // 🧠 Step 2: যদি "by all" → অন্য সব গ্রুপ ছেড়ে দাও (এইটা বাদে)
    if (args[0]?.toLowerCase() === "all") {
      const threads = await api.getThreadList(100, null, ["INBOX"]);
      let left = 0;
      for (const t of threads) {
        if (t.isGroup && t.threadID !== threadID) {
          try {
            await api.removeUserFromGroup(botID, t.threadID);
            left++;
          } catch (e) {}
        }
      }
      return message.reply(getLang("leaveAllDone", left));
    }

    // 🧠 Step 3: যদি "@everyone" mention বা লেখা থাকে → সবাইকে কিক + বট বের
    if ("@everyone" in event.mentions || event.body?.toLowerCase().includes("@everyone")) {
      if (!isBotAdmin) return;
      for (const uid of allMembers) {
        try {
          await api.removeUserFromGroup(uid, threadID);
        } catch (e) {}
      }
      return api.removeUserFromGroup(botID, threadID).catch(() => {});
    }

    // 🧠 Step 4: শুধু "by" → বট নিজে leave করবে
    return api.removeUserFromGroup(botID, threadID).catch(() => {});
  }
};
