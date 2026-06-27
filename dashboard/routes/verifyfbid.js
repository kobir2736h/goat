const express = require("express");
const router = express.Router();
const { findUid } = global.utils;

module.exports = function ({ isAuthenticated, randomNumberApikey, expireVerifyCode, isVerifyRecaptcha, dashBoardData, api, createLimiter, config }) {

	router
		.get("/", isAuthenticated, (req, res) => {
			req.session.redirectTo = req.query.redirect;
			res.render("verifyfbid");
		})

		.get("/submit-code", [isAuthenticated, function (req, res, next) {
			if (!req.session.waitVerify)
				return res.redirect("/verifyfbid");
			next();
		}], (req, res) => {
			res.render("verifyfbid-submit-code");
		})

		.post("/", isAuthenticated, async (req, res) => {
			if (!await isVerifyRecaptcha(req.body["g-recaptcha-response"]))
				return res.status(400).json({ errors: [{ msg: "Recaptcha is not correct" }] });

			if (!api)
				return res.status(400).send({ errors: [{ msg: "The bot is currently not running. Please try again later." }] });

			let { fbid } = req.body;
			const code = randomNumberApikey(6);

			if (!fbid)
				return res.status(400).send({ errors: [{ msg: "Please enter your Facebook ID" }] });

			try {
				if (isNaN(fbid))
					fbid = await findUid(fbid);
			}
			catch (e) {
				return res.status(400).send({ errors: [{ msg: "Facebook ID or profile URL does not exist" }] });
			}

			req.session.waitVerify = {
				fbid,
				code,
				email: req.user.email
			};

			setTimeout(() => {
				delete req.session.waitVerify;
			}, expireVerifyCode);

			try {
				await api.sendMessage(`Your verification code is: ${code}\nThis code will expire in ${config.dashBoard.expireVerifyCode / 60000} minutes.`, fbid);
			}
			catch (e) {
				const errors = [];
				if (e.blockedAction)
					errors.push({ msg: "The bot is currently restricted from sending messages. Please try again later." });
				else
					errors.push({ msg: `Unable to send verification code to Facebook ID "${fbid}". Please make sure you have enabled receiving messages from strangers.` });

				req.flash("errors", errors);
				return res.status(400).send({
					status: "error",
					errors,
					message: errors[0].msg
				});
			}

			req.flash("success", { msg: "Verification code has been sent to your Facebook ID. Please check your message requests if you don't see it." });
			res.send({
				status: "success",
				message: "Verification code has been sent to your Facebook ID. Please check your message requests if you don't see it."
			});
		})

		.post("/submit-code", [isAuthenticated, function (req, res, next) {
			if (!req.session.waitVerify)
				return res.redirect("/verifyfbid");
			next();
		}, createLimiter(1000 * 60 * 5, 20)], async (req, res) => {
			const { code } = req.body;
			const user = await dashBoardData.get(req.user.email);

			if (code == req.session.waitVerify.code) {
				const fbid = req.session.waitVerify.fbid;
				console.log(`User ${user.email} verified fbid ${fbid}`);
				delete req.session.waitVerify;
				await dashBoardData.set(user.email, { facebookUserID: fbid });
				req.flash("success", { msg: "Facebook user ID verified successfully" });
				res.send({
					status: "success",
					message: "Facebook user ID verified successfully",
					redirectLink: req.session.redirectTo || "/dashboard"
				});
			}
			else {
				return res.status(400).send({ msg: "Verification code is incorrect" });
			}
		});

	return router;
};
