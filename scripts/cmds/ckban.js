module.exports = {
  config: {
    name: 'ckban',
    version: '1.0',
    author: 'Mah MUD彡',
    countDown: 15,
    usePrefix: false,
    role: 0,
    shortDescription: 'Check if bot is media banned',
    longDescription: 'Check if the bot is banned from sending media.',
    category: 'system',
    guide: {
      en: '{pn}: Check if the bot is media banned.'
    }
  },

  onStart: async function ({ message, api , event}) {
    const checkImageURL = "https://i.ibb.co/2ntpM69/image.jpg";
    const checkMessage = await message.reply("Checking media ban 🐤");

    try {
      const attachment = await global.utils.getStreamFromURL(checkImageURL);
      await api.sendMessage({
        body: "Media not banned ✅",
        attachment: attachment
      }, event.threadID, async (error, success) => {
        if (error) throw error;
        await api.editMessage("✅ The bot's media is not banned.", checkMessage.messageID);
      }, event.messageID);
    } catch (error) {
      await api.editMessage("❌ The bot's media has been banned.", checkMessage.messageID);
    }
  }
};