const { readdirSync, readFileSync, writeFileSync, existsSync } = require("fs-extra");
const path = require("path");
const builtinModules = require("module").builtinModules;

const exec = (cmd, options) => new Promise((resolve, reject) => {
    require("child_process").exec(cmd, options, (err, stdout) => {
        if (err) return reject(err);
        resolve(stdout);
    });
});

const { log, loading, getText, removeHomeDir } = global.utils;
const { GoatBot } = global;
const { configCommands } = GoatBot;

const regExpCheckPackage = /require(\s+|)\((\s+|)[`'"]([^`'"]+)[`'"](\s+|)\)/g;
const packageAlready = [];
const spinner = ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏'];
let count = 0;

module.exports = async function (api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData) {

    const aliasesData = await globalData.get('setalias', 'data', []);
    if (aliasesData) {
        for (const data of aliasesData) {
            const { aliases, commandName } = data;
            for (const alias of aliases) {
                if (GoatBot.aliases.has(alias))
                    throw new Error(`Alias "${alias}" already exists in command "${commandName}"`);
                else
                    GoatBot.aliases.set(alias, commandName);
            }
        }
    }

    const folders = ["cmds", "events"];
    let text, setMap, typeEnvCommand;

    for (const folderModules of folders) {

        console.log(folderModules == "cmds"
            ? "========== LOAD COMMANDS =========="
            : "========== LOAD EVENTS ==========");

        if (folderModules == "cmds") {
            text = "command";
            typeEnvCommand = "envCommands";
            setMap = "commands";
        } else {
            text = "event command";
            typeEnvCommand = "envEvents";
            setMap = "eventCommands";
        }

        const fullPathModules = path.normalize(process.cwd() + `/scripts/${folderModules}`);

        const Files = readdirSync(fullPathModules).filter(file =>
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
                // 🔥 PACKAGE CHECK (UPDATED)
                const contentFile = readFileSync(pathCommand, "utf8");
                let allPackage = contentFile.match(regExpCheckPackage);

                if (allPackage) {
                    allPackage = allPackage
                        .map(p => p.match(/[`'"]([^`'"]+)[`'"]/)[1])
                        .filter(p =>
                            !p.startsWith("./") &&
                            !p.startsWith("../") &&
                            !p.startsWith("/") &&
                            !builtinModules.includes(p.split('/')[0])
                        );

                    for (let packageName of allPackage) {
                        if (packageName.startsWith('@'))
                            packageName = packageName.split('/').slice(0, 2).join('/');
                        else
                            packageName = packageName.split('/')[0];

                        if (builtinModules.includes(packageName)) continue;

                        if (!packageAlready.includes(packageName)) {
                            packageAlready.push(packageName);

                            if (!existsSync(`${process.cwd()}/node_modules/${packageName}`)) {
                                const wating = setInterval(() => {
                                    console.log(`${spinner[count % spinner.length]} Installing ${packageName} for ${text} ${file}`);
                                    count++;
                                }, 80);

                                try {
                                    await exec(`npm install ${packageName} --save`);
                                    clearInterval(wating);
                                    process.stderr.write('\r\x1b[K');
                                    console.log(`✔ Installed ${packageName}`);
                                } catch (err) {
                                    clearInterval(wating);
                                    process.stderr.write('\r\x1b[K');
                                    console.log(`✖ Failed ${packageName}`);
                                    throw new Error(`Can't install ${packageName}`);
                                }
                            }
                        }
                    }
                }

                global.temp.contentScripts[folderModules][file] = contentFile;

                const command = require(pathCommand);
                command.location = pathCommand;

                const configCommand = command.config;
                const commandName = configCommand?.name;

                if (!configCommand) throw new Error(`config undefined`);
                if (!configCommand.category) throw new Error(`category undefined`);
                if (!commandName) throw new Error(`name undefined`);
                if (!command.onStart) throw new Error(`onStart undefined`);
                if (typeof command.onStart !== "function") throw new Error(`onStart must be function`);

                if (GoatBot[setMap].has(commandName))
                    throw new Error(`${commandName} already exists`);

                const { onFirstChat, onChat, onLoad, onEvent, onAnyEvent } = command;
                const { envGlobal, envConfig, aliases } = configCommand;

                // aliases
                const validAliases = [];
                if (aliases) {
                    if (!Array.isArray(aliases))
                        throw new Error("aliases must be array");

                    for (const alias of aliases) {
                        if (GoatBot.aliases.has(alias))
                            throw new Error(`alias exists: ${alias}`);
                        validAliases.push(alias);
                    }

                    for (const alias of validAliases)
                        GoatBot.aliases.set(alias, commandName);
                }

                // envGlobal
                if (envGlobal) {
                    for (const i in envGlobal) {
                        if (!configCommands.envGlobal[i])
                            configCommands.envGlobal[i] = envGlobal[i];
                    }
                }

                // envConfig
                if (envConfig) {
                    if (!configCommands[typeEnvCommand])
                        configCommands[typeEnvCommand] = {};

                    if (!configCommands[typeEnvCommand][commandName])
                        configCommands[typeEnvCommand][commandName] = {};

                    for (const [key, value] of Object.entries(envConfig)) {
                        if (!configCommands[typeEnvCommand][commandName][key])
                            configCommands[typeEnvCommand][commandName][key] = value;
                    }
                }

                // onLoad
                if (onLoad) await onLoad({
                    api, threadModel, userModel, dashBoardModel,
                    globalModel, threadsData, usersData, dashBoardData, globalData
                });

                if (onChat) GoatBot.onChat.push(commandName);
                if (onFirstChat) GoatBot.onFirstChat.push({ commandName, threadIDsChattedFirstTime: [] });
                if (onEvent) GoatBot.onEvent.push(commandName);
                if (onAnyEvent) GoatBot.onAnyEvent.push(commandName);

                GoatBot[setMap].set(commandName.toLowerCase(), command);
                commandLoadSuccess++;

            } catch (error) {
                commandError.push({ name: file, error });
            }

            console.log(`LOADED: ${commandLoadSuccess} success${commandError.length ? `, ${commandError.length} failed` : ''}`);
        }

        console.log("");

        if (commandError.length > 0) {
            console.log(`❌ Error loading ${text}:`);
            for (const item of commandError)
                console.log(` ✖ ${item.name}: ${item.error.message}`);
        }
    }
};
