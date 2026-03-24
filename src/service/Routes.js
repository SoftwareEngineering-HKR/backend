import express from "express";
import authmodel from "../middleware/jwt";
import UserModel from "../model/UserModel";
export const router = express.Router();

router.post("/login", (req, res) => {
	const { username, password } = req.body;
	try {
		const user = UserModel.login(username, password);
		const accessToken = authmodel.createAccessJWToken(user.id, user.type, user.device);
		const refreshToken = authmodel.createRefreshToken(user.id, user.type, user.device);

		//call to  model 

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

router.post("/refresh", (req, res) =>{
	const refreshToken = req.cookies.jwt;

	authmodel.tokenVerification(refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded)=>{
		if (error) {
			return res.status(406).json({message: 'Unauthorized'});
		}
		else{
				const accessToken = authmodel.createAccessJWToken(decoded.id, decoded.type, decoded.device);
				const refreshToken = authmodel.createRefreshToken(user.id, user.type, user.device);

				//call to model

			res.cookie("jwt", refreshToken, {
				httpOnly: true,
				sameSite: "strict",
				secure: true,
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
