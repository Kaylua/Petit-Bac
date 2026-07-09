import http from "http";

import uuid_pkg from "uuid";
const { v4: uuid } = uuid_pkg;

import GameServer from "./server.js";
import { log_info, log_err } from "./logging.js";

const DEBUG = (process.env.NODE_ENV || 'development') != "production";
const SERVER_PORT = process.env.PITIT_BAC_WS_PORT || 62868;

let server = http.createServer(function(request, response) {
    if (request.url.startsWith("/munin")) return;

    response.writeHead(404)
    response.end()
});

server.listen(SERVER_PORT, function() {
    log_info('Server is listening on port ' + SERVER_PORT + '.');
    let game_server = new GameServer(server);
    game_server.start();
});
