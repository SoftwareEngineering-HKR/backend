import net from "net";

export class MqttBrokerService {
	#clients = new Map();
	// #subscriptions = new Map();
	// #sessions = new Map();

	start() {
		const server = net.createServer((socket) => {
			console.debug("Client connected");
			socket._buffers = [];
			socket._bufferedBytes = 0;

			socket.on("data", (data) => {
				socket._buffers.push(data);
				socket._bufferedBytes += data.length;
				this.#processBuffer(socket);
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
	 * Gets the incoming data of the TCP socket.
	 * Checks if full MQTT packet has arrived and processes the content of it.
	 * @param {net.Socket} socket - The socket object where a MQTT client is bound to
	 * @returns {void}
	 */
	#processBuffer(socket) {
		while (true) {
			//TODO: prevent socket waiting for huge datasizes
			if (socket._bufferedBytes < 2) return; // no header

			const buffer = Buffer.concat(socket._buffers, socket._bufferedBytes);
			const res = this.#getRemainingLength(buffer);
			if (!res) return;

			const { remainingLength, bytesUsed } = res;
			const fixedHeaderLength = 1 + bytesUsed;
			const totalPacketLength = fixedHeaderLength + remainingLength;

			if (socket._bufferedBytes < totalPacketLength) return;

			const packet = buffer.subarray(0, totalPacketLength);
			this.#handlePacket(socket, packet[0] >> 4, packet.subarray(fixedHeaderLength));

			// remove MQTT packet from buffer
			let bytesToRemove = totalPacketLength;
			while (bytesToRemove > 0 && socket._buffers.length > 0) {
				const socketBuffer = socket._buffers[0];
				if (socketBuffer.length <= bytesToRemove) {
					bytesToRemove -= socketBuffer.length;
					socket._buffers.shift();
				} else {
					socket._buffers[0] = socketBuffer.subarray(bytesToRemove);
					bytesToRemove = 0;
				}
			}
			socket._bufferedBytes -= totalPacketLength;
		}
	}

	/**
	 * Handle the different MQTT message types
	 * @param {net.Socket} socket - The socket object where the client is bound to
	 * @param {number} packetType - The identifier that shows what the content of the message is
	 * @param {Buffer<ArrayBuffer>} payload - The payload of the MQTT message
	 * @returns {void}
	 */
	#handlePacket(socket, packetType, payload) {
		this.#logPacketType(packetType);

		switch (packetType) {
			case 1:
				this.#handleConnect(socket, payload);
				break;

			case 3:
				this.#handlePublish(socket, payload);
				break;

			case 8:
				this.#handleSubscribe(socket, payload);
				break;

			case 14:
				this.#handleDisconnect(socket);
				break;

			default:
				socket.end();
		}
	}

	/**
	 * Check if all the received data matches the needed MQTT protocol
	 * @param {net.Socket} socket - Socket that holds the connection information to the MQTT client
	 * @param {Buffer<ArrayBufferLike>} packet - Variable header + payload of the MQTT packet
	 * @returns {void}
	 */
	#handleConnect(socket, packet) {
		//TODO: dynamically parse the packet
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
			return;
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

	#handleDisconnect() {}

	/**
	 * Helper function that returns the remaining MQTT packet length and the size of the length field
	 * @param {Buffer<ArrayBuffer>} buffer - The recieved part of a MQTT message
	 * @returns {{remainingLength: number, bytesUsed: number} | undefined}
	 */
	#getRemainingLength(buffer) {
		let multiplier = 1;
		let remainingLength = 0;
		let bytesUsed = 0;
		while (true) {
			if (buffer.length <= 1 + bytesUsed) return;
			const encodedByte = buffer[1 + bytesUsed];
			remainingLength += (encodedByte & 127) * multiplier;
			bytesUsed++;
			if (bytesUsed > 4) return;
			if ((encodedByte & 128) === 0) break; // MSB is 0
			multiplier *= 128;
		}
		console.debug(`length: ${remainingLength}, bytesUsed: ${bytesUsed}, buffer size: ${buffer.length}`);

		return {
			remainingLength,
			bytesUsed,
		};
	}

	// for debugging :)
	#logPacketType(identifier) {
		console.debug(identifier);
		if (identifier == 1) console.debug("CONNECT");
		else if (identifier == 2) console.debug("CONNACK");
		else if (identifier == 3) console.debug("PUBLISH");
	}
}
