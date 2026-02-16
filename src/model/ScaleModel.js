//Imports goes here
import dbs from '../service/DatabaseService.js'
/**
* Model for the scale
* 
*/
class ScaleModel {

    /** 
    * Gets a value for that scale
    * @param {string} id - UUID to identify the scale
    * @return {Promise<{value: number, max_value: number,  min_value: number}>} - returns value and max value for that scale
    * @throws {Error} - if no scale with that id is found
    */
    
    async getValue(id){
        let sql = 'SELECT value, max_value, min_value FROM Scale WHERE id = $1'
        const args = [id]
        const result = await dbs.query(sql, args)
        const row = result.rows[0]
        if(!row){
            throw new Error('No scale for this device found.')
        }
        return {value: row.value,
                max_value: row.max_value, min_value: row.min_value
        }
    }

    /** 
    * Sets a value for that scale
    * @param {string} device_id - UUID of the device
    * @param {number} value - the value that will be the current value
    * @param {number} max_value - max value for that device
    * @param {number} min_value - max value for that device
    * @return {Promise<{id: string, value: number, max_value: number. min_value: number }>} - returns id, value and max value for that scale
    * @throws {Error} - If it was not possible to set the value for that device at this time
    */
    
    async setValue(device_id, value, max_value, min_value){
        let sql = 'INSERT INTO Scale (id_device, value, max_value, min_value) VALUES ($1, $2, $3, $4) RETURNING id, value, max_value, min_value'
        const args = [device_id, value, max_value, min_value]
        const result = await dbs.query(sql, args)
        const row = result.rows[0]
        if(!row){
            throw new Error('Error setting the value at this time.')
        }
        return {id: row.id, 
                value: row.value,
                max_value: row.max_value,
                min_value: row.min_value
        }
    }

    /** 
    * Updates the value for that scale
    * @param {string} id - UUID to identify the scale
    * @param {number} value - the value that will be the current value
    * @return {Promise<boolean>} - returns true if update was successfull
    * @throws {Error} - If the value exceeds max_value
    * @throws {Error} - If the value exceeds min_value
    */

    async updateValue(id, value){
        const scale = await this.getValue(id)
        if (scale.max_value < value){
            throw new Error ('Value can not exceed max value')
        }
        if(scale.min_value > value){
            throw new Error ('Value can not exceed min value')
        }
        const sql = 'UPDATE Scale SET value = $1 WHERE id = $2'
        const args = [value, id]
        const result = await dbs.query(sql, args)
        return result.rowCount > 0
    }

    /** 
    * Deletes the value for that scale
    * @param {string} id - UUID to identify the scale
    * @return {Promise<boolean>} - returns true if delete was successfull
    */

    async deleteValue(id){
        const sql = 'DELETE FROM Scale WHERE id =$1'
        const args = [id]
        const result = await dbs.query(sql, args)
        return result.rowCount > 0
    }
}


export default new ScaleModel()