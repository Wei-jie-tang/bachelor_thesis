const http = require('http');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

exports.post_asset = function (IP, port, pieceName) {
  console.log(`Sending Asset piece to ${IP}`);
  if (pieceName === "") {
    console.error('Did not receive asset Piece yet.');
    return;
  }
  const readStream = fs.createReadStream(path.join(__dirname, 'temp', pieceName));
  const form = new FormData;
  form.append('file', readStream);

  const options = {
    host: IP,
    port: port,
    path: '/asset',
    method: 'POST',
    headers: form.getHeaders(),
  }

  const request = http.request(options, (res) => {
    if (res.statusCode !== 201) {
      console.error(`Did not get 'Created'. Code. ${res.statusCode}`);
      res.resume();
      return;
    }

    // Handle response
    let chunks = [];
    res.on('data', (chunk) => {
      chunks.push(chunk);
    }).on('end', () => {
      const msg = Buffer.concat(chunks).toString();
      console.log(msg);
    });
  });

  request.on('error', (err) => { console.error(`Error sending asset Piece: ${err.message}`); });
  form.pipe(request);
}

exports.post_shamirKey = function (IP, port, key) {
  console.log(`Sending Shamir key to ${IP}`);
  if (key === undefined) {
    console.error('Did not receive key yet.');
    return;
  }

  const options = { host: IP,
    port: port,
    path: '/key',
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain'
    }
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
    });
  });

  request.write(key);
  request.end();
  request.on('error', (err) =>{ console.error(`Error sending Shamir key: ${err.message}`); })
}

exports.post_assetState = function (IP, port, postData) {
  console.log(`Sending Asset state to ${IP}`);
  const options = {
    host: IP,
    port: port,
    path: '/state',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=UTF-8' 
    }
  };

  const request = http.request(options, (res) => {
    if (res.statusCode !== 201) {
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
      const msg = Buffer.concat(chunks).toString();
      console.log(msg);
    })
  });

  request.write(postData);
  request.end();

  request.on('error', (err) => { console.error(`Error sending heartbeat: ${err.message}`); });
}