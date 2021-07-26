let socket = io();
        
let myPlayer, game, hints;
game = {};

let infoDisplay = document.getElementById('info');
let scoreBoard = document.getElementById('rank');
let hintDisplay = document.getElementById('hints');
let timeDisplay = document.getElementById('time');
let keyboard = document.getElementById('keyboard');
let keys = {};

let updateScoreboard = players => {
    if (players == undefined) return;

    //Remove previous children
    while(scoreBoard.firstChild) {
        scoreBoard.removeChild(scoreBoard.firstChild);
    }
    players.forEach((player, i) => {
        let element = document.createElement('li');
        element.textContent = (i + 1) + '. ' + player.name + ' - ' + player.score;

        //Add their status
        element.classList.remove('correct');
        element.classList.remove('incorrect');
        if (player.status == 1) {
            element.classList.add('correct');
        }
        else if (player.status == 2) {
            element.classList.add('incorrect');
        }

        if (player.name == myPlayer.name) {
            //This is this player, so add some custom style for it
            element.classList.add('selected');
            // element.textContent = 'YOU ' + element.textContent;
        }
        scoreBoard.appendChild(element);
    });

    //Update local variable
    game.players = players;
}

let updateKeys = (correct, incorrect) => {
    for(let key in keys) {
        let button = keys[key];

        //Reset style
        button.classList.remove('correct');
        button.classList.remove('incorrect');
        button.disabled = false;

        if (correct.includes(key)) {
            //Correct letter
            button.classList.add('correct');
            button.disabled = true;
        }
        else if (incorrect.includes(key)) {
            //Incorrect letter
            button.classList.add('incorrect');
            button.disabled = true;
        }
    }
}

let useGameData = (gameData, mode) => {
    if (gameData == undefined) return;

    updateScoreboard(gameData.players);

    //Round and game stuff
    if (gameData.round != undefined) {
        game.round = gameData.round;
        infoDisplay.textContent = gameData.players.length + ' Players, Round ' + game.round + '/5';

        //Check for new game, or joining a game
        if ((mode == 'join' || mode == 'start' || mode == 'newRound') && game.round > 0) {
            //Add spaces in between each letter
            hints = gameData.hints.split('').join(' ');
            hintDisplay.textContent = hints;

            //Clear keyboard (no guesses yet)
            updateKeys([], []);
        }
    }

    //Time
    if (gameData.timeLeft != undefined) {
        game.timeLeft = gameData.timeLeft;

        timeDisplay.textContent = game.timeLeft;
    }
}

let usePlayerData = (playerData, mode) => {
    if (playerData.correct != undefined && playerData.incorrect != undefined) {
        //Update keys
        updateKeys(playerData.correct, playerData.incorrect)
    }
}

socket.on('join', msg => {
    let info = JSON.parse(msg);
    console.log('This player')
    console.log(info)
    myPlayer = info.player;
    // game = info.game;

    //Show player scoreboard
    // players = game.players.sort((a, b) => b.score - a.score);
    // updateScoreboard(players);

    //Start game for this player if the game already started
    // if (game.round > 0) {
        // setHints(game.hints);
    // }
    useGameData(info.game, 'join');
});

//When another player joins (not this one)
socket.on('addPlayer', msg => {
    let info = JSON.parse(msg);
    console.log('other player')
    console.log(info)
    useGameData(info, 'addPlayer');
});
//When time is changed
socket.on('timeUpdate', msg => {
    let info = JSON.parse(msg);
    console.log('tme update')
    console.log(info)
    useGameData(info, 'timeUpdate');
});
//When a new round starts
socket.on('newRound', msg => {
    let info = JSON.parse(msg);
    console.log('newRound')
    console.log(info)
    useGameData(info, 'newRound');
});

//When a player updates their score
socket.on('scoreUpdate', msg => {
    let info = JSON.parse(msg);
    console.log('score update')
    console.log(info)
    useGameData(info.game, 'scoreUpdate');
});
let setHints = hint => {
    //split then join is used to add spaces in between each letter
    hints = hint.split('').join(' ')
    hintDisplay.textContent = hints
}

//When the game starts
socket.on('start', msg => {
    let info = JSON.parse(msg);
    console.log('Started game');
    console.log(info);
    //setHints(info.hints);

    useGameData(info, 'start');
});

//When the user hears back about their guess
socket.on('guessResult', msg => {
    let info = JSON.parse(msg);

    console.log('Player guessed');
    console.log(info);
    myPlayer = info.player;
    usePlayerData(myPlayer, 'guessResult');

    //Update hint
    hints = info.customHint.split('').join(' ');
    hintDisplay.textContent = hints;

});

let guess = letter => {
    //Make sure the player hasn't aready guessed this letter
    if (myPlayer.correct.includes(letter) || myPlayer.incorrect.includes(letter)) return;

    console.log('guessed ' +letter)
    socket.emit('guess', JSON.stringify({
        guess: letter,
        player: myPlayer,
    }));
}
//add keyboard
let rows = [7, 7, 6, 6]
let i = 0;
for(let row in rows) {
    let rowElement = document.createElement('div')
    for(let j = 0; j < rows[row]; j++) {
        let button = document.createElement('button')
        let letter = String.fromCharCode(65 + i)

        button.textContent = letter;
        button.onclick = () => guess(letter)
        rowElement.appendChild(button)
        i++;

        //Add this key to the dictionary for later access
        keys[letter] = button;

    }
    keyboard.appendChild(rowElement)
}