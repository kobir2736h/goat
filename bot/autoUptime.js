const axios = require("axios");

// ❌ config ব্যবহার নেই
// ✅ ONLY RENDER
const hostURL = process.env.RENDER_EXTERNAL_URL;

if (!hostURL) {
  console.error("[UPTIME] Render URL not found, auto uptime disabled");
  return;
}

let status = "ok";

console.log("[UPTIME] Auto ping started:", hostURL);

setInterval(async () => {
  try {
    await axios.get(hostURL, { timeout: 10000 });

    if (status !== "ok") {
      status = "ok";
      console.log("[UPTIME] Bot back online");
    }

  } catch (err) {
    if (status === "failed") return;
    status = "failed";

    console.error("[UPTIME] Ping failed, bot may be down");

    // ✅ Admin alert
    const admins = global.GoatBot?.config?.adminBot || [];
    for (const adminID of admins) {
      global.api.sendMessage(
        `🚨 UPTIME ALERT\nBot host is DOWN!\n${hostURL}`,
        adminID
      );
    }
  }
}, 1000 * 60 * 10); // প্রতি ৫ মিনিটে ping
