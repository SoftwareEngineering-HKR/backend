//Imports goes here
import dbs from "../service/DatabaseService.js";
import DeviceModel from "./DeviceModel.js";
/**
 * Model for the room
 *
 */
class RoomModel {
	/**
	 * Gets the name of the room
	 * @param {string} id - UUID to identify the room
	 * @return {Promise<{name: string}>} - returns the name for that room
	 * @throws {Error} - if no room with that id is found
	 */

	async getRoom(id) {
		let sql = "SELECT name FROM rooms WHERE id = $1";
		const args = [id];
		const result = await dbs.query(sql, args);
		const row = result.rows[0];
		if (!row) {
			throw new Error("No room with that id was found.");
		}
		return { name: row.name };
	}

	/**
	 * Set the name for the room
	 * @param {string} name - the name of the room
	 * @return {Promise <{id: string, name: string }>} - returns id and name for the room
	 * @throws {Error} - If it was not possible to add a room
	 */

	async setRoom(name) {
		let sql = "INSERT INTO rooms (name) VALUES ($1) RETURNING id, name";
		const args = [name];
		const result = await dbs.query(sql, args);
		const row = result.rows[0];
		if (!row) {
			throw new Error("Error adding the room.");
		}
		return { id: row.id, name: row.name };
	}

	/**
	 * Updates the room name
	 * @param {string} id - UUID to identify the room
	 * @param {string} name - tthe new room name
	 * @return {Promise<boolean>} - returns true if update was successfull
	 */
	async updateRoom(id, name) {
		const sql = "UPDATE rooms SET name = $1 WHERE id = $2";
		const args = [name, id];
		const result = await dbs.query(sql, args);
		return result.rowCount > 0;
	}

	/**
	 * Deletes the room
	 * @param {string} id - UUID to identify the room
	 * @return {Promise<boolean>} - returns true if delete was successfull
	 */

	async deleteRoom(id) {
		const client = await dbs.pool.connect();
		try {
			await client.query("BEGIN");

			const result = await DeviceModel.deleteDeviceRoomID(id, client);

			await client.query("DELETE FROM rooms WHERE id_room = $1", [id]);
			await client.query("COMMIT");

			return result.rowCount;
		} catch (e) {
			await client.query("ROLLBACK");
			throw e;
		} finally {
			client.release();
		}
	}
}

export default new RoomModel();
