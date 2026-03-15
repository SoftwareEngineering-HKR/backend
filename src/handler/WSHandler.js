import DeviceModel from "../model/DeviceModel.js";
import RoomModel from "../model/RoomModel.js";
import UserDeviceModel from "../model/UserDevicesModel.js";

export class WSHandler {
	/**
	 * Get devices that the user has access to
	 * @param {string} userID - ID of the user in question
	 * @returns {Promise<Array<Object>>}
	 * @throws {Error} If it was not able to call on getDevicesByUser function in UserDeviceModel
	 */
	async getUserDevices(userID) {
		const deviceIDs = await UserDeviceModel.getDevicesByUser(userID);
		const devices = await DeviceModel.getDevicesByIDs(deviceIDs);
		return devices;
	}

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
	 * @param {string} userId - Id of the user that is trying to update the devices value
	 */
	async update_value(data, userId) {
		const id = data.id;
		const value = data.value;
		const userDevices = await UserDeviceModel.getDevicesByUser(userId);
		if (!userDevices.includes(id)) {
			console.debug(`User ${userId} attempted to update device ${id} without access`);
			return this.#constructFrontendResponse(403, "User has no access to requested device.");
		}
		try {
			await DeviceModel.setValue(id, value);
		} catch (e) {
			console.error(e);
			return this.#constructFrontendResponse(500, "Device could not be contacted.");
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

	/**
	 * Response messages for the frontend after user actions
	 * @param {number} statusCode - the status code
	 * @param {string | undefined} message - optional message to the frontend
	 */
	#constructFrontendResponse(statusCode, message = "") {
		return {
			type: "action response",
			payload: {
				statusCode,
				message,
			},
		};
	}
}

export const handler = new WSHandler();

/**Message handeling
 * @param {JSON} type the message type
 * @param {JSON} payload the message payload
 */
export const messagehandler = async (type, payload, userId) => {
	const handlers = {
		"create room": handler.create_room.bind(handler),
		"creat device": handler.create_device.bind(handler),
		"update device": handler.update_device.bind(handler),
		"update room": handler.update_room.bind(handler),
		"delete room": handler.delete_room.bind(handler),
		"delete device": handler.delete_device.bind(handler),
		"update value": handler.update_value.bind(handler),
		"get devices": handler.get_device.bind(handler),
		"get room": handler.get_room.bind(handler),
	};

	const handelfunction = handlers[type];
	return await handelfunction(payload, userId);
};
