const { loadImage, createCanvas } = require("canvas");
const axios = require("axios");
const fs = require("fs-extra");

module.exports = {
  config: {
    name: "crush",
    author: "Aryan Chauhan",
    role: 0,
    shortDescription: "Get Crush Pair from Mentions",
    longDescription: "Mention a user to get a romantic crush pair image with them.",
    category: "media",
    guide: "{pn} @mention",
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID, senderID, mentions } = event;
    const mentionIDs = Object.keys(mentions);

    if (mentionIDs.length === 0) {
      return api.sendMessage("⚠️ Please mention someone to create a crush pair!", threadID, messageID);
    }

    const id1 = senderID;
    const id2 = mentionIDs[0];

    const cachePath = __dirname + "/cache";
    const pathImg = `${cachePath}/crush_bg.png`;
    const pathAvt1 = `${cachePath}/crush_avt1.png`;
    const pathAvt2 = `${cachePath}/crush_avt2.png`;

    try {
      const bgUrl = "http://goatbiin.onrender.com/gvuDwSd_W.jpg";
      if (!fs.existsSync(pathImg)) {
        const bgBuffer = (await axios.get(bgUrl, { responseType: "arraybuffer" })).data;
        fs.writeFileSync(pathImg, bgBuffer);
      }

      const [avt1Buffer, avt2Buffer] = await Promise.all([
        axios.get(`https://graph.facebook.com/${id1}/picture?width=512&height=512&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" }),
        axios.get(`https://graph.facebook.com/${id2}/picture?width=512&height=512&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" }),
      ]);

      fs.writeFileSync(pathAvt1, avt1Buffer.data);
      fs.writeFileSync(pathAvt2, avt2Buffer.data);

      const bg = await loadImage(pathImg);
      const avt1 = await loadImage(pathAvt1);
      const avt2 = await loadImage(pathAvt2);
      const canvas = createCanvas(bg.width, bg.height);
      const ctx = canvas.getContext("2d");

      ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

      const drawCircularImage = (ctx, image, x, y, size) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(image, x, y, size, size);
        ctx.restore();
      };

      drawCircularImage(ctx, avt1, 93, 111, 191);
      drawCircularImage(ctx, avt2, 434, 107, 190); 

      const finalBuffer = canvas.toBuffer("image/png");
      fs.writeFileSync(pathImg, finalBuffer);

      fs.removeSync(pathAvt1);
      fs.removeSync(pathAvt2);

      const userInfo = await api.getUserInfo([id1, id2]);
      const name1 = userInfo[id1]?.name || "User";
      const name2 = userInfo[id2]?.name || "Crush";

      return api.sendMessage({
        body: `✧•❁𝐂𝐫𝐮𝐬𝐡❁•✧\n\n╔═══❖••° °••❖═══╗\n   𝐒𝐮𝐜𝐜𝐞𝐬𝐬𝐟𝐮𝐥 𝐏𝐚𝐢𝐫𝐢𝐧𝐠\n╚═══❖••° °••❖═══╝\n\n❤️ ${name1} × ${name2}\n💌 You two look cute together!`,
        attachment: fs.createReadStream(pathImg),
        mentions: [{ tag: name2, id: id2 }]
      }, threadID, () => fs.unlinkSync(pathImg), messageID);

    } catch (err) {
      console.error(err);
      return api.sendMessage(`❌ Error: ${err.message}`, threadID, messageID);
    }
  }
};