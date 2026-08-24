import { createServer } from "http";
import { WebSocketServer } from "ws";
import express from "express";
import {join} from "path";
import { Game } from "@server/game";
import { type ClientMessage, clientMessage } from "@common/messages";
import { prettifyError } from 'zod'
import {SERVER_GAME_TICK} from '@common'
import { deserializeTiles, serializeTiles } from "./tile-manager";
import { readFile, writeFile } from "fs/promises";


if (process.argv.length !== 3) {
  console.error('usage: node dist/server.js <port>')
  process.exit(1)
}
const [,, port] = process.argv;

const server = createServer();
const app = express();
const wss = new WebSocketServer({ 
    server: server
});

server.on("request", app);
app.use(express.static('public'));
app.get("/", (_, res) => {
  res.sendFile(join(__dirname, "public/index.html"));
});

const tiles = deserializeTiles(await readFile('tiles.txt', 'utf-8')
  .catch(error => Error.isError(error) && 'code' in error && error.code === 'ENOENT' ? '' : Promise.reject(error)))
const game = new Game(tiles, async tilesEdited => {
  await writeFile('tiles.txt', serializeTiles(tilesEdited))
});

wss.on("connection", (ws) => {
  ws.on("message", (msg) => {
    
    let jason;
    try {
      jason = JSON.parse(msg.toString());
    } catch (e) {
      console.error("erm buddy your message is shit THAT is not jason: ", e,);
      console.error('message', msg)
      return;
    }
    const result = clientMessage.safeParse(jason)
    if (result.success){
    game.handleMessage(ws, result.data);
  } else {
    console.error("erm buddy your message is shit", );
    console.dir(result.error.issues, {depth:null})
    console.dir(jason, {depth:null})
      return;
  }
  });
  ws.on("close", () => {
    game.handleDisconnect(ws);
  });
});

server.listen({port:+port}, () => {
  console.log(`the server is at http://localhost:${port}`);
});

while (true) {

  game.loop()
  game.broadcastState()

  await new Promise(resolve => setTimeout(resolve, SERVER_GAME_TICK))
}