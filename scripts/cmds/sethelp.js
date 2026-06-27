module.exports = {
	config: {
		name: "sethelp",
		version: "1.2",
		author: "NTKhang",
		countDown: 5,
		role: 0,
		description: {
			vi: "Sắp xếp danh sách help",
			en: "Sort help list"
		},
		category: "change",
		guide: {
			en: "{pn} [n | c]"
		}
	},

	langs: {
		vi: {
			savedName: "Đã lưu cài đặt sắp xếp danh sách help theo thứ tự chữ cái",
			savedCategory: "Đã lưu cài đặt sắp xếp danh sách help theo thứ tự thể loại"
		},
		en: {
			savedName: "Saved sort help list by name",
			savedCategory: "Saved sort help list by category"
		}
	},

	onStart: async function ({ message, event, args, threadsData, getLang }) {
		if (args[0] == "n") {
			await threadsData.set(event.threadID, "name", "settings.sortHelp");
			message.reply(getLang("savedName"));
		}
		else if (args[0] == "c") {
			threadsData.set(event.threadID, "category", "settings.sortHelp");
			message.reply(getLang("savedCategory"));
		}
		else
			message.SyntaxError();
	}
};
