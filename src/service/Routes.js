import express from "express";
import authmodel from "../middleware/jwt";
import UserModel from "../model/UserModel";
import RefreshModel from "../model/RefreshModel";
import jwt from "jsonwebtoken";

export const router = express.Router();

router.post("/login", (req, res) => {
	const { username, password, ip } = req.body;
	var date = new Date();

	try {
		const user = UserModel.login(username, password);
		const accessToken = authmodel.createAccessJWToken(user.id, user.type);
		const refreshToken = authmodel.createRefreshToken(user.id, user.type, ip);

		RefreshModel.addToken(refreshToken, user.id, date.setDate(date.getDate() + 7), ip);

		res.cookie("jwt", refreshToken, {
			httpOnly: true,
			sameSite: "lax",
			secure: false,
		});
		return res.json({ accessToken });
	} catch (err) {
		console.log(err);
		return res.status(406).json({
			message: "Invalid credentials",
		});
	}
});

router.post("/refresh", (req, res) => {
	var date = new Date();
	const refreshToken = req.cookies.jwt;
	const oldToken = RefreshModel.getToken(refreshToken);
	if (!oldToken) {
		return res.status(403).json({ message: "Refresh token invalid/revoked" });
	}
	RefreshModel.revokeToken(oldToken);
	jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
		if (error) {
			return res.status(406).json({ message: "Unauthorized" });
		} else {
			const accessToken = authmodel.createAccessJWToken(decoded.id, decoded.type);
			const newRefreshToken = authmodel.createRefreshToken(decoded.id, decoded.type, decoded.ip);

			RefreshModel.addToken(newRefreshToken, decoded.id, date.setDate(date.getDate() + 7), decoded.ip);
			res.cookie("jwt", newRefreshToken, {
				httpOnly: true,
				sameSite: "lax",
				secure: false,
			});
			return res.json({ accessToken });
		}
	});
});

router.post("/logout", (req, res) => {
	const refreshToken = req.cookies.refreshToken;
	RefreshModel.revokeToken(refreshToken);

	res.clearCookie("refreshToken");
	res.json({ message: "Logged out successfully" });
});

router.post("/signup", (req, res) => {
	var date = new Date();
	const { username, password, type, ip } = req.body;
	try {
		const user = UserModel.addUser(username, password, type);
		const accessToken = authmodel.createAccessJWToken(user.id, user.type);
		const refreshToken = authmodel.createRefreshToken(user.id, user.type, ip);

		RefreshModel.addToken(refreshToken, user.id, date.setDate(date.getDate() + 7), ip);

		res.cookie("jwt", refreshToken, {
			httpOnly: true,
			sameSite: "lax",
			secure: false,
		});
		return res.json({ accessToken });
	} catch (err) {
		console.log(err);
		return res.status(406).json({
			message: "Invalid credentials",
		});
	}
});
