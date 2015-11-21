# WebRcon

Create rcon connections using websockets

## Plugin

WebRcon consists of a sourcemod plugin that accepts websocket connections and allows rcon commands to be send over the socket.

[Download Plugin](https://github.com/spiretf/webrcon/raw/master/plugin/webrcon.smx)

### Authentication

Authentication of the websocket connection is done by sending the password as the first message over the socket, if authentication is successfull the server will respond with `"authenticated"`

The provided password is checked against two server vars

- `rcon_password` - the regular rcon password
- `sm_webrcon_key` -  the webrcon only password, allows keeping the webrcon seperate from the one used for regular connections


## JS Client

WebRcon comes with a javascript client which runs in nodejs or the browser (trough browserify/webpack/etc)

```
npm install --save webrcon
```

### Usage

```js
import Rcon from 'webrcon';

const rcon = new Rcon('127.0.0.1', 'secret_rcon_password');

(async () => {
	const result = await rcon.status();
	console.log(result); // { name: 'UGC Highlander Match', map: 'pl_badwater', players: [] }
})();


```

### API


- `status(): Promise<Object>` get server status including players
- `getSVar(string: name): Promise<String>` get the value of a server var
- `setSVar(string: name, string: value): Promise` set the value of a server var
- `changeLevel(string: level): Promise` change the level
- `sendString(string: command): Promise<string>` send a raw rcon command
