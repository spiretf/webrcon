import GetSVar from './getsvar.js'

export default class SetSVar extends GetSVar {
	constructor (name, value) {
		super();
		this.command = name + " " + value + "; " + (this.command) ? this.command : '';
	}
}
