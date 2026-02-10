import dgram from "dgram";
import EventEmitter from "events";

/**
 * @typedef {Object} DiscoveredDevice
 * @property {string} ipAddress
 * @property {string} mac
 * @property {string} desc
 */

/**
 * Emitted when a device is discovered
 * @event NetworkDiscoveryService#deviceDiscovered
 * @param {DiscoveredDevice[]} devices - All currently discovered devices
 */

/**
 * Service which enables devices to be automatically discovered
 *
 * @example
 * const discovery = new NetworkDiscoveryService();
 * discovery.on("deviceDiscovered", devices => {
 *   console.log("Discovered devices:", devices);
 * });
 * await discovery.startNetworkDiscovery();
 *
 * @extends EventEmitter
 * @fires NetworkDiscoveryService#deviceDiscovered
 */
export class NetworkDiscoveryService extends EventEmitter {
	/** @type {dgram.Socket | null} */
	static #server = null;
	/** @type {string} */
	static #VERSION = "1";
	/** @type {DiscoveredDevice[]} */
	static #discoveredDevices = [];
	/** @type {Set<NetworkDiscoveryService>} */
	static #activeDiscoveries = new Set();
	/** @type {Map<NetworkDiscoveryService, Function>} */
	static #activeRejects = new Map();

	/**
	 * Initialise the UDP socket and start listening
	 * Resolves when the discovery window has ended
	 * Rejects if the UDP socket encounters an error
	 * @returns {Promise<void>}
	 * @throws {Error}
	 */
	async startNetworkDiscovery() {
		NetworkDiscoveryService.#activeDiscoveries.add(this);

		// console.debug("Network discovery started, active discoveries:", NetworkDiscoveryService.#activeDiscoveries.size)

		if (!NetworkDiscoveryService.#server) {
			// console.debug("Socket not initialised, creating one...");

			NetworkDiscoveryService.#server = dgram.createSocket("udp4");

			NetworkDiscoveryService.#server.on("error", (err) => NetworkDiscoveryService.#handleError(err));
			NetworkDiscoveryService.#server.on("message", (msg, rinfo) =>
				NetworkDiscoveryService.#parseDatagram(msg, rinfo),
			);
			NetworkDiscoveryService.#server.on("listening", () => NetworkDiscoveryService.#startListen());

			NetworkDiscoveryService.#server.bind(process.env.PORT || 4444);
		}

		// if another device discovery is currently active and has found device, notify this instance about the device
		if (NetworkDiscoveryService.#discoveredDevices.length > 0) {
			this.emit("deviceDiscovered", NetworkDiscoveryService.#discoveredDevices);
		}

		// let the socket discover datagrams for 10 seconds, reject the promise if an error occurred
		await new Promise((resolve, reject) => {
			NetworkDiscoveryService.#activeRejects.set(this, reject);

			setTimeout(() => {
				NetworkDiscoveryService.#activeRejects.delete(this);
				resolve();
			}, 10000);
		});

		NetworkDiscoveryService.#activeDiscoveries.delete(this);

		if (NetworkDiscoveryService.#activeDiscoveries.size === 0) {
			console.debug("Closing Socket, removing cached discoveries");
			NetworkDiscoveryService.#discoveredDevices = [];
			NetworkDiscoveryService.#server?.close();
			NetworkDiscoveryService.#server = null;
		}

		// console.debug("Network discovery stopped, active discoveries:", NetworkDiscoveryService.#activeDiscoveries.size)
	}

	/**
	 * Process the content of the message
	 * Looks for UDP datagrams that contain "NetworkDiscovery"
	 * @param {Buffer} msg - Content of the datagram that the socket has received
	 * @param {dgram.RemoteInfo} rinfo - Information about the sender of the datagram
	 * @returns {void}
	 */
	static #parseDatagram(msg, rinfo) {
		const expectedMsg =
			/^NetworkDiscovery;Mac=(?<mac>(?:[0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2});Desc=(?<desc>[^;]+);Ver=(?<ver>\d+)$/;
		const message = msg.toString();
		const datagramMatch = message.match(expectedMsg);

		// console.debug("Received:", message);

		// not a discovery datagram
		if (!datagramMatch) return;

		const { mac, desc, ver } = datagramMatch.groups;

		if (ver !== NetworkDiscoveryService.#VERSION) return;

		const device = {
			ipAddress: rinfo.address,
			mac,
			desc,
		};

		const alreadyDiscovered = NetworkDiscoveryService.#discoveredDevices.some(
			(discoveredDevice) => discoveredDevice.mac === device.mac,
		);
		if (alreadyDiscovered) return;

		NetworkDiscoveryService.#discoveredDevices.push(device);
		for (const instance of NetworkDiscoveryService.#activeDiscoveries) {
			instance.emit("deviceDiscovered", NetworkDiscoveryService.#discoveredDevices);
		}
		// console.debug("Discovered device:", device);
	}

	/**
	 * Start listening to the port specified in the .env
	 * @returns {void}
	 */
	static #startListen() {
		const address = NetworkDiscoveryService.#server.address();
		console.debug(`Network discovery listening at ${address.address}:${address.port}`);
	}

	/**
	 * Handle potential errors of the socket
	 * @param {Error} err - The error object
	 * @returns {void}
	 */
	static #handleError(err) {
		console.error(`UDP socket error: ${err.stack}`);

		// Reject all active discovery promises
		for (const reject of NetworkDiscoveryService.#activeRejects.values()) {
			reject(err);
		}
		NetworkDiscoveryService.#activeRejects.clear();

		NetworkDiscoveryService.#server?.close();
		NetworkDiscoveryService.#server = null;
	}
}
