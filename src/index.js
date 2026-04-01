import { NetworkDiscoveryService } from "./service/NetworkDiscoveryService.js";
import { MqttBrokerService } from "./service/MqttBrokerService.js";
import { WebSocketService } from "./service/WebSocketService.js";
import { router } from "./service/Routes.js";

const express = require("express");

const app = express();

app.use(express.json());

app.use("/", router);

const PORT = process.env.PORT || 8081;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));

NetworkDiscoveryService.startNetworkDiscovery();
const broker = new MqttBrokerService();
broker.start();
const webSocketService = new WebSocketService();
webSocketService.startWebSocket();
