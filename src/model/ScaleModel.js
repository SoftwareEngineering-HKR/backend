//Imports goes here
import dbs from "../service/DatabaseService.js";
/**
 * Model for the scale
 *
 */
class ScaleModel {
	/**
	 * Gets a value for that scale
	 * @param {string} id - UUID to identify the scale
	 * @return {Promise<{value: number, max_value: number}>} - returns value and max value for that scale
	 * @throws {Error} - if no scale with that id is found
	 */

	async getValue(id) {
		let sql = "SELECT value, min_value, max_value FROM scales WHERE id = $1";
		const args = [id];
		const result = await dbs.query(sql, args);
		const row = result.rows[0];
		if (!row) {
			throw new Error("No scale for this device found.");
		}
		return { value: row.value, min_value: row.min_value, max_value: row.max_value };
	}

	/**
	 * Sets a value for that scale
	 * @param {string} device_id - UUID of the device
	 * @param {number} value - the value that will be the current value
	 * @param {number} min_value - min value for that device
	 * @param {number} max_value - max value for that device
	 * @param {object} client - client object so transaction will not be broken
	 * @return {Promise<{ row }>} - returns a row that holds id, value, min and max value for that scale
	 */

	async setValue(device_id, value, min_value, max_value, client = null) {
		const waiting = client ?? dbs.pool;
		const result = await waiting.query(
			"INSERT INTO scales (id_device, value, min_value, max_value)" +
				"VALUES ($1, $2, $3, $4) RETURNING id, value, min_value, max_value",
			[device_id, value, min_value, max_value],
		);
		const row = result.rows[0];
		return row;
	}

	/**
	 * Updates the value for that scale
	 * @param {string} id - UUID to identify the scale
	 * @param {number} value - the value that will be the current value
	 * @return {Promise<boolean>} - returns true if update was successfull
	 * @throws {Error} - If the value exceeds min_value or max_value
	 * @throws {Error} - If the row does not exists
	 */

	async updateValue(id, value) {
		const scale = await this.getValue(id);
		if (scale.max_value < value || scale.min_value > value) {
			throw new Error("Value can not exceed max value");
		}
		const sql = "UPDATE scales SET value = $1 WHERE id = $2 RETURNING id_device";
		const args = [value, id];
		const result = await dbs.query(sql, args);
		if (result.rowCount === 0) {
			throw new Error("Scale not found");
		}
		const row = result.rows[0];
		return row.id_device;
	}

	/**
	 * Deletes the value for that scale
	 * @param {string} id - UUID to identify the scale
	 * @return {Promise<boolean>} - returns true if delete was successfull
	 */

	async deleteValue(id) {
		const sql = "DELETE FROM scales WHERE id =$1";
		const args = [id];
		const result = await dbs.query(sql, args);
		return result.rowCount > 0;
	}
}

export default new ScaleModel();
