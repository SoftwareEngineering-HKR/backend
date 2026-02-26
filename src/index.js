import { WebSocketServer } from "ws";
import { messagehandler } from "./handler/WSHandler";

const websocket = new WebSocketServer({ port: 8080 });

websocket.on("connection", function connection(ws) {
	ws.on("message", function message(data) {
		const mesg = JSON.parse(data);
		messagehandler(mesg.prototype, mesg.payload);
	});
	ws.on("error", console.error);
});
