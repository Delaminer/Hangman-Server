class Game {
    constructor(minPlayers, maxPlayers, getWord) {
        this.minPlayers = minPlayers;
        this.maxPlayers = maxPlayers;
        this.playerCount = 0;
        this.players = {};
        this.getWord = getWord;

        this.roundsPerGame = 5;
        this.round = 0;
        this.timePerRound = 30;
        this.timeLeft = this.timePerRound;

        //Timing
        this.timer = undefined;
    }

    isFull() {
        return this.playerCount >= this.maxPlayers;
    }

    addPlayer(player) {
        if (!this.isFull()) {
            this.players[player.id] = player;
            this.playerCount++;
            player.sendMessage('join', JSON.stringify(this.getData(true, player)));

            //Connect this player's guess to the game's
            player.socket.on('guess', msg => {
                //Call this game's guess for this player
                let info = JSON.parse(msg);
                let guess = info.guess;
                this.guess(guess, player);
            })

            //Let other players know there is a new player
            for(let otherPlayer in this.players) {
                //Skip the new player
                if (otherPlayer ===  player.id) continue;

                this.players[otherPlayer].sendMessage('addPlayer', JSON.stringify(this.getData(false)));
            }

            if (this.round == 0 && this.playerCount >= this.minPlayers) {
                //Start the game!
                //Start at round 1
                this.round = 1;
                //Get a new word
                this.word = this.getWord();
                console.log('new game, word is '+this.word)
                //Reset timing
                this.timeLeft = this.timePerRound;
                //Start timer
                this.startTimer();

                //Reset players
                for(let p in this.players) {
                    this.players[p].reset(true);
                }
                //Then notify. This is seperated in two loops so that the message contains all updated values from the reset
                for(let p in this.players) {
                    //Send message
                    this.players[p].sendMessage('start', JSON.stringify(this.getData(true, this.players[p])));
                }
            }
        }
    }

    getData(personal, player) {
        if (personal) {
            let customHint = 'Please wait';
            if (this.word != undefined)
                customHint = this.word.split('').map(letter => player.correct.includes(letter) ? letter : '_').join('');

            return {
                player: player.getData(false),
                customHint: customHint,
                game: this.getData(false),
            }
        }
        else {
            return {
                round: this.round,
                roundsPerGame: this.roundsPerGame,
                timeLeft: this.timeLeft,
                //Return players as an array for ease of access
                players: Object.keys(this.players).map(playerKey => this.players[playerKey].getData(true)),
                // players: this.players.map(player => player.getData()),
    
                minPlayers: this.minPlayers,
                maxPlayers: this.maxPlayers,
                //Return the hints a player gets if they have not guessed anything yet
                hints: this.getHints(['-']),
            }
        }
    }

    startTimer() {
        this.timer = setInterval(() => {
            //This function runs every second
            this.timeLeft--;
            
            //If time goes negative (display 0), end the round
            if (this.timeLeft < 0) {
                //Start a new round
                this.round++;
                //New word
                this.word = this.getWord();
                console.log('new round, word is '+this.word)
                //Reset time
                this.timeLeft = this.timePerRound;

                if (this.round > this.roundsPerGame) {
                    //Stop the game timer
                    this.stopTimer();
                    
                    // //Reset players
                    // for(let p in this.players) {
                    //     this.players[p].reset(false);
                    // }
                    //Notify players the game ended. They can still look at the old scoreboard
                    for(let p in this.players) {
                        //Send message
                        this.players[p].sendMessage('gameEnd', JSON.stringify(this.getData(true, this.players[p])));
                    }

                    //End the game, giving a short period before a new one starts
                    let endTimer = setInterval(() => {
                        //10 seconds have passed, so tell players to leave and delete this game

                        for(let p in this.players) {
                            //Send blank message to tell players the game is closing, so they can join a new one
                            this.players[p].sendMessage('gameClose', '{}');
                        }
                        if (this.delete != undefined) {
                          this.delete();
                        }
                    }, 10000);
                }
                else {
                    //Next round. Resest guesses and lives, but not score
                    

                    //Reset players
                    for(let p in this.players) {
                        this.players[p].reset(false);
                    }
                    //Then notify. This is seperated in two loops so that the message contains all updated values from the reset
                    for(let p in this.players) {
                        //Send message
                        this.players[p].sendMessage('newRound', JSON.stringify(this.getData(true, this.players[p])));
                    }
                }
            }
            else {
                //Show the updated time to the players
    
                for(let p in this.players) {
                    this.players[p].sendMessage('timeUpdate', JSON.stringify(this.getData(false)));
                }
            }
            

        }, 1000);
    }

    stopTimer() {
        if (this.timer != undefined) {
            clearInterval(this.timer);
            this.timer = undefined;
        }
    }

    /**
     * Guess a letter for a player.
     * @param {string} letter The letter guessed as a string
     * @param {Player} player The Player object for the player.
     */
    guess(letter, player) {
        if (this.round < 1) return;

        //Must be a new guess and the player must still be in guessing mode
        if (player.status != 0 || player.correct.includes(letter) || player.incorrect.includes(letter)) return

        //Check if the word contains the letter
        if (this.word.includes(letter)) {
            //Good!
            player.correct.push(letter);
            console.log('Correct! letter '+letter)
            
            //Check if the player guessed all of the letters
            if (this.word.split('').filter(letter => !player.correct.includes(letter)).length == 0) {
                //They win!
                player.status = 1;
                //Add score relative to the number of lives they have left and how many people got it before them
                player.score += this.calculateScore(player.lives);
                console.log(player.name + ' has guessed the word correctly with ' + player.lives + ' left!');
            }
        }
        else {
            //Incorrect!
            player.incorrect.push(letter);
            player.lives--;
            if (player.lives <= 0) {
                //The player loses
                player.status = 2;
            }
        }

        //Send back data reflecting the new guess
        player.sendMessage('guessResult', JSON.stringify(this.getData(true, player)));

        //And update scores for all players
        for(let p in this.players) {
            this.players[p].sendMessage('scoreUpdate', JSON.stringify(this.getData(false)));
        }
    }

    /**
     * Calculates the score a player receives based on certain parameters.
     * @param {number} livesLeft How many lives they had left when they won
     * @param {number} rank The rank the player placed in this round 
     * (how many people had won when they won, including themselves (1st, 2nd, 3rd))
     */
    calculateScore(livesLeft, rank) {
        if (rank == undefined) {
            //Find it ourselves
            rank = Object.keys(this.players).filter(playerID => this.players[playerID].status == 1).length;
        }

        //1st gets 100, 2nd gets 80, then 60, and so on
        let rankBonus = 120 - (20 * rank);

        //You get 200 points for each life left
        let livesBonus = 20 * livesLeft;

        return rankBonus + livesBonus;
    }

    /**
     * Removes a player from this game
     * @param {string} id The player's ID
     * @param {Player} player The player object. Not actually needed.
     */
    removePlayer(id, player) {
        if (this.players[id] != undefined) {
            //Remove the player if it exists
            delete this.players[id];
            this.playerCount--;
        }
    }

    getHints(guesses) {
        if (this.word == undefined || typeof this.word != 'string') return '';
        return this.word.split('').map(char => guesses.includes(char) ? char : '_').join('');
    }
}

class Player {
    constructor(name, game, socket) {
        this.id = socket.id;
        this.name = name;
        this.score = 0;
        this.socket = socket;
        // this.score = Math.floor(Math.random() * 100);
        this.correct = ['-'];
        this.incorrect = [];
        this.status = 0; //0: still guessing, 1: won, 2: lost
        this.game = game;
        //Intialize their number of lives to the max, just in case
        this.startingLives = 10;
        this.lives = this.startingLives;
    }

    getData(basic) {
        let output = {
            name: this.name,
            score: this.score,
            status: this.status,
            lives: this.lives,
            // guesses: this.guesses,
            // correct: this.correct,
            // incorrect: this.incorrect,
        };
        if (!basic) {
            //Add more personal data
            output.correct = this.correct;
            output.incorrect = this.incorrect;
        }

        return output;
    }

    sendMessage(name, message) {
        this.socket.emit(name, message);
    }

    /**
     * Resets variables for this player. Use for new rounds and new games.
     * @param {boolean} resetScore Reset score as well. Do this for new games, not new rounds. 
     */
    reset(resetScore) {
        //Reset lives
        this.lives = this.startingLives;
        //Reset guesses
        this.correct = ['-'];
        this.incorrect = [];
        //Reset status
        this.status = 0;

        if (resetScore) {
            //Reset score
            this.score = 0;
        }
    }
}

module.exports = { Game, Player };