import { NetworkDiscoveryService } from "./service/NetworkDiscoveryService.js";
import { MqttBrokerService } from "./service/MqttBrokerService.js";
import { WebSocketService } from "./service/WebSocketService.js";
import { BluetoothService } from "./service/BluetoothService.js";

NetworkDiscoveryService.startNetworkDiscovery();
const broker = new MqttBrokerService();
broker.start();
const webSocketService = new WebSocketService();
webSocketService.startWebSocket();

const bluetoothService = new BluetoothService();
try {
	await bluetoothService.start();
} catch (error) {
	console.error(error);
}
