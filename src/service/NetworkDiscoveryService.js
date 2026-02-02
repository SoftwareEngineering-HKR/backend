import dgram from "dgram";

/**
 * Service which enables devices to be automatically discovered
 * @class NetworkDiscoveryService
 *
 * @property {dgram.Socket} #server - The socket object for UDP communication
 */
export class NetworkDiscoveryService {
	#server = dgram.createSocket("udp4");

	/**
	 * Initialise the UDP socket and start listening
	 * @function startNetworkDiscovery
	 * @returns {void}
	 */
	startNetworkDiscovery() {
		this.#server.on("error", (err) => {
			console.error(`Server error:\n${err.stack}`);
			this.#server.close();
		});

		this.#server.on("message", (msg, rinfo) => {
			console.log(`Server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
		});

		this.#server.on("listening", () => {
			const address = this.#server.address();
			console.log(`Network discovery listening at ${address.address}:${address.port}`);
		});

		this.#server.bind(4444);
	}
}
