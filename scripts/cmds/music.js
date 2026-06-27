const axios = require("axios");
const fs = require('fs');

const baseApiUrl = async () => {
        const base = await axios.get(
                `https://raw.githubusercontent.com/Mostakim0978/D1PT0/refs/heads/main/baseApiUrl.json`
        );
        return base.data.api;
};

module.exports = {
        config: {
                name: "music",
                version: "1.1.5",
                author: "kawsar",
                countDown: 5,
                role: 0,
                description: {
                        en: "Download video, audio, and info from YouTube"
                },
                category: "song",
                guide: {
                        en: "  {pn} -v <link or keyword>: Download video\n"
                           + "{pn} -a <link or keyword>: Download audio\n"
                           + "{pn} -i <link or keyword>: Show info"
                }
        },

        onStart: async ({ api, args, event, commandName }) => {
                const action = args[0]?.toLowerCase();
                const checkurl = /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))((\w|-){11})(?:\S+)?$/;
                const urlYtb = checkurl.test(args[1]);
                let videoID;

                // ✅ Direct URL case (as before)
                if (urlYtb) {
                        try {
                                const match = args[1].match(checkurl);
                                videoID = match ? match[1] : null;
                                const format = action === '-v' ? 'mp4' : 'mp3';
                                const path = `ytb_${format}_${videoID}.${format}`;
                                const { data: { title, downloadLink, quality } } = await axios.get(`${await baseApiUrl()}/ytDl3?link=${videoID}&format=${format}&quality=3`);
                                await api.sendMessage({
                                        body: `🎬 Title: ${title}\n📥 Quality: ${quality}`,
                                        attachment: await dipto(downloadLink, path)
                                }, event.threadID, () => fs.unlinkSync(path), event.messageID);
                        } catch (e) {
                                console.error(e);
                                return api.sendMessage('❌ Failed to download the video/audio. Please try again later.', event.threadID, event.messageID);
                        }
                        return;
                }

                // ✅ Keyword-based search → directly download first result
                args.shift();
                const keyWord = args.join(" ");
                try {
                        const result = (await axios.get(`${await baseApiUrl()}/ytFullSearch?songName=${keyWord}`)).data;
                        if (!result || result.length === 0)
                                return api.sendMessage("⭕ No results found for: " + keyWord, event.threadID, event.messageID);

                        const selected = result[0]; // first result only
                        videoID = selected.id;
                        const format = action === '-v' ? 'mp4' : 'mp3';
                        const path = `ytb_${format}_${videoID}.${format}`;
                        const { data: { title, downloadLink, quality } } = await axios.get(`${await baseApiUrl()}/ytDl3?link=${videoID}&format=${format}&quality=3`);
                        await api.sendMessage({
                                body: `🎬 Title: ${title}\n📥 Quality: ${quality}`,
                                attachment: await dipto(downloadLink, path)
                        }, event.threadID, () => fs.unlinkSync(path), event.messageID);
                } catch (e) {
                        console.error(e);
                        return api.sendMessage('❌ Failed to search/download. Try again.', event.threadID, event.messageID);
                }
        },

        onReply: async ({ event, api, Reply }) => {
                // Keep this part as-is for future feature support (like info command)
        }
};

async function dipto(url, pathName) {
        try {
                const response = (await axios.get(url, {
                        responseType: "arraybuffer"
                })).data;

                fs.writeFileSync(pathName, Buffer.from(response));
                return fs.createReadStream(pathName);
        } catch (err) {
                throw err;
        }
}

async function diptoSt(url, pathName) {
        try {
                const response = await axios.get(url, {
                        responseType: "stream"
                });
                response.data.path = pathName;
                return response.data;
        } catch (err) {
                throw err;
        }
}
