import net from "net";
// import DeviceModel from "../model/DeviceModel.js";

export class MqttBrokerService {
	/** @type {typeof DeviceModel} */
	// #model = DeviceModel;
	/** @type {Map<string, net.Socket>} */
	#clients = new Map();
	// #subscriptions = new Map();
	// #sessions = new Map();

	start() {
		const server = net.createServer((socket) => {
			console.debug("Client connected");
			socket._buffers = [];
			socket._bufferedBytes = 0;
			socket._clientId = null;

			socket.on("data", (data) => {
				socket._buffers.push(data);
				socket._bufferedBytes += data.length;
				this.#processBuffer(socket);
			});
			socket.on("end", () => {
				console.debug("Closing socket.");
				this.#handleDisconnect(socket);
			});

			socket.on("error", (error) => {
				console.error(`Socket Error: ${error.message}`);
			});
		});

		server.on("error", (error) => {
			console.error(`Server Error: ${error.message}`);
		});

		server.listen({ port: process.env.MQTT_BROKER_PORT || 1883, host: "0.0.0.0" }, () => {
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
			this.#handlePacket(socket, packet[0] >> 4, packet[0] & 0x0f, packet.subarray(fixedHeaderLength));

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
	 * @param {number} flags - Specific flags that are send with each package type
	 * @param {Buffer<ArrayBuffer>} payload - The payload of the MQTT message
	 * @returns {void}
	 */
	#handlePacket(socket, packetType, flags, payload) {
		this.#logPacketType(packetType);

		switch (packetType) {
			case 1:
				this.#handleConnect(socket, payload);
				break;

			case 3:
				this.#handlePublish(socket, flags, payload);
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
		let offset = 0;
		const protocolNameLength = (packet[0] << 8) + packet[1];
		offset += 2;

		const protocolName = packet.subarray(offset, offset + protocolNameLength).toString();
		offset += protocolNameLength;

		const protocolVersion = packet[offset++]; // 4 == 3.1.1
		offset += 3; // this skips the flags and keep alive for now

		console.debug(protocolName, protocolVersion);

		if (protocolName !== "MQTT" || protocolVersion !== 4) {
			console.error(
				`Expected protocol name: "MQTT", recieved: "${protocolName.toString()}"; expected protocol version: 4, recieved: ${protocolVersion}`,
			);
			const connAck = [0x20, 0x02, 0x01, 0x01];
			socket.write(Buffer.from(connAck));
			socket.end();
			return;
		}

		const payload = packet.subarray(offset);
		const clientNameLength = (payload[0] << 8) + payload[1];
		const clientName = payload.subarray(2, 2 + clientNameLength).toString();
		console.debug(clientName);

		socket._clientId = clientName;

		if (this.#clients.has(clientName)) {
			const connAck = [0x20, 0x02, 0x01, 0x00];
			//TODO: handle session restoration
			socket.write(Buffer.from(connAck));
		} else {
			this.#clients.set(clientName, socket);
			const connAck = [0x20, 0x02, 0x00, 0x00];
			socket.write(Buffer.from(connAck));
		}
	}

	#handleSubscribe(socket, packet) {
		console.debug(socket, packet);
	}

	/**
	 * Parse all incoming publish packages and act on the specific topics and their payload
	 * @param {net.Socket} socket - Socket object where the client is bound to
	 * @param {number} flags - The flags of the PUBLISH message
	 * @param {Buffer<ArrayBufferLike>} packet - Variable header + payload of the MQTT packet
	 */
	async #handlePublish(socket, flags, packet) {
		let offset = 0;
		const topicNameLenght = (packet[0] << 8) + packet[1];
		offset += 2;

		const topicName = packet.subarray(offset, offset + topicNameLenght).toString();
		offset += topicNameLenght;

		const qosLevel = (flags >> 1) & 0x03;
		let packageId = null;
		if (qosLevel > 0) {
			packageId = (packet[offset] << 8) + packet[offset + 1];
			offset += 2;
		}

		const payloadBuffer = packet.subarray(offset);

		console.debug(`Received Package ${packageId || "-"} topic: ${topicName} with payload: ${payloadBuffer}`);

		if (topicName === "register") {
			let payload;
			try {
				payload = JSON.parse(payloadBuffer.toString("utf8"));
			} catch (error) {
				console.error("Invalid JSON payload:", error);
				return;
			}

			const clientName = socket._clientId;
			if (
				!clientName ||
				typeof payload.id !== "string" ||
				typeof payload.type !== "string" ||
				typeof payload.maxVal !== "number" ||
				typeof payload.sensor !== "boolean"
			) {
				return;
			}
			// try {
			// 	if (await this.#model.checkIfDeviceExists(clientName)) return;
			// 	console.debug("client should be added to DB");
			// 	// TODO: change device model, maybe new table for discovered devices
			// 	await this.#model.setDevice(null, socket.remoteAddress, null, null, null, payload.maxVal, 0)
			// } catch (error) {
			// 	console.error("Error trying to add device to DB:", error);
			// 	return;
			// }
		}
		if (qosLevel == 1) {
			// console.debug("Responding with PUPACK to:", socket.remoteAddress);
			const pubAck = Buffer.alloc(4);
			pubAck[0] = 0x40;
			pubAck[1] = 0x02;
			pubAck.writeUInt16BE(packageId, 2);
			socket.write(pubAck);
		}
	}

	/**
	 * Make sure that when a device disconnects the brokers is updated
	 * @param {net.Socket} socket - The socket object where the client was bound to
	 * @returns {void}
	 */
	#handleDisconnect(socket) {
		if (socket._clientId) this.#clients.delete(socket._clientId);
	}

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
		else if (identifier == 8) console.debug("SUBSCRIBE");
	}
}
