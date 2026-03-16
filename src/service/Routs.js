import express from "express";
import authmodel from "../middleware/jwt";
import UserModel from "../model/UserModel";
export const router = express.Router();

router.get("/login", (req, res) => {
	const { username, password } = req.body;
	try {
		const user = UserModel.login(username, password);
		const accessToken = authmodel.createAccessJWToken(user.id, user.type);
		const refreshToken = authmodel.createRefreshToken(user.id, user.type);
		res.cookie("jwt", refreshToken, {
			httpOnly: true,
			sameSite: "strict",
			secure: true,
		});
		return res.json({ accessToken });
	} catch (err) {
		console.log(err);
		return res.status(406).json({
			message: "Invalid credentials",
		});
	}
});
