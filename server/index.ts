import { createServer } from "http";
import { WebSocketServer } from "ws";
import express from "express";
import {join} from "path";
import { Game } from "@server/game";
import { type ClientMessage, clientMessage } from "@common/messages";
import { prettifyError } from 'zod'
import {SERVER_GAME_TICK} from '@common/index'


if (process.argv.length !== 3) {
  console.error('usage: node dist/server.js <port>')
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

const game = new Game();

wss.on("connection", (ws) => {
  ws.on("message", (msg) => {
    
    let json;
    try {
      json = JSON.parse(msg.toString());
    } catch (e) {
      console.error("erm buddy your message is shit THAT is not json: ", e,);
      console.error('message', msg)
      return;
    }
    const result = clientMessage.safeParse(json)
    if (result.success){
    game.handleMessage(ws, result.data);
  } else {
    console.error("erm buddy your message is shit", );
    console.dir(result.error.issues, {depth:null})
    console.dir(json, {depth:null})
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

  await new Promise(resolve => setTimeout(resolve, SERVER_GAME_TICK))
}