class Game {
    constructor(maxPlayers, getWord) {
        this.maxPlayers = maxPlayers;
        this.playerCount = 0;
        this.players = {};
        this.getWord = getWord;

        this.round = 1;
    }
    isFull() {
        return this.playerCount >= this.maxPlayers;
    }
    addPlayer(player) {
        if (!this.isFull()) {
            this.players[player.id] = player;
            this.playerCount++;
        }
    }
    getData() {
        return {
            round: this.round,
            players: Object.keys(this.players).map(playerKey => this.players[playerKey].getData()),
            // players: this.players.map(player => player.getData()),
            maxPlayers: this.maxPlayers,
        }
    }
    guess(letter) {

    }
    removePlayer(id, player) {
        delete this.players[id];
    }
}

class Player {
    constructor(id, name, game) {
        this.id = id;
        this.name = name;
        this.score = 0;
        this.score = Math.floor(Math.random() * 100);
        this.correct = [];
        this.incorrect = [];
        this.game = game;
    }
    getData() {
        return {
            name: this.name,
            score: this.score,
            // guesses: this.guesses,
            correct: this.correct,
            incorrect: this.incorrect,
        }
    }
}

module.exports = { Game, Player };