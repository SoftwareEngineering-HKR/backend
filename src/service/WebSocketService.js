import WebSocket, { WebSocketServer } from "ws";
import { messagehandler, handler } from "../handler/WSHandler.js";
import DeviceModel from "../model/DeviceModel.js";
import jwt from "jsonwebtoken";
import url from "url";
import UserDevicesModel from "../model/UserDevicesModel.js";
import RoomModel from "../model/RoomModel.js";
import UserModel from "../model/UserModel.js";

export class WebSocketService {
	/** @type {number} */
	#PORT = process.env.PORT_WS || 8080;
	/** @type {WebSocketServer} */
	#wss = new WebSocketServer({ port: this.#PORT });
	/** @type {Map<string, Set<WebSocket>>} */
	#deviceClients = new Map();
	/** @type {Map<string, Set<WebSocket>>} */
	#socketClients = new Map();
	/** @type {Map<string, Set<WebSocket>>} */
	#socketAdminClients = new Map();

	/**
	 * Start the websocket server so that the frontend can communicate with the backend
	 * @returns {void}
	 */
	startWebSocket() {
		this.#wss.on("listening", () => {
			console.log("WebSocket server is running on port 8080");
		});

		this.#wss.on("connection", (ws, req) => {
			console.log("Client connected");
			var token = url.parse(req.url, true).query.token;

			jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
				if (err) {
					ws.close();
					return;
				}
				this.#updateDeviceConnectionMap(ws, decoded.sub);

				if (!this.#socketClients.has(decoded.sub)) {
					this.#socketClients.set(decoded.sub, new Set());
				}
				this.#socketClients.get(decoded.sub).add(ws);

				if (decoded.role == "admin") {
					if (!this.#socketAdminClients.has(decoded.sub)) {
						this.#socketAdminClients.set(decoded.sub, new Set());
					}
					this.#socketAdminClients.get(decoded.sub).add(ws);
				}

				ws.on("message", async (data) => {
					try {
						const mesg = JSON.parse(data);
						const response = await messagehandler(mesg.type, mesg.payload, decoded.sub, decoded.role);
						if (response && ws.readyState === WebSocket.OPEN) {
							ws.send(JSON.stringify(response));
						}
					} catch (e) {
						console.error("Unexpected message", e);
					}
				});

				ws.on("error", (error) => {
					console.error("WebSocket error:", error);
				});

				ws.on("close", () => {
					for (const clients of this.#deviceClients.values()) {
						clients.delete(ws);
					}
					this.#socketClients.get(decoded.sub).delete(ws);
					this.#socketAdminClients.get(decoded.sub)?.delete(ws);
					console.log("Client disconnected:", decoded.sub);
				});
			});
		});

		UserDevicesModel.on("addedUserToID", ({ userID, device }) => {
			this.#socketClients.get(userID)?.forEach((ws) => {
				const clients = this.#deviceClients.get(device.id);
				if (!clients) {
					this.#deviceClients.set(device.id, new Set());
				}
				this.#deviceClients.get(device.id).add(ws);
			});
			this.#sendDeviceMessageToFrontend(device.id, "added new device", device, userID);
		});

		UserDevicesModel.on("deletedUserFromDevice", ({ userID, device }) => {
			this.#socketClients.get(userID)?.forEach((ws) => {
				const clients = this.#deviceClients.get(device.id);
				if (!clients) {
					return;
				}
				clients.delete(ws);
			});
			this.#sendDeviceMessageToFrontend(device.id, "removed device from user", device, userID);
		});

		DeviceModel.on("updateValue", ({ id, value }) => {
			this.#sendDeviceMessageToFrontend(id, "update value", value);
		});

		DeviceModel.on("newDevice", ({ id, scaleResult }) => {
			this.#sendDeviceMessageToFrontend(id, "new device", scaleResult);
		});

		DeviceModel.on("updateDevice", ({ id, name, description }) => {
			this.#sendDeviceMessageToFrontend(id, "update device description", { name, description });
		});

		DeviceModel.on("OnlineStateUpdate", ({ id, online }) => {
			this.#sendDeviceMessageToFrontend(id, "update device onlineState", online);
		});

		RoomModel.on("allRooms", (rooms) => {
			const clients = this.#socketClients.values();
			for (const set of clients) {
				for (const ws of set) {
					if (ws.readyState === WebSocket.OPEN) {
						ws.send(JSON.stringify({ type: "rooms", payload: { rooms } }));
					}
				}
			}
		});

		DeviceModel.on("deviceChangeAdmin", (devices) => {
			const clients = this.#socketAdminClients.values();
			for (const set of clients) {
				for (const ws of set) {
					if (ws.readyState === WebSocket.OPEN) {
						ws.send(JSON.stringify({ type: "device info", payload: { devices } }));
					}
				}
			}
		});

		DeviceModel.on("deviceChanges", async (users) => {
			if (!users) return;
			for (const user of users) {
				console.log("user id", user);
				const wsclients = this.#socketClients.get(user.id);
				console.log("user", user, wsclients, this.#socketClients);
				if (!wsclients) {
					continue;
				}
				const deviceIds = await UserDevicesModel.getDevicesByUser(user.id);
				const devices = await DeviceModel.getDevicesByIDs(deviceIds);
				for (const ws of wsclients) {
					if (ws.readyState === WebSocket.OPEN) {
						ws.send(JSON.stringify({ type: "inital devices", payload: { devices } }));
					}
				}
			}
		});

		UserModel.on("users", (users) => {
			const clients = this.#socketAdminClients.values();
			for (const set of clients) {
				for (const ws of set) {
					if (ws.readyState === WebSocket.OPEN) {
						ws.send(JSON.stringify({ type: "users", payload: { users } }));
					}
				}
			}
		});
	}

	/**
	 * Send list of device that the user has access to when this function is called
	 * @param {WebSocket} ws - Websocket that manages the connections
	 * @param {string} userId - ID of the connected user
	 * @returns {Promis<void>}
	 */
	async #updateDeviceConnectionMap(ws, userId) {
		// send list of devices that the user has access to when a frontend connects
		const devices = await handler.getUserDevices(userId).catch((e) => {
			console.error("Failed to get devices for user:", e);
			return [];
		});
		for (const device of devices) {
			if (!this.#deviceClients.has(device.id)) {
				this.#deviceClients.set(device.id, new Set());
			}
			this.#deviceClients.get(device.id).add(ws);
		}
		if (ws.readyState === WebSocket.OPEN) {
			console.debug(devices);
			ws.send(JSON.stringify({ type: "inital devices", payload: { devices } }));
		}
	}

	async #sendDeviceMessageToFrontend(deviceID, type, content, userID = null) {
		let clients;
		if (!userID) {
			clients = this.#deviceClients.get(deviceID) ?? [];
		} else {
			clients = this.#socketClients.get(userID) ?? [];
		}
		for (const ws of clients) {
			if (ws.readyState === WebSocket.OPEN) {
				ws.send(JSON.stringify({ type, payload: { deviceID, content } }));
			}
		}
	}
}
