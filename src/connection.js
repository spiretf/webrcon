import Promise from 'bluebird';
import WebRcon from './webrcon.js';

export default class Connection {
	connectPromise = null;
	messageHandlers = [];
	receivedTimer = 0;
	receivedBuffer = '';
	errorCount = 0;

	constructor (host, password) {
		this.host = host;
		this.password = password;
		this.errorListeners = [];

		this.init();
	}

	onError (listener) {
		this.errorListeners.push(listener);
	}

	buildRcon () {
		if (this.rcon) {
			return;
		}
		this.rcon = new WebRcon(this.host, this.password);
	}

	init () {
		this.buildRcon();
		this.connected = false;
		this.connectPromise = null;
		this.rcon.on('response', (response) => {
			clearTimeout(this.receivedTimer);
			this.receivedBuffer += response;
			// buffer the response
			this.receivedTimer = setTimeout(() => {
				var response = this.receivedBuffer;
				this.receivedBuffer = '';
				if (this.messageHandlers.length) {
					while (this.messageHandlers.length > 0) {
						var handler = this.messageHandlers.shift();
						handler(response);
					}
				} else {
					console.log('unhandled response:');
					console.log("'" + response + "'");
				}
			}, 100);
		});
		this.rcon.on('error', (e) => {
			if (e == 'not authenticated') {
				for (let listener of this.errorListeners) {
					listener(e);
				}
				return;
			}
			this.errorCount++;
			console.log('failed to connect ' + this.errorCount + ' times (' + e + ')');
			Promise.delay(2500).then(() => {
				if (this.connectPromise) {
					this.rcon.connect();
				} else {
					this.connect();
				}
			});
		});
		this.rcon.on('end', () => {
			console.log('lost rcon');
			this.connectPromise = null;
		});
	}

	connect () {
		if (!this.connectPromise) {
			this.connectPromise = new Promise((resolve) => {
				this.rcon.on('connect', () => {
					resolve(null);
				})
			});
			this.rcon.connect();
		}
		return this.connectPromise;
	}

	async sendString (command) {
		await this.connect();
		// give existing command a chance to finish
		await this.waitFor(() => {
			return this.messageHandlers.length === 0;
		}, 500);
		var promise = new Promise((resolve) => {
			this.messageHandlers.push(resolve);
		});
		this.rcon.send(command);
		return await promise;
	}

	async send (command) {
		var response = await this.sendString(command.command);
		return command.handler(response);
	}

	disconnect () {
		this.rcon.disconnect();
	}

	async waitFor (cb, timeout) {
		var waited = 0;
		while (waited < timeout) {
			if (cb()) {
				return true;
			}
			await Promise.delay(250);
			waited += 250;
		}
		return false;
	}
}
