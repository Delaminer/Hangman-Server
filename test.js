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
let player;

socket.on('join', msg => {
    let info = JSON.parse(msg);
    console.log(info)
    player = info.player;
    game = info.game;
    players = game.players.sort((a, b) => a.score - b.score);

    //Display name
    // document.getElementById('name').textContent = player.name
    let scoreBoard = document.getElementById('rank');
    players.forEach((player, i) => {
        let element = document.createElement('li');
        element.textContent = (i+1) + '. ' + player.name + ' - ' + player.score;
        scoreBoard.appendChild(element);
    });
});