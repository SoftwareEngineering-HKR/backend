import express from "express";
import authmodel from "../middleware/jwt";
import UserModel from "../model/UserModel";

export const router = express.Router();

router.post("/login", (req, res) => {
	const { username, password, device } = req.body;
	try {
		const user = UserModel.login(username, password);
		const accessToken = authmodel.createAccessJWToken(user.id, user.type);
		const refreshToken = authmodel.createRefreshToken(user.id, user.type, device);

		//call to  model 

		res.cookie("jwt", refreshToken, {
			httpOnly: true,
			sameSite: "lax",
			secure: false
		});
		return res.json({ accessToken });
	} catch (err) {
		console.log(err);
		return res.status(406).json({
			message: "Invalid credentials",
		});
	}
});

router.post("/refresh", (req, res) =>{
	const refreshToken = req.cookies.jwt;

	authmodel.tokenVerification(refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded)=>{
		if (error) {
			return res.status(406).json({message: 'Unauthorized'});
		}
		else{
				const accessToken = authmodel.createAccessJWToken(decoded.id, decoded.type);
				const refreshToken = authmodel.createRefreshToken(decoded.id, decoded.type, decoded.device);

				//call to model

			res.cookie("jwt", refreshToken, {
				httpOnly: true,
				sameSite: "lax",
				secure: false
				});
				return res.json({ accessToken });
			}
		}
)})

router.post("/logout", (req, res) =>{
	const refreshToken = req.cookies.refreshToken;
	//call to model

	res.clearCookie('refreshToken');
  	res.json({ message: 'Logged out successfully' });
})

router.post("/signup", (req, res)=>{
	const { username, password, type, device } = req.body;
	try {
		const user = UserModel.addUser(username, password, type); 
		const accessToken = authmodel.createAccessJWToken(user.id, user.type);
		const refreshToken = authmodel.createRefreshToken(user.id, user.type, device);

		//call to  model 

		res.cookie("jwt", refreshToken, {
			httpOnly: true,
			sameSite: "lax",
			secure: false
		});
		return res.json({ accessToken });
	} catch (err) {
		console.log(err);
		return res.status(406).json({
			message: "Invalid credentials",
		});
	}
})