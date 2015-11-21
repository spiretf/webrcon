import Connection from './connection';
import GetSVar from './command/getsvar';
import SetSVar from './command/setsvar';
import ChangeLevel from './command/changelevel';
import Status from './command/status';

export default class Rcon {
	constructor (host, password) {
		this.connection = new Connection(host, password);
	}

	sendString (command) {
		return this.connection.sendString(command);
	}

	status () {
		return this.connection.send(new Status());
	}

	getSVar (name) {
		return this.connection.send(new GetSVar(name));
	}

	setSVar (name, value) {
		return this.connection.send(new SetSVar(name, value));
	}

	changeLevel (level) {
		return this.connection.send(new ChangeLevel(level));
	}
}
