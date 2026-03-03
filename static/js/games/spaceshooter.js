const canvas = document.getElementById('spaceCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('current-score');
const healthEl = document.getElementById('health');

let ship = { x: 400, y: 550, w: 40, h: 40, speed: 5 };
let enemies = [];
let bullets = [];
let score = 0;
let health = 100;
let gameRunning = false;

function spawnEnemy() {
    if (!gameRunning) return;
    enemies.push({ x: Math.random() * 760, y: -50, w: 40, h: 40, speed: Math.random() * 2 + 1 });
    setTimeout(spawnEnemy, 2000 - Math.min(score * 10, 1500));
}

function update() {
    if (!gameRunning) return;
    
    // Bullets
    bullets.forEach((b, bi) => {
        b.y -= 10;
        if (b.y < 0) bullets.splice(bi, 1);
        
        enemies.forEach((e, ei) => {
            if (b.x > e.x && b.x < e.x + e.w && b.y > e.y && b.y < e.y + e.h) {
                enemies.splice(ei, 1);
                bullets.splice(bi, 1);
                score += 10;
                scoreEl.innerText = score;
                window.playSound('eat');
            }
        });
    });

    // Enemies
    enemies.forEach((e, ei) => {
        e.y += e.speed;
        if (e.y > 600) {
            enemies.splice(ei, 1);
            health -= 10;
            healthEl.innerText = health;
            window.playSound('lose');
            if (health <= 0) endGame();
        }
        
        // Ship collision
        if (e.x < ship.x + ship.w && e.x + e.w > ship.x && e.y < ship.y + ship.h && e.y + e.h > ship.y) {
            endGame();
        }
    });

    draw();
    requestAnimationFrame(update);
}

function draw() {
    ctx.clearRect(0,0,800,600);
    
    // Ship
    ctx.fillStyle = '#00f2ff';
    ctx.fillRect(ship.x, ship.y, ship.w, ship.h);
    
    // Bullets
    ctx.fillStyle = '#ff0044';
    bullets.forEach(b => ctx.fillRect(b.x, b.y, 4, 10));
    
    // Enemies
    ctx.fillStyle = '#ffaa00';
    enemies.forEach(e => ctx.fillRect(e.x, e.y, e.w, e.h));
}

function endGame() {
    gameRunning = false;
    alert('Ship Destroyed! Final Score: ' + score);
    window.submitScore('spaceshooter', score);
}

window.addEventListener('keydown', (e) => {
    if (!gameRunning) return;
    if (e.key === 'ArrowLeft' && ship.x > 0) ship.x -= ship.speed;
    if (e.key === 'ArrowRight' && ship.x < 760) ship.x += ship.speed;
    if (e.key === ' ') {
        bullets.push({ x: ship.x + 18, y: ship.y });
        window.playSound('click');
    }
});

document.getElementById('start-btn').onclick = () => {
    score = 0; health = 100; enemies = []; bullets = [];
    gameRunning = true;
    spawnEnemy();
    update();
};

document.getElementById('ins-btn').onclick = () => {
    window.showInstruction('Void Sentinel', 'Use Arrow Keys to move and Space to fire. Don\'t let enemies pass or hit you!');
};

draw();
