import net from "net";
import sinon from "sinon";
import { expect } from "chai";
import { MqttBrokerService } from "../../src/service/MqttBrokerService.js";
import DeviceModel from "../../src/model/DeviceModel.js";

function makeConnect(clientId) {
	const clientIdBytes = Buffer.from(clientId);
	const payload = Buffer.alloc(2 + clientIdBytes.length);
	payload.writeUInt16BE(clientIdBytes.length, 0);
	clientIdBytes.copy(payload, 2);

	const varHeader = Buffer.from([0x00, 0x04, 0x4d, 0x51, 0x54, 0x54, 0x04, 0x00, 0x00, 0x3c]);

	const remaining = Buffer.concat([varHeader, payload]);
	return Buffer.concat([
		Buffer.from([0x10, remaining.length]),
		remaining,
	]);
}

function makePublish(topic, payload, qos = 0, packetId = null) {
	const topicBytes = Buffer.from(topic);
	const payloadBytes = Buffer.from(payload);
	const hasPacketId = qos > 0;

	const varHeader = Buffer.alloc(2 + topicBytes.length + (hasPacketId ? 2 : 0));
	varHeader.writeUInt16BE(topicBytes.length, 0);
	topicBytes.copy(varHeader, 2);
	if (hasPacketId) varHeader.writeUInt16BE(packetId, 2 + topicBytes.length);

	const remaining = Buffer.concat([varHeader, payloadBytes]);
	const flags = (qos & 0x03) << 1;
	return Buffer.concat([
		Buffer.from([0x30 | flags, remaining.length]),
		remaining,
	]);
}

function makeSubscribe(topic, packetId = 1, qos = 0) {
	const topicBytes = Buffer.from(topic);
	const buf = Buffer.alloc(2 + 2 + topicBytes.length + 1);
	buf.writeUInt16BE(packetId, 0);
	buf.writeUInt16BE(topicBytes.length, 2);
	topicBytes.copy(buf, 4);
	buf[4 + topicBytes.length] = qos;
	return Buffer.concat([Buffer.from([0x82, buf.length]), buf]);
}

function connectSocket(port) {
	return new Promise((resolve) => {
		const socket = net.connect(port, "127.0.0.1", () => resolve(socket));
	});
}

function waitForData(socket) {
	return new Promise((resolve) => socket.once("data", resolve));
}

function startBroker(port) {
	process.env.MQTT_BROKER_PORT = String(port);
	const broker = new MqttBrokerService();
	broker.start();
	return broker;
}

describe("MqttBrokerService", () => {
	let port = 18830;
	let stubs = {};

	beforeEach(() => {
		console.debug = () => {};
		console.error = () => {};
		port++;
		stubs.checkIfDeviceExists = sinon.stub(DeviceModel, "checkIfDeviceExists");
		stubs.setDevice = sinon.stub(DeviceModel, "setDevice");
		stubs.updateDeviceStatus = sinon.stub(DeviceModel, "updateDeviceStatus");
		stubs.updateValue = sinon.stub(DeviceModel, "updateValue");
		stubs.getDeviceValue = sinon.stub(DeviceModel, "getDeviceValue");
	});

	afterEach(() => sinon.restore());

	describe("CONNECT", () => {
		it("responds with CONNACK 0x00 for a new client", async () => {
			startBroker(port);
			await new Promise((r) => setTimeout(r, 20));

			const socket = await connectSocket(port);
			socket.write(makeConnect("device-1"));
			const data = await waitForData(socket);

			expect(data[0]).to.equal(0x20);
			expect(data[3]).to.equal(0x00);
			socket.destroy();
		});

		it("rejects non-MQTT protocol with CONNACK 0x01", async () => {
			startBroker(port);
			await new Promise((r) => setTimeout(r, 20));

			const socket = await connectSocket(port);
			const bad = Buffer.from([
				0x10, 0x0e,
				0x00, 0x04, 0x48, 0x54, 0x54, 0x50,
				0x04, 0x00, 0x00, 0x3c,
				0x00, 0x02, 0x61, 0x62,
			]);
			socket.write(bad);
			const data = await waitForData(socket);

			expect(data[0]).to.equal(0x20);
			expect(data[3]).to.equal(0x01);
			socket.destroy();
		});
	});

	describe("PUBLISH to 'register'", () => {
		it("registers a new device and calls setDevice", async () => {
			stubs.checkIfDeviceExists.resolves(false);
			stubs.setDevice.resolves();
			startBroker(port);
			await new Promise((r) => setTimeout(r, 20));

			const socket = await connectSocket(port);
			socket.write(makeConnect("client-1"));
			await waitForData(socket);

			const regPayload = JSON.stringify({
				id: "test-light",
				type: "light",
				maxVal: 100,
				minVal: 0,
				sensor: false,
			});
			socket.write(makePublish("register", regPayload));
			await new Promise((r) => setTimeout(r, 30));

			expect(stubs.setDevice.calledOnce).to.be.true;
			expect(stubs.setDevice.firstCall.args[0], "test-light")
			socket.destroy();
		});

		it("calls updateDeviceStatus if device already exists", async () => {
			stubs.checkIfDeviceExists.resolves(true);
			stubs.updateDeviceStatus.resolves();
			startBroker(port);
			await new Promise((r) => setTimeout(r, 20));

			const socket = await connectSocket(port);
			socket.write(makeConnect("client-2"));
			await waitForData(socket);

			const regPayload = JSON.stringify({
				id: "test-light", type: "light", maxVal: 1, minVal: 0, sensor: false,
			});
			socket.write(makePublish("register", regPayload));
			await new Promise((r) => setTimeout(r, 30));

			expect(stubs.updateDeviceStatus.calledOnce).to.equal(true);

			const [deviceId, status] = stubs.updateDeviceStatus.firstCall.args;

			expect(deviceId).to.equal("test-light");
			expect(status).to.equal(true);

			socket.destroy();
		});

		it("ignores publish to 'register' with invalid JSON", async () => {
			startBroker(port);
			await new Promise((r) => setTimeout(r, 20));

			const socket = await connectSocket(port);
			socket.write(makeConnect("client-3"));
			await waitForData(socket);

			socket.write(makePublish("register", "not-json"));
			await new Promise((r) => setTimeout(r, 30));

			expect(stubs.setDevice.notCalled).to.be.true;
			socket.destroy();
		});
	});

	describe("SUBSCRIBE", () => {
		it("rejects subscription from unregistered device with SUBACK 0x80", async () => {
			startBroker(port);
			await new Promise((r) => setTimeout(r, 20));

			const socket = await connectSocket(port);
			socket.write(makeConnect("ghost-client"));
			await waitForData(socket);

			socket.write(makeSubscribe("device/unknown-id/value", 1));
			const data = await waitForData(socket);

			expect(data[0]).to.equal(0x90);
			expect(data[4]).to.equal(0x80);
			socket.destroy();
		});
	});

	describe("PINGREQ", () => {
		it("responds with PINGRESP", async () => {
			startBroker(port);
			await new Promise((r) => setTimeout(r, 20));

			const socket = await connectSocket(port);
			socket.write(makeConnect("pinger"));
			await waitForData(socket);

			socket.write(Buffer.from([0xc0, 0x00]));
			const data = await waitForData(socket);

			expect(data[0]).to.equal(0xd0);
			expect(data[1]).to.equal(0x00);
			socket.destroy();
		});
	});

	describe("buffer overflow protection", () => {
		it("destroys socket when buffer exceeds 1MB", async () => {
			startBroker(port);
			await new Promise((r) => setTimeout(r, 20));

			const socket = await connectSocket(port);
			socket.on("error", () => {});
			const closed = new Promise((r) => socket.on("close", r));

			const chunk = Buffer.alloc(512 * 1024, 0xff);
			socket.write(chunk);
			socket.write(chunk);
			socket.write(chunk);

			await closed;
		});
	});
});
