//Imports goes here
import dbs from '../service/DatabaseService.js'
import scale from '../model/ScaleModel.js'

/**
 * Model for the device table
 *
 */
class DeviceModel {
	/**
	 * Gets all the divices
	 * @return {Promise<string[]>} - returns the id for all the devices
	 * @throws {Error} - if no devices was found
	 */

	async getDevices() {
		let sql = "SELECT id FROM Device";
		const args = [];
		const result = await dbs.query(sql, args);
		if (result.rows.lenght === 0) {
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
	 * Gets the ip from a device
	 * @param {string} id - UUID to identify the device
	 * @return {Promise<string>} - returns the ip for that device
	 * @throws {Error} - if no device with that id is found
	 */

	async getDeviceIp(id) {
		let sql = "SELECT ip FROM Device WHERE id = $1";
		const args = [id];
		const result = await dbs.query(sql, args);
		const row = result.rows[0];
		if (!row) {
			throw new Error("No device with that id was found.");
		}
		return row.ip;
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
    
    async setDevice(id_room, ip, name, description, value, max, min){
        
        let sql = 'INSERT INTO Device (id_room, ip, name, description) VALUES ($1, $2, $3, $4) RETURNING id'
        const args = [id_room, ip, name, description]
        const result = await dbs.query(sql, args)
        const row = result.rows[0]
        if(!row){
            throw new Error('Error adding the new device.')
        }
        scale.setValue(row.id, value, max, min)
        return row.id
    }
  
  /**
	 * Updates the device name and description
	 * @param {string} id - UUID to identify the device
	 * @param {string} name - the new device name
	 * @param {string} description - tthe new description for the device
	 * @return {Promise<boolean>} - returns true if update was successfull
	 */

	async updateDevice(id, name, desciption) {
		const sql = "UPDATE Device SET name = $1, desciption = $2  WHERE id = $3";
		const args = [name, desciption, id];
		const result = await dbs.query(sql, args);
		return result.rowCount > 0;
	}

    /** 
    * Deletes the device
    * @param {string} id - UUID to identify the device
    * @return {Promise<boolean>} - returns true if delete was successfull
    */

    async deleteDevice(id){
        const sql = 'DELETE FROM Device WHERE id = $1'
        const args = [id]
        const result = await dbs.query(sql, args)
        return result.rowCount > 0
    }
    /** 
    * Updates the the device's scale
    * @param {string} id - UUID to identify the scale
    * @param {number} value - value of the new device scale setting
    * @return {Promise<boolean>} - returns true if update was successfull
    * @throws {Error} - if update was not successfull
    */
    async updateValue(id, value){
        const success = scale.updateValue(id, value);
        if(!success){
            throw new Error("Could not set a new value.")
        }
        return success
    }
}

export default new DeviceModel();
