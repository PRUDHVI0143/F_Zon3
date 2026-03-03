const canvas = document.getElementById('flappyCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('current-score');

let birdX = 50;
let birdY = canvas.height / 2;
let birdVel = 0;
let gravity = 0.5;
let jump = -8;
let pipes = [];
let pipeGap = 150;
let pipeWidth = 50;
let pipeVel = 2;
let score = 0;
let gameRunning = false;

function spawnPipe() {
    let topH = Math.random() * (canvas.height - pipeGap - 100) + 50;
    pipes.push({ x: canvas.width, top: topH });
}

function update() {
    if (!gameRunning) return;
    
    birdVel += gravity;
    birdY += birdVel;
    
    // Collision check
    if (birdY > canvas.height || birdY < 0) endGame();
    
    pipes.forEach((p, i) => {
        p.x -= pipeVel;
        if (p.x + pipeWidth < 0) {
            pipes.splice(i, 1);
            score++;
            scoreEl.innerText = score;
            window.playSound('eat');
        }
        
        // Rect collision
        if (birdX + 20 > p.x && birdX - 20 < p.x + pipeWidth) {
            if (birdY - 20 < p.top || birdY + 20 > p.top + pipeGap) {
                endGame();
            }
        }
    });

    if (pipes.length === 0 || pipes[pipes.length - 1].x < canvas.width - 200) spawnPipe();
    
    draw();
    requestAnimationFrame(update);
}

function draw() {
    ctx.clearRect(0,0,canvas.width, canvas.height);
    
    // Bird
    ctx.fillStyle = 'yellow';
    ctx.beginPath();
    ctx.arc(birdX, birdY, 20, 0, Math.PI * 2);
    ctx.fill();
    
    // Pipes
    ctx.fillStyle = 'green';
    pipes.forEach(p => {
        ctx.fillRect(p.x, 0, pipeWidth, p.top);
        ctx.fillRect(p.x, p.top + pipeGap, pipeWidth, canvas.height - (p.top + pipeGap));
    });
}

function endGame() {
    gameRunning = false;
    alert('Game Over! Score: ' + score);
    window.submitScore('flappybird', score);
    window.playSound('lose');
}

canvas.onclick = () => {
    if (!gameRunning) {
        birdY = canvas.height / 2;
        birdVel = 0;
        score = 0;
        pipes = [];
        gameRunning = true;
        update();
    } else {
        birdVel = jump;
        window.playSound('click');
    }
}

document.getElementById('ins-btn').onclick = () => {
    window.showInstruction('Flappy Dash', 'Click to flap and stay airborne. Dodge the pipes and reach the highest score!');
};

draw();
