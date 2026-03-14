const { spawn } = require("child_process");
const log = require("./logger/log.js"); // যদি logger/log.js না থাকে তবে console.log ব্যবহার করুন

function startProject() {
  const child = spawn("node", ["Goat.js"], {
    cwd: __dirname,
    stdio: "inherit",
    shell: true
  });

  child.on("close", (code) => {
    if (code == 2) {
      log.info("🔁 Restarting Goat Bot...");
      startProject();
    }
  });
}

startProject();
