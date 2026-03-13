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
	const token = jwt.sign({ userId, role }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
	return token;
};

/**
 *
 * @param {Object} user - conatins userId and role
 * @returns {string} JWT refresh token
 */
authmodel.createRefreshToken = (user) => {
	return jwt.sign(user, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
};
/**
 *
 * @param {string} token - JWT token
 * @param {string} key - The security key used
 * @returns {object} Decoded JWT payload
 * @throws {TokenExpiredError} If the token has expired
 * @throws {JsonWebTokenError} If the token is invalid
 */
authmodel.tokenVerification = (token, key) => {
	return jwt.verify(token, key);
};
