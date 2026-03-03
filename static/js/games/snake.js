const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('current-score');
const lengthElement = document.getElementById('snake-length');
const speedDisplay = document.getElementById('speed-display');
const startBtn = document.getElementById('start-btn');

const gridSize = 20;
const tileCount = canvas.width / gridSize; // 25 tiles on 500px canvas

let score = 0;
let dx = 0;
let dy = 0;
let snake = [{x:12,y:12},{x:12,y:13},{x:12,y:14}];
let food = {x: 5, y: 5};
let gameLoop;
let isRunning = false;
let gameSpeed = 80;
let particles = [];
let trailHistory = [];

// === SPEED SELECTOR ===
function setSpeed(speed, btn) {
    gameSpeed = speed;
    var labels = {120:'SLOW', 80:'NORMAL', 50:'FAST', 30:'INSANE'};
    speedDisplay.innerText = labels[speed] || 'NORMAL';

    document.querySelectorAll('.speed-btn').forEach(function(b) { b.classList.remove('active'); });
    if (btn) btn.classList.add('active');

    if (isRunning) {
        clearInterval(gameLoop);
        gameLoop = setInterval(drawGame, gameSpeed);
    }
}
window.setSpeed = setSpeed;

// === MOBILE CONTROLS ===
function mobileDir(ndx, ndy) {
    if (ndx === 1 && dx !== -1) { dx = 1; dy = 0; }
    if (ndx === -1 && dx !== 1) { dx = -1; dy = 0; }
    if (ndy === 1 && dy !== -1) { dx = 0; dy = 1; }
    if (ndy === -1 && dy !== 0 || (ndy === -1 && dy === 0 && dx === 0)) { dx = 0; dy = -1; }

    if (!isRunning) {
        isRunning = true;
        resetGame();
        dx = ndx; dy = ndy;
        gameLoop = setInterval(drawGame, gameSpeed);
    }
}
window.mobileDir = mobileDir;

// === PARTICLES ===
function spawnParticles(x, y, color, count) {
    for (var i = 0; i < count; i++) {
        particles.push({
            x: x, y: y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            life: 20 + Math.random() * 15,
            color: color,
            size: 2 + Math.random() * 3
        });
    }
}

function updateParticles() {
    for (var i = particles.length - 1; i >= 0; i--) {
        var p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        p.size *= 0.95;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

function drawParticles() {
    particles.forEach(function(p) {
        var alpha = p.life / 35;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
    });
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
}

// === GRID DRAWING ===
function drawGrid() {
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.04)';
    ctx.lineWidth = 0.5;
    for (var i = 0; i <= tileCount; i++) {
        ctx.beginPath();
        ctx.moveTo(i * gridSize, 0);
        ctx.lineTo(i * gridSize, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * gridSize);
        ctx.lineTo(canvas.width, i * gridSize);
        ctx.stroke();
    }
}

// === GAME LOOP ===
function drawGame() {
    clearCanvas();
    drawGrid();
    moveSnake();
    if (!isRunning) return;
    checkGameOver();
    if (!isRunning) return;
    updateParticles();
    drawFood();
    drawSnake();
    drawParticles();
}

function clearCanvas() {
    ctx.fillStyle = '#060a14';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawSnake() {
    var headColor = '#00f0ff';
    var bodyColor = '#00bb99';

    snake.forEach(function(part, idx) {
        var px = part.x * gridSize;
        var py = part.y * gridSize;
        var s = gridSize - 2;

        // Gradient from head to tail
        var ratio = idx / snake.length;
        var r = Math.round(0 + ratio * 0);
        var g = Math.round(240 - ratio * 50);
        var b = Math.round(255 - ratio * 100);
        var alpha = 1 - ratio * 0.3;

        if (idx === 0) {
            // HEAD - bright glow
            ctx.fillStyle = headColor;
            ctx.shadowBlur = 15;
            ctx.shadowColor = headColor;
            ctx.fillRect(px, py, s, s);

            // Eyes
            ctx.fillStyle = '#000';
            ctx.shadowBlur = 0;
            if (dx === 1) { ctx.fillRect(px+12, py+4, 3, 3); ctx.fillRect(px+12, py+12, 3, 3); }
            else if (dx === -1) { ctx.fillRect(px+4, py+4, 3, 3); ctx.fillRect(px+4, py+12, 3, 3); }
            else if (dy === -1) { ctx.fillRect(px+4, py+4, 3, 3); ctx.fillRect(px+12, py+4, 3, 3); }
            else { ctx.fillRect(px+4, py+12, 3, 3); ctx.fillRect(px+12, py+12, 3, 3); }
        } else {
            ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
            ctx.shadowBlur = 5;
            ctx.shadowColor = 'rgba(0, 240, 255, 0.3)';
            ctx.fillRect(px + 1, py + 1, s - 2, s - 2);
        }
    });
    ctx.shadowBlur = 0;
}

function moveSnake() {
    if (dx === 0 && dy === 0) return;

    var head = {x: snake[0].x + dx, y: snake[0].y + dy};
    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        if (window.playSound) window.playSound('eat');
        score += 10;
        scoreElement.textContent = score;
        lengthElement.textContent = snake.length;

        // Explosion particles on eat
        spawnParticles(
            food.x * gridSize + gridSize/2,
            food.y * gridSize + gridSize/2,
            '#ff003c', 12
        );
        spawnParticles(
            food.x * gridSize + gridSize/2,
            food.y * gridSize + gridSize/2,
            '#fcee0a', 8
        );

        createFood();
    } else {
        snake.pop();
    }
}

function createFood() {
    var valid = false;
    while (!valid) {
        food.x = Math.floor(Math.random() * tileCount);
        food.y = Math.floor(Math.random() * tileCount);
        valid = true;
        // Make sure food doesn't spawn on snake
        for (var i = 0; i < snake.length; i++) {
            if (snake[i].x === food.x && snake[i].y === food.y) {
                valid = false;
                break;
            }
        }
    }
}

function drawFood() {
    var px = food.x * gridSize;
    var py = food.y * gridSize;
    var s = gridSize - 2;
    var pulse = Math.sin(Date.now() / 200) * 3 + 5;

    // Pulsing glow
    ctx.fillStyle = '#ff003c';
    ctx.shadowBlur = pulse + 10;
    ctx.shadowColor = '#ff003c';
    ctx.fillRect(px, py, s, s);

    // Inner highlight
    ctx.fillStyle = '#ff4d6d';
    ctx.shadowBlur = 0;
    ctx.fillRect(px + 4, py + 4, s - 8, s - 8);
}

function checkGameOver() {
    if (dx === 0 && dy === 0) return;
    var head = snake[0];

    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        gameOver();
        return;
    }

    for (var i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            gameOver();
            return;
        }
    }
}

function gameOver() {
    if (window.playSound) window.playSound('lose');
    clearInterval(gameLoop);
    isRunning = false;
    var finalScore = score;

    // Death explosion
    spawnParticles(
        snake[0].x * gridSize + gridSize/2,
        snake[0].y * gridSize + gridSize/2,
        '#ff003c', 30
    );

    // Draw one more frame with particles
    setTimeout(function() {
        updateParticles();
        drawParticles();
    }, 50);

    if (window.showResult) window.showResult('WORM TERMINATED', finalScore);
    if (window.submitScore) window.submitScore('snake', finalScore);

    startBtn.innerText = 'REINITIALIZE';
}

function resetGame() {
    score = 0;
    scoreElement.textContent = '0';
    dx = 0;
    dy = 0;
    snake = [{x:12,y:12},{x:12,y:13},{x:12,y:14}];
    lengthElement.textContent = '3';
    particles = [];
    createFood();
    clearCanvas();
    drawGrid();
    drawSnake();
    drawFood();
}

function changeDirection(event) {
    var key = event.keyCode;

    if (key === 37 && dx !== 1)  { dx = -1; dy = 0; }
    if (key === 38 && dy !== 1)  { dx = 0;  dy = -1; }
    if (key === 39 && dx !== -1) { dx = 1;  dy = 0; }
    if (key === 40 && dy !== -1) { dx = 0;  dy = 1; }

    // WASD support
    if (key === 65 && dx !== 1)  { dx = -1; dy = 0; }  // A
    if (key === 87 && dy !== 1)  { dx = 0;  dy = -1; } // W
    if (key === 68 && dx !== -1) { dx = 1;  dy = 0; }  // D
    if (key === 83 && dy !== -1) { dx = 0;  dy = 1; }  // S

    // Start game on first keypress
    if (!isRunning && (dx !== 0 || dy !== 0)) {
        isRunning = true;
        gameLoop = setInterval(drawGame, gameSpeed);
        startBtn.innerText = 'RUNNING...';
    }

    event.preventDefault();
}

startBtn.addEventListener('click', function() {
    if (!isRunning) {
        resetGame();
        isRunning = true;
        gameLoop = setInterval(drawGame, gameSpeed);
        startBtn.innerText = 'RUNNING...';
    }
});

document.addEventListener('keydown', changeDirection);

// Initial draw
resetGame();
