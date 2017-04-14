import {EventEmitter} from 'events';
import WebSocket from 'ws';

export default class WebRcon extends EventEmitter {
	constructor (host, password, port = 27021) {
		super();
		this.host = host;
		this.password = password;
		this.port = port;
		this.socket = null;
		this.queue = [];
		this.authenticated = false;
		this.connected = false;
	}

	connect () {
		if (this.connected) {
			return;
		}
		this.socket = new WebSocket('ws://' + this.host + ':' + this.port, 'foo');
		this.socket.onopen = () => {
			if (this.socket.readyState === 1) {
				this.socket.send(this.password);
				this.connected = true;
				this.emit('connect');
				setTimeout(() => {
					for (let message of this.queue) {
						this.socket.send(message);
					}
					this.queue = [];
				}, 100);
			}
		};
		this.socket.onmessage = (data) => {
			if (data.data === 'authenticated') {
				this.authenticated = true;
			} else {
				if (!this.authenticated) {
					this.emit('error', 'not authenticated');
				}
				this.emit('response', data.data)
			}
		};
		this.socket.onerror = (error) => {
			this.emit('error', error);
		};
		this.socket.onclose = () => {
			this.emit('close');
		};
	}

	send (string) {
		this.connect();
		if (this.socket.readyState !== 1) {
			this.queue.push(string);
		} else {
			this.socket.send(string);
		}
	}

	disconnect () {
		this.socket.disconnect();
	}
}
