//Imports goes here
import dbs from '../services/DatabaseService.js'
/**
 * 
 * A model to interact with the 'Scale' table in the database
 * 
 * @class
 */
class ScaleModel {

    #table = 'Scale'

    async getValue(id){
        let sql = 'GET * FROM ?? WHERE id = ??'
        const args = [this.#table, id]
        return await dbs.query(sql, args)
    }

    async setValue(id, value, max_value){
        let sql = 'INSERT INTO ?? (id_device, value, max_value) VALUES (?, ?, ?)'
        const args = [this.#table, id, value, max_value]
        const result = await dbs.query(sql, args)
        return result.id

    }

    async updateValue(id, value){
        const scale = this.getValue(id)
        if (scale.max_value < value){
            throw new Error ('Value can not exeed max value')
        }
        const sql = 'UPDATE ?? SET value = ? WHERE id = ?'
        const args = [this.#table, value, id]
        const result = await dbs.query(sql, args)
        return result.affectedRows > 0
    }

    async deleteValue(id){
        const sql = 'DETETE FROM ?? WHERE id =?'
        const args = [this.#table, id]
        const result = await dbs.query(sql, args)
        return result.affectedRows > 0
    }
}


export default new ScaleModel()


/**
 * 
 * 
 * CREATE TABLE Scale (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    id_device UUID NOT NULL REFERENCES Device(id),
    value NUMERIC NOT NULL,
    max_value NUMERIC NOT NULL
);

 */