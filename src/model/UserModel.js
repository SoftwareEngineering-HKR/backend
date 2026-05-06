import bcrypt from "bcrypt";
import dbs from "../service/DatabaseService.js";

/**
 * Model for the User table
 *
 */
class UserModel {
	/**
	 * Hash the password submitted by the user
	 *
	 * @param {string} plaintext - the password in plaintext.
	 * @returns {Promise<string>} The hashed password.
	 */

	async hashpass(plaintext) {
		const salt = 10;
		return bcrypt.hash(plaintext, salt);
	}

	/**
	 * Get a specific user from the database based on the username.
	 *
	 * @param {string} username - The name of the user.
	 * @throws {Error} - If no user was found.
	 * @returns {Promise<string>} A user id if it exists or false.
	 */
	async getUserByName(username) {
		let sql = "SELECT id FROM users WHERE username = $1";
		const arg = [username];
		const result = await dbs.query(sql, arg);
		if (result.rowCount == 0) {
			return null;
		}
		const row = result.rows[0];
		return row.id;
	}

	/**
	 * Get all users from the database.
	 * @throws {Error} - If sql fail.
	 * @returns {Promise<Array<Object>>} list of users.
	 */
	async getAllUsers() {
		let sql = "SELECT id, username, type FROM users";
		const results = await dbs.query(sql);
		if (results.rowCount == 0) {
			return null;
		}
		return results;
	}

	/**
	 * Get a specific user from the database based on the username.
	 *
	 * @param {string} username - The name of the user.
	 * @throws {Error} - If no user was found.
	 * @returns {Promise<object>} A user if it exists or false.
	 */
	async _getUser(username) {
		let sql = "SELECT id, type, password FROM users WHERE username = $1";
		const arg = [username];
		const result = await dbs.query(sql, arg);
		if (result.rowCount == 0) {
			return null;
		}
		const row = result[0];
		return { id: row.id, type: row.type, password: row.password };
	}

	/**
	 * Get a specific user from the database based on the id.
	 *
	 * @param {string} userId - The id of the user.
	 * @throws {Error} - If no user was found.
	 * @returns {Promise<object>} A user if it exists or false.
	 */
	async getUserById(userId) {
		let sql = "SELECT id, username, type FROM users WHERE id = $1";
		const arg = [userId];
		const result = await dbs.query(sql, arg);
		if (result.rowCount == 0) {
			throw new Error("No user was found");
		}
		const row = result[0];
		return row;
	}

	/**
	 * Get a the password for a user based on the id.
	 *
	 * @param {string} id - The id of the user.
	 * @throws {Error} - If no user was found.
	 * @returns {Promise<string>} password for that specific user.
	 */
	async getUserPassword(id) {
		let sql = "SELECT password FROM users WHERE id = $1";
		const arg = [id];
		const result = await dbs.query(sql, arg);
		if (result.rowCount == 0) {
			throw new Error("No user was found");
		}
		const row = result.rows[0];
		return row.password;
	}

	/**
	 * Add a new user to the database.
	 *
	 * @param {string} username - name of the user
	 * @param {string} password - password the user choose
	 * @returns {Promise<user>} The user of the newly created user.
	 */
	async addUser(username, password, type = "user") {
		const hashedPassword = await this.hashpass(password);
		let sql;
		let arg;
		sql = "INSERT INTO users (username, password, type) VALUES ($1, $2, $3) RETURNING id";
		arg = [username, hashedPassword, type];
		const result = await dbs.query(sql, arg);
		const user = await this.getUserById(result[0].id);
		return user;
	}

	/**
	 * Update the username.
	 *
	 * @param {string} userId - The ID of the user to updat
	 * @param {string} username - The email of the user.
	 * @returns {Promise<boolean>} True if the update was successful, false otherwise.
	 */
	async updateUserName(userId, username) {
		let sql = "UPDATE users SET username = $1 WHERE id = $2";
		const arg = [username, userId];
		const result = await dbs.query(sql, arg);
		return result.rowCount > 0;
	}

	/**
	 * Update the password.
	 *
	 * @param {string} userId - The ID of the user to update.
	 * @throws {Error} - If password is incorrect
	 * @returns {Promise<boolean>} True if the update was successful, false otherwise.
	 */
	async updatePassword(userName, password, newPassword) {
		const userId = await this.getUserByName(userName);
		const hashedPassword = await this.getUserPassword(userId);
		const success = await bcrypt.compare(password, hashedPassword);
		if (!success) {
			throw new Error("Wrong password!");
		}
		let sql = "UPDATE users SET password = $1 WHERE id = $2";
		const salt = 10;
		const newPassHash = await bcrypt.hash(newPassword, salt);
		const arg = [newPassHash, userId];
		const result = await dbs.query(sql, arg);
		return result.rowCount > 0;
	}

	/**
	 * Delete a user from the database.
	 *
	 * @param {string} userName - The username of the user to be delete.
	 * @throws {Error} - No user found or error deleting user
	 * @returns {Promise<boolean>} True if the deletion was successful, false otherwise.
	 */
	async deleteUser(userName) {
		let sql = "DELETE FROM users WHERE username = $1";
		const arg = [userName];
		const result = await dbs.query(sql, arg);
		if (result.rowCount === 0) {
			throw new Error("Unable to delete user.");
		}
		return result.rowCount > 0;
	}
	/** Login a user
	 *
	 * @param {string} userName - username for the user.
	 * @param {string} password - password for the user.
	 * @throws {Error} - No user found.
	 * @throws {Error} - Password and username does not match.
	 * @return {Promise<string>} - A JWT Token if user gets logged in successfully.
	 */
	async login(userName, password) {
		const user = await this._getUser(userName);
		let success = false;
		if (user) {
			success = await bcrypt.compare(password, user.password);
		}
		if (!success) {
			throw new Error("Invalid username or password.");
		}

		return user;
	}

	/** Promote a user to admin role
	 *
	 * @param {string} userName - username for the user.
	 * @param {string} role - new role for the user.
	 * @throws {Error} - If username is wrong or user already has the desired role
	 * @return {Promise<boolean>} - Returns true if promotion complete
	 */
	async setUserRole(userName, role) {
		const sql = "UPDATE users SET type = $1 WHERE user = $2 AND type != $1";
		const arg = [role, userName];
		const result = await dbs.query(sql, arg);
		if (result.rowCount === 0) {
			throw new Error("Wrong username or user already have desired role.");
		}
		return result.rowCount > 0;
	}
}

export default new UserModel();
