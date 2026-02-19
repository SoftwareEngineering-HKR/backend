import net from "net";

export class MqttBrokerService {
	#clients = new Map();
	// #subscriptions = new Map();
	// #sessions = new Map();

	start() {
		const server = net.createServer((socket) => {
			console.debug("Client connected");

			socket.on("data", (data) => {
				console.debug(`Received: ${data.toString()}`);

				if (data.length < 2) socket.end();

				const packetType = data[0] >> 4;
				// const flags = data[0] << 4;
				const remainingLength = data[1];

				this.#logPacketType(packetType);

				switch (packetType) {
					case 1:
						if (remainingLength < 11) {
							socket.end();
							break;
						}
						this.#handleConnect(socket, data.subarray(2, 2 + remainingLength));
						break;

					case 3:
						this.#handlePublish();
						break;

					case 8:
						this.#handleSubscribe();
						break;

					case 14:
						this.#handeDisconnect();
						break;

					default:
						console.debug("Closing socket, as MQTT packet type did not match");
						socket.end();
						break;
				}
			});

			socket.on("end", () => {
				console.debug("Closing socket.");
			});

			socket.on("error", (error) => {
				console.error(`Socket Error: ${error.message}`);
			});
		});

		server.on("error", (error) => {
			console.error(`Server Error: ${error.message}`);
		});

		server.listen(process.env.MQTT_BROKER_PORT || 1883, () => {
			console.log(`MQTT socker listening on port: ${process.env.MQTT_BROKER_PORT || 1883}`);
		});
	}

	/**
	 * Check if all the received data matches the needed MQTT protocol
	 * @param {net.Socket} socket - Socket that holds the connection information to the MQTT client
	 * @param {Buffer<ArrayBufferLike>} packet - Variable header + payload of the MQTT packet
	 * @returns {void}
	 */
	#handleConnect(socket, packet) {
		const protocolNameLength = (packet[0] << 8) + packet[1];
		const protocolName = packet.subarray(2, 2 + protocolNameLength).toString();
		const protocolVersion = packet[6]; // 4 == 3.1.1

		console.debug(protocolName, protocolVersion);

		if (protocolName.toString() !== "MQTT" || protocolVersion !== 4) {
			console.error(
				`Expected protocol name: "MQTT", recieved: "${protocolName.toString()}"; expected protocol version: 4, recieved: ${protocolVersion}`,
			);
			// TODO: send connectack with error code
			socket.end();
		}

		const payload = packet.subarray(10, packet.length);
		const clientNameLength = (payload[0] << 8) + payload[1];
		const clientName = payload.subarray(2, 2 + clientNameLength).toString();
		console.debug(clientName);

		if (this.#clients.has(clientName)) {
			const connAck = [0x20, 0x02, 0x01, 0x00];
			//TODO: handle session restoration
			socket.write(Buffer.from(connAck));
		} else {
			//TODO: add client to clients map
			const connAck = [0x20, 0x02, 0x00, 0x00];
			socket.write(Buffer.from(connAck));
		}
	}

	#handleSubscribe(clientId, packet) {
		console.debug(clientId, packet);
	}

	#handlePublish(clientId, packet) {
		console.debug(clientId, packet);
	}

	#handeDisconnect() {}

	// for debugging :)
	#logPacketType(identifier) {
		console.debug(identifier);
		if (identifier == 1) console.debug("CONNECT");
		else if (identifier == 2) console.debug("CONNACK");
		else if (identifier == 3) console.debug("PUBLISH");
	}
}
