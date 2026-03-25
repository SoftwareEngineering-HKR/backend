import { Bluetooth } from "webbluetooth";
import DeviceModel from "../model/DeviceModel.js";

//TODO: communication from backend to device

/**
 * @typedef {Object} BluetoothDeviceInfo
 * @property {string} id - The identifier for the device
 * @property {string | undefined} name - The name of the device
 */

class BluetoothService {
	/** @type {Bluetooth} */
	#bluetooth = null;
	/** @type {Promise<BluetoothDeviceInfo[]> | null} */
	#activeScan = null;
	/** @type {Map<string, BluetoothDevice>} */
	#knownDevices = new Map();
	/** @type {Map<string, BluetoothRemoteGATTServer>} */
	#connections = new Map();

	/**
	 * Initialises the Bluetooth adapter and checks if it is available.
	 * @returns {Promise<void>}
	 * @throws {Error} if bluetooth is not available on system
	 */
	async start() {
		this.#bluetooth = new Bluetooth({ allowAllDevices: true, scanTime: 4 });

		const available = await this.#bluetooth.getAvailability();
		if (!available) {
			throw new Error("Bluetooth adapter is not available");
		}

		console.log("Bluetooth adapter is ready");
		this.reconnect();
	}

	/**
	 * Reconnect to previously connected devices
	 * @returns{Promise<void>}
	 */
	async reconnect() {
		while (true) {
			try {
				console.debug("Trying to reconnect to know devices ...");
				const pairedDeviceAddresses = await DeviceModel.getBluetoothDevices();
				const devices = await this.scan();
				for (const device of devices) {
					if (pairedDeviceAddresses.includes(device.id)) {
						try {
							await this.connectDevice(device.id);
						} catch (e) {
							console.debug(`Reconnect failed for ${device.id}`, e);
						}
					}
				}
			} catch (e) {
				console.error("Could not reconnect to previously connected devices", e);
			}
			await new Promise((r) => setTimeout(r, 300000)); // 5 min timeout for now :)
		}
	}

	/**
	 * Scans for nearby BLE devices for 4 seconds.
	 * @returns {Promise<BluetoothDeviceInfo[]>}
	 * @throws {Error} if bluetooth is not started
	 */
	async scan() {
		if (!this.#bluetooth) throw new Error("BluetoothService not started.");

		if (this.#activeScan) {
			console.debug("Scan already in progress, returning existing scan.");
			return this.#activeScan;
		}

		console.debug("Starting bluetooth scan...");

		this.#activeScan = this.#bluetooth
			.getDevices()
			.then((devices) => {
				// store raw devices for later connection
				for (const device of devices) {
					this.#knownDevices.set(device.id, device);
				}
				return devices.map((device) => ({
					id: device.id,
					name: device.name?.startsWith("Unknown") ? "Unknown" : device.name,
				}));
			})
			.finally(() => {
				this.#activeScan = null;
				console.debug("Finished bluetooth scan!");
			});
		return this.#activeScan;
	}

	/**
	 * Make a connection to a bluetooth device and register it to the db
	 * @param {string} bluetoothAddress - Id of the device that the user wants to connect to
	 * @returns {Promise<void>}
	 * @throws {Error} If the connection to the device fails
	 */
	async connectDevice(bluetoothAddress) {
		const bluetoothDevice = this.#knownDevices.get(bluetoothAddress);
		if (!bluetoothDevice) throw new Error(`Device ${bluetoothAddress} not found.`);
		if (this.#connections.has(bluetoothAddress)) {
			console.debug(`Already connected to ${bluetoothAddress}`);
			return;
		}

		console.debug("Attempting to connect to", bluetoothAddress);

		let server;
		try {
			server = await bluetoothDevice.gatt.connect();
		} catch (e) {
			console.error(`Failed to connect to ${bluetoothAddress}`, e);
			return;
		}

		this.#connections.set(bluetoothAddress, server);

		bluetoothDevice.addEventListener("gattserverdisconnected", () => {
			try {
				console.debug(`Device ${bluetoothAddress} disconnected.`);
				DeviceModel.updateDeviceStatus(bluetoothAddress, false);
				this.#connections.delete(bluetoothAddress);
			} catch (e) {
				console.error("Failed to update device status:", e);
			}
		});

		const service = await server.getPrimaryService("12345678-1234-5678-1234-56789abcdef0");
		const characteristic = await service.getCharacteristic("12345678-1234-5678-1234-56789abcdef1");

		characteristic.addEventListener("characteristicvaluechanged", (event) => {
			this.#handleIncoming(bluetoothAddress, characteristic, event.target.value);
		});

		await characteristic.startNotifications();

		await characteristic.writeValueWithResponse(new TextEncoder().encode(JSON.stringify({ type: "rdy" })));

		console.debug(`Connected to ${bluetoothDevice.name ?? bluetoothAddress}`);
	}

	/**
	 * @param {string} bluetoothAddress - Id of the bluetooth device
	 * @param {BluetoothRemoteGATTCharacteristic} characteristic - communication interface
	 * @param {DataView} payload - the received payload the the device
	 * @returns {Promise<void>}
	 */
	async #handleIncoming(bluetoothAddress, characteristic, payload) {
		let msg;
		try {
			msg = JSON.parse(new TextDecoder().decode(payload));
		} catch {
			console.error(`Invalid JSON from ${bluetoothAddress}`);
			return;
		}

		if (msg.type === "register") {
			console.debug(`Register received from ${bluetoothAddress}:`, msg);
			try {
				const exists = await DeviceModel.checkIfDeviceExists(bluetoothAddress);
				if (!exists) {
					await DeviceModel.setDevice(
						bluetoothAddress,
						null,
						msg.deviceType,
						true,
						"bluetooth",
						null,
						null,
						null,
						msg.maxVal,
						msg.minVal,
					);
				} else {
					await DeviceModel.updateDeviceStatus(bluetoothAddress, true);
				}
				const ack = JSON.stringify({ type: "reg" });
				await characteristic.writeValueWithResponse(new TextEncoder().encode(ack));
				console.debug(`Device ${bluetoothAddress} registered`);
			} catch (e) {
				console.error("Registration failed:", e);
			}
		} else if (msg.type === "publish") {
			// console.debug(`Value from ${deviceId}: ${msg.value}`);
			try {
				await DeviceModel.updateValue(bluetoothAddress, msg.value);
			} catch (e) {
				console.error("Could not update device value:", e);
			}
		} else if (msg.type === "ping") {
			const pong = JSON.stringify({ type: "pong" });
			await characteristic.writeValueWithResponse(new TextEncoder().encode(pong));
		}
	}
}

export default new BluetoothService();
