import DeviceModel from "../model/DeviceModel.js";
import RoomModel from "../model/RoomModel.js";
import UserDeviceModel from "../model/UserDevicesModel.js";
import UserModel from "../model/UserModel.js";
import BluetoothService from "../service/BluetoothService.js";

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
			return this.constructFrontendResponse(403, "User has no access to requested device.");
		}
		try {
			await DeviceModel.setValue(id, value);
		} catch (e) {
			console.error(e);
			return this.constructFrontendResponse(500, "Device could not be contacted.");
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
	 * Call to promoteUser in user model
	 * @param {JSON} data object payload from message
	 */
	async setUserRole(data) {
		try {
			await UserModel.setUserRole(data.userName, data.role);
			return this.constructFrontendResponse(200, "Promoted users successfully!");
		} catch (e) {
			console.error(e);
			return this.constructFrontendResponse(500, "Error, could not update the user to desired role!");
		}
	}

	/**
	 * Call to deleteUser in user model
	 * @param {JSON} data object payload from message
	 */
	async deleteUser(data) {
		try {
			await UserModel.deleteUser(data.userName);
			return this.constructFrontendResponse(200, "Deleted user successfully!");
		} catch (e) {
			console.error(e);
			return this.constructFrontendResponse(500, "Error in deleting user!");
		}
	}

	/**
	 * Call to add user to a specific device
	 * @param {JSON} data object payload from message
	 */
	async addUserToDevice(data) {
		try {
			await UserDeviceModel.addUserToDevice(data.userId, data.deviceId);
			return this.constructFrontendResponse(200, "Successfully assigned device to user!");
		} catch (e) {
			console.error(e);
			return this.constructFrontendResponse(500, "Failed to connect user to device");
		}
	}
	/**
	 * So that the admin can delete themself from a device
	 * @param {JSON} data object payload from message
	 */
	async deleteUserFromDevice(data){
		try{
			await UserDeviceModel.deleteUserFromDevice(data.userId, data.deviceId);
			return this.constructFrontendResponse(200, "Successfully deleted user from device!");
		} catch (e) {
			console.error(e);
			return this.constructFrontendResponse(500, "Failed to remove user from device.");
		}
	}
	
	/**
	 * So that the user themself can delete themself from a device
	 * @param {userId} string - Id for the user sending the request 
	 */

	async deleteYourselfFromDevice(userId, data){
		try{
			await UserDeviceModel.deleteYourselfFromDevice(userId, data.deviceId);
			return this.constructFrontendResponse(200, "Successfully deleted user from device!");
		} catch (e) {
			console.error(e);
			return this.constructFrontendResponse(500, "Failed to remove user from device.");
		}
	}
	/**
	 * Response messages for the frontend after user actions
	 * @param {number} statusCode - the status code
	 * @param {string | undefined} message - optional message to the frontend
	 */
	constructFrontendResponse(statusCode, message = "") {
		return {
			type: "action response",
			payload: {
				statusCode,
				message,
			},
		};
	}

	/**
	 * Method to get available bluetooth device
	 */
	async get_bluetooth_devices() {
		try {
			const devices = await BluetoothService.scan();
			return { type: "bluetooth devices", payload: { devices } };
		} catch (e) {
			console.error(e);
			return this.constructFrontendResponse(500, "Bluetooth scan failed.");
		}
	}

	/**
	 * Method to connect to a bluetooth device
	 * @param {JSON} data - object payload from message
	 */
	async connect_bluetooth_device(data) {
		try {
			await BluetoothService.connectDevice(data.id);
			return this.constructFrontendResponse(200, "Bluetooth device successfully connected to network!");
		} catch (e) {
			console.error(e);
			return this.constructFrontendResponse(500, "Bluetooth connection to device failed.");
		}
	}
	async getUsers() {
		try {
			const users = await UserModel.getAllUsers();
			return { type: "users", payload: { users } };
		} catch (e) {
			console.error(e);
			return this.constructFrontendResponse(500, "Failed to get users.");
		}
	}


}

export const handler = new WSHandler();

/**Message handeling
 * @param {JSON} type the message type
 * @param {JSON} payload the message payload
 * @param {JSON} userId of the user that sent the message
 */
export const messagehandler = async (type, payload, userId) => {
	const handlers = {
		"get users": handler.getUsers.bind(handler),
		"create room": handler.create_room.bind(handler),
		"create device": handler.create_device.bind(handler),
		"update device": handler.update_device.bind(handler),
		"update room": handler.update_room.bind(handler),
		"delete room": handler.delete_room.bind(handler),
		"delete device": handler.delete_device.bind(handler),
		"update value": handler.update_value.bind(handler),
		"get devices": handler.get_device.bind(handler),
		"get room": handler.get_room.bind(handler),
		"get bluetooth devices": handler.get_bluetooth_devices.bind(handler),
		"connect bluetooth device": handler.connect_bluetooth_device.bind(handler),
		"update user role": handler.setUserRole.bind(handler),
		"delete user": handler.deleteUser.bind(handler),
		"add user to device": handler.addUserToDevice.bind(handler),
		"deletedUserFromDevice": handler.deleteUserFromDevice.bind(handler),
		"delete yourself from device": handler.deleteYourselfFromDevice.bind(handler)
	};

	const handelfunction = handlers[type];
	return await handelfunction(payload, userId);
};

export const permissions = {
	"get users": ["admin"],
	"create room": ["admin"],
	"create device": ["admin"],
	"update device": ["admin"],
	"update room": ["admin"],
	"delete room": ["admin"],
	"delete device": ["admin"],
	"update value": ["admin", "user"],
	"get devices": ["admin", "user"],
	"get room": ["admin"],
	"get bluetooth devices": ["admin"],
	"connect bluetooth device": ["admin"],
	"update user role": ["admin"],
	"delete user": ["admin"],
	"add user to device": ["admin"],
	"deletedUserFromDevice": ["admin"],
	"delete yourself from device": ["admin", "user"],
};
