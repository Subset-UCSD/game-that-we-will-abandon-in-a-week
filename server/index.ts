import { createServer } from "http";
import { WebSocketServer } from "ws";
import express from "express";
import {join} from "path";
import { Game } from "@server/game";
import { type ClientMassage, clientMassage } from "@common/messages";
import { prettifyError } from 'zod'
import {SERVER_GAME_TICK} from '@common'


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
    
    let jason;
    try {
      jason = JSON.parse(msg.toString());
    } catch (e) {
      console.error("erm buddy your massage is shit THAT is not jason: ", e,);
      console.error('massage', msg)
      return;
    }
    const result = clientMassage.safeParse(jason)
    if (result.success){
    game.handleMassage(ws, result.data);
  } else {
    console.error("erm buddy your massage is shit", );
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

  await new Promise(resolve => setTimeout(resolve, SERVER_GAME_TICK))
}