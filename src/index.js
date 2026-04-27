import { NetworkDiscoveryService } from "./service/NetworkDiscoveryService.js";
import { MqttBrokerService } from "./service/MqttBrokerService.js";
import { WebSocketService } from "./service/WebSocketService.js";
import { router } from "./service/Routes.js";
import BluetoothService from "./service/BluetoothService.js";
import express from "express";
import cookieParser from "cookie-parser";
import UserModel from "./model/UserModel.js";

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use("/", router);

const PORT_HTTP = process.env.PORT_HTTP || 8081;
app.listen(PORT_HTTP, () => console.log(`Server running on ${PORT_HTTP}`));

NetworkDiscoveryService.startNetworkDiscovery();
const broker = new MqttBrokerService();
broker.start();
const webSocketService = new WebSocketService();
webSocketService.startWebSocket();

try {
	await BluetoothService.start();
} catch (error) {
	console.error(error);
}

const result = await UserModel.getAllUsers();
if (result.length == 0) {
	await UserModel.addUser("admin", "password", "admin");
}
