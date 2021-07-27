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
const getWord = () => words[Math.floor(Math.random() * words.length)].toUpperCase();
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
const { Server } = require('socket.io');
const io = new Server(server);

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});
app.get('/js', (req, res) => {
    res.sendFile(__dirname + '/test.js');
});

let port = 5000;
server.listen(port, () => {
  console.log('listening on *:' + port);
});


let games = [];
const newGame = () => new Game(2, 10, getWord, io);

/**
 * Gets an open game (there is space for more people). If there are none, it creates a new game.
 * @returns {Game} A game that can take a new player.
 */
const getOpenGame = () => {
    //Get a list of games that have room
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

/**
 * Adds a player to the server.
 * @param {*} socket The socket the player is using.
 * @returns {[Player, Game]} The player object for this player and the game they are in.
 */
const addPlayer = socket => {
    //Get a random name for this player
    let name = getName();
    //Get an open game for this player
    let game = getOpenGame();
    //Create the player
    let player = new Player(name, game, socket);
    //Add the player to the available game
    game.addPlayer(player);
    
    return [player, game];
};

//Main server connection method. Handles new players when they connect.
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
});