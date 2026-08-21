import {createServer} from "http";
import express from "express";
import { WebSocketServer } from "ws";

const server = createServer();



// server always function
// step 1: ping pong


const wss = new WebSocketServer({ 
  server: server
});

wss.on("connection", (socket) => {
    socket.on("message", (raw) => {
    const message = JSON.parse(raw.toString());

    if (message.type === "ping") {
      socket.send(JSON.stringify({
        type: "pong",
        sentAt: message.sentAt,
      }));
    }
  });

  socket.on("close", () => console.log("Client disconnected"));
})

console.log("WebSocket server running at ws://localhost:8081");