// set bash title
process.stdout.write("\x1b]2;Goat Bot V2 - Simple JSON Cookie Login\x1b\x5c");

// প্রয়োজনীয় packages
const fs = require("fs-extra");
const path = require("path");
const login = require(`${process.cwd()}/fb-chat-api`);

const { writeFileSync, readFileSync, existsSync } = require("fs-extra");
const { callbackListenTime, storage5Message } = global.GoatBot;
const { log, getText, convertTime, randomString } = global.utils;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const { dirAccount } = global.client;

// টার্মিনালের লাইন পরিষ্কার করার ফাংশন (অন্য কাজে লাগতে পারে)
const clearLines = (n) => {
for (let i = 0; i < n; i++) {
const y = i === 0 ? null : -1;
process.stdout.moveCursor(0, y);
process.stdout.clearLine(1);
}
process.stdout.cursorTo(0);
process.stdout.write('');
};

function createLine(content) {
    const width = 50;
    if (!content) {
        return "─".repeat(width);
    }
    content = ` ${content.trim()} `;  
    const left = Math.floor((width - content.length) / 2);
    const line = "─".repeat(left > 0 ? left : 0);
    return line + content + line;
}
const character = createLine();
// ================== HELPER FUNCTIONS ================== //

function filterKeysAppState(appState) {
    return appState.filter(item => 
        ["c_user", "xs", "datr", "fr", "sb", "i_user"].includes(item.key)
    );
}

function responseUptimeSuccess(req, res) {
    res.type('json').send({
        status: "success",
        uptime: process.uptime(),
        unit: "seconds"
    });
}

function responseUptimeError(req, res) {
    res.status(500).type('json').send({
        status: "error",
        uptime: process.uptime(),
        statusAccountBot: global.statusAccountBot
    });
}

global.responseUptimeCurrent = responseUptimeSuccess;
global.responseUptimeSuccess = responseUptimeSuccess;
global.responseUptimeError = responseUptimeError;
global.statusAccountBot = 'good';

let dashBoardIsRunning = false;

function stopListening(keyListen) {
    keyListen = keyListen || Object.keys(callbackListenTime).pop();
    return new Promise((resolve) => {
        global.GoatBot.fcaApi?.stopListening?.(() => {
            if (callbackListenTime[keyListen]) {
                callbackListenTime[keyListen] = () => { };
            }
            resolve();
        }) || resolve();
    });
}

// ================== MAIN BOT FUNCTION ================== //

async function startBot() {
    console.log("========================================");
    console.log("🚀 Starting GoatBot V2...");
    console.log("========================================");

    // পুরোনো listener বন্ধ
    if (global.GoatBot.Listening) {
        await stopListening();
    }

    log.info("LOGIN", "Reading cookie from account.txt...");

    // ================== STEP 1: Cookie ফাইল check ================== //
    
    if (!existsSync(dirAccount)) {
        log.err("LOGIN", "account.txt file not found!");
        console.log("📝 Please create account.txt and paste your JSON cookie");
        process.exit();
    }

    const accountText = readFileSync(dirAccount, "utf8").trim();

    if (!accountText) {
        log.err("LOGIN", "account.txt is empty!");
        console.log("📝 Please paste your JSON cookie array in account.txt");
        process.exit();
    }

    // ================== STEP 2: JSON Parse ================== //
    
    let appState;

    try {
        appState = JSON.parse(accountText);
        log.info("LOGIN", "Cookie parsed successfully!");
    }
    catch (err) {
        log.err("LOGIN", "Invalid JSON format!");
        console.log("❌ Error:", err.message);
        console.log("📝 Please paste valid JSON array format");
        console.log("Example: [{\"key\":\"c_user\",\"value\":\"123\"}, ...]");
        process.exit();
    }

    // ================== STEP 3: Format check ================== //
    
    if (!Array.isArray(appState)) {
        log.err("LOGIN", "Cookie must be a JSON array!");
        console.log("📝 Format: [{...}, {...}, ...]");
        process.exit();
    }

    // "name" থাকলে "key" তে convert
    if (appState.some(item => item.name)) {
        appState = appState.map(item => {
            if (item.name) {
                item.key = item.name;
                delete item.name;
            }
            return item;
        });
        log.info("LOGIN", "Converted 'name' to 'key' format");
    }

    // দরকারি fields যোগ/normalize
    appState = appState
        .map(item => ({
            key: item.key,
            value: item.value,
            domain: item.domain || "facebook.com",
            path: item.path || "/",
            hostOnly: item.hostOnly !== undefined ? item.hostOnly : false,
            creation: item.creation || new Date().toISOString(),
            lastAccessed: new Date().toISOString()
        }))
        .filter(item => item.key && item.value);

    log.info("LOGIN", `Found ${appState.length} cookies`);

    // দরকারি Cookie filter
    const filteredAppState = filterKeysAppState(appState);

    if (filteredAppState.length === 0) {
        log.err("LOGIN", "No valid cookies found!");
        console.log("❌ Required cookies: c_user, xs, datr, fr, sb");
        console.log("📝 Please check your cookie data");
        process.exit();
    }

    log.info("LOGIN", `Using ${filteredAppState.length} essential cookies`);

    // ================== STEP 4: Cookie সেভ ================== //
    
    writeFileSync(dirAccount, JSON.stringify(filteredAppState, null, 2));
    log.info("LOGIN", "Cookie saved to account.txt");

    // ================== STEP 5: fb-chat-api Login ================== //
    
    log.info("LOGIN", "Connecting to Facebook...");

    // Global variables reset
    global.GoatBot.commands = new Map();
    global.GoatBot.eventCommands = new Map();
    global.GoatBot.aliases = new Map();
    global.GoatBot.onChat = [];
    global.GoatBot.onEvent = [];
    global.GoatBot.onReply = new Map();
    global.GoatBot.onReaction = new Map();

    login(
        { appState: filteredAppState },
        global.GoatBot.config.optionsFca,
        async function (error, api) {
            
            // ================== Login Error ================== //
            if (error) {
                log.err("LOGIN", "Login failed!");
                console.log("❌ Error:", error);
                console.log("📝 Please get fresh cookie from browser");
                process.exit();
            }

            // ================== Login Success! ================== //
            log.info("LOGIN", "Login successful!");

            global.GoatBot.fcaApi = api;
            global.GoatBot.botID = api.getCurrentUserID();
            global.botID = api.getCurrentUserID();

            console.log("========================================");
            console.log("📌 BOT INFO:");
            console.log(`   Bot ID: ${global.botID}`);
            console.log(`   Prefix: ${global.GoatBot.config.prefix}`);
            console.log(`   Language: ${global.GoatBot.config.language}`);
            console.log("========================================");

            // ================== Auto Refresh Cookie ================== //
            if (global.GoatBot.config.autoRefreshFbstate === true) {
                try {
                    const newAppState = filterKeysAppState(api.getAppState());
                    writeFileSync(dirAccount, JSON.stringify(newAppState, null, 2));
                    log.info("COOKIE", "Cookie refreshed successfully!");
                }
                catch (err) {
                    log.warn("COOKIE", "Cookie refresh failed:", err.message);
                }
            }

            // ================== Load Database ================== //
            log.info("DATABASE", "Loading...");
            const { 
                threadModel, userModel, dashBoardModel, globalModel, 
                threadsData, usersData, dashBoardData, globalData 
            } = await require(process.env.NODE_ENV === 'development' 
                ? "./loadData.dev.js" 
                : "./loadData.js")(api);
            log.info("DATABASE", "Loaded successfully!");

            // ================== Load Custom Scripts ================== //
            log.info("CUSTOM", "Loading custom scripts...");
            await require("../custom.js")({ 
                api, threadModel, userModel, dashBoardModel, globalModel, 
                threadsData, usersData, dashBoardData, globalData, getText 
            });
            log.info("CUSTOM", "Custom scripts loaded!");

            // ================== Load Commands & Events ================== //
            log.info("COMMANDS", "Loading commands & events...");
            await require(process.env.NODE_ENV === 'development' 
                ? "./loadScripts.dev.js" 
                : "./loadScripts.js")(
                api, threadModel, userModel, dashBoardModel, globalModel, 
                threadsData, usersData, dashBoardData, globalData
            );
            log.info("COMMANDS", "Commands & Events loaded!");

            // ================== Dashboard ================== //
            if (global.GoatBot.config.dashBoard?.enable === true && !dashBoardIsRunning) {
                log.info("DASHBOARD", "Starting...");
                try {
                    await require("../../dashboard/app.js")(api);
                    log.info("DASHBOARD", "Running successfully!");
                    dashBoardIsRunning = true;
                }
                catch (err) {
                    log.err("DASHBOARD", "Failed:", err.message);
                }
            }

            // ================== Message Listener ================== //
            const { restartListenMqtt } = global.GoatBot.config;
            let isSendNotiErrorMessage = false;

            async function callBackListen(error, event) {
                if (error) {
                    global.responseUptimeCurrent = responseUptimeError;
                    
                    if (error.error === "Not logged in" || 
                        error.error === "Not logged in." ||
                        error.error === "Connection refused: Server unavailable") {
                        
                        log.err("SESSION", "Session expired!");
                        global.statusAccountBot = 'can\'t login';
                        
                        if (global.GoatBot.config.autoRestartWhenListenMqttError) {
                            process.exit(2);
                        }
                    }
                    return;
                }

                global.responseUptimeCurrent = responseUptimeSuccess;
                global.statusAccountBot = 'good';

                // WhiteList check
                if (global.GoatBot.config.whiteListMode?.enable === true &&
                    !global.GoatBot.config.whiteListMode.whiteListIds.includes(event.senderID) &&
                    !global.GoatBot.config.adminBot.includes(event.senderID)) {
                    return;
                }

                if (global.GoatBot.config.whiteListModeThread?.enable === true &&
                    !global.GoatBot.config.whiteListModeThread.whiteListThreadIds.includes(event.threadID) &&
                    !global.GoatBot.config.adminBot.includes(event.senderID)) {
                    return;
                }

                // Duplicate message check
                if (event.messageID && event.type === "message") {
                    if (storage5Message.includes(event.messageID)) {
                        return;
                    }
                    storage5Message.push(event.messageID);
                    if (storage5Message.length > 5) {
                        storage5Message.shift();
                    }
                }

                // Event logging
                const configLog = global.GoatBot.config.logEvents;
                if (configLog?.disableAll === false && configLog?.[event.type] !== false) {
                    const senderName = await usersData.getName(event.senderID).catch(() => "Unknown");
                    const threadInfo = await threadsData.get(event.threadID).catch(() => null);
                    const threadName = threadInfo?.threadInfo?.threadName || "Unknown";

                    console.log(`📩 ${event.type} | ${senderName} | ${threadName}`);
                    if (event.body) {
                        console.log(`   ${event.body.substring(0, 100)}`);
                    }
                }

                // Handler
                const handlerAction = require("../handler/handlerAction.js")(
                    api, threadModel, userModel, dashBoardModel, globalModel, 
                    usersData, threadsData, dashBoardData, globalData
                );
                handlerAction(event);
            }

            function createCallBackListen(key) {
                key = randomString(10) + (key || Date.now());
                callbackListenTime[key] = callBackListen;
                return function (error, event) {
                    callbackListenTime[key](error, event);
                };
            }

            // ================== Start Listening ================== //
            await stopListening();
            global.GoatBot.Listening = api.listenMqtt(createCallBackListen());
            global.GoatBot.callBackListen = callBackListen;

            console.log("========================================");
            console.log("🎉 BOT IS NOW RUNNING!");
            console.log("📩 Listening for messages...");
            console.log("========================================");

            // ================== Uptime Server ================== //
            if (global.GoatBot.config.serverUptime?.enable === true && 
                !global.GoatBot.config.dashBoard?.enable && 
                !global.serverUptimeRunning) {
                
                const http = require('http');
                const express = require('express');
                const app = express();
                const server = http.createServer(app);
                const PORT = global.GoatBot.config.serverUptime.port || 3001;
                
                app.get('/', (req, res) => res.send('GoatBot is running!'));
                app.get('/uptime', global.responseUptimeCurrent);
                
                try {
                    await server.listen(PORT);
                    log.info("UPTIME", `Server: http://localhost:${PORT}`);
                    
                    if (global.GoatBot.config.serverUptime.socket?.enable === true) {
                        require('./socketIO.js')(server);
                    }
                    global.serverUptimeRunning = true;
                }
                catch (err) {
                    log.err("UPTIME", "Failed:", err.message);
                }
            }

            // ================== Auto Restart Listener ================== //
            if (restartListenMqtt?.enable === true) {
                if (restartListenMqtt.logNoti === true) {
                    log.info("AUTO-RESTART", `Every ${convertTime(restartListenMqtt.timeRestart, true)}`);
                }
                
                const restart = setInterval(async function () {
                    if (restartListenMqtt.enable === false) {
                        clearInterval(restart);
                        return;
                    }
                    try {
                        await stopListening();
                        await sleep(1000);
                        global.GoatBot.Listening = api.listenMqtt(createCallBackListen());
                        log.info("AUTO-RESTART", "Listener restarted!");
                    }
                    catch (e) {
                        log.err("AUTO-RESTART", "Failed:", e.message);
                    }
                }, restartListenMqtt.timeRestart);
                
                global.intervalRestartListenMqtt = restart;
            }

            require('../autoUptime.js');
        }
    );
}

// ================== START BOT ================== //
global.GoatBot.reLoginBot = startBot;
startBot();
