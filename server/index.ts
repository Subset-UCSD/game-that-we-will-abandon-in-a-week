import { SERVER_GAME_TICK } from "@common";
import { clientMessage } from "@common/messages";
import { Game } from "@server/game";
import express from "express";
import { readFile, rename, writeFile } from "fs/promises";
import { createServer } from "http";
import { join } from "path";
import { WebSocketServer } from "ws";
import { deserializeTiles, serializeTiles } from "./tile-manager";

if (process.argv.length !== 3) {
	console.error("usage: node dist/server.js <port>");
	process.exit(1);
}
const [, , port] = process.argv;

const server = createServer();
const app = express();
const wss = new WebSocketServer({
	server: server,
});

declare const IS_SERVING: boolean

server.on("request", app);
app.use(express.static("public"));
app.get("/", (_, res) => {
	if (IS_SERVING) {
		res.redirect('http://localhost:6767/')
		return
	}
	res.sendFile(join(__dirname, "public/index.html"));
});

const tiles = deserializeTiles(
	await readFile("tiles.txt", "utf-8").catch((error) =>
		Error.isError(error) && "code" in error && error.code === "ENOENT" ? "" : Promise.reject(error),
	),
);
let debounceId: ReturnType<typeof setTimeout> | undefined;
const game = new Game(tiles, (tilesEdited) => {
	if (debounceId !== undefined) {
		clearTimeout(debounceId);
	}
	debounceId = setTimeout(async () => {
		debounceId = undefined;
		// too many writes were causing corruption issues i think
		const fileName = `tiles-${Date.now()}.txt.tmp`;
		await writeFile(fileName, serializeTiles(tilesEdited));
		await rename(fileName, "tiles.txt");
		console.log("saved tiles.txt");
	}, 500);
});

wss.on("connection", (ws) => {
	ws.on("message", (msg) => {
		let jason;
		try {
			jason = JSON.parse(msg.toString());
		} catch (e) {
			console.error("erm buddy your message is shit THAT is not jason: ", e);
			console.error("message", msg);
			return;
		}
		const result = clientMessage.safeParse(jason);
		if (result.success) {
			game.handleMessage(ws, result.data);
		} else {
			console.error("erm buddy your message is shit");
			console.dir(result.error.issues, { depth: null });
			console.dir(jason, { depth: null });
			return;
		}
	});
	ws.on("close", () => {
		game.handleDisconnect(ws);
	});
});

server.listen({ port: +port }, () => {
	console.log(`the server is at http://localhost:${port}`);
});

while (true) {
	game.loop();
	game.broadcastState();

	await new Promise((resolve) => setTimeout(resolve, SERVER_GAME_TICK));
}
