const express = require('express');
const https = require('https');
const {Server} = require('socket.io');
const fs = require('fs');

const app = express();
const server = https.createServer({key: fs.readFileSync('ssl/server.key'), cert: fs.readFileSync('ssl/server.crt')}, app);
const io = new Server(server, {cors: {origin: "*"}});

io.on('connection', (socket) => {
    socket.on('offer', (offer) => {
        socket.broadcast.emit('offer', offer);
    });

    socket.on('answer', (answer) => {
        socket.broadcast.emit('answer', answer);
    });

    socket.on('candidate', (candidate) => {
        socket.broadcast.emit('candidate', candidate);
    });
});

server.listen(3001, () => {
    console.log(`Сервер запущен на https://localhost:3001`);
});
