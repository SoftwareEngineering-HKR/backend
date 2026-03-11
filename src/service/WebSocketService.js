import WebSocket, { WebSocketServer } from "ws";
import { messagehandler } from "../handler/WSHandler.js";
import DeviceModel from "../model/DeviceModel.js";
import UserDeviceModel from "../model/UserDevicesModel.js";

export class WebSocketService {
	/** @type {number} */
	#PORT = process.env.PORT_WS || 8080;
	/** @type {WebSocketServer} */
	#wss = new WebSocketServer({ port: this.#PORT });
	/** @type {typeof UserDeviceModel} */
	#userDeviceModel = UserDeviceModel;

	/**
	 * Start the websocket server so that the frontend can communicate with the backend
	 * @returns {void}
	 */
	startWebSocket() {
		this.#wss.on("listening", () => {
			console.log("WebSocket server is running on port 8080");
		});

		// TODO: this should be replaced later by parsing the UserID from the access token
		const userId = "6a77949f-4a2d-4d17-9fc2-62c7249d1a58";

		this.#wss.on("connection", async (ws) => {
			console.log("Client connected");

			const userDevices = await this.#userDeviceModel.getDevicesByUser(userId);
			console.debug(userDevices);

			ws.on("message", function message(data) {
				const mesg = JSON.parse(data);
				messagehandler(mesg.type, mesg.payload);
			});
			ws.on("error", (error) => {
				console.error("WebSocket error:", error);
			});
		});

		DeviceModel.on("updateValue", (deviceID, value) => {
			this.#wss.clients.forEach(function each(client) {
				if (client.readyState === WebSocket.OPEN) {
					client.send(JSON.stringify({ deviceID, value }));
				}
			});
		});

		DeviceModel.on("newDevice", (deviceID, scaleResult) => {
			this.#wss.clients.forEach(function each(client) {
				if (client.readyState === WebSocket.OPEN) {
					client.send(JSON.stringify({ deviceID, scaleResult }));
				}
			});
		});

		DeviceModel.on("updateDevice", (name, description) => {
			this.#wss.clients.forEach(function each(client) {
				if (client.readyState === WebSocket.OPEN) {
					client.send(JSON.stringify({ name, description }));
				}
			});
		});
	}
}
