import net from "net";
import DeviceModel from "../model/DeviceModel.js";

/**
 * @typedef {Object} SocketState
 * @property {Buffer[]} buffers - Unprocessed incoming data
 * @property {number} bufferedBytes - Total byte count across all buffers
 * @property {string | null} clientId - The MQTT clientId
 * @property {boolean} registered - Flag which shows if the client is registerd in the DB
 */

/**
 * @typedef {Object} Topic
 * @property {string} topicId - The topic identifier to wich devices publish their topic to
 * @property {string} payload - The content that the devices publish
 */

export class MqttBrokerService {
	/** @type {typeof DeviceModel} */
	#deviceModel = DeviceModel;
	/** @type {Map<string, net.Socket>} */
	#clients = new Map();
	/** @type {Map<string, net.Socket>} */
	#registeredDevices = new Map();
	/** @type {WeakMap<net.Socket, SocketState} */
	#socketState = new WeakMap();
	/** @type {Map<string, Array<net.Socket, string>>} */
	#subscriptions = new Map();
	/** @type {Map<string, Topic} */
	#deviceTopics = new Map();
	/** @type {Map<string, [number, number]}> */
	#outgoingMessages = new Map();
	/** @type {number} */
	#packetIdCounter = 0;
	/** @type {Map<number, string>} */
	#packetIdToDeviceId = new Map();

	/**
	 * Initialise the broker so that frontend clients can exchange messages with the devices.
	 * @returns {void}
	 */
	start() {
		const server = net.createServer((socket) => {
			console.debug("Client connected");
			this.#socketState.set(socket, { buffers: [], bufferedBytes: 0, clientId: null });

			socket.on("data", (data) => {
				const MAX_BUFFER_BYTES = 1024 * 1024;
				const state = this.#socketState.get(socket);

				if (state.bufferedBytes + data.length > MAX_BUFFER_BYTES) {
					socket.destroy(new Error("Buffer overflow"));
					return;
				}
				state.buffers.push(data);
				state.bufferedBytes += data.length;
				this.#processBuffer(socket, state);
			});

			socket.on("close", () => {
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

		this.#deviceModel.on("sendPublish", ({ id, value }) => this.#setDeviceValue(id, value));
	}

	/**
	 * Gets the incoming data of the TCP socket.
	 * Checks if full MQTT packet has arrived and processes the content of it.
	 * @param {net.Socket} socket - The socket where the client is bound to
	 * @param {SocketState} state - Sockets incoming data and its ID
	 * @returns {void}
	 */
	#processBuffer(socket, state) {
		if (state.bufferedBytes < 2) return;

		const buffer = Buffer.concat(state.buffers, state.bufferedBytes);
		let offset = 0;

		while (offset < buffer.length) {
			if (buffer.length - offset < 2) break;

			const res = this.#getRemainingLength(buffer, offset);
			if (!res) break;

			const { remainingLength, bytesUsed } = res;
			const totalPacketLength = 1 + bytesUsed + remainingLength;

			if (buffer.length - offset < totalPacketLength) break;

			const fixedHeaderLength = 1 + bytesUsed;
			const packet = buffer.subarray(offset, offset + totalPacketLength);
			this.#handlePacket(socket, packet[0] >> 4, packet[0] & 0x0f, packet.subarray(fixedHeaderLength));

			offset += totalPacketLength;
		}

		const remaining = buffer.subarray(offset);
		state.buffers = remaining.length > 0 ? [remaining] : [];
		state.bufferedBytes = remaining.length;
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

			case 4:
				this.#handlePubAck(payload);
				break;

			case 8:
				this.#handleSubscribe(socket, payload);
				break;

			case 12:
				this.#handlePingRequest(socket);
				break;

			case 14:
				this.#handleDisconnect(socket);
				break;

			default:
				socket.destroy();
		}
	}

	/**
	 * Send publish package to an online device to change its value
	 * @param {string} deviceId - ID of the device which value should be changed
	 * @param {number} value - The value which device should update its state to
	 * @returns {void}
	 */
	#setDeviceValue(deviceId, value) {
		this.#packetIdCounter = (this.#packetIdCounter % 65535) + 1;
		const packetId = this.#packetIdCounter;

		this.#outgoingMessages.set(deviceId, [packetId, value]);
		this.#packetIdToDeviceId.set(packetId, deviceId);

		if (!this.#subscriptions.has(deviceId)) return;
		const [deviceSocket, topicName] = this.#subscriptions.get(deviceId);

		const topicBytes = Buffer.from(topicName, "utf8");
		const payloadBytes = Buffer.from(String(value), "utf8");

		const remainingLength = 2 + topicBytes.length + 2 + payloadBytes.length;

		const rlBytes = [];
		let rl = remainingLength;
		do {
			let byte = rl & 0x7f;
			rl >>>= 7;
			if (rl > 0) byte |= 0x80;
			rlBytes.push(byte);
		} while (rl > 0);

		const packet = Buffer.alloc(1 + rlBytes.length + remainingLength);
		let offset = 0;

		packet[offset++] = 0x32; // PUBLISH, QoS 1
		for (const byte of rlBytes) packet[offset++] = byte;
		packet.writeUInt16BE(topicBytes.length, offset);
		offset += 2;
		topicBytes.copy(packet, offset);
		offset += topicBytes.length;
		packet.writeUInt16BE(packetId, offset);
		offset += 2;
		payloadBytes.copy(packet, offset);

		deviceSocket.write(packet);
		console.debug(`PUBLISH sent to ${deviceId} topic: "${topicName}" value: ${value} packetId: ${packetId}`);
	}

	/**
	 * Deal with publish confirmation packages; Checks if it is a response to an existing outgoing message
	 * @param {net.Socket} socket - Socket that holds the connection information to the MQTT client
	 * @param {Buffer<ArrayBufferLike>} packet - Variable header
	 * @returns {void}
	 */
	#handlePubAck(packet) {
		const packetId = (packet[0] << 8) + packet[1];

		const deviceId = this.#packetIdToDeviceId.get(packetId);
		if (!deviceId) return;

		const latestMessage = this.#outgoingMessages.get(deviceId);
		if (!latestMessage || latestMessage[0] !== packetId) return;

		try {
			this.#deviceModel.updateValue(deviceId, latestMessage[1]);
			this.#outgoingMessages.delete(deviceId);
			this.#packetIdToDeviceId.delete(packetId);
		} catch (e) {
			console.error(e);
		}
	}

	/**
	 * Respond to a ping request
	 * @param{net.Socket} socket - Socket that the client is bound to
	 * @returns {void}
	 */
	#handlePingRequest(socket) {
		const pingresp = [0xd0, 0x00];
		socket.write(Buffer.from(pingresp));
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

		const protocolVersion = packet[offset++];
		offset += 3; // skip flags and keep alive

		console.debug(protocolName, protocolVersion);

		if (protocolName !== "MQTT" || protocolVersion !== 4) {
			console.error(
				`Expected protocol name: "MQTT", received: "${protocolName}"; expected version: 4, received: ${protocolVersion}`,
			);
			socket.write(Buffer.from([0x20, 0x02, 0x01, 0x01]));
			socket.destroy();
			return;
		}

		const payload = packet.subarray(offset);
		const clientNameLength = (payload[0] << 8) + payload[1];
		const clientName = payload.subarray(2, 2 + clientNameLength).toString();
		console.debug("Connected Client ID:", clientName);

		const state = this.#socketState.get(socket);
		state.clientId = clientName;

		if (this.#clients.has(clientName)) {
			const oldSocket = this.#clients.get(clientName);
			if (!oldSocket.destroyed) oldSocket.destroy();
			this.#clients.set(clientName, socket);
			socket.write(Buffer.from([0x20, 0x02, 0x01, 0x00]));
		} else {
			this.#clients.set(clientName, socket);
			socket.write(Buffer.from([0x20, 0x02, 0x00, 0x00]));
		}
	}

	/**
	 * Parse subscribe messages and add them to the internal subscribe map
	 * @param {net.Socket} socket - Socket object where the client is bound to
	 * @param {Buffer<ArrayBufferLike>} packet - Variable header + payload of the MQTT packet
	 * @returns {Promise<void>}
	 */
	async #handleSubscribe(socket, packet) {
		let offset = 0;

		const packageId = (packet[offset] << 8) + packet[offset + 1];
		offset += 2;

		const topicNameLength = (packet[offset] << 8) + packet[offset + 1];
		offset += 2;

		const topicName = packet.subarray(offset, offset + topicNameLength).toString();
		offset += topicNameLength;

		const qosLevel = packet[offset];

		console.debug(`SUBSCRIBE Package ${packageId} topic: "${topicName}" QoS: ${qosLevel}`);

		const deviceId = topicName.split("/")[1];

		if (!this.#registeredDevices.has(deviceId)) {
			console.debug("Unregistered device tried to subscribe:", deviceId);
			const subAck = Buffer.alloc(5);
			subAck[0] = 0x90;
			subAck[1] = 0x03;
			subAck.writeUInt16BE(packageId, 2);
			subAck[4] = 0x80;
			socket.write(subAck);
			return;
		}

		this.#subscriptions.set(deviceId, [socket, topicName]);

		const subAck = Buffer.alloc(5);
		subAck[0] = 0x90;
		subAck[1] = 0x03;
		subAck.writeUInt16BE(packageId, 2);
		subAck[4] = qosLevel;
		socket.write(subAck);

		if (this.#outgoingMessages.has(deviceId)) {
			this.#setDeviceValue(deviceId, this.#outgoingMessages.get(deviceId)[1]);
		} else {
			try {
				const deviceValue = await this.#deviceModel.getDeviceValue(deviceId);
				if (deviceValue) this.#setDeviceValue(deviceId, deviceValue);
			} catch (e) {
				console.error("Could not send initial value to device:", e);
			}
		}
	}

	/**
	 * Parse all incoming publish packages and act on the specific topics and their payload
	 * @param {net.Socket} socket - Socket object where the client is bound to
	 * @param {number} flags - The flags of the PUBLISH message
	 * @param {Buffer<ArrayBufferLike>} packet - Variable header + payload of the MQTT packet
	 * @returns {Promise<void>}
	 */
	async #handlePublish(socket, flags, packet) {
		let offset = 0;
		const topicNameLength = (packet[0] << 8) + packet[1];
		offset += 2;

		const topicName = packet.subarray(offset, offset + topicNameLength).toString();
		offset += topicNameLength;

		const qosLevel = (flags >> 1) & 0x03;
		let packageId = null;
		if (qosLevel > 0) {
			packageId = (packet[offset] << 8) + packet[offset + 1];
			offset += 2;
		}

		const payloadBuffer = packet.subarray(offset);
		console.debug(`Received Package ${packageId || "-"} topic: ${topicName} with payload: ${payloadBuffer}`);
		const state = this.#socketState.get(socket);

		if (topicName === "register") {
			let payload;
			try {
				payload = JSON.parse(payloadBuffer.toString("utf8"));
			} catch (error) {
				console.error("Invalid JSON payload:", error);
				return;
			}

			if (
				!state.clientId ||
				typeof payload.id !== "string" ||
				typeof payload.type !== "string" ||
				typeof payload.maxVal !== "number" ||
				typeof payload.minVal !== "number" ||
				typeof payload.sensor !== "boolean"
			) {
				return;
			}
			try {
				if ((await this.#deviceModel.checkIfDeviceExists(payload.id)) === false) {
					console.debug("Device will be added to DB:", payload.id);
					await this.#deviceModel.setDevice(
						payload.id,
						null,
						payload.type,
						true,
						socket.remoteAddress,
						null,
						null,
						null,
						payload.maxVal,
						payload.minVal,
					);
				} else {
					await this.#deviceModel.updateDeviceStatus(payload.id, true);
				}
			} catch (error) {
				console.error("Error trying to add device to DB:", error);
				return;
			}
			this.#registeredDevices.set(payload.id, socket);
			console.debug("Device registered:", payload.id);
		} else {
			const deviceId = topicName.split("/")[1];
			if (!this.#registeredDevices.has(deviceId)) {
				console.debug("Message received for unregistered device:", deviceId);
				return;
			}
			const oldTopic = this.#deviceTopics.get(deviceId);
			if (oldTopic?.payload !== payloadBuffer.toString()) {
				this.#deviceModel.updateValue(deviceId, payloadBuffer.toString());
			}
			this.#deviceTopics.set(deviceId, { topicId: topicName, payload: payloadBuffer.toString() });
		}

		if (qosLevel === 1) {
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
	 * @returns {Promise<void>}
	 */
	async #handleDisconnect(socket) {
		const state = this.#socketState.get(socket);
		if (state?.clientId) {
			this.#clients.delete(state.clientId);
		}

		for (const [deviceId, deviceSocket] of this.#registeredDevices) {
			if (deviceSocket !== socket) continue;

			await this.#deviceModel.updateDeviceStatus(deviceId, false);
			this.#deviceTopics.delete(deviceId);
			this.#subscriptions.delete(deviceId);

			const pendingMessage = this.#outgoingMessages.get(deviceId);
			if (pendingMessage) this.#packetIdToDeviceId.delete(pendingMessage[0]);

			this.#registeredDevices.delete(deviceId);
		}
	}

	/**
	 * Helper function that returns the remaining MQTT packet length and the size of the length field
	 * @param {Buffer<ArrayBuffer>} buffer - The recieved part of a MQTT message
	 * @returns {{remainingLength: number, bytesUsed: number} | undefined}
	 */
	#getRemainingLength(buffer, offset = 0) {
		let multiplier = 1;
		let remainingLength = 0;
		let bytesUsed = 0;
		while (true) {
			if (buffer.length <= offset + 1 + bytesUsed) return;
			const encodedByte = buffer[offset + 1 + bytesUsed];
			remainingLength += (encodedByte & 127) * multiplier;
			bytesUsed++;
			if (bytesUsed > 4) return;
			if ((encodedByte & 128) === 0) break;
			multiplier *= 128;
		}
		console.debug(`length: ${remainingLength}, bytesUsed: ${bytesUsed}, buffer size: ${buffer.length}`);
		return { remainingLength, bytesUsed };
	}

	// for debugging :)
	#logPacketType(identifier) {
		console.debug(identifier);
		if (identifier == 1) console.debug("CONNECT");
		else if (identifier == 2) console.debug("CONNACK");
		else if (identifier == 3) console.debug("PUBLISH");
		else if (identifier == 4) console.debug("PUBACK");
		else if (identifier == 8) console.debug("SUBSCRIBE");
		else if (identifier == 12) console.debug("PINGREQ");
	}
}
