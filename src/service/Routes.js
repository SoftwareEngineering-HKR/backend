import express from "express";
import authmodel from "../middleware/JwtService.js";
import UserModel from "../model/UserModel.js";
import RefreshModel from "../model/RefreshModel.js";
import jwt from "jsonwebtoken";

export const router = express.Router();

router.post("/login", async (req, res) => {
	const { username, password, ip } = req.body;

	try {
		const user = await UserModel.login(username, password);
		const accessToken = authmodel.createAccessJWToken(user.id, user.type);
		const refreshToken = authmodel.createRefreshToken(user.id, user.type, ip);

		await RefreshModel.addToken(
			refreshToken,
			user.id,
			new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
			ip,
		);

		res.cookie("jwt", refreshToken, {
			httpOnly: true,
			sameSite: "lax",
			secure: false,
		});
		return res.json({ accessToken });
	} catch {
		return res.status(406).json({
			message: "Invalid credentials",
		});
	}
});

router.post("/refresh", async (req, res) => {
	const refreshToken = req.cookies.jwt;
	const oldToken = await RefreshModel.getToken(refreshToken);
	if (!oldToken) {
		return res.status(403).json({ message: "Refresh token invalid/revoked" });
	}

	try {
		await RefreshModel.revokeToken(refreshToken);
		const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
		const accessToken = authmodel.createAccessJWToken(decoded.sub, decoded.role);
		const newRefreshToken = authmodel.createRefreshToken(decoded.sub, decoded.role, decoded.ip);
		await RefreshModel.addToken(
			newRefreshToken,
			decoded.sub,
			new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
			decoded.ip,
		);
		res.cookie("jwt", newRefreshToken, {
			httpOnly: true,
			sameSite: "lax",
			secure: false,
		});
		return res.json({ accessToken });
	} catch {
		return res.status(403).json({ message: "Refresh token invalid/revoked" });
	}
});

router.post("/logout", async (req, res) => {
	const authHeader = req.headers["authorization"];
	if (!authHeader) return res.status(401).json({ message: "No access token provided" });
	const token = authHeader.split(" ")[1];
	let verify = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
	if (!verify) {
		return res.status(406).json({ message: "acesstoken not valid" });
	}
	const refreshToken = req.cookies.jwt;
	const revkoed = await RefreshModel.revokeToken(refreshToken);
	if (revkoed) {
		res.clearCookie("jwt");
		res.json({ message: "Logged out successfully" });
	} else {
		console.log("something went wrong");
	}
});

router.post("/signup", async (req, res) => {
	const { username, password, ip } = req.body;
	try {
		const user = await UserModel.addUser(username, password);
		const accessToken = authmodel.createAccessJWToken(user.id, user.type);
		const refreshToken = authmodel.createRefreshToken(user.id, user.type, ip);

		RefreshModel.addToken(refreshToken, user.id, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), ip);

		res.cookie("jwt", refreshToken, {
			httpOnly: true,
			sameSite: "lax",
			secure: false,
		});
		return res.json({ accessToken });
	} catch {
		return res.status(406).json({
			message: "Invalid credentials",
		});
	}
});
