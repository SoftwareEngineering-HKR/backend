import DeviceModel from "../model/DeviceModel"
import RoomModel from "../model/RoomModel"

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
        device_name = data.name
        description = data.description
        try{
            await DeviceModel.setDevice(id_room, ip, device, description)  
        }catch(e){
            console.log(e)
        }
        
    }
    /**call to setDevice in model
     * @param {JSON} data object payload from message
     * @throws {Error} If it was not able to call on setDevice function in DeviceModel 
     */
    async create_room(data){
        room_name = data.name
        try{
            await RoomModel.setRoom(room_name)  
        }catch(e){
            console.log(e)
        }
    }
    /**Update device name and description  
     * @param {JSON} data object payload from message
    */
    async update_device(data){
        id = data.id
        device_name = data.name
        description = data.description
        try{
            await DeviceModel.updateDevice(id, device_name, description)  
        }catch(e){
            console.log(e)
        }
    }
    /**Update room name 
     * @param {JSON} data object payload from message
    */
    async update_room(data){
        id = data.id
        room_name = data.name
        try{
            await RoomModel.updateRoom(id, room_name)  
        }catch(e){
            console.log(e)
        }
    }

    /**Delete room
     * @param {JSON} data object payload from message
     */
    async delete_room(data){
        id = data.id
        try{
            await RoomModel.deleteRoom(id, room_name)  
        }catch(e){
            console.log(e)
        }
    }

     /**Delete device
     * @param {JSON} data object payload from message
     */
    async delete_device(data){
        id = data.id
        
        try{
            await DeviceModel.deleteDevice(id, room_name)  
        }catch(e){
            console.log(e)
        }
    }

    /**Update scale value in device
     * @param {JSON} data object payload from message
     */
    async update_value(data){
        id = data.id
        value = data.value
        try{
            await DeviceModel.updateValue(id, value)  
        }catch(e){
            console.log(e)
        }
    }

    async get_device(data){
        id = data.id
        try{
            await DeviceModel.getDevices(id)  
        }catch(e){
            console.log(e)
        }
    }

    async get_room(data){
        try{
            await RoomModel.getRoom(data.id)
        }catch(e){
            console.log(e)
        }
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
    "delete_device": delete_device,
    "update_value": update_value
    }