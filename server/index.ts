import {createServer} from "http";
import { WebSocketServer } from "ws";
import express from "express";
import {join} from "path";
import { Game } from "@server/game";
import { type ClientMessage, clientMessage } from "@common/messages";

if (process.argv.length !== 3) {
  console.error('usage: node dist/server.js <port>')
}
const [,, port] = process.argv

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
    let content: ClientMessage;
    try {
      content = clientMessage.parse(JSON.parse(msg.toString()));
    } catch (e) {
      console.error("erm buddy your message is shit: ", e);
      return;
    }
    game.handleMessage(ws, content);
  });
  ws.on("close", () => {
    game.handleDisconnect(ws);
  });
});

server.listen({port:+port}, () => {
  console.log(`the server is at http://localhost:${port}`);
});