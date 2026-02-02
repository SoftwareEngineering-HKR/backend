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
		this.#server.on("error", (err) => this.#handleError(err));

		this.#server.on("message", (msg, rinfo) => this.#parseDatagram(msg, rinfo));

		this.#server.on("listening", () => this.#startListen());

		this.#server.bind(4444);
	}

	/**
	 * Close the socket and stop listening
	 * @function stopNetworkDiscovery
	 * @returns {void}
	 */
	stopNetworkDiscovery() {
		this.#server.close();
	}

	/*
	 * Process the content of the message
	 * Looks for UDP datagrams that contain "NetworkDiscovery" and reply with MQTT brokers IP
	 * @function parseDatagram
	 * @param {Buffer} msg - Content of the datagram that the socket has received
	 * @param {dgram.RemoteInfo} rinfo - Information about the sender of the datagram
	 * @returns {void}
	 */
	#parseDatagram(msg, rinfo) {
		//TODO: implement content parsing & reply
		console.log(`Server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
	}

	/*
	 * Start listening to the port specified in the .env
	 * @function startListen
	 * @returns {void}
	 */
	#startListen() {
		//TODO: change port to use the .env
		const address = this.#server.address();
		console.log(`Network discovery listening at ${address.address}:${address.port}`);
	}

	/*
	 * Handle potential errors of the socket
	 * @function handleError
	 * @param {Error} err - The error object
	 * @returns {void}
	 */
	#handleError(err) {
		/**
		 * For now errors just get printed to the console, maybe log them to a file later on?
		 * Also idk if closing the server after an error is the best way to handle it, should prob do sth else :,)
		 */
		console.error(`UDP socket error: ${err.stack}`);
		this.#server.close();
		/* maybe restart socket or dont close it */
	}
}
