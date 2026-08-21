import {createServer} from "http";
import { WebSocketServer } from "ws";
import express from "express";
import {join} from "path";
import { Game } from "@server/game";

const server = createServer();
const app = express();

app.use(express.static('public'));
server.on("request", app);

app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "public/index.html"));
});

const game = new Game();
const wss = new WebSocketServer({ 
    server: server
});
wss.on("connection", game.handleConnection);


game.run();

server.listen({port:6767}, () => {
  console.log("the server is at http://localhost:6767");
});