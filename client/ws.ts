const url = window.location.origin.replace(/^http/, "ws")
export const ws = new WebSocket(url);
console.log(url, ws)

ws.onopen = () => {
	ws.send(JSON.stringify({type:"ping"}));
}

ws.onmessage = (msg) => {
		// console.log(msg);
}

export const msg = (message: any) => {
    if (ws.readyState!==ws.OPEN) return;
    ws.send(JSON.stringify(message));
}