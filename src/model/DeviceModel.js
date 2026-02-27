//Imports goes here
import dbs from "../service/DatabaseService.js";
import scale from "../model/ScaleModel.js";
import { EventEmitter } from "node:events";

/**
 * Model for the device table
 *
 */
class DeviceModel extends EventEmitter {
	constructor() {
		super();
	}

	/**
	 * Gets all the divices
	 * @return {Promise<string[]>} - returns the id for all the devices
	 * @throws {Error} - if no devices was found
	 */

	async getDevices() {
		let sql = "SELECT id FROM Device";
		const args = [];
		const result = await dbs.query(sql, args);
		if (result.rows.length === 0) {
			throw new Error("No devices was found.");
		}
		return result.rows.map((r) => r.id);
	}

	/**
	 * Gets the name  and desciption of the device
	 * @param {string} id - UUID to identify the device
	 * @return {Promise<{name: string, description: string}>} - returns the name and description for that device
	 * @throws {Error} - if no device with that id is found
	 */

	async getDeviceInfo(id) {
		let sql = "SELECT name, description FROM Device WHERE id = $1";
		const args = [id];
		const result = await dbs.query(sql, args);
		const row = result.rows[0];
		if (!row) {
			throw new Error("No device with that id was found.");
		}
		return { name: row.name, description: row.description };
	}

	/**
	 * Set up a new device
	 * @param {string} id_room - the id for the room for the the device
	 * @param {string} ip - tip of the divice
	 * @param {string} name - the name of the device
	 * @param {string} description - the description of the device
	 * @param {string} value - value for the initial scale
	 * @param {string} max - max value for the scale
	 * @param {string} min - max value for the scale
	 * @return {Promise<string>} - returns id for the device
	 * @throws {Error} - If it was not possible to add a device
	 */

	async setDevice(id_room, ip, name, description, value, max, min) {
		const client = await dbs.pool.connect();
		try {
			await client.query("BEGIN");
			const deviceResult = await client.query(
				"INSERT INTO Device (id_room, ip, name, description)" + "VALUES ($1, $2, $3, $4) RETURNING id",
				[id_room, ip, name, description],
			);

			const deviceID = deviceResult.rows[0].id;

			const scaleResult = await scale.setValue(deviceID, value, min, max, client);

			await client.query("COMMIT");

			this.emit("newDevice", { deviceID, scaleResult });
			return deviceID;
		} catch (e) {
			await client.query("ROLLBACK");
			throw e;
		} finally {
			client.release();
		}
	}

	/**
	 * Updates the device name and description
	 * @param {string} id - UUID to identify the device
	 * @param {string} name - the new device name
	 * @param {string} description - tthe new description for the device
	 * @return {Promise<boolean>} - returns true if update was successfull
	 */

	async updateDevice(id, name, description) {
		const sql = "UPDATE Device SET name = $1, description = $2  WHERE id = $3";
		const args = [name, description, id];
		const result = await dbs.query(sql, args);
		this.emit("updateDevice", { name, description });
		return result.rowCount > 0;
	}

	/**
	 * Deletes the device
	 * @param {string} id - UUID to identify the device
	 * @return {Promise<boolean>} - returns true if delete was successfull
	 */

	async deleteDevice(id) {
		const sql = "DELETE FROM Device WHERE id = $1";
		const args = [id];
		const result = await dbs.query(sql, args);
		return result.rowCount > 0;
	}

	/**
	 * Deletes the device by room id
	 * @param {string} id_room - UUID to identify the room
	 * @return {Promise<boolean>} - returns true if delete was successfull
	 */

	async deleteDeviceRoomID(id_room, client = null) {
		const waiting = client ?? dbs.pool;
		const result = await waiting.query("DELETE FROM Device WHERE id_room = $1 RETURNING id", [id_room]);
		if (result.rowCount > 0) {
			for (const row of result.rows) {
				this.emit("deviceDeleted", { id: row.id });
			}
		}
		return result.rowCount > 0;
	}
	/**
	 * Updates the the device's scale
	 * @param {string} id - UUID to identify the scale
	 * @param {number} value - value of the new device scale setting
	 * @return {Promise<boolean>} - returns true if update was successfull
	 * @throws {Error} - if update was not successfull
	 */
	async updateValue(id, value) {
		let deviceID = await scale.updateValue(id, value);
		this.emit("updateValue", { deviceID, value });
		return;
	}

	/**
	 * Checks if device exists
	 * @param {string} id - UUID to identify the device
	 * @return {Promise<boolean>} - returns true if update was successfull
	 * @throws {Error} - if update was not successfull
	 */
	async checkIfDeviceExists(id) {
		const sql = "SELECT name FROM Device WHERE id = $1";
		const args = [id];
		const result = await dbs.query(sql, args);
		return result.rowCount > 0;
	}
}

export default new DeviceModel();
