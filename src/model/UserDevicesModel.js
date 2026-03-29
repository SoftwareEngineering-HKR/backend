import dbs from "../service/DatabaseService.js";
import EventEmitter from "node:events";

/**
 * Model for the user_devices table
 */
class UserDeviceModel extends EventEmitter {
	constructor() {
		super();
	}

	/**
	 * Gets all devices connected to a user
	 * @param {string} id_user - UUID to identify the user
	 * @return {Promise<string[]>} - returns the ids of all devices for that user
	 * @throws {Error} - throws error if the query fails
	 */
	async getDevicesByUser(id_user) {
		const sql = `SELECT devices.id FROM devices
		INNER JOIN user_devices ON devices.id = user_devices.id_device
		WHERE user_devices.id_user = $1`;
		const result = await dbs.query(sql, [id_user]);
		return result.map((r) => r.id);
	}

	/*
	 * TODO: here a function should be implemented that is only for admins: add connections between devices and users
	 * This should emit an event to which the Websocketservice must listen to and update its map of devices.
	 */

	/**
	 * Connect users to devices they are allowed to control
	 * @param {string} id_user - UUID to identify the user
	 * @param {string} id_device - VARCHAR that identifies the device
	 * @return {Promise<boolean>} - returns true if user was able to be connected to the device
	 * @throws {Error} - throws error if the query fails
	 */
	async addUserToDevice(id_user, id_device) {
		const sql = `INSERT INTO user_devices (id_user, id_device) VALUES ($1, $2)`;
		const args = [id_user, id_device];
		const result = await dbs.query(sql, args);
		if (result.rowCount > 0) {
			this.emit("addedUserToD", { id_user, id_device });
		}
		return result.rowCount > 0;
	}
}

export default new UserDeviceModel();
