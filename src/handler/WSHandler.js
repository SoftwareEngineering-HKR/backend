import DeviceModel from "../model/DeviceModel"

export class WSHandler{
   
    /** Option two for message handeling 
     * @param {JSON} message the websocket message
     */
    messagehandler(message){
        let handler = handlers(message.type)
        handler(message.data)

    }

    /**call to setDevice in model
     * @param {JSON} data object payload from message
     * @throws {Error} If it was not able to call on setDevice function in DeviceModel 
     */
    async creat_device(data){
        id_room = data.id_room
        ip = data.ip
        nam = data.name
        description = data.description
        try{
          DeviceModel.setDevice(id_room, ip, nam, description)  
        }catch(e){
            console.log(e)
        }
    }
    /**call to setDevice in model
     * @param {JSON} data object payload from message
     * @throws {Error} If it was not able to call on setDevice function in DeviceModel 
     */
    async create_room(data){

    }
    /**Update device settings  
     * @param {JSON} data object payload from message
    */
    async update_device(data){

    }
    /**Update room with adding device or removing 
     * @param {JSON} data object payload from message
    */
    async update_room(data){

    }

}

/** Has all the functions related to type  
*/
const handlers = {
    "create_room": create_room,
    "creat_device": create_device,
    "update_device": update_device,
    "update_room": update_room,
    "delete_room": delete_room,
    "delete_device": delete_device
    }