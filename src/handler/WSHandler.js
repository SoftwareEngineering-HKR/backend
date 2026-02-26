import DeviceModel from "../model/DeviceModel";
import RoomModel from "../model/RoomModel";

export class WSHandler {
	/**call to setDevice in model
	 * @param {JSON} data object payload from message
	 * @throws {Error} If it was not able to call on setDevice function in DeviceModel
	 */
	async create_device(data) {
		const id_room = data.id_room;
		const ip = data.ip;
		const device_name = data.name;
		const description = data.description;
		try {
			await DeviceModel.setDevice(id_room, ip, device_name, description);
		} catch (e) {
			console.error(e);
		}
	}

	/**call to setDevice in model
	 * @param {JSON} data object payload from message
	 * @throws {Error} If it was not able to call on setDevice function in DeviceModel
	 */
	async create_room(data) {
		const room_name = data.name;
		try {
			await RoomModel.setRoom(room_name);
		} catch (e) {
			console.error(e);
		}
	}
	/**call to updateDevice name and description in model
	 * @param {JSON} data object payload from message
	 */
	async update_device(data) {
		const id = data.id;
		const device_name = data.name;
		const description = data.description;
		try {
			await DeviceModel.updateDevice(id, device_name, description);
		} catch (e) {
			console.error(e);
		}
	}
	/**call to updateRoomwith new name in model
	 * @param {JSON} data object payload from message
	 */
	async update_room(data) {
		const id = data.id;
		const room_name = data.name;
		try {
			await RoomModel.updateRoom(id, room_name);
		} catch (e) {
			console.error(e);
		}
	}

	/**call to deleteRoom in room model
	 * @param {JSON} data object payload from message
	 */
	async delete_room(data) {
		const id = data.id;
		try {
			await RoomModel.deleteRoom(id);
		} catch (e) {
			console.error(e);
		}
	}

	/**call to deleteDevice in device model
	 * @param {JSON} data object payload from message
	 */
	async delete_device(data) {
		const id = data.id;
		try {
			await DeviceModel.deleteDevice(id);
		} catch (e) {
			console.error(e);
		}
	}

	/**call to updateValue in device model
	 * @param {JSON} data object payload from message
	 */
	async update_value(data) {
		const id = data.id;
		const value = data.value;
		try {
			await DeviceModel.updateValue(id, value);
		} catch (e) {
			console.error(e);
		}
	}

	/**call to getDevices in device model
	 */
	async get_device() {
		try {
			await DeviceModel.getDevices();
		} catch (e) {
			console.error(e);
		}
	}

	/**call to getRoom in room model
	 * @param {JSON} data object payload from message
	 */
	async get_room(data) {
		try {
			await RoomModel.getRoom(data.id);
		} catch (e) {
			console.error(e);
		}
	}
}

const handler = new WSHandler();

/**Message handeling
 * @param {JSON} type the message type
 * @param {JSON} payload the message payload
 */
export const messagehandler = async (type, payload) => {
	const handlers = {
		create_room: handler.create_room.bind(handler),
		creat_device: handler.create_device.bind(handler),
		update_device: handler.update_device.bind(handler),
		update_room: handler.update_room.bind(handler),
		delete_room: handler.delete_room.bind(handler),
		delete_device: handler.delete_device.bind(handler),
		update_value: handler.update_value.bind(handler),
		get_devices: handler.get_device(),
		get_room: handler.get_room.bind(handler),
	};

	const handelfunction = handlers[type];
	await handelfunction(payload);
};
