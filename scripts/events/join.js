const { getTime, drive } = global.utils; if (!global.temp.welcomeEvent) global.temp.welcomeEvent = {};

module.exports = { config: { name: "welcome", version: "1.7", author: "NTKhang", category: "events" },

langs: {
            en: {
                    welcomeMessage: "{inviter} thanks\n\nnow i am a bot,,,,,my prefix: {prefix}",
                    multiple1: "you",
                    multiple2: "you guys",
                    defaultWelcomeMessage: `✅ ||⇨ 𝐉𝐎𝐈𝐍 𝐀𝐋𝐄𝐑𝐓 ⇦|| ✅\n\n||⇨ 𝐍𝐚𝐦𝐞: {userNameTag}\n||⇨ 𝐓𝐢𝐦𝐞: {time}`
            }
    },

    onStart: async ({ threadsData, message, event, api, getLang }) => {
            if (event.logMessageType == "log:subscribe") {
                    const { threadID } = event;
                    const { nickNameBot } = global.GoatBot.config;
                    const prefix = global.utils.getPrefix(threadID);
                    const dataAddedParticipants = event.logMessageData.addedParticipants;
                    const hours = getTime("HH");
                    const mins = getTime("mm");
                    const ampm = hours >= 12 ? '𝐏𝐌' : '𝐀𝐌';
                    const time = `${((+hours % 12) || 12)}:${mins} ${ampm}`;

                    if (dataAddedParticipants.some((item) => item.userFbId == api.getCurrentUserID())) {
                            if (nickNameBot)
                                    api.changeNickname(nickNameBot, threadID, api.getCurrentUserID());

                            const inviterID = event.senderID;
                            const inviterName = await api.getUserName(inviterID);

                            return message.send({
                                    body: getLang("welcomeMessage")
                                            .replace("{inviter}", inviterName)
                                            .replace("{prefix}", prefix),
                                    mentions: [{ tag: inviterName, id: inviterID }]
                            });
                    }

                    if (!global.temp.welcomeEvent[threadID])
                            global.temp.welcomeEvent[threadID] = {
                                    joinTimeout: null,
                                    dataAddedParticipants: []
                            };

                    global.temp.welcomeEvent[threadID].dataAddedParticipants.push(...dataAddedParticipants);
                    clearTimeout(global.temp.welcomeEvent[threadID].joinTimeout);

                    global.temp.welcomeEvent[threadID].joinTimeout = setTimeout(async function () {
                            const threadData = await threadsData.get(threadID);
                            if (threadData.settings.sendWelcomeMessage === false) return;

                            const dataAddedParticipants = global.temp.welcomeEvent[threadID].dataAddedParticipants;
                            const dataBanned = threadData.data.banned_ban || [];
                            const threadName = threadData.threadName;

                            const userName = [], mentions = [];
                            let multiple = false;

                            if (dataAddedParticipants.length > 1)
                                    multiple = true;

                            for (const user of dataAddedParticipants) {
                                    if (dataBanned.some(item => item.id == user.userFbId)) continue;

                                    userName.push(user.fullName);
                                    mentions.push({ tag: user.fullName, id: user.userFbId });
                            }

                            if (userName.length == 0) return;

                            const welcomeMessageTemplate = threadData.data.welcomeMessage || getLang("defaultWelcomeMessage");

                            let welcomeMessage = welcomeMessageTemplate
                                    .replace(/\{userName\}/g, userName.join(", "))
                                    .replace(/\{userNameTag\}/g, userName.map(u => `@${u}`).join(", "))
                                    .replace(/\{boxName\}|\{threadName\}/g, threadName)
                                    .replace(/\{multiple\}/g, multiple ? getLang("multiple2") : getLang("multiple1"))
                                    .replace(/\{time\}/g, time);

                            const form = {
                                    body: welcomeMessage,
                                    mentions
                            };

                            if (threadData.data.welcomeAttachment) {
                                    const files = threadData.data.welcomeAttachment;
                                    const attachments = files.reduce((acc, file) => {
                                            acc.push(drive.getFile(file, "stream"));
                                            return acc;
                                    }, []);

                                    form.attachment = (await Promise.allSettled(attachments))
                                            .filter(({ status }) => status === "fulfilled")
                                            .map(({ value }) => value);
                            }

                            message.send(form);
                            delete global.temp.welcomeEvent[threadID];
                    }, 1500);
            }
    }

};

