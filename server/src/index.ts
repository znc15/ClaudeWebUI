import http from "node:http";
import { URL } from "node:url";

import express from "express";
import { WebSocketServer } from "ws";

import { isAuthorized, isWebSocketAuthorized, sendUnauthorized } from "./auth.js";
import { loadConfig } from "./config.js";
import { createNodePtyProcess } from "./node-pty-factory.js";
import { SessionService } from "./session-service.js";
import { SessionStore } from "./session-store.js";
import type { ClientEvent } from "./types.js";

const config = loadConfig();
const store = new SessionStore(config.dataDir);
const service = new SessionService(config, store, createNodePtyProcess);

const app = express();
app.use(express.json());
app.use((request, response, next) => {
  response.header("Access-Control-Allow-Origin", request.header("origin") ?? "*");
  response.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Claude-Webui-Password");
  response.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (request.method === "OPTIONS") {
    response.sendStatus(204);
    return;
  }

  next();
});

app.get("/api/health", (request, response) => {
  if (!isAuthorized(request, config.password)) {
    sendUnauthorized(response);
    return;
  }

  response.json({
    ok: true,
    authRequired: Boolean(config.password),
    command: config.command,
    defaultCwd: config.defaultCwd,
  });
});

app.get("/api/sessions", async (request, response) => {
  if (!isAuthorized(request, config.password)) {
    sendUnauthorized(response);
    return;
  }

  response.json(await service.listSessions());
});

app.post("/api/sessions", async (request, response) => {
  if (!isAuthorized(request, config.password)) {
    sendUnauthorized(response);
    return;
  }

  const session = await service.createSession(request.body ?? {});
  response.status(201).json(session);
});

app.get("/api/sessions/:sessionId", async (request, response) => {
  if (!isAuthorized(request, config.password)) {
    sendUnauthorized(response);
    return;
  }

  const session = await service.getSession(request.params.sessionId);
  if (!session) {
    response.status(404).json({ error: "Session not found" });
    return;
  }

  response.json(session);
});

const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

wss.on("connection", (socket, request) => {
  const requestUrl = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
  const sessionId = requestUrl.searchParams.get("sessionId");
  if (!sessionId) {
    socket.close(1008, "sessionId is required");
    return;
  }

  void service.attach(sessionId, (event) => {
    socket.send(JSON.stringify(event));
  }).then((detach) => {
    if (!detach) {
      socket.close(1008, "session not found");
      return;
    }

    socket.on("close", () => {
      detach();
    });
  });

  socket.on("message", (payload) => {
    const message = JSON.parse(payload.toString()) as ClientEvent;
    if (message.type === "input") {
      void service.handleInput(sessionId, message.content);
      return;
    }

    void service.handleResize(sessionId, message.cols, message.rows);
  });
});

server.on("upgrade", (request, socket, head) => {
  const requestUrl = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
  if (requestUrl.pathname !== "/ws") {
    socket.destroy();
    return;
  }

  const password = requestUrl.searchParams.get("password");
  if (!isWebSocketAuthorized(config.password, password)) {
    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
    socket.destroy();
    return;
  }

  wss.handleUpgrade(request, socket, head, (websocket) => {
    wss.emit("connection", websocket, request);
  });
});

server.listen(config.port, config.host, () => {
  console.log(`Claude WebUI backend listening on http://${config.host}:${config.port}`);
});
