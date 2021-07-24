class Game {
    constructor(maxPlayers, getWord) {
        this.maxPlayers = maxPlayers;
        this.players = [];
        this.getWord = getWord;

        this.round = 1;
    }
    isFull() {
        return this.players.length >= this.maxPlayers;
    }
    addPlayer(player) {
        if (!this.isFull()) {
            this.players.push(player);
        }
    }
    getData() {
        return {
            round: this.round,
            players: this.players.map(player => player.getData()),
            maxPlayers: this.maxPlayers,
        }
    }
}

class Player {
    constructor(name, game) {
        this.name = name;
        this.score = 0;
        this.score = Math.floor(Math.random() * 100);
        this.guesses = 0;
        this.game = game;
    }
    getData() {
        return {
            name: this.name,
            score: this.score,
            guesses: this.guesses,
        }
    }
}

module.exports = { Game, Player };