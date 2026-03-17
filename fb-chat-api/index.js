"use strict";

var utils = require("./utils");
var cheerio = require("cheerio");

const Boolean_Option = ['online', 'selfListen', 'listenEvents', 'updatePresence', 'forceLogin', 'autoMarkDelivery', 'autoMarkRead', 'listenTyping', 'autoReconnect', 'emitReady'];
global.ditconmemay = false;
var checkVerified = null;

function setOptions(globalOptions, options) {
    Object.keys(options).map(function (key) {
        switch (Boolean_Option.includes(key)) {
            case true: {
                globalOptions[key] = Boolean(options[key]);
                break;
            }
            case false: {
                switch (key) {
                    case 'pauseLog':
                    case 'logLevel':
                    case 'logRecordSize':
                        // npmlog রিমুভ করা হয়েছে, তাই এগুলো এখন আর কোনো কাজ করবে না। 
                        // তবে পুরনো কোড যেন ক্র্যাশ না করে তাই এগুলো ইগনোর করা হলো।
                        globalOptions[key] = options[key];
                        break;
                    case 'pageID': {
                        globalOptions.pageID = options.pageID.toString();
                        break;
                    }
                    case 'userAgent': {
                        globalOptions.userAgent = (options.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36');
                        break;
                    }
                    case 'proxy': {
                        if (typeof options.proxy != "string") {
                            delete globalOptions.proxy;
                            utils.setProxy();
                        } else {
                            globalOptions.proxy = options.proxy;
                            utils.setProxy(globalOptions.proxy);
                        }
                        break;
                    }
                    default: {
                        console.warn("[WARN setOptions]: Unrecognized option given to setOptions: " + key);
                        break;
                    }
                }
                break;
            }
        }
    });
}

function buildAPI(globalOptions, html, jar) {
    let fb_dtsg = null;
    let irisSeqID = null;

    function extractFromHTML() {
        try {
            const $ = cheerio.load(html);
            $('script').each((i, script) => {
                if (!fb_dtsg) {
                    const scriptText = $(script).html() || '';
                    const patterns = [
    /,{"token":"([^"]+)"}]/,
    /,{"token":"([^"]+)"/,
    /"token":"([^"]+)"/,
    /{\"token\":\"([^\"]+)\"/,
    /,{"token":"([^"]+)"},\d+]/,
    /"async_get_token":"([^"]+)"/,
    /"dtsg":{"token":"([^"]+)"/,
    /DTSGInitialData[^>]+>([^<]+)/
];
                    for (const pattern of patterns) {
                        const match = scriptText.match(pattern);
                        if (match && match[1]) {
                            try {
                                const possibleJson = match[1].replace(/\"/g, '"');
                                const parsed = JSON.parse(possibleJson);
                                fb_dtsg = parsed.token || parsed;
                            } catch {
                                fb_dtsg = match[1];
                            }
                            if (fb_dtsg) break;
                        }
                    }
                }
            });
            if (!fb_dtsg) {
                const dtsgInput = $('input[name="fb_dtsg"]').val();
                if (dtsgInput) fb_dtsg = dtsgInput;
            }
            const seqMatches = html.match(/irisSeqID":"([^"]+)"/);
            if (seqMatches && seqMatches[1]) {
                irisSeqID = seqMatches[1];
            }
            try {
                const jsonMatches = html.match(/{"dtsg":({[^}]+})/);
                if (jsonMatches && jsonMatches[1]) {
                    const dtsgData = JSON.parse(jsonMatches[1]);
                    if (dtsgData.token) fb_dtsg = dtsgData.token;
                }
            } catch { }
            if (fb_dtsg) {
                console.log("[INFO]: Đã tìm thấy fb_dtsg");
            }
        } catch (e) {
            console.error("[ERROR]: Lỗi khi tìm fb_dtsg:", e.message);
        }
    }
    extractFromHTML();

    var userID;
    var cookies = jar.getCookies("https://www.facebook.com");
    var userCookie = cookies.find(cookie => cookie.cookieString().startsWith("c_user="));
    var tiktikCookie = cookies.find(cookie => cookie.cookieString().startsWith("i_user="));
    
    if (!userCookie && !tiktikCookie) {
        console.error('[ERROR login]: Không tìm thấy cookie cho người dùng, vui lòng kiểm tra lại appstate!');
        return null;
    }
    if (html.includes("/checkpoint/block/?next")) {
        console.error('[ERROR login]: Appstate die, vui lòng thay cái mới!');
        return null;
    }
    userID = (tiktikCookie || userCookie).cookieString().split("=")[1];

    try { clearInterval(checkVerified); } catch (_) { }
    const clientID = (Math.random() * 2147483648 | 0).toString(16);
    let mqttEndpoint = `wss://edge-chat.facebook.com/chat?region=prn&sid=${userID}`;
    let region = "PRN";

    try {
        const endpointMatch = html.match(/"endpoint":"([^"]+)"/);
        if (endpointMatch && endpointMatch.input.includes("601051028565049")) {
            console.log(`[INFO]: lỗi login vì dính tài khoản tự động`);
            ditconmemay = true;
        }
        if (endpointMatch) {
            mqttEndpoint = endpointMatch[1].replace(/\\\//g, '/');
            const url = new URL(mqttEndpoint);
            region = url.searchParams.get('region')?.toUpperCase() || "PRN";
        }
    } catch (e) {
        console.log('[INFO]: Using default MQTT endpoint');
    }
    
    console.log('[INFO login]: Fix fca by DongDev x Satoru (Cleaned & Axios Ready)');

    var ctx = {
        userID: userID,
        jar: jar,
        clientID: clientID,
        globalOptions: globalOptions,
        loggedIn: true,
        access_token: 'NONE',
        clientMutationId: 0,
        mqttClient: undefined,
        lastSeqId: irisSeqID,
        syncToken: undefined,
        mqttEndpoint: mqttEndpoint,
        region: region,
        firstListen: true,
        fb_dtsg: fb_dtsg,
        req_ID: 0,
        callback_Task: {},
        wsReqNumber: 0,
        wsTaskNumber: 0,
        reqCallbacks: {}
    };
    
    var api = {
        setOptions: setOptions.bind(null, globalOptions),
        getAppState: () => utils.getAppState(jar)
    };
    var defaultFuncs = utils.makeDefaults(html, userID, ctx);

    api.postFormData = function (url, body) {
        return defaultFuncs.postFormData(url, ctx.jar, body);
    };

    api.getFreshDtsg = async function () {
        try {
            const res = await defaultFuncs.get('https://www.facebook.com/', jar, null, globalOptions);
            const htmlData = res.data || res.body; // Support both axios and request
            const $ = cheerio.load(htmlData);
            let newDtsg;
            const patterns = [
                /"DTSGInitialData",\[,{"token":"([^"]+)"}]/,
                /"DTSGInitData",\[,{"token":"([^"]+)"/,
                /"token":"([^"]+)"/,
                /name="fb_dtsg" value="([^"]+)"/
            ];

            $('script').each((i, script) => {
                if (!newDtsg) {
                    const scriptText = $(script).html() || '';
                    for (const pattern of patterns) {
                        const match = scriptText.match(pattern);
                        if (match && match[1]) {
                            newDtsg = match[1];
                            break;
                        }
                    }
                }
            });

            if (!newDtsg) {
                newDtsg = $('input[name="fb_dtsg"]').val();
            }

            return newDtsg;
        } catch (e) {
            console.error("[ERROR]: Error getting fresh dtsg:", e.message);
            return null;
        }
    };

    require('fs').readdirSync(__dirname + '/src/').filter(v => v.endsWith('.js')).forEach(v => { 
        api[v.replace('.js', '')] = require(`./src/${v}`)(utils.makeDefaults(html, userID, ctx), api, ctx); 
    });
    
    api.listen = api.listenMqtt;
    return { ctx, defaultFuncs, api };
}

async function loginHelper(appState, globalOptions, callback) {
    const jar = utils.getJar();

    if (typeof appState === 'string') {
        try {
            appState = JSON.parse(appState);
        } catch (e) {
            return callback(new Error("Failed to parse appState. Kiểm tra lại appstate!"));
        }
    }

    try {
        appState.forEach(c => {
            const str = `${c.key}=${c.value}; expires=${c.expires}; domain=${c.domain}; path=${c.path};`;
            jar.setCookie(str, "http://" + c.domain);
        });

        // Step 1: Request Home Page
        let res = await utils.get('https://www.facebook.com/', jar, null, globalOptions, { noRef: true });
        utils.saveCookies(jar)(res);

        let html = res.data || res.body; // Support both axios and request

        // Step 2: Handle Redirect if any
        const reg = /<meta http-equiv="refresh" content="0;url=([^"]+)[^>]+>/;
        let redirect = reg.exec(html);
        if (redirect && redirect[1]) {
            res = await utils.get(redirect[1], jar, null, globalOptions);
            utils.saveCookies(jar)(res);
            html = res.data || res.body;
        }

        // Step 3: Check Mobile Agent
        const mobileAgentRegex = /MPageLoadClientMetrics/gs;
        if (!mobileAgentRegex.test(html)) {
            globalOptions.userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";
            res = await utils.get('https://www.facebook.com/', jar, null, globalOptions, { noRef: true });
            utils.saveCookies(jar)(res);
            html = res.data || res.body;
            
            // Recheck redirect
            redirect = reg.exec(html);
            if (redirect && redirect[1]) {
                res = await utils.get(redirect[1], jar, null, globalOptions);
                utils.saveCookies(jar)(res);
                html = res.data || res.body;
            }
        }

        // Step 4: Build API
        const Obj = buildAPI(globalOptions, html, jar);
        if (!Obj) return callback(new Error("Login failed. Check logs."));
        
        const { api } = Obj;

        // Step 5: Handle Page ID if exists
        if (globalOptions.pageID) {
            let resData = await utils.get(`https://www.facebook.com/${globalOptions.pageID}/messages/?section=messages&subsection=inbox`, jar, null, globalOptions);
            let pageHtml = resData.data || resData.body;
            let url = utils.getFrom(pageHtml, 'window.location.replace("https:\\/\\/www.facebook.com\\', '");').split('\\').join('');
            url = url.substring(0, url.length - 1);
            await utils.get('https://www.facebook.com' + url, jar, null, globalOptions);
        }

        console.log('[INFO login]: Đăng nhập thành công bằng AppState (Logged in via Cookies)');
        callback(null, api);

    } catch (e) {
        console.error('[ERROR login Helper]:', e.message);
        callback(e);
    }
}

function login(loginData, options, callback) {
    if (utils.getType(options) === 'Function' || utils.getType(options) === 'AsyncFunction') {
        callback = options;
        options = {};
    }

    var globalOptions = {
        selfListen: false,
        listenEvents: true,
        listenTyping: false,
        updatePresence: false,
        forceLogin: false,
        autoMarkDelivery: false,
        autoMarkRead: false,
        autoReconnect: true,
        logRecordSize: 100,
        online: false,
        emitReady: false,
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
    };

    var prCallback = null;
    if (utils.getType(callback) !== "Function" && utils.getType(callback) !== "AsyncFunction") {
        var rejectFunc = null;
        var resolveFunc = null;
        var returnPromise = new Promise(function (resolve, reject) {
            resolveFunc = resolve;
            rejectFunc = reject;
        });
        prCallback = function (error, api) {
            if (error) return rejectFunc(error);
            return resolveFunc(api);
        };
        callback = prCallback;
    }

    if (!loginData.appState) {
        console.error("[ERROR login]: Vui lòng cung cấp appState (Cookies) để đăng nhập!");
        callback(new Error("appState is required."));
        return returnPromise || null;
    }

    setOptions(globalOptions, options);
    loginHelper(loginData.appState, globalOptions, callback);

    return returnPromise;
}

module.exports = login;
