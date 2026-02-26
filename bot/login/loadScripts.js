const { readdirSync, readFileSync, writeFileSync } = require("fs-extra");
const path = require("path");
const { log, loading, getText, colors, removeHomeDir } = global.utils;
const { GoatBot } = global;
const { configCommands } = GoatBot;

module.exports = async function (api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData, createLine) {
        /* { CHECK ORIGIN CODE } */

        const aliasesData = await globalData.get('setalias', 'data', []);
        if (aliasesData) {
                for (const data of aliasesData) {
                        const { aliases, commandName } = data;
                        for (const alias of aliases)
                                if (GoatBot.aliases.has(alias))
                                        throw new Error(`Alias "${alias}" already exists in command "${commandName}"`);
                                else
                                        GoatBot.aliases.set(alias, commandName);
                }
        }
        const folders = ["cmds", "events"];
        let text, setMap, typeEnvCommand;

        for (const folderModules of folders) {
                const makeColor = folderModules == "cmds" ?
                        createLine("LOAD COMMANDS") :
                        createLine("LOAD COMMANDS EVENT");
                console.log(colors.hex("#f5ab00")(makeColor));

                if (folderModules == "cmds") {
                        text = "command";
                        typeEnvCommand = "envCommands";
                        setMap = "commands";
                }
                else if (folderModules == "events") {
                        text = "event command";
                        typeEnvCommand = "envEvents";
                        setMap = "eventCommands";
                }

                const fullPathModules = path.normalize(process.cwd() + `/scripts/${folderModules}`);
                const Files = readdirSync(fullPathModules)
                        .filter(file =>
                                file.endsWith(".js") &&
                                !file.endsWith("eg.js") &&
                                (process.env.NODE_ENV == "development" ? true : !file.match(/(dev)\.js$/g)) &&
                                !configCommands[folderModules == "cmds" ? "commandUnload" : "commandEventUnload"]?.includes(file)
                        );

                const commandError = [];
                let commandLoadSuccess = 0;

                for (const file of Files) {
                        const pathCommand = path.normalize(fullPathModules + "/" + file);
                        try {
                                // —————————————— CHECK CONTENT SCRIPT —————————————— //
                                const contentFile = readFileSync(pathCommand, "utf8");
                                global.temp.contentScripts[folderModules][file] = contentFile;

                                const command = require(pathCommand);
                                command.location = pathCommand;
                                const configCommand = command.config;
                                const commandName = configCommand.name;
                                // ——————————————— CHECK SYNTAXERROR ——————————————— //
                                if (!configCommand)
                                        throw new Error(`config of ${text} undefined`);
                                if (!configCommand.category)
                                        throw new Error(`category of ${text} undefined`);
                                if (!commandName)
                                        throw new Error(`name of ${text} undefined`);
                                if (!command.onStart)
                                        throw new Error(`onStart of ${text} undefined`);
                                if (typeof command.onStart !== "function")
                                        throw new Error(`onStart of ${text} must be a function`);
                                if (GoatBot[setMap].has(commandName))
                                        throw new Error(`${text} "${commandName}" already exists with file "${removeHomeDir(GoatBot[setMap].get(commandName).location || "")}"`);
                                const { onFirstChat, onChat, onLoad, onEvent, onAnyEvent } = command;
                                const { envGlobal, envConfig } = configCommand;
                                const { aliases } = configCommand;
                                // ————————————————— CHECK ALIASES —————————————————— //
                                const validAliases = [];
                                if (aliases) {
                                        if (!Array.isArray(aliases))
                                                throw new Error("The value of \"config.aliases\" must be array!");
                                        for (const alias of aliases) {
                                                if (aliases.filter(item => item == alias).length > 1)
                                                        throw new Error(`alias "${alias}" duplicate in ${text} "${commandName}" with file "${removeHomeDir(pathCommand)}"`);
                                                if (GoatBot.aliases.has(alias))
                                                        throw new Error(`alias "${alias}" already exists in ${text} "${GoatBot.aliases.get(alias)}" with file "${removeHomeDir(GoatBot[setMap].get(GoatBot.aliases.get(alias))?.location || "")}"`);
                                                validAliases.push(alias);
                                        }
                                        for (const alias of validAliases)
                                                GoatBot.aliases.set(alias, commandName);
                                }
                                // ——————————————— CHECK ENV GLOBAL ——————————————— //
                                if (envGlobal) {
                                        if (typeof envGlobal != "object" || typeof envGlobal == "object" && Array.isArray(envGlobal))
                                                throw new Error("the value of \"envGlobal\" must be object");
                                        for (const i in envGlobal) {
                                                if (!configCommands.envGlobal[i]) {
                                                        configCommands.envGlobal[i] = envGlobal[i];
                                                }
                                                else {
                                                        const readCommand = readFileSync(pathCommand, "utf-8").replace(envGlobal[i], configCommands.envGlobal[i]);
                                                        writeFileSync(pathCommand, readCommand);
                                                }
                                        }
                                }
                                // ———————————————— CHECK CONFIG CMD ——————————————— //
                                if (envConfig) {
                                        if (typeof envConfig != "object" || typeof envConfig == "object" && Array.isArray(envConfig))
                                                throw new Error("The value of \"envConfig\" must be object");
                                        if (!configCommands[typeEnvCommand])
                                                configCommands[typeEnvCommand] = {};
                                        if (!configCommands[typeEnvCommand][commandName])
                                                configCommands[typeEnvCommand][commandName] = {};
                                        for (const [key, value] of Object.entries(envConfig)) {
                                                if (!configCommands[typeEnvCommand][commandName][key])
                                                        configCommands[typeEnvCommand][commandName][key] = value;
                                                else {
                                                        const readCommand = readFileSync(pathCommand, "utf-8").replace(value, configCommands[typeEnvCommand][commandName][key]);
                                                        writeFileSync(pathCommand, readCommand);
                                                }
                                        }
                                }
                                // ————————————————— CHECK ONLOAD ————————————————— //
                                if (onLoad) {
                                        if (typeof onLoad != "function")
                                                throw new Error("The value of \"onLoad\" must be function");
                                        await onLoad({ api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData });
                                }
                                // ——————————————— CHECK RUN ANYTIME ——————————————— //
                                if (onChat)
                                        GoatBot.onChat.push(commandName);
                                // ——————————————— CHECK ONFIRSTCHAT ——————————————— //
                                if (onFirstChat)
                                        GoatBot.onFirstChat.push({ commandName, threadIDsChattedFirstTime: [] });
                                // ————————————————— CHECK ONEVENT ————————————————— //
                                if (onEvent)
                                        GoatBot.onEvent.push(commandName);
                                // ———————————————— CHECK ONANYEVENT ———————————————— //
                                if (onAnyEvent)
                                        GoatBot.onAnyEvent.push(commandName);
                                // —————————————— IMPORT TO GLOBALGOAT —————————————— //
                                GoatBot[setMap].set(commandName.toLowerCase(), command);
                                commandLoadSuccess++;

                                global.GoatBot[folderModules == "cmds" ? "commandFilesPath" : "eventCommandsFilesPath"].push({
                                        filePath: path.normalize(pathCommand),
                                        commandName: [commandName, ...validAliases]
                                });
                        }
                        catch (error) {
                                commandError.push({
                                        name: file,
                                        error
                                });
                        }
                        loading.info('LOADED', `${colors.green(`${commandLoadSuccess}`)}${commandError.length ? `, ${colors.red(`${commandError.length}`)}` : ''}`);
                }
                console.log("\r");
                if (commandError.length > 0) {
                        log.err("LOADED", getText('loadScripts', 'loadScriptsError', colors.yellow(text)));
                        for (const item of commandError)
                                console.log(` ${colors.red('✖ ' + item.name)}: ${item.error.message}\n`, item.error);
                }
        }
};
