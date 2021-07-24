// document.getElementById('game').textContent = 'loading';


var socket = io();
        
let input = document.getElementById('chat');
let button = document.getElementById('send');
if (button)
button.onclick = () => {
    let message = input.value;

    if (message) {
        socket.emit('message', message);
    }

    input.value = '';
}
let myPlayer;

socket.on('join', msg => {
    let info = JSON.parse(msg);
    console.log(info)
    myPlayer = info.player;
    game = info.game;
    players = game.players.sort((a, b) => b.score - a.score);

    //Display name
    // document.getElementById('name').textContent = player.name
    let scoreBoard = document.getElementById('rank');
    players.forEach((player, i) => {
        let element = document.createElement('li');
        element.textContent = (i+1) + '. ' + player.name + ' - ' + player.score;
        if (player.name == myPlayer.name) {
            element.classList.add('selected')
        }
        scoreBoard.appendChild(element);
    });
});
let guess = letter => {
    console.log('guessed ' +letter)
    socket.emit('guess', JSON.stringify({
        guess: letter,
        player: myPlayer,
    }))
}
//add keyboard
let keyboard = document.getElementById('keyboard')
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

    }
    keyboard.appendChild(rowElement)
}