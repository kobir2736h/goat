const fs = require("fs-extra");

module.exports = {
  config: {
    name: "goibot",
    version: "1.0",
    author: "Samir",
    countDown: 5,
    role: 0,
    shortDescription: "no-prefix",
    longDescription: "Bot Will Reply You In English/Bangla Language",
    category: "no prefix",
    guide: {
      en: "{p}{n}",
    },
  },

  onStart: async function () { },

  onChat: async function ({ api, event }) {
    const { threadID, messageID, senderID, body } = event;

    if (!body) return;

    // ✅ Smart trigger check
    const lowerBody = body.toLowerCase();
    const triggerWords = ["bot", "বট"];
    const triggered = triggerWords.some(word => lowerBody.startsWith(word));
    if (!triggered) return;

    // ✅ Random message selection
    const Messages = [
"This person is unavailable on Messenger.",
"জমি কিনতে আগ্রহী...😐",
  "তুমি যদি নিজেকে ঘুষি মেরে ব্যথা পাও,,,, তাহলে কি তুমি শক্তিশালী নাকি দুর্বল....??",
  "পেট এ চাপ দিয়েই ছাতা বন্ধ করা লাগে.....!!",
  "দেখ বিল্লু,,এইটা আমার বড় বিলাই🙄",
  "বাবাগো.......",
  "কেন্দে দিয়েছি....🙈",
  "বাড়িতে ফিরেই সবার প্রথম প্রশ্ন...মা কোথায়?💝",
  "সাপুট দিলে সাপুট পাবেন....",
  "মেয়ে খাওয়ার মত ওয়েদার,,,,,🤤",
  "আর যাবনা বেগুন তুলিতে,,,,,ও ললিতে.....",
  "বৃষ্টির দিনে রিকশা ভাড়া শুনলে মনে,, হয় বিয়ের গেট ধরছে.....☠️☠️",
  "মহিলা কামড়ানো হয়....☹️",
  "দোয়া অসম্ভব কে সম্ভব করতে পারে....।।",
  "নারী কত সুন্দর অভিনয় করে রে....🙈🙈",
  "পুরুষ কত সুন্দর অভিনয় করে রে....🙈🙈",
  "জীবনটা শেখ হাসিনার মতো হয়ে গেছে,,,, যত কিছুই করি নাম নাই",
  "Babu, babu ammu basay nei",
  "rag kore na pookie",
  "valo ekta dalal suggest koren to",
  "shala abal",
  "Biye korbi 😐",
  "arash maras naki love maras.?",
  "mamar bari giyechilam 🙂",
  "Abar arekbar bot bol 🙄",
  "Babu amar dimag gorom 😐",
  "Ami mastan hote cai  🙈",
  "Tor ki kaj nai 🙂",
  "Amar bhalo lage na 🐸",
  "Chup kore kichukhon thak na 🤡",
  "Bot bolley kichu ekta kine dite hbe",
  "🤔",
  "Systemmmmmmm 😴",
  "Moye moye moye moye🙆🏻‍♀🙆🏻‍♀",
  "পুটকি সবাই চুলকায় দোষ পড়ে ফুচকা ওয়ালার..।😑",
  "Tum to dokebaz ho",
  "you just looking like a wow😶",
  "keya be",
  "Kya hua bol 😏",
  "Bot Na Bol Oye Gussa aata hai 🙆‍♂️",
  "Han bolo kya kaam hai🤨",
  "Faltu time nhi hai🤪",
  "Itna bot bot mt kr😝",
  "Bolo sona 💋🙂",
  "Are chutiya jaldi bol🤨",
  "Dont call me penchow🙂",
  "Chup rah be 🙈",
  "Kyaa ho gyaa chhpri 🙂",
  "Are bhai nikal tu🙂",
  "Garmi me preshan mt kr plz 🙂",
  "Thodi der so jao yrr 🙂",
  "Babu dur raha kro plz 🙊",
  "Are ja yar naha dho le",
  "Chup kar be chumtiya 🙈",
  "Jab dekho B0T B0T B0T😒😒",
  "Arry Bas Kar🤣😛",
  "so elegent, so beautiful , just looking like a wow🤭",
  "Tum wahi ho na ,jisko.me.nahi janti 🙂",
  "Ye I love you kya hota hai",
  "Sunai deta hai mujhe behri nahi hu me 😒",
  "Me ni To Kon Be",
  "Saaaaaaat karurrr ",
  "Naach meri Bulbul tujhe pesa milega",
  "me idhar se hu aap kidhar se ho",
  "bado badi bado badi",
  "Khelega Free Fire🥴",
  "Hallo bai tu darr raha hai kya",
  "janu bula raha h mujhe",
  "I cant live without you babu😘",
  "haa meri jaan",
  "Agye Phirse Bot Bot Krne🙄",
  "konse color ki jacket pehne ho umm btao na😚",
  "dhann khachh booyaah",
  "I love cooking, So i cooked my Life"
    ];

    const rand = Messages[Math.floor(Math.random() * Messages.length)];

    // ✅ 2 second delay before sending
    setTimeout(() => {
      api.sendMessage({ body: rand }, threadID, messageID);
    }, 2000); // 2000 milliseconds = 2 seconds
  }
};
