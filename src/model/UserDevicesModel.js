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
}

export default new UserDeviceModel();
