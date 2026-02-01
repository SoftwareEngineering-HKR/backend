import dgram from "dgram"

export class NetworkDiscoveryService {
	#server = dgram.createSocket("udp4");

	/**
	 * Initialise the UDP socket and start listening
	 */
	startNetworkDiscovery() {
		this.#server.on("error", (err) => {
			console.error(`Server error:\n${err.stack}`);
			server.close();
		});

		this.#server.on("message", (msg, rinfo) => {
			console.log(`Server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
		});

		this.#server.on("listening", () => {
			const address = this.#server.address();
			console.log(`Network discovery listening at ${address.address}:${address.port}`);
		})

		this.#server.bind(4444);
	}
}
