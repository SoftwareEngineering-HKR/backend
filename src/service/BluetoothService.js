import { Bluetooth } from "webbluetooth";

/**
 * @typedef {Object} BluetoothDeviceInfo
 * @property {string} address - The identifier for the device
 * @property {string | undefined} name - The name of the device
 */

class BluetoothService {
	/** @type {Bluetooth} */
	#bluetooth = null;
	/** @type {Promise<BluetoothDeviceInfo[]> | null} */
	#activeScan = null;
	/** @type {Map<string, BluetoothDevice>}*/
	#knownDevices = new Map();
	/** @type {Map<string, BluetoothRemoteGATTServer>} - active connections keyed by id */
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
	 * Make a connection to a bluetooth device
	 * @param {string} deviceId - Id of the device that the user wants to connect to
	 * @returns {Promise<void>}
	 * @throws {Error} If the connection to the device fails
	 */
	async connectDevice(deviceId) {
		const device = this.#knownDevices.get(deviceId);
		if (!device) throw new Error(`Device ${deviceId} not found.`);
		if (this.#connections.has(deviceId)) {
			console.debug(`Already connected to ${deviceId}`);
			return;
		}

		console.debug("Attempting to connect to", deviceId);

		const server = await device.gatt.connect();
		this.#connections.set(deviceId, server);

		device.addEventListener("gattserverdisconnected", () => {
			console.debug(`Device ${deviceId} disconnected.`);
			this.#connections.delete(deviceId);
		});

		console.log(`Connected to ${device.name ?? deviceId}`);
	}
}

export default new BluetoothService();
