const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const MAX_SIZE = 25 * 1024 * 1024; // 25 MB in bytes

module.exports = {
  config: {
    name: "dl",
    version: "1.2",
    author: "Kawsar x ChatGPT",
    cooldowns: 5,
    description: { en: "Download FB/IG/TT video using yt-dlp with size and resolution info" },
    category: "media",
    guide: { en: "{pn} [video link]" }
  },

  onStart: async function ({ message, args }) {
    const url = args[0];
    if (!url || (!url.includes("facebook.com") && !url.includes("fb.watch") &&
                 !url.includes("instagram.com") && !url.includes("tiktok.com"))) {
      return message.reply("❌ Only Facebook, Instagram, or TikTok links are supported.");
    }

    const filename = `dl_${Date.now()}.mp4`;
    const filepath = path.join(__dirname, filename);

    // Best quality download command
    const cmdDownload = `yt-dlp -f best -o "${filepath}" "${url}"`;

    // Command to get best format info JSON
    const cmdFormatInfo = `yt-dlp -j -f best "${url}"`;

    message.reply("📥 Downloading your video in best quality...");

    exec(cmdDownload, async (error) => {
      if (error) {
        console.error("❌ yt-dlp error:", error);
        return message.reply("❌ Failed to download. Make sure the video is public and the link is correct.");
      }

      if (!fs.existsSync(filepath)) {
        return message.reply("⚠️ Downloaded file not found. Try again or use a different link.");
      }

      try {
        const stats = fs.statSync(filepath);
        const fileSizeInBytes = stats.size;

        // Get best format info (resolution, filesize)
        exec(cmdFormatInfo, (err2, stdout2) => {
          if (err2 || !stdout2) {
            fs.unlinkSync(filepath);
            return message.reply("⚠️ Could not fetch video info.");
          }

          let formatInfo;
          try {
            const json = JSON.parse(stdout2);
            formatInfo = json.format || {};
          } catch {
            fs.unlinkSync(filepath);
            return message.reply("⚠️ Failed to parse video info.");
          }

          const resolution = formatInfo.height ? `${formatInfo.height}p` : "Unknown resolution";
          const filesizeMB = (fileSizeInBytes / (1024 * 1024)).toFixed(2);

          if (fileSizeInBytes <= MAX_SIZE) {
            // Send video file with size and resolution info
            message.reply({
              body: `✅ Here's your video!\nResolution: ${resolution}\nSize: ${filesizeMB} MB`,
              attachment: fs.createReadStream(filepath)
            }, () => {
              fs.unlinkSync(filepath);
            });
          } else {
            // Send only download link with size and resolution info
            const downloadLinkCmd = `yt-dlp -f best -g "${url}"`;
            exec(downloadLinkCmd, (err3, stdout3) => {
              if (err3 || !stdout3) {
                fs.unlinkSync(filepath);
                return message.reply("⚠️ Video is too large and failed to get direct download link.");
              }
              const downloadLink = stdout3.trim();
              message.reply(`⚠️ Video is too large (${filesizeMB} MB, ${resolution}).\n\nYou can download it directly from here:\n${downloadLink}`);
              fs.unlinkSync(filepath);
            });
          }
        });
      } catch (fsError) {
        console.error("❌ File stat error:", fsError);
        if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
        return message.reply("⚠️ Unexpected error while processing the file.");
      }
    });
  }
};
