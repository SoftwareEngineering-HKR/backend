import dbs from "../service/DatabaseService.js";

class RefreshModel {
	async getToken(refToken) {
		const sql = "SELECT * FROM refresh_tokens WHERE token = $1 AND revoked = false AND expires > NOW();";
		const args = [refToken];
		const result = await dbs.query(sql, args);
		if (result.length > 0) {
			return true;
		} else {
			throw false;
		}
	}
	async addToken(token, user_id, expires, ip) {
		const sql = "INSERT INTO refresh_tokens (token, user_id, expires, ip) VALUES ($1, $2, $3, $4)";
		const args = [token, user_id, expires, ip];
		const result = await dbs.query(sql, args);
		if (result.length > 0) {
			return true;
		} else {
			return false;
		}
	}

	async revokeToken(token) {
		const sql = "UPDATE refresh_tokens SET revoked = true WHERE token = $1 RETURNING revoked";
		const args = [token];
		const result = await dbs.query(sql, args);
		console.log(result);
		if (result.length > 0) {
			return true;
		} else {
			return false;
		}
	}
}
export default new RefreshModel();
