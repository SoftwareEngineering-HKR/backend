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
			.then((devices) =>
				devices.map((device) => ({
					id: device.id,
					name: device.name.startsWith("Unknown") ? "Unknown" : device.name,
				})),
			)
			.finally(() => {
				this.#activeScan = null;
				console.debug("Finished bluetooth scan!");
			});
		return this.#activeScan;
	}
}

export default new BluetoothService();
