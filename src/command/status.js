export default class Status {
	command = 'status';

	handler (response) {
		var status = {
			name: '',
			map: '',
			players: []
		};
		var playerIds = {};
		var lines = response.split("\n");
		for (var i = 0; i < lines.length; i++) {
			let parts;
			var line = lines[i].trim();
			if (line[0] !== '#' && line.indexOf(':')) {
				parts = line.split(':');
				parts = parts.map((part)=> {
					return part.trim()
				});
				if (parts[0] === 'hostname') {
					status.name = parts[1];
				} else if (parts[0] === 'map') {
					status.map = parts[1].substr(0, parts[1].indexOf(' '));
				}
			} else if (line[0] === '#' && line.substr(0, 8) !== '# userid') {
				var playerLine = line.substr(2).trim();
				parts = playerLine.split('"');
				parts = parts.map((part)=> {
					return part.trim()
				});
				var id = parseInt(parts[0], 10);
				if (playerIds[id]) {
					continue;
				}
				playerIds[id] = true;
				var name = parts[1];
				if (!parts[2]) {
					return;
				}
				parts = parts[2].replace(/\s+/g, ' ').split(' ');
				var steamId = parts[0];
				var player = {
					id: id,
					name: name,
					steamId: steamId
				};
				if (parts.length > 2 && steamId !== 'BOT') {
					player.ping = parseInt(parts[2], 10);
					player.ip = parts[5];
					var timeParts = parts[1].split(':');
					if (timeParts.length === 2) {
						player.connected = parseInt(timeParts[0], 10) * 60 + parseInt(timeParts[1], 10);
					} else {
						player.connected = parseInt(timeParts[0], 10) * 3600 + parseInt(timeParts[1], 10) * 60 + parseInt(timeParts[2], 10);
					}
				}
				status.players.push(player)
			}
		}
		return status;
	}
}
