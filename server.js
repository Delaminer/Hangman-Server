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
const cors = require('cors');
app.use(cors());
const http = require('http');
const server = http.createServer(app);

//Socket.io stuff
const { Server } = require('socket.io');
const io = new Server(server);
//Allow CORS to allow offsite pages access
const ioSocket = io.listen(server, {
    cors: {
        origin: '*',
    }
});

// app.get('/', (req, res) => {
//     res.sendFile(__dirname + '/index.html');
// });
// app.get('/js', (req, res) => {
//     res.sendFile(__dirname + '/test.js');
// });

let port = 80;
server.listen(port, () => {
    console.log('listening on *:' + port);
});


let games = [];
const newGame = () => {
    let game = new Game(2, 10, getWord, ioSocket);
    //Get a unique room ID for this game
    let id = 'Game' + Math.floor(Math.random() * 10000);
    while(games.map(game => game.id).includes(id)) {
        id = 'Game' + Math.floor(Math.random() * 10000);
    }
    game.id = id;
    //For giving the players a new home after this game ends
    game.findGame = getOpenGame; 
    //Give the game a function that allows itself to be deleted
    game.delete = () => {
        console.log('Stopping game '+game.id)
        //Stop this game loop
        game.stopTimer();
        //Remove this game from the list of games            
        let index = games.indexOf(game);
        if (index > -1) {
            games.splice(index, 1);
        }
    };
    return game;
};

/**
 * Gets an open game (there is space for more people). If there are none, it creates a new game.
 * @returns {Game} A game that can take a new player.
 */
const getOpenGame = () => {
    //Get a list of games that are available (they are not full and they are not over)
    let available = game => !game.isFull() && game.round <= game.roundsPerGame;
    let availableGames = games.filter(available);

    if (availableGames == 0) {
        //Start a new game
        let game = newGame();
        //Add the new game to the list of games
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
ioSocket.on('connection', socket => {
    console.log('Connected: ' + socket.id);
    [player, game] = addPlayer(socket);

    //get number of players and games
    // let gameCount = games.length;
    // let playerCount = 0;
    // for (let g in games) {
    //     playerCount += Object.keys(games[g].players).length;
    // }
    // console.log(`there are now ${playerCount} players in ${gameCount} games.`);

});