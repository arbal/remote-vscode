import * as net from 'net';
import Session from "./Session";
import * as vscode from 'vscode';
import Logger from '../utils/Logger';

const L = Logger.getLogger('Server');

const DEFAULT_PORT = 52689;

class Server {
  online : boolean = false;
  server : net.Server;
  defaultSession : Session;

  start(quiet : boolean) {
    L.trace('start', quiet);

    if (this.isOnline()) {
      this.stop();
      L.info("Restarting server");
      vscode.window.setStatusBarMessage("Restarting server", 2000);

    } else {
      if (!quiet) {
        L.info("Starting server");
        vscode.window.setStatusBarMessage("Starting server", 2000);
      }
    }

    this.server = net.createServer(this.onServerConnection.bind(this));

    this.server.on('listening', this.onServerListening.bind(this));
    this.server.on('error', this.onServerError.bind(this));
    this.server.on("close", this.onServerClose.bind(this));

    this.server.listen(this.getPort(), '127.0.0.1');
  }

  getPort() : number {
    var remoteConfig = vscode.workspace.getConfiguration("remote");
    var port = remoteConfig.get("port");

    return +(port || DEFAULT_PORT);
  }

  onServerConnection(socket) {
    L.trace('onServerConnection');

    var session = new Session(socket);
    session.send("VSCode " + 1);

    session.on('connect', () => {
      console.log("connect");
      this.defaultSession = session;
    });
  }

  onServerListening(e) {
    L.trace('onServerListening');
    this.setOnline(true);
  }

  onServerError(e) {
    L.trace('onServerError', e);

    setTimeout(() => {
      this.start(true);
    }, 10000);
  }

  onServerClose() {
    L.trace('onServerClose');
  }

  stop() {
    L.trace('stop');

    if (this.isOnline()) {
      vscode.window.setStatusBarMessage("Stoping server", 2000);
      this.server.close();
      this.setOnline(false);
    }
  }

  setOnline(online : boolean) {
    L.trace('setOnline', online);
    this.online = online;
  }

  isOnline() : boolean {
    L.trace('isOnline');

    L.debug('isOnline?', this.online);
    return this.online;
  }
}

export default Server;