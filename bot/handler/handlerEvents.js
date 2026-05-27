const fs = require("fs-extra");

const nullAndUndefined = [undefined, null];

function getType(obj) {
	return Object.prototype.toString.call(obj).slice(8, -1);
}

function getRole(threadData, senderID) {
	const adminBot = global.GoatBot.config.adminBot || [];
	if (!senderID) return 0;
	const adminBox = threadData ? threadData.adminIDs || [] : [];
	return adminBot.includes(senderID) ? 2 : adminBox.includes(senderID) ? 1 : 0;
}

function getRoleConfig(utils, command, isGroup, threadData, commandName) {
	let roleConfig;
	if (utils.isNumber(command.config.role)) {
		roleConfig = { onStart: command.config.role };
	} else if (typeof command.config.role == "object" && !Array.isArray(command.config.role)) {
		if (!command.config.role.onStart) command.config.role.onStart = 0;
		roleConfig = command.config.role;
	} else {
		roleConfig = { onStart: 0 };
	}
	if (isGroup)
		roleConfig.onStart = threadData.data.setRole?.[commandName] ?? roleConfig.onStart;

	for (const key of ["onChat", "onStart", "onReaction", "onReply"]) {
		if (roleConfig[key] == undefined) roleConfig[key] = roleConfig.onStart;
	}
	return roleConfig;
}

function isBannedOrOnlyAdmin(userData, threadData, senderID, threadID, isGroup, commandName, message) {
	const config = global.GoatBot.config;
	const { adminBot, hideNotiMessage } = config;

	// Check if user banned
	if (userData.banned?.status == true) {
		const { reason, date } = userData.banned;
		if (hideNotiMessage.userBanned == false)
			message.reply(`You have been banned from using the bot.\nReason: ${reason}\nDate: ${date}\nUser ID: ${senderID}`);
		return true;
	}

	// Check if only admin bot
	if (config.adminOnly.enable == true && !adminBot.includes(senderID) && !config.adminOnly.ignoreCommand.includes(commandName)) {
		if (hideNotiMessage.adminOnly == false)
			message.reply("This command is only for bot admins.");
		return true;
	}

	if (isGroup == true) {
		// Check only admin box
		if (threadData.data.onlyAdminBox === true && !threadData.adminIDs.includes(senderID) && !(threadData.data.ignoreCommanToOnlyAdminBox || []).includes(commandName)) {
			if (!threadData.data.hideNotiMessageOnlyAdminBox)
				message.reply("This command can only be used by group admins.");
			return true;
		}

		// Check if thread banned
		if (threadData.banned?.status == true) {
			const { reason, date } = threadData.banned;
			if (hideNotiMessage.threadBanned == false)
				message.reply(`This group has been banned from using the bot.\nReason: ${reason}\nDate: ${date}`);
			return true;
		}
	}
	return false;
}

function createGetText2(langCode, pathCustomLang, prefix, command) {
	const commandName = command.config.name;
	let customLang = {};
	let getText2 = () => { };

	if (fs.existsSync(pathCustomLang))
		customLang = require(pathCustomLang)[commandName]?.text || {};

	if (command.langs || customLang) {
		getText2 = function (key, ...args) {
			let lang = command.langs?.[langCode]?.[key] || customLang[key] || "";
			lang = lang.replace(/\{(?:p|prefix)\}/g, prefix).replace(/\{(?:n|name)\}/g, commandName).replace(/\{pn\}/g, `${prefix}${commandName}`);
			for (let i = args.length - 1; i >= 0; i--)
				lang = lang.replace(new RegExp(`%${i + 1}`, "g"), args[i]);
			return lang || `❌ Can't find text on language "${langCode}" for command "${commandName}" with key "${key}"`;
		};
	}
	return getText2;
}

module.exports = function (api, threadModel, userModel, dashBoardModel, globalModel, usersData, threadsData, dashBoardData, globalData) {
	return async function (event, message) {
		const { utils, client, GoatBot } = global;
		const { getPrefix, removeHomeDir, log, getTime } = utils;
		const { config, configCommands: { envGlobal, envCommands, envEvents } } = GoatBot;
		const { autoRefreshThreadInfoFirstTime } = config.database;
		let { hideNotiMessage = {} } = config;
		const { body, messageID, threadID, isGroup } = event;

		if (!threadID) return;

		const senderID = event.userID || event.senderID || event.author;
		let threadData = global.db.allThreadData.find(t => t.threadID == threadID);
		let userData = global.db.allUserData.find(u => u.userID == senderID);

		if (!userData && !isNaN(senderID)) userData = await usersData.create(senderID);
		if (!threadData && !isNaN(threadID)) {
			if (global.temp.createThreadDataError.includes(threadID)) return;
			threadData = await threadsData.create(threadID);
			global.db.receivedTheFirstMessage[threadID] = true;
		} else {
			if (autoRefreshThreadInfoFirstTime === true && !global.db.receivedTheFirstMessage[threadID]) {
				global.db.receivedTheFirstMessage[threadID] = true;
				await threadsData.refreshInfo(threadID);
			}
		}

		if (typeof threadData.settings.hideNotiMessage == "object")
			hideNotiMessage = threadData.settings.hideNotiMessage;

		const prefix = getPrefix(threadID);
		const role = getRole(threadData, senderID);

		const parameters = {
			api, usersData, threadsData, message, event,
			userModel, threadModel, prefix, dashBoardModel,
			globalModel, dashBoardData, globalData, envCommands,
			envEvents, envGlobal, role,
			removeCommandNameFromBody: function (body_, prefix_, commandName_) {
				if ([body_, prefix_, commandName_].every(x => nullAndUndefined.includes(x)))
					throw new Error("Please provide body, prefix and commandName");
				return body_.replace(new RegExp(`^${prefix_}(\\s+|)${commandName_}`, "i"), "").trim();
			}
		};

		const langCode = threadData.data.lang || config.language || "en";

		function createMessageSyntaxError(commandName) {
			message.SyntaxError = async function () {
				return await message.reply(`Invalid command syntax. Please use: ${prefix}${commandName}`);
			};
		}

		// ===================== ON START =====================
		let isUserCallCommand = false;

		async function onStart() {
			if (!body || !body.startsWith(prefix)) return;

			const dateNow = Date.now();
			const args = body.slice(prefix.length).trim().split(/ +/);
			let commandName = args.shift().toLowerCase();
			let command = GoatBot.commands.get(commandName) || GoatBot.commands.get(GoatBot.aliases.get(commandName));

			const aliasesData = threadData.data.aliases || {};
			for (const cmdName in aliasesData) {
				if (aliasesData[cmdName].includes(commandName)) {
					command = GoatBot.commands.get(cmdName);
					break;
				}
			}

			if (command) commandName = command.config.name;

			if (isBannedOrOnlyAdmin(userData, threadData, senderID, threadID, isGroup, commandName, message))
				return;

			if (!command) {
				if (!hideNotiMessage.commandNotFound) {
					return await message.reply(
						commandName
							? `Command "${commandName}" not found. Use ${prefix}help to see all commands.`
							: `Please enter a command. Use ${prefix}help to see all commands.`
					);
				}
				return true;
			}

			const roleConfig = getRoleConfig(utils, command, isGroup, threadData, commandName);
			const needRole = roleConfig.onStart;

			if (needRole > role) {
				if (!hideNotiMessage.needRoleToUseCmd) {
					if (needRole == 1) return await message.reply(`Only group admins can use the command "${commandName}"`);
					else if (needRole == 2) return await message.reply(`Only bot admins can use the command "${commandName}"`);
				}
				return true;
			}

			if (!client.countDown[commandName]) client.countDown[commandName] = {};
			const timestamps = client.countDown[commandName];
			let getCoolDown = command.config.countDown;
			if (!getCoolDown && getCoolDown != 0 || isNaN(getCoolDown)) getCoolDown = 1;

			const cooldownCommand = getCoolDown * 1000;
			if (timestamps[senderID]) {
				const expirationTime = timestamps[senderID] + cooldownCommand;
				if (dateNow < expirationTime)
					return await message.reply(`Please wait ${(expirationTime - dateNow) / 1000}s before using this command again.`);
			}

			isUserCallCommand = true;
			try {
				createMessageSyntaxError(commandName);
				const getText2 = createGetText2(langCode, `${process.cwd()}/languages/cmds/${langCode}.js`, prefix, command);

				await command.onStart({
					...parameters,
					args,
					commandName,
					getLang: getText2,
					removeCommandNameFromBody: (b, p, n) => b.replace(new RegExp(`^${p}(\\s+|)${n}`, "i"), "").trim()
				});

				timestamps[senderID] = dateNow;
				log.info("CALL COMMAND", `${commandName} | ${userData.name} | ${senderID} | ${threadID} | ${args.join(" ")}`);
			} catch (err) {
				log.err("CALL COMMAND", `An error occurred when calling the command ${commandName}`, err);
				return await message.reply(`An error occurred while running the command "${commandName}".\nTime: ${getTime("DD/MM/YYYY HH:mm:ss")}`);
			}
		}

		// ===================== ON CHAT =====================
		async function onChat() {
			const allOnChat = GoatBot.onChat || [];
			const args = body ? body.split(/ +/) : [];

			for (const key of allOnChat) {
				const command = GoatBot.commands.get(key);
				if (!command) continue;

				const commandName = command.config.name;
				const roleConfig = getRoleConfig(utils, command, isGroup, threadData, commandName);
				if (roleConfig.onChat > role) continue;

				const getText2 = createGetText2(langCode, `${process.cwd()}/languages/cmds/${langCode}.js`, prefix, command);
				const time = getTime("DD/MM/YYYY HH:mm:ss");
				createMessageSyntaxError(commandName);

				command.onChat({
					...parameters,
					isUserCallCommand,
					args,
					commandName,
					getLang: getText2
				}).then(async (handler) => {
					if (typeof handler == "function") {
						if (isBannedOrOnlyAdmin(userData, threadData, senderID, threadID, isGroup, commandName, message)) return;
						try {
							await handler();
							log.info("onChat", `${commandName} | ${userData.name} | ${senderID} | ${threadID}`);
						} catch (err) {
							await message.reply(`An error occurred while running onChat of "${commandName}".`);
						}
					}
				}).catch(err => log.err("onChat", err));
			}
		}

		// ===================== অন্যান্য ফাংশন =====================
		async function onAnyEvent() { /* ... */ }
		async function onFirstChat() { /* ... */ }
		async function onReply() { /* ... */ }
		async function onReaction() { /* ... */ }
		async function handlerEvent() { /* ... */ }
		async function onEvent() { /* ... */ }
		async function presence() {}
		async function read_receipt() {}
		async function typ() {}

		return {
			onAnyEvent, onFirstChat, onChat, onStart,
			onReaction, onReply, onEvent, handlerEvent,
			presence, read_receipt, typ
		};
	};
};
