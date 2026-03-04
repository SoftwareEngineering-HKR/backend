import WebSocket, { WebSocketServer } from "ws";
import { messagehandler } from "./handler/WSHandler.js";
import DeviceModel from "./model/DeviceModel.js";

const PORT = process.env.PORT_WS || 8080;
const wss = new WebSocketServer({ port: PORT });
wss.on("listening", () => {
	console.log("WebSocket server is running on port 8080");
});

wss.on("connection", function connection(ws) {
	console.log("Client connected");

	ws.on("message", function message(data) {
		const mesg = JSON.parse(data);
		messagehandler(mesg.type, mesg.payload);
	});
	ws.on("error", (error) => {
		console.error("WebSocket error:", error);
	});

	DeviceModel.on("updateValue", (deviceID, value) => {
		wss.clients.forEach(function each(client) {
			if (client.readyState === WebSocket.OPEN) {
				client.send(JSON.stringify({ deviceID, value }));
			}
		});
	});

	DeviceModel.on("newDevice", (deviceID, scaleResult) => {
		wss.clients.forEach(function each(client) {
			if (client.readyState === WebSocket.OPEN) {
				client.send(JSON.stringify({ deviceID, scaleResult }));
			}
		});
	});

	DeviceModel.on("updateDevice", (name, description) => {
		wss.clients.forEach(function each(client) {
			if (client.readyState === WebSocket.OPEN) {
				client.send(JSON.stringify({ name, description }));
			}
		});
	});
});
