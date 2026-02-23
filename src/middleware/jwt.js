import jwt from "jsonwebtoken";

const model = {};
export default model;

model.createJWToken = () => {
	const token = jwt.sign();
	return token;
};
