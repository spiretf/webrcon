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
		this.connecting = false;
	}

	connect () {
		if (this.connected || this.connecting) {
			return;
		}
		this.connecting = true;
		this.socket = new WebSocket('ws://' + this.host + ':' + this.port, 'foo');
		this.socket.onopen = () => {
			if (this.socket.readyState === 1) {
				this.socket.send(this.password);
				this.emit('connect');
				setTimeout(() => {
					for (let message of this.queue) {
						this.socket.send(message);
					}
					this.queue = [];
					this.connecting = false;
					this.connected = true;
				}, 100);
			}
		};
		this.socket.onmessage = ({data}) => {
			if (data === 'authenticated') {
				this.authenticated = true;
			} else {
				if (!this.authenticated) {
					this.emit('error', 'not authenticated');
				}
				this.emit('response', data)
			}
		};
		this.socket.onerror = (error) => {
			this.connecting = false;
			this.emit('error', error);
		};
		this.socket.onclose = () => {
			this.connecting = false;
			this.emit('close');
		};
	}

	send (string) {
		if (!this.connected) {
			this.queue.push(string);
			this.connect();
		} else {
			this.socket.send(string);
		}
	}

	disconnect () {
		if (this.socket && this.socket.disconnect) {
			this.socket.disconnect();
		}
	}
}
