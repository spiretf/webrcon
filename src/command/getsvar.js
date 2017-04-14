export default class GetSVar {
	constructor (name) {
		this.command = name;
		this.name = name;
	}

	handler (response) {
		const regex = '"' + this.name + '" = "([^"]*)"';
		const matches = response.match(new RegExp(regex));
		if (matches) {
			return matches[1];
		} else {
			return null;
		}
	}
}
