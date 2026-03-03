const canvas = document.getElementById('breakoutCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('current-score');

let ball = { x: 300, y: 350, dx: 3, dy: -3, radius: 8 };
let paddle = { x: 250, y: 380, w: 100, h: 10 };
let bricks = [];
let score = 0;
let gameRunning = false;

function initBricks() {
    bricks = [];
    for(let c=0; c<6; c++) {
        for(let r=0; r<4; r++) {
            bricks.push({ x: c * 100 + 10, y: r * 30 + 40, w: 80, h: 20, active: true });
        }
    }
}

function update() {
    if (!gameRunning) return;
    
    ball.x += ball.dx;
    ball.y += ball.dy;
    
    // Bounds check
    if(ball.x + ball.radius > 600 || ball.x - ball.radius < 0) ball.dx = -ball.dx;
    if(ball.y - ball.radius < 0) ball.dy = -ball.dy;
    if(ball.y + ball.radius > 400) endGame();

    // Paddle hit
    if(ball.y + ball.radius > paddle.y && ball.x > paddle.x && ball.x < paddle.x + paddle.w) {
        ball.dy = -Math.abs(ball.dy);
        window.playSound('click');
    }

    // Brick hit
    bricks.forEach(b => {
        if(b.active && ball.x > b.x && ball.x < b.x + b.w && ball.y > b.y && ball.y < b.y + b.h) {
            b.active = false;
            ball.dy = -ball.dy;
            score += 20;
            scoreEl.innerText = score;
            window.playSound('eat');
            if(bricks.every(b => !b.active)) {
                alert('Level Cleared!');
                endGame();
            }
        }
    });

    draw();
    requestAnimationFrame(update);
}

function draw() {
    ctx.clearRect(0,0,600,400);
    
    // Ball
    ctx.fillStyle = '#ff0044';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI*2);
    ctx.fill();

    // Paddle
    ctx.fillStyle = '#00f2ff';
    ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);
    
    // Bricks
    ctx.fillStyle = '#ffaa00';
    bricks.forEach(b => {
        if(b.active) ctx.fillRect(b.x, b.y, b.w, b.h);
    });
}

function endGame() {
    if (gameRunning) {
        gameRunning = false;
        alert('Match Ended! Score: ' + score);
        window.submitScore('breakout', score);
    }
}

canvas.onmousemove = (e) => {
    let rect = canvas.getBoundingClientRect();
    paddle.x = e.clientX - rect.left - paddle.w/2;
}

document.getElementById('start-btn').onclick = () => {
    score = 0; ball.x = 300; ball.y = 350; ball.dy = -3;
    initBricks();
    gameRunning = true;
    update();
};

document.getElementById('ins-btn').onclick = () => {
    window.showInstruction('Neon Breakout', 'Drag the mouse to move the paddle. Don\'t let the ball fall!');
};

draw();
