import bcrypt from "bcrypt";
import dbs from "../service/DatabaseService.js";
import jwt from "../middleware/jwt.js";

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
	 * Get all users from the database.
	 *
	 * @returns {Promise<Array>} An array of users.
	 */
	async getAllUsers() {
		let sql = "SELECT id, username, password FROM User";
		const arg = [];
		return await dbs.query(sql, arg);
	}

	/**
	 * Get a specific user from the database based on the username.
	 *
	 * @param {string} username - The name of the user.
	 * @throws {Error} - If no user was found.
	 * @returns {Promise<object>} A user if it exists or false.
	 */
	async getUserByName(username) {
		let sql = "SELECT id, password FROM User WHERE username = $1";
		const arg = [username];
		const row = await dbs.query(sql, arg);
		if (!row) {
			throw new Error("No user was found");
		}
		return { id: row.id, username: username };
	}

	/**
	 * Get a specific user from the database based on the id.
	 *
	 * @param {number} userId - The id of the user.
	 * @throws {Error} - If no user was found.
	 * @returns {Promise<object>} A user if it exists or false.
	 */
	async getUserById(userId) {
		let sql = "SELECT username, password FROM User WHERE id = $1";
		const arg = [userId];
		const row = await dbs.query(sql, arg);
		if (!row) {
			throw new Error("No user was found");
		}
		return { id: userId, username: row.username, password: row.password };
	}

	/**
	 * Get a the password for a user based on the id.
	 *
	 * @param {number} userId - The id of the user.
	 * @throws {Error} - If no user was found.
	 * @returns {Promise<string>} password for that specific user.
	 */
	async getUserPassword(userId) {
		let sql = "SELECT password FROM User WHERE id = $1";
		const arg = [userId];
		const row = await dbs.query(sql, arg);
		if (!row) {
			throw new Error("No user was found");
		}
		return row.password;
	}

	/**
	 * Add a new user to the database.
	 *
	 * @param {string} username - name of the user
	 * @param {string} password - password the user choose
	 * @returns {Promise<number>} The ID of the newly created user.
	 */
	async addUser(username, password) {
		let sql = "INSERT INTO User (username, password) VALUES ($1, $2) RETURNING id";
		const hashedPassword = await this.hashPassword(password);
		const arg = [username, hashedPassword];
		const result = await dbs.query(sql, arg);
		return result.id;
	}

	/**
	 * Update the username.
	 *
	 * @param {number} userId - The ID of the user to update.
	 * @param {string} username - The email of the user.
	 * @returns {Promise<boolean>} True if the update was successful, false otherwise.
	 */
	async updateUserName(userId, username) {
		let sql = "UPDATE User SET username = $1 WHERE id = $2";
		const arg = [username, userId];
		const result = await dbs.query(sql, arg);
		return result.rowCount > 0;
	}

	/**
	 * Update the password.
	 *
	 * @param {number} userId - The ID of the user to update.
	 * @returns {Promise<boolean>} True if the update was successful, false otherwise.
	 */
	async updatePassword(userId, password, newPassword) {
		const hashedPassword = this.getUserPassword(userId);
		if (!bcrypt.compare(password, hashedPassword)) {
			throw new Error("Wrong password!");
		}
		let sql = "UPDATE User SET password = $1 WHERE id = $2";
		const arg = [newPassword, userId];
		const result = await dbs.query(sql, arg);
		return result.rowCount > 0;
	}

	/**
	 * Delete a user from the database.
	 *
	 * @param {number} userId - The ID of the user to delete.
	 * @returns {Promise<boolean>} True if the deletion was successful, false otherwise.
	 */
	async deleteUser(userId) {
		let sql = "DELETE FROM User WHERE id = $1";
		const arg = [userId];
		const result = await dbs.query(sql, arg);
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
		const user = this.getUserByName(userName);
		if (!user) {
			throw new Error("No user by that name found.");
		}
		const hashedPassword = user.password;
		const success = await bcrypt.compare(password, hashedPassword);
		if (!success) {
			throw new Error("Password and Username does not match.");
		}
		const token = jwt.createToken(user.username);
		return token;
	}
}

export default new UserModel();
