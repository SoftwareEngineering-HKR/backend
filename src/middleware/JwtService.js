import jwt from "jsonwebtoken";

const authmodel = {};
export default authmodel;

/**
 *
 * @param {int} userId
 * @param {string} role
 * @returns {string} JWT access token
 */
authmodel.createAccessJWToken = (userId, role) => {
	const token = jwt.sign({ sub: userId, role: role }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
	return token;
};

/**
 *
 * @param {Object} user - conatins userId, role and device
 * @returns {string} JWT refresh token
 */
authmodel.createRefreshToken = (userId, role, device) => {
	return jwt.sign({ sub: userId, role: role, ip: device }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
};
