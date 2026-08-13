// Simple WebSocket -> SSH proxy (for demo/prototype only)
// Dependencies: express, ws, ssh2
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { Client } = require('ssh2');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/ssh' });

// Serve static frontend
app.use(express.static(path.join(__dirname, 'public')));

// Basic connection handling
wss.on('connection', (ws, req) => {
  let ssh = null;
  let sshStream = null;
  let closed = false;

  ws.on('message', (msg) => {
    // Messages are JSON strings with shape { action: 'connect'|'input'|'resize', ... }
    let data;
    try { data = JSON.parse(msg.toString()); } catch (e) {
      ws.send(JSON.stringify({ type: 'error', message: 'invalid_json' }));
      return;
    }

    if (data.action === 'connect') {
      if (ssh) {
        ws.send(JSON.stringify({ type: 'error', message: 'already_connected' }));
        return;
      }

      ssh = new Client();
      ssh.on('ready', () => {
        ssh.shell({ term: data.term || 'xterm-color', cols: data.cols || 80, rows: data.rows || 24 }, (err, stream) => {
          if (err) {
            ws.send(JSON.stringify({ type: 'error', message: 'shell_error:' + err.message }));
            ssh.end();
            return;
          }
          sshStream = stream;

          stream.on('data', (chunk) => {
            ws.send(JSON.stringify({ type: 'data', data: chunk.toString('utf8') }));
          });

          stream.on('close', () => {
            ws.send(JSON.stringify({ type: 'exit' }));
            ssh.end();
          });

          stream.stderr && stream.stderr.on('data', (d) => {
            ws.send(JSON.stringify({ type: 'data', data: d.toString('utf8') }));
          });

          ws.send(JSON.stringify({ type: 'ready' }));
        });
      }).on('error', (err) => {
        ws.send(JSON.stringify({ type: 'error', message: 'ssh_error:' + err.message }));
      }).on('end', () => {
        // SSH connection ended
      });

      // Connect options: host, port, username, password OR privateKey (string)
      const connectOpts = {
        host: data.host,
        port: data.port || 22,
        username: data.username,
      };
      if (data.password) connectOpts.password = data.password;
      if (data.privateKey) connectOpts.privateKey = Buffer.from(data.privateKey);
      if (data.passphrase) connectOpts.passphrase = data.passphrase;

      // IMPORTANT: for production, validate and sanitize input, enforce auth on the web layer
      ssh.connect(connectOpts);
    }

    else if (data.action === 'input') {
      if (sshStream) sshStream.write(data.data);
    }

    else if (data.action === 'resize') {
      if (sshStream && typeof sshStream.setWindow === 'function') {
        sshStream.setWindow(data.rows, data.cols, data.height || 0, data.width || 0);
      }
    }

    else {
      ws.send(JSON.stringify({ type: 'error', message: 'unknown_action' }));
    }
  });

  ws.on('close', () => {
    if (ssh) ssh.end();
    closed = true;
  });

  ws.on('error', () => {
    if (ssh) ssh.end();
    closed = true;
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('Server listening on port', PORT);
  console.log('WebSocket path: /ssh');
});
