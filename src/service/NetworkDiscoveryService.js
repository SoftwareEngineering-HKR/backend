import dgram from "dgram";
import EventEmitter from "events";

/**
 * @typedef {Object} DiscoveredDevice
 * @property {string} ipAddress
 * @property {string} mac
 * @property {string} desc
 */

/**
 * Emitted when a new device is discovered.
 * @event NetworkDiscoveryService#deviceDiscovered
 * @type {DiscoveredDevice[]}
 */

/**
 * Service which enables devices to be automatically discovered
 * @class
 *
 * @extends EventEmitter
 * @fires NetworkDiscoveryService#deviceDiscovered
 */
export class NetworkDiscoveryService extends EventEmitter {
	/** @type {dgram.Socket} */
	static #server = dgram.createSocket("udp4");
	/** @type {string} */
	static #VERSION = "1";
	/** @type {DiscoveredDevice[]} */
	static #discoveredDevices = [];

	/**
	 * Initialise the UDP socket and start listening
	 * @returns {void}
	 */
	startNetworkDiscovery() {
		NetworkDiscoveryService.#server.on("error", (err) => this.#handleError(err));

		NetworkDiscoveryService.#server.on("message", (msg, rinfo) => this.#parseDatagram(msg, rinfo));

		NetworkDiscoveryService.#server.on("listening", () => this.#startListen());

		NetworkDiscoveryService.#server.bind(process.env.PORT || 4444);
	}

	/**
	 * Close the socket and stop listening
	 * @function stopNetworkDiscovery
	 * @returns {void}
	 */
	// #stopNetworkDiscovery() {
	// 	NetworkDiscoveryService.#server.close();
	// }

	/**
	 * Process the content of the message
	 * Looks for UDP datagrams that contain "NetworkDiscovery"
	 * @param {Buffer} msg - Content of the datagram that the socket has received
	 * @param {dgram.RemoteInfo} rinfo - Information about the sender of the datagram
	 * @returns {void}
	 */
	#parseDatagram(msg, rinfo) {
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
		this.emit("deviceDiscovered", NetworkDiscoveryService.#discoveredDevices);
		// console.debug("Discovered device:", device);
	}

	/**
	 * Start listening to the port specified in the .env
	 * @returns {void}
	 */
	#startListen() {
		const address = NetworkDiscoveryService.#server.address();
		console.log(`Network discovery listening at ${address.address}:${address.port}`);
	}

	/**
	 * Handle potential errors of the socket
	 * @param {Error} err - The error object
	 * @returns {void}
	 */
	#handleError(err) {
		/**
		 * For now errors just get printed to the console, maybe log them to a file later on?
		 * Also idk if closing the server after an error is the best way to handle it, should prob do sth else :,)
		 */
		console.error(`UDP socket error: ${err.stack}`);
		NetworkDiscoveryService.#server.close();
		/* maybe restart socket or dont close it */
	}
}
