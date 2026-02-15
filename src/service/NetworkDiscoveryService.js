import dgram from "dgram";

/**
 * Service which enables devices to be automatically discovered
 *
 * @example
 * NetworkDiscoveryService.startNetworkDiscovery();
 */
export class NetworkDiscoveryService {
	/** @type {dgram.Socket | null} */
	static #server = null;
	/** @type {string} */
	static #VERSION = "1";
	/** @type {Set<string>} */
	static #recentIPs = new Set();

	/**
	 * Initialise the UDP socket and start listening to discovery packets
	 * @returns {void}
	 */
	static startNetworkDiscovery() {
		// console.debug("Network discovery started, active discoveries:", NetworkDiscoveryService.#activeDiscoveries.size)

		if (!NetworkDiscoveryService.#server) {
			// console.debug("Socket not initialised, creating one...");

			NetworkDiscoveryService.#server = dgram.createSocket("udp4");

			NetworkDiscoveryService.#server.on("error", (err) => NetworkDiscoveryService.#handleError(err));
			NetworkDiscoveryService.#server.on("message", (msg, rinfo) =>
				NetworkDiscoveryService.#parseDatagram(msg, rinfo),
			);
			NetworkDiscoveryService.#server.on("listening", () => NetworkDiscoveryService.#startListen());

			NetworkDiscoveryService.#server.bind(process.env.UDP_PORT || 4444, "0.0.0.0");
		}

		// console.debug("Network discovery stopped, active discoveries:", NetworkDiscoveryService.#activeDiscoveries.size)
	}

	/**
	 * Process the content of the message
	 * Looks for UDP datagrams that contain "NetworkDiscovery" and responds to that device
	 * @param {Buffer} msg - Content of the datagram that the socket has received
	 * @param {dgram.RemoteInfo} rinfo - Information about the sender of the datagram
	 * @returns {void}
	 */
	static #parseDatagram(msg, rinfo) {
		const expectedMsg = /^NetworkDiscovery;Ver=(?<ver>\d+);$/;
		const message = msg.toString();
		const datagramMatch = message.match(expectedMsg);

		// dont respond to IPs that have been in contact with the server too recently
		if (NetworkDiscoveryService.#recentIPs.has(rinfo.address)) return;

		NetworkDiscoveryService.#recentIPs.add(rinfo.address);
		setTimeout(() => this.#recentIPs.delete(rinfo.address), 10000);

		// console.debug("Received:", message);

		// not a discovery datagram
		if (!datagramMatch) return;

		const { ver } = datagramMatch.groups;

		if (ver !== NetworkDiscoveryService.#VERSION) return;

		// console.debug("Discovered device at IP:", rinfo.address);

		NetworkDiscoveryService.#server.send(
			"DiscoveryResponse;",
			0,
			18,
			process.env.UDP_RESPONSE_PORT || 4445,
			rinfo.address,
		);
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

		NetworkDiscoveryService.#server?.close();
		NetworkDiscoveryService.#server = null;

		NetworkDiscoveryService.startNetworkDiscovery();
	}
}
