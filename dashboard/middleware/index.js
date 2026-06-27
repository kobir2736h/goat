const { threadsData } = global.db;

function isPostMethod(req) {
	return req.method == "POST";
}

module.exports = function (checkAuthConfigDashboardOfThread) {
	return {
		isAuthenticated(req, res, next) {
            // লগইন চেক করা বন্ধ করে সরাসরি পারমিশন দেওয়া হলো
			next();
		},

		unAuthenticated(req, res, next) {
			next();
		},

		isVeryfiUserIDFacebook(req, res, next) {
            // ফেসবুক আইডি ভেরিফিকেশন চেক বন্ধ করা হলো
			next();
		},

		isWaitVerifyAccount(req, res, next) {
			next();
		},

		async checkHasAndInThread(req, res, next) {
			const threadID = isPostMethod(req) ? req.body.threadID : req.params.threadID;
			const threadData = await threadsData.get(threadID);

            // গ্রুপ না পেলে শুধু এরর দেখাবে, কিন্তু আপনি ওই গ্রুপে আছেন কি না সেই চেকিং (findMember) বাদ দেওয়া হলো
			if (!threadData) {
				if (isPostMethod(req))
					return res.status(401).send({
						status: "error",
						error: "PERMISSION_DENIED",
						message: "Không tìm thấy nhóm này (Group not found)"
					});

				req.flash("errors", { msg: "Thread not found" });
				return res.redirect("/dashboard");
			}

			req.threadData = threadData;
			next(); 
		},

		async middlewareCheckAuthConfigDashboardOfThread(req, res, next) {
            // গ্রুপের ড্যাশবোর্ড এডিট করার পারমিশন চেক বন্ধ করা হলো (সবসময় এডিট করা যাবে)
			next();
		},

		async isAdmin(req, res, next) {
            // অ্যাডমিন চেক বন্ধ করা হলো (সবাইকে অ্যাডমিন হিসেবে কাজ করতে দেবে)
			next();
		}
	};
};
