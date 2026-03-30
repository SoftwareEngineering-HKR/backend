import { NetworkDiscoveryService } from "./service/NetworkDiscoveryService.js";
import { MqttBrokerService } from "./service/MqttBrokerService.js";
import { WebSocketService } from "./service/WebSocketService.js";
import { router } from "./service/Routes.js";

const express = require("express");
const cors = require("cors");

const app = express();

var corsOptions = {
  origin: //frontend loclahost here
};

app.use(cors(corsOptions));
app.use(express.json())

app.use("/", router);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));

NetworkDiscoveryService.startNetworkDiscovery();
const broker = new MqttBrokerService();
broker.start();
const webSocketService = new WebSocketService();
webSocketService.startWebSocket();
