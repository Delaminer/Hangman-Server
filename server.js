const fs = require('fs');

//Words
const getList = file => {
    try {
        return fs.readFileSync(file, 'utf8').replace(/\r/g, '').toLowerCase().split('\n');
    } catch (error) {
        console.error(error);
    }
    return [];
}
const capitalize = word => word.charAt(0).toUpperCase() + word.substring(1).toLowerCase();

const animals = getList('animals.txt');
const nouns = getList('nouns.txt');
const adjectives = getList('adjectives.txt');

const words = [...animals, ...nouns, ...adjectives];
const getWord = () => words[Math.floor(Math.random() * words.length)];
//An adjective and an animal (both capitalized)
const getName = () => 
    capitalize(adjectives[Math.floor(Math.random() * adjectives.length)]) + ' ' + 
    capitalize(animals[Math.floor(Math.random() * animals.length)]);

const { Game, Player } = require('./GameManager')

//Http server stuff
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);

//Socket.io stuff
const { Server } = require("socket.io");
const io = new Server(server);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});
app.get('/js', (req, res) => {
    res.sendFile(__dirname + '/test.js');
  });

let port = 80;
server.listen(port, () => {
  console.log('listening on *:'+port);
});


let games = [];
const newGame = () => new Game(10, getWord);

const getOpenGame = () => {
    let availableGames = games.filter(game => !game.isFull());
    if (availableGames == 0) {
        //Start a new game
        let game = newGame();
        games.push(game);
        return game;
    }
    else {
        return availableGames[0];
    }
};

const addPlayer = socket => {
    let name = getName();
    let game = getOpenGame();
    let player = new Player(socket.id, name, game);
    game.addPlayer(player);
    socket.emit('join', JSON.stringify({
        status: 'hi', 
        player: player.getData(),
        game: game.getData(),
    }));
    return [player, game];
};

io.on('connection', socket => {
    console.log('Connected: ' + socket.id);
    [player, game] = addPlayer(socket);

    socket.on('disconnect', () => {
        console.log('Disconnected!');
        game.removePlayer(socket.id, player);
    });
    socket.on('message', msg => {
        console.log('Message: '+msg)
    });
    socket.on('guess', msg => {

        let info = JSON.parse(msg);
        let guess = info.guess;
        game.guess()
    });
});