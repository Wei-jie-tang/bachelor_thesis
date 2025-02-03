const http = require('http');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const EventEmitter = require('events');
const { exportBenchmarks } = require('@/common/benchmark/bench');

let events = new EventEmitter();
exports.events = events;
let received = {
  testament: false,
  keys: [],
  assets: [],
};

let exported = false;
function allDone() {
  return (
    received.testament &&
    received.keys[0] &&
    received.keys[1] &&
    received.assets[0] &&
    received.assets[1]
  );
}

exports.post_heartbeat = function (IP, port, postData) {
  if (allDone() && !exported) {
    exportBenchmarks();
    exported = true;
  }

  const options = {
    host: IP,
    port: port,
    path: '/heartbeat',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const request = http.request(options, (res) => {
    if (res.statusCode === 401) {
      console.error('Could not verify heartbeat.');
      res.resume();
      return;
    }
    if (res.statusCode !== 200) {
      console.error(`Did not get successful response. Code: ${res.statusCode}`);
      res.resume();
      return;
    }
    // Handle response
    let chunks = [];
    res.on('data', (chunk) => {
      chunks.push(chunk);
    });
    res.on('end', () => {
      const address = Buffer.concat(chunks).toString();
    });
  });

  request.write(postData);
  request.end();

  request.on('error', (err) => {
    events.emit('POST_Error', 'heartbeat', [IP, port, postData]);
  });
};

exports.post_assetPiece = function (IP, port, name) {
  console.log(`Sending Asset piece to ${IP}`);
  const readStream = fs.createReadStream(path.join(__dirname, 'temp', name));
  const form = new FormData();
  form.append('file', readStream);

  const options = {
    host: IP,
    port: port,
    path: '/asset',
    method: 'POST',
    headers: form.getHeaders(),
  };

  const request = http.request(options, (res) => {
    if (res.statusCode !== 201) {
      console.error(`Did not get 'Created'. Code: ${res.statusCode}`);
      res.resume();
      return;
    }
    // Handle response
    let chunks = [];
    res.on('data', (chunk) => {
      chunks.push(chunk);
    });
    res.on('end', () => {
      const msg = Buffer.concat(chunks).toString();
      console.log(msg);
      received.assets.push(true);
    });
  });
  request.on('error', (err) => {
    events.emit('POST_Error', 'asset', [IP, port, name]);
  });
  form.pipe(request);
};

exports.post_shamirKey = function (IP, port, key) {
  console.log(`Sending Shamir key to ${IP}`);
  const options = {
    host: IP,
    port: port,
    path: '/key',
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
    },
  };

  const request = http.request(options, (res) => {
    if (res.statusCode !== 201) {
      console.error(`Did not get 'Created'. Code: ${res.statusCode}`);
      res.resume();
      return;
    }
    // Handle response
    let chunks = [];
    res.on('data', (chunk) => {
      chunks.push(chunk);
    });
    res.on('end', () => {
      const msg = Buffer.concat(chunks).toString();
      console.log(msg);
      received.keys.push(true);
    });
  });

  request.write(key);
  request.end();
  request.on('error', (err) => {
    events.emit('POST_Error', 'key', [IP, port, key]);
  });
};

exports.post_testament = function (IP, port) {
  console.log(`Sending Testament to ${IP}`);
  const readStream = fs.createReadStream(
    path.join(__dirname, 'temp', 'testament.enc')
  );
  const form = new FormData();
  form.append('file', readStream);

  const options = {
    host: IP,
    port: port,
    path: '/testament',
    method: 'POST',
    headers: form.getHeaders(),
  };

  const request = http.request(options, (res) => {
    if (res.statusCode !== 201) {
      console.error(`Did not get 'Created'. Code: ${res.statusCode}`);
      res.resume();
      return;
    }
    // Handle response
    let chunks = [];
    res.on('data', (chunk) => {
      chunks.push(chunk);
    });
    res.on('end', () => {
      const msg = Buffer.concat(chunks).toString();
      console.log(msg);
      received.testament = true;
      events.emit('Testament received');
    });
  });

  request.on('error', (err) => {
    events.emit('POST_Error', 'testament', [IP, port]);
  });
  form.pipe(request);
};
