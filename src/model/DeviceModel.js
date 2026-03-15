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
		let sql = "SELECT id FROM devices";
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
		let sql = "SELECT name, description FROM devices WHERE id = $1";
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
	 * @param {string} id - the id for the device
	 * @param {string} id_room - the id for the room for the the device
	 * @param {string} type - type of the deivce
	 * @param {boolean} online - the online state of the device
	 * @param {string} ip - the ip of the device
	 * @param {string} name - the name of the device
	 * @param {string} description - the description of the device
	 * @param {string} value - value for the initial scale
	 * @param {string} max - max value for the scale
	 * @param {string} min - min value for the scale
	 * @return {Promise<string>} - returns id for the device
	 * @throws {Error} - If it was not possible to add a device
	 */

	async setDevice(id, id_room, type, online, ip, name, description, value, max, min) {
		try {
			await dbs.query("BEGIN");
			await dbs.query(
				"INSERT INTO devices (id, id_room, type, online, ip, name, description) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
				[id, id_room, type, online, ip, name, description],
			);

			const scaleResult = await scale.setValue(id, value, min, max, dbs);

			await dbs.query("COMMIT");

			this.emit("newDevice", { id, scaleResult });
			return id;
		} catch (e) {
			await dbs.query("ROLLBACK");
			throw e;
		}
	}

	/**
	 * Set up a new device
	 * @param {string} ip - tip of the divice
	 * @return {Promise<string>} - returns id for the device
	 * @throws {Error} - If it was not possible to add a device
	 */

	async initDevice(ip, mac) {
		const sql = "INSERT INTO devices (id, ip)" + "VALUES ($1, $2)";
		const args = [mac, ip];
		await dbs.query(sql, args);
	}

	/**
	 * Updates the device name and description
	 * @param {string} id - UUID to identify the device
	 * @param {string} name - the new device name
	 * @param {string} description - tthe new description for the device
	 * @return {Promise<boolean>} - returns true if update was successfull
	 */

	async updateDevice(id, name, description) {
		const sql = "UPDATE devices SET name = $1, description = $2  WHERE id = $3";
		const args = [name, description, id];
		const result = await dbs.query(sql, args);
		this.emit("updateDevice", { id, name, description });
		return result.rowCount > 0;
	}

	/**
	 * Deletes the device
	 * @param {string} id - UUID to identify the device
	 * @return {Promise<boolean>} - returns true if delete was successfull
	 */

	async deleteDevice(id) {
		const sql = "DELETE FROM devices WHERE id = $1";
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
		const result = await waiting.query("DELETE FROM devices WHERE id_room = $1 RETURNING id", [id_room]);
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
	 * Updates the the device's scale; this function is supposed to be used by the frontend
	 * @param {string} id - Id of the device to identify the scale
	 * @param {number} value - value of the new device scale setting
	 * @return {Promise<boolean>} - returns true if update was successfull
	 * @throws {Error} - if update was not successfull
	 */
	async setValue(id, value) {
		this.emit("sendPublish", { id, value });
		return;
	}

	/**
	 * Updates the the device's online state
	 * @param {string} id - UUID to identify the scale
	 * @param {boolean} online - state of the device's online status
	 * @return {Promise<boolean>} - returns true if update was successfull
	 * @throws {Error} - if update was not successfull
	 */
	async updateDeviceStatus(id, online) {
		const sql = "UPDATE devices SET online = $1 WHERE id = $2";
		const args = [online, id];
		const result = await dbs.query(sql, args);
		this.emit("OnlineStateUpdate", { id, online });
		return result.rowCount > 0;
	}

	/**
	 * Checks if device exists
	 * @param {string} id - UUID to identify the device
	 * @return {Promise<boolean>} - returns true if device exists, else false
	 * @throws {Error} - if query was not successfull
	 */
	async checkIfDeviceExists(id) {
		const sql = "SELECT ip FROM devices WHERE id = $1";
		const args = [id];
		const result = await dbs.query(sql, args);
		if (result.length > 0) {
			return true;
		}
		return false;
	}

	/**
	 * Get current value of a device.
	 * @param {string} id - ID to identify the device
	 * @return {Promise<boolean>} - returns true if device exists, else false
	 * @throws {Error} - if query was not successfull
	 */
	async getDeviceValue(id) {
		const scaleResult = await scale.getValue(id);
		return scaleResult.value;
	}

	/**
	 * Gets full device info for a list of device IDs
	 * @param {string[]} ids - list of device IDs
	 * @return {Promise<{Object}[]>}
	 * @throws {Error} - if query was not successfull
	 */
	async getDevicesByIDs(ids) {
		if (ids.length === 0) return [];
		const sql = `
			SELECT
				devices.id,
				rooms.name AS room,
				devices.type,
				devices.online,
				devices.ip,
				devices.name,
				devices.description,
				scales.value,
				scales.max_value,
				scales.min_value,
				scales.name AS scale_name
			FROM devices
			LEFT JOIN rooms ON devices.id_room = rooms.id
			LEFT JOIN scales ON devices.id = scales.id_device
			WHERE devices.id = ANY($1)
		`;
		const result = await dbs.query(sql, [ids]);
		return result;
	}
}

export default new DeviceModel();
