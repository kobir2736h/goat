const { getTime } = global.utils;

module.exports = {
  config: {
    name: "logsbot",
    isBot: true,
    version: "4.0",
    author: "Kawsar - English Only",
    category: "events"
  },

  onStart: async function ({ api, event, usersData }) {
    try {
      const botID = api.getCurrentUserID();
      const { threadID, logMessageType, logMessageData, author } = event;
      const adminIDs = global.GoatBot?.config?.adminBot || [];

      const isAdd = logMessageType === "log:subscribe" &&
        logMessageData.addedParticipants.some(p => p.userFbId == botID);

      const isKick = logMessageType === "log:unsubscribe" &&
        logMessageData.leftParticipantFbId == botID;

      if (!isAdd && !isKick) return;
      if (author == botID) return;

      const authorName = await usersData.getName(author);
      const threadInfo = await api.getThreadInfo(threadID);
      const threadName = threadInfo.threadName || "Unnamed Group";
      const time = getTime("DD/MM/YYYY HH:mm:ss");

      let message = "📋 Bot Activity Log\n";

      if (isAdd) {
        message += `✅ Bot has been added to a group\n👤 Added by: ${authorName}\n`;
      } else if (isKick) {
        message += `❌ Bot has been removed from a group\n👤 Removed by: ${authorName}\n`;
      }

      message += `👤 User ID: ${author}\n💬 Group: ${threadName}\n🆔 Group ID: ${threadID}\n⏰ Time: ${time}`;

      for (const adminID of adminIDs) {
        await api.sendMessage(message, adminID);
      }
    } catch (error) {
      console.error("logsbot error:", error);
    }
  }
};
