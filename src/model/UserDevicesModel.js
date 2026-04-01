import dbs from "../service/DatabaseService.js";
import EventEmitter from "node:events";
import DeviceModel from "./DeviceModel.js";

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

	/**
	 * Connect users to devices they are allowed to control
	 * @param {string} userID - UUID to identify the user
	 * @param {string} deviceId - VARCHAR that identifies the device
	 * @return {Promise<boolean>} - returns true if user was able to be connected to the device
	 * @throws {Error} - throws error if the query fails
	 */
	async addUserToDevice(userID, deviceId) {
		const sql = `INSERT INTO user_devices (id_user, id_device) VALUES ($1, $2)`;
		const args = [userID, deviceId];
		const result = await dbs.query(sql, args);
		const devices = await DeviceModel.getDevicesByIDs([deviceId]);
		const device = devices[0];
		if (result) {
			this.emit("addedUserToID", { userID, device });
		}
		return result.rowCount > 0;
	}
}

export default new UserDeviceModel();
