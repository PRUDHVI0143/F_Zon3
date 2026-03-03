const canvas = document.getElementById('colorCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('current-score');

let player = { y: 500, radius: 15, color: '#ff0044', dy: 0, gravity: 0.1, jumpPower: -4 };
let obstacles = [];
let colors = ['#ff0044', '#00f2ff', '#ffaa00', '#aa00ff'];
let score = 0;
let gameRunning = false;

function spawnObstacle() {
    if (!gameRunning) return;
    let targetC = colors[Math.floor(Math.random() * colors.length)];
    obstacles.push({ y: -100, x: 0, w: 400, h: 40, color: targetC });
    setTimeout(spawnObstacle, 2000);
}

function update() {
    if (!gameRunning) return;
    
    player.dy += player.gravity;
    player.y += player.dy;
    
    if (player.y > 600 || player.y < 0) endGame();

    obstacles.forEach((ob, i) => {
        ob.y += 2;
        if (ob.y > 600) {
            obstacles.splice(i, 1);
            score++;
            scoreEl.innerText = score;
            window.playSound('eat');
        }
        
        // Match check
        if (player.y - player.radius < ob.y + ob.h && player.y + player.radius > ob.y) {
            if (player.color !== ob.color) endGame();
        }
    });

    draw();
    requestAnimationFrame(update);
}

function draw() {
    ctx.clearRect(0,0,400,600);
    
    // Player
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(200, player.y, player.radius, 0, Math.PI*2);
    ctx.fill();
    
    // Obstacles
    obstacles.forEach(ob => {
        ctx.fillStyle = ob.color;
        ctx.fillRect(ob.x, ob.y, ob.w, ob.h);
    });
}

function endGame() {
    gameRunning = false;
    alert('Color Clash! Final Score: ' + score);
    window.submitScore('colorswitch', score);
}

window.onkeydown = (e) => {
    if (e.key === ' ') {
        player.dy = player.jumpPower;
        // Cycle player color
        player.color = colors[(colors.indexOf(player.color) + 1) % colors.length];
        window.playSound('click');
    }
}

document.getElementById('start-btn').onclick = () => {
    score = 0; obstacles = []; player.y = 500;
    gameRunning = true;
    spawnObstacle();
    update();
};

document.getElementById('ins-btn').onclick = () => {
    window.showInstruction('Color Pulse', 'Space to jump and CHANGE your color. Match the color of the bars ahead to pass through!');
};

draw();
