const axios = require("axios");
const fs = require("fs-extra");

module.exports = {
    config: {
        name: "coupledp2",
        version: "2.0",
        author: "RUBISH",
        countDown: 5,
        role: 0,
        shortDescription: {
            en: "Random Couple dp"
        },
        longDescription: {
            en: "Random Couple dp"
        },
        category: "dp",
        guide: {
            en: "{pn}"
        }
    },

    onStart: async function ({ api, event, args }) {
        try {
            const response = await axios.get("https://rubish-apihub.onrender.com/rubish//cdp?&apikey=rubish69");
            const data = response.data;

            const maleImgResponse = await axios.get(data.images[0], { responseType: "arraybuffer" });
            fs.writeFileSync(__dirname + "/tmp/img1.png", Buffer.from(maleImgResponse.data, "utf-8"));
            const femaleImgResponse = await axios.get(data.images[1], { responseType: "arraybuffer" });
            fs.writeFileSync(__dirname + "/tmp/img2.png", Buffer.from(femaleImgResponse.data, "utf-8"));

            const msg = `
✅ | Here is your couple dp 

⦿ ID: ${data.serialNumber}`;
            const allImages = [
                fs.createReadStream(__dirname + "/tmp/img1.png"),
                fs.createReadStream(__dirname + "/tmp/img2.png")
            ];

            await api.sendMessage({
                body: msg,
                attachment: allImages
            }, event.threadID, event.messageID);
        } catch (error) {
            console.error(error);
        }
    }
};
