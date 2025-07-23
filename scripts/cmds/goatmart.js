const axios = require("axios");
const fs = require('fs');
const path = require('path');
const GoatMart = "https://goatmart.vercel.app";

module.exports = {
  config: {
    name: "goatmart",
    aliases: ["gm", "cmdstore3"],
    shortDescription: {
      en: "🌟 GoatMart - Your Command Marketplace"
    },
    longDescription: {
      en: "✨ Browse, search, upload, and manage your commands in the GoatMart marketplace with easy sharing cmds."
    },
    category: "cmdstore",
    version: "12.1",
    role: 0,
    author: "GoatMart",
    cooldowns: 0,
  },

  onStart: async ({ api, event, args, message }) => {
    const sendBeautifulMessage = (content) => {
      const header = "╭───『 𝗚𝗼𝗮𝘁𝗠𝗮𝗿𝘁 』───╮\n";
      const footer = "\n╰─────────────╯";
      return message.reply(header + content + footer);
    };

    try {
      if (!args[0]) {
        return sendBeautifulMessage(
          "\n" +
          `╭─❯ ${event.body} show <ID>\n├ 📦 Get command code\n╰ Example: code 1\n\n` +
          `╭─❯ ${event.body} page <number>\n├ 📄 Browse commands\n╰ Example: page 1\n\n` +
          `╭─❯ ${event.body} search <query>\n├ 🔍 Search commands\n╰ Example: search music\n\n` +
          `╭─❯ ${event.body} trending\n├ 🔥 View trending\n╰ Most popular commands\n\n` +
          `╭─❯ ${event.body} stats\n├ 📊 View statistics\n╰ Marketplace insights\n\n` +
          `╭─❯ ${event.body} like <ID>\n├ 💝 Like a command\n╰ Example: like 1\n\n` +
          `╭─❯ ${event.body} upload <name>\n├ ⬆️ Upload command\n╰ Example: upload goatmart\n\n` +
          "💫 𝗧𝗶𝗽: Use 'help goatmart' for details"
        );
      }

      const command = args[0].toLowerCase();

      switch (command) {
        case "show": {
          const itemID = parseInt(args[1]);
          if (isNaN(itemID)) return sendBeautifulMessage("\n⚠️ 𝗘𝗿𝗿𝗼𝗿: Please provide a valid item ID.");

          const response = await axios.get(`${GoatMart}/api/item/${itemID}`);
          const item = response.data;

          return sendBeautifulMessage(
            "\n" +
            `╭─❯ 👑 𝗡𝗮𝗺𝗲\n╰ ${item.itemName}\n\n` +
            `╭─❯ 🆔 𝗜𝗗\n╰ ${item.itemID}\n\n` +
            `╭─❯ ⚙️ 𝗧𝘆𝗽𝗲\n╰ ${item.type || 'Unknown'}\n\n` +
            `╭─❯ 👨‍💻 𝗔𝘂𝘁𝗵𝗼𝗿\n╰ ${item.authorName}\n\n` +
            `╭─❯ 🔗 𝗥𝗮𝘄 𝗟𝗶𝗻𝗸\n╰ ${item.rawLink}\n\n` +
            `╭─❯ 📅 𝗔𝗱𝗱𝗲𝗱\n╰ ${new Date(item.createdAt).toLocaleString()}\n\n` +
            `╭─❯ 👀 𝗩𝗶𝗲𝘄𝘀\n╰ ${item.views}\n\n` +
            `╭─❯ 💝 𝗟𝗶𝗸𝗲𝘀\n╰ ${item.likes}`
          );
        }

        case "page": {
          const page = parseInt(args[1]) || 1;
          const { data: { items, total } } = await axios.get(`${GoatMart}/api/items?page=${page}&limit=5`);
          const totalPages = Math.ceil(total / 5);

          if (page <= 0 || page > totalPages) {
            return sendBeautifulMessage("\n⚠️ 𝗘𝗿𝗿𝗼𝗿: Invalid page number.");
          }

          const itemsList = items.map((item, index) =>
            `╭─❯ ${index + 1}. 📦 ${item.itemName}\n` +
            `├ 🆔 𝗜𝗗: ${item.itemID}\n` +
            `├ ⚙️ 𝗧𝘆𝗽𝗲: ${item.type}\n` +
            `├ 📝 𝗗𝗲𝘀𝗰: ${item.description}\n` +
            `╰ 👨‍💻 𝗔𝘂𝘁𝗵𝗼𝗿: ${item.authorName}\n`
          ).join("\n");

          return sendBeautifulMessage(`\n📄 𝗣𝗮𝗴𝗲 ${page}/${totalPages}\n\n${itemsList}`);
        }

        case "search": {
          const query = args.slice(1).join(" ");
          if (!query) return sendBeautifulMessage("\n⚠️ Please provide a search query.");

          const { data } = await axios.get(`${GoatMart}/api/items?search=${encodeURIComponent(query)}`);
          const results = data.items;

          if (!results.length) return sendBeautifulMessage("\n❌ No matching commands found.");

          const searchList = results.slice(0, 5).map((item, index) =>
            `╭─❯ ${index + 1}. 📦 ${item.itemName}\n` +
            `├ 🆔 𝗜𝗗: ${item.itemID}\n` +
            `├ ⚙️ 𝗧𝘆𝗽𝗲: ${item.type}\n` +
            `╰ 👨‍💻 𝗔𝘂𝘁𝗵𝗼𝗿: ${item.authorName}\n`
          ).join("\n");

          return sendBeautifulMessage(`\n📝 Query: "${query}"\n\n${searchList}`);
        }

        case "trending": {
          const { data } = await axios.get(`${GoatMart}/api/trending`);
          const trendingList = data.slice(0, 5).map((item, index) =>
            `╭─❯ ${index + 1}. 🔥 ${item.itemName}\n` +
            `├ 💝 𝗟𝗶𝗸𝗲𝘀: ${item.likes}\n` +
            `╰ 👀 𝗩𝗶𝗲𝘄𝘀: ${item.views}\n`
          ).join("\n");

          return sendBeautifulMessage(`\n${trendingList}`);
        }

          case "stats": {
            const { data: stats } = await axios.get(`${GoatMart}/api/stats`);
            const { hosting, totalCommands, totalLikes, dailyActiveUsers, popularTags, topAuthors, topViewed } = stats;

            const uptimeStr = `${hosting?.uptime?.years}y ${hosting?.uptime?.months}m ${hosting?.uptime?.days}d ${hosting?.uptime?.hours}h ${hosting?.uptime?.minutes}m ${hosting?.uptime?.seconds}s`;

            const tagList = popularTags.map((tag, i) =>
              `#${i + 1}. ${tag._id || 'Unknown'} (${tag.count})`
            ).join('\n');

            const authorList = topAuthors.map((a, i) =>
              `#${i + 1}. ${a._id || 'Unknown'} (${a.count})`
            ).join('\n');

            const viewedList = topViewed.map((v, i) =>
              `#${i + 1}. ${v.itemName} (ID: ${v.itemID})\nViews: ${v.views}`
            ).join('\n\n');

            return sendBeautifulMessage(
              `\n╭─❯ 📦 𝗧𝗼𝘁𝗮𝗹 𝗖𝗼𝗺𝗺𝗮𝗻𝗱𝘀\n╰ ${totalCommands}\n\n` +
              `╭─❯ 💝 𝗧𝗼𝘁𝗮𝗹 𝗟𝗶𝗸𝗲𝘀\n╰ ${totalLikes}\n\n` +
              `╭─❯ 👥 𝗗𝗮𝗶𝗹𝘆 𝗨𝘀𝗲𝗿𝘀\n╰ ${dailyActiveUsers}\n\n` +
              `═══『 🌟 𝗧𝗼𝗽 𝗔𝘂𝘁𝗵𝗼𝗿𝘀 』═══\n${authorList}\n\n` +
              `═══『 🔥 𝗧𝗼𝗽 𝗩𝗶𝗲𝘄𝗲𝗱 』═══\n${viewedList}\n\n` +
              `═══『 🏷️ 𝗣𝗼𝗽𝘂𝗹𝗮𝗿 𝗧𝗮𝗴𝘀 』═══\n${tagList}\n\n` +
              `═══『 🌐 𝗛𝗼𝘀𝘁𝗶𝗻𝗴 𝗜𝗻𝗳𝗼 』═══\n\n` +
              `╭─❯ ⏰ 𝗨𝗽𝘁𝗶𝗺𝗲\n╰ ${uptimeStr}\n\n` +
              `╭─❯ 💻 𝗦𝘆𝘀𝘁𝗲𝗺\n` +
              `├ 🔧 ${hosting.system.platform} (${hosting.system.arch})\n` +
              `├ 📌 Node ${hosting.system.nodeVersion}\n` +
              `├ 🏷️ PID: ${hosting.system.pid}\n` +
              `╰ 🖥️ CPU Cores: ${hosting.system.cpuCores}`
            );
          }case "stats": {
  const { data: stats } = await axios.get(`${GoatMart}/api/stats`);
  const { hosting, totalCommands, totalLikes, dailyActiveUsers, popularTags, topAuthors, topViewed } = stats;

  const uptimeStr = `${hosting?.uptime?.years}y ${hosting?.uptime?.months}m ${hosting?.uptime?.days}d ${hosting?.uptime?.hours}h ${hosting?.uptime?.minutes}m ${hosting?.uptime?.seconds}s`;

  const tagList = popularTags.map((tag, i) =>
    `#${i + 1}. ${tag._id || 'Unknown'} (${tag.count})`
  ).join('\n');

  const authorList = topAuthors.map((a, i) =>
    `#${i + 1}. ${a._id || 'Unknown'} (${a.count})`
  ).join('\n');

  const viewedList = topViewed.map((v, i) =>
    `#${i + 1}. ${v.itemName} (ID: ${v.itemID})\nViews: ${v.views}`
  ).join('\n\n');

  return sendBeautifulMessage(
    `\n╭─❯ 📦 𝗧𝗼𝘁𝗮𝗹 𝗖𝗼𝗺𝗺𝗮𝗻𝗱𝘀\n╰ ${totalCommands}\n\n` +
    `╭─❯ 💝 𝗧𝗼𝘁𝗮𝗹 𝗟𝗶𝗸𝗲𝘀\n╰ ${totalLikes}\n\n` +
    `╭─❯ 👥 𝗗𝗮𝗶𝗹𝘆 𝗨𝘀𝗲𝗿𝘀\n╰ ${dailyActiveUsers}\n\n` +
    `═══『 🌟 𝗧𝗼𝗽 𝗔𝘂𝘁𝗵𝗼𝗿𝘀 』═══\n${authorList}\n\n` +
    `═══『 🔥 𝗧𝗼𝗽 𝗩𝗶𝗲𝘄𝗲𝗱 』═══\n${viewedList}\n\n` +
    `═══『 🏷️ 𝗣𝗼𝗽𝘂𝗹𝗮𝗿 𝗧𝗮𝗴𝘀 』═══\n${tagList}\n\n` +
    `═══『 🌐 𝗛𝗼𝘀𝘁𝗶𝗻𝗴 𝗜𝗻𝗳𝗼 』═══\n\n` +
    `╭─❯ ⏰ 𝗨𝗽𝘁𝗶𝗺𝗲\n╰ ${uptimeStr}\n\n` +
    `╭─❯ 💻 𝗦𝘆𝘀𝘁𝗲𝗺\n` +
    `├ 🔧 ${hosting.system.platform} (${hosting.system.arch})\n` +
    `├ 📌 Node ${hosting.system.nodeVersion}\n` +
    `├ 🏷️ PID: ${hosting.system.pid}`
  );
}

        case "like": {
          const likeItemId = parseInt(args[1]);
          if (isNaN(likeItemId)) return sendBeautifulMessage("\n⚠️ Please provide a valid item ID.");

          const { data } = await axios.post(`${GoatMart}/api/items/${likeItemId}/like`);
          if (data.success) {
            return sendBeautifulMessage(
              `\n╭─❯ ✨ Status\n╰ Successfully liked!\n\n╭─❯ 💝 Total Likes\n╰ ${data.likes}`
            );
          } else {
            return sendBeautifulMessage("\n❌ Error: Failed to like command.");
          }
        }

        case "upload": {
          const commandName = args[1];
          if (!commandName) return sendBeautifulMessage("\n⚠️ Error: Please provide a command name.");

          const commandPath = path.join(process.cwd(), 'scripts', 'cmds', `${commandName}.js`);
          if (!fs.existsSync(commandPath)) return sendBeautifulMessage(`\n❌ File '${commandName}.js' not found.`);

          try {
            const code = fs.readFileSync(commandPath, 'utf8');
            let commandFile;
            try {
              commandFile = require(commandPath);
            } catch (err) {
              return sendBeautifulMessage("\n❌ Error: Invalid command file format.");
            }

            const uploadData = {
              itemName: commandFile.config?.name || commandName,
              description: commandFile.config?.longDescription?.en || commandFile.config?.shortDescription?.en || "No description",
              type: "GoatBot",
              code,
              authorName: commandFile.config?.author || event.senderID || "Unknown"
            };

            const response = await axios.post(`${GoatMart}/v1/paste`, uploadData);

            if (response.data.success) {
              const { item, itemID, link } = response.data;
              return sendBeautifulMessage(
                "\n" +
                `╭─❯ ✅ 𝗦𝘁𝗮𝘁𝘂𝘀\n╰  Command uploaded successfully!\n\n` +
                `╭─❯ 👑 𝗡𝗮𝗺𝗲\n╰ ${uploadData.itemName}\n\n` +
                `╭─❯ 🆔 𝗜𝗗\n╰ ${itemID}\n\n` +
                `╭─❯ 👨‍💻 𝗔𝘂𝘁𝗵𝗼𝗿\n╰ ${uploadData.authorName}\n\n`  +
                `╭─❯ 👀 𝗣𝗿𝗲𝘃𝗶𝗲𝘄 𝗨𝗿𝗹\n╰ ${GoatMart}/view.html?id=${itemID}\n\n` +
                `╭─❯ 🔗 𝗥𝗮𝘄 𝗨𝗿𝗹\n╰ ${link}`
              );
            }

            return sendBeautifulMessage("\n❌ Error: Failed to upload the command.");
          } catch (error) {
            console.error("Upload error:", error);
            return sendBeautifulMessage("\n❌ Error: Failed to read or upload the command file.");
          }
        }

        default:
          return sendBeautifulMessage("\n⚠️ Invalid subcommand. Use `help goatmart` for options.");
      }

    } catch (err) {
      console.error("GoatMart Error:", err);
      return sendBeautifulMessage("\n❌ An unexpected error occurred.");
    }
  }
};
