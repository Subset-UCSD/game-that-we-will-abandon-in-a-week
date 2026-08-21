export const ws = new WebSocket(window.location.origin.replace(/^http/, "ws"));

ws.onopen = () => {
	ws.send(JSON.stringify({type:"ping"}));
}

ws.onmessage = (msg) => {
		console.log(msg);
}

export const msg = (message) => {
    ws.send(JSON.stringify(message));
}