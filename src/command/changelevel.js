export default class ChangeLevel {
	constructor (level) {
		// force response
		this.command = 'changelevel ' + level + '; echo ' + level;
		this.level = level;
	}

	handler () {
		return this.level;
	}
}
