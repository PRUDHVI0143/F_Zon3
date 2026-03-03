var canvas = document.getElementById('runnerCanvas');
var ctx = canvas.getContext('2d');
var startBtn = document.getElementById('start-btn');
var W = canvas.width, H = canvas.height;
var GROUND = H - 50;

// === THEME DETECTION ===
function isLightMode() {
    return document.body.classList.contains('light-theme');
}

function getThemeColors() {
    if (isLightMode()) {
        return {
            bg: '#ffffff',
            ground: '#f0f2f5',
            line: '#cbd5e1',
            text: '#1a1a2e',
            accent: '#008eb4'
        };
    }
    return {
        bg: '#000000',
        ground: '#151821',
        line: '#333333',
        text: '#ffffff',
        accent: '#00f0ff'
    };
}

// === STATE ===
var gameRunning = false, gameOver = false;
var score = 0, hiScore = 0, speed = 6, dist = 0;
var animFrame = null;

// Ground bumps
var groundBumps = [];
for (var i = 0; i < 50; i++) groundBumps.push({ x: i * 20, w: 5 + Math.random() * 12, h: 2 + Math.random() * 3 });

window.addEventListener('themeChanged', () => {
    if (!gameRunning) draw(); // Immediate refresh if idle
});


// Clouds
var clouds = [];
for (var c = 0; c < 4; c++) clouds.push({ x: 200 + Math.random() * W, y: 30 + Math.random() * 60, w: 50 + Math.random() * 40 });

// === ROBOT ===
var robo = {
    x: 60, y: GROUND, w: 40, h: 50,
    vy: 0, onGround: true, ducking: false,
    legFrame: 0
};
var DUCK_H = 28;
var JUMP_VEL = -12;
var GRAVITY = 0.55;

// === OBSTACLES ===
var obstacles = [];
var spawnTimer = 0, spawnInterval = 90;

function createObs() {
    var r = Math.random();
    var ob;
    if (r < 0.25) {
        // Small penguin
        ob = { x: W + 10, y: GROUND - 32, w: 24, h: 32, type: 'small' };
    } else if (r < 0.5) {
        // Tall penguin
        ob = { x: W + 10, y: GROUND - 48, w: 28, h: 48, type: 'tall' };
    } else if (r < 0.7) {
        // Group (2-3 penguins)
        ob = { x: W + 10, y: GROUND - 32, w: 55, h: 32, type: 'group' };
    } else {
        // Flying penguin (pterodactyl style)
        ob = { x: W + 10, y: GROUND - 65 - Math.random() * 30, w: 36, h: 22, type: 'flying', wingT: 0 };
    }
    obstacles.push(ob);
}

// === DRAWING ===

function drawRobo() {
    var x = robo.x, h = robo.ducking ? DUCK_H : robo.h;
    var y = robo.ducking ? GROUND - DUCK_H : robo.y;
    var cx = x + robo.w / 2;
    var bot = y + h;

    if (robo.ducking) {
        // Flat robot
        ctx.fillStyle = '#444';
        roundRect(x, y + 6, robo.w, h - 6, 4);
        ctx.fill();
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 1;
        roundRect(x, y + 6, robo.w, h - 6, 4);
        ctx.stroke();
        // Visor
        ctx.fillStyle = '#00f0ff';
        ctx.shadowBlur = 6; ctx.shadowColor = '#00f0ff';
        ctx.fillRect(x + robo.w - 14, y + 10, 10, 4);
        ctx.fillRect(x + robo.w - 14, y + 17, 10, 4);
        ctx.shadowBlur = 0;
        // Antenna
        ctx.strokeStyle = '#999'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx, y + 6); ctx.lineTo(cx, y - 2); ctx.stroke();
        ctx.fillStyle = '#ff003c'; ctx.shadowBlur = 4; ctx.shadowColor = '#ff003c';
        ctx.beginPath(); ctx.arc(cx, y - 2, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
    } else {
        // Legs
        robo.legFrame += 0.25;
        var legA = Math.sin(robo.legFrame) * (robo.onGround ? 6 : 0);
        ctx.fillStyle = '#555';
        ctx.fillRect(cx - 10, bot - 14 + legA, 7, 14 - legA);
        ctx.fillRect(cx + 3, bot - 14 - legA, 7, 14 + legA);
        ctx.fillStyle = '#777';
        ctx.fillRect(cx - 12, bot - 2 + legA, 10, 3);
        ctx.fillRect(cx + 1, bot - 2 - legA, 10, 3);

        // Body
        ctx.fillStyle = '#444';
        roundRect(x + 6, y + 16, robo.w - 12, 24, 3);
        ctx.fill();
        ctx.strokeStyle = '#888'; ctx.lineWidth = 1;
        roundRect(x + 6, y + 16, robo.w - 12, 24, 3);
        ctx.stroke();

        // Chest
        ctx.fillStyle = '#00f0ff';
        ctx.globalAlpha = 0.3;
        ctx.fillRect(x + 10, y + 20, robo.w - 20, 8);
        ctx.globalAlpha = 1;
        var bars = 3 + Math.floor((Date.now() / 300) % 3);
        for (var b = 0; b < bars; b++) {
            ctx.fillStyle = '#00f0ff';
            ctx.fillRect(x + 12 + b * 6, y + 22, 4, 4);
        }

        // Arms
        var armA = Math.sin(robo.legFrame) * (robo.onGround ? 12 : 20);
        ctx.fillStyle = '#555';
        ctx.save(); ctx.translate(x + 4, y + 20); ctx.rotate((-15 + armA) * Math.PI / 180);
        ctx.fillRect(-2, 0, 5, 16); ctx.restore();
        ctx.save(); ctx.translate(x + robo.w - 4, y + 20); ctx.rotate((15 - armA) * Math.PI / 180);
        ctx.fillRect(-3, 0, 5, 16); ctx.restore();

        // Head
        ctx.fillStyle = '#555';
        roundRect(x + 8, y, robo.w - 16, 18, 3);
        ctx.fill();
        ctx.strokeStyle = '#888'; ctx.lineWidth = 1;
        roundRect(x + 8, y, robo.w - 16, 18, 3);
        ctx.stroke();

        // Eyes
        ctx.fillStyle = '#00f0ff';
        ctx.shadowBlur = 8; ctx.shadowColor = '#00f0ff';
        ctx.fillRect(x + 12, y + 6, 6, 4);
        ctx.fillRect(x + robo.w - 18, y + 6, 6, 4);
        ctx.shadowBlur = 0;

        // Antenna
        ctx.strokeStyle = '#999'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx, y); ctx.lineTo(cx, y - 8); ctx.stroke();
        ctx.fillStyle = '#ff003c'; ctx.shadowBlur = 5; ctx.shadowColor = '#ff003c';
        ctx.beginPath(); ctx.arc(cx, y - 8, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;

        // Jet flame when jumping
        if (!robo.onGround) {
            var fh = 6 + Math.random() * 8;
            ctx.fillStyle = 'rgba(255,140,0,0.7)';
            ctx.beginPath(); ctx.moveTo(cx - 6, bot); ctx.lineTo(cx, bot + fh); ctx.lineTo(cx + 6, bot); ctx.fill();
            ctx.fillStyle = 'rgba(255,220,0,0.9)';
            ctx.beginPath(); ctx.moveTo(cx - 3, bot); ctx.lineTo(cx, bot + fh * 0.5); ctx.lineTo(cx + 3, bot); ctx.fill();
        }
    }
}

function drawPenguin(ob) {
    if (ob.type === 'group') {
        // Draw 2-3 small penguins
        drawSinglePenguin(ob.x, GROUND, 0.85);
        drawSinglePenguin(ob.x + 18, GROUND, 0.9);
        if (ob.w > 50) drawSinglePenguin(ob.x + 36, GROUND, 0.8);
        return;
    }
    if (ob.type === 'flying') {
        drawFlyingPenguin(ob);
        return;
    }
    var sc = ob.type === 'tall' ? 1.3 : 1.0;
    drawSinglePenguin(ob.x, ob.y + ob.h, sc);
}

function drawSinglePenguin(x, bottom, scale) {
    var s = scale || 1;
    var cx = x + 12 * s;
    // Body
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.ellipse(cx, bottom - 14 * s, 10 * s, 16 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    // Belly
    ctx.fillStyle = '#ddd';
    ctx.beginPath();
    ctx.ellipse(cx, bottom - 11 * s, 7 * s, 11 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    // Head
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(cx, bottom - 28 * s, 8 * s, 0, Math.PI * 2);
    ctx.fill();
    // Eye
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(cx - 3 * s, bottom - 29 * s, 2.5 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(cx - 2 * s, bottom - 29 * s, 1.2 * s, 0, Math.PI * 2);
    ctx.fill();
    // Beak
    ctx.fillStyle = '#ff8c00';
    ctx.beginPath();
    ctx.moveTo(cx - 8 * s, bottom - 27 * s);
    ctx.lineTo(cx - 14 * s, bottom - 25 * s);
    ctx.lineTo(cx - 8 * s, bottom - 23 * s);
    ctx.closePath();
    ctx.fill();
    // Feet
    ctx.fillStyle = '#ff8c00';
    ctx.fillRect(cx - 8 * s, bottom - 2, 6 * s, 3);
    ctx.fillRect(cx + 1 * s, bottom - 2, 6 * s, 3);
}

function drawFlyingPenguin(ob) {
    ob.wingT = (ob.wingT || 0) + 0.15;
    var cx = ob.x + ob.w / 2;
    var cy = ob.y + ob.h / 2;
    var wf = Math.sin(ob.wingT) * 10;
    // Body
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 14, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    // Belly
    ctx.fillStyle = '#ddd';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 1, 9, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    // Wings
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.moveTo(cx - 12, cy); ctx.lineTo(cx - 22, cy - 8 + wf); ctx.lineTo(cx - 6, cy + 3); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + 12, cy); ctx.lineTo(cx + 22, cy - 8 + wf); ctx.lineTo(cx + 6, cy + 3); ctx.fill();
    // Head
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(cx - 10, cy - 5, 6, 0, Math.PI * 2);
    ctx.fill();
    // Eye
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(cx - 13, cy - 6, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(cx - 14, cy - 6, 1, 0, Math.PI * 2);
    ctx.fill();
    // Beak
    ctx.fillStyle = '#ff8c00';
    ctx.beginPath();
    ctx.moveTo(cx - 16, cy - 4); ctx.lineTo(cx - 22, cy - 3); ctx.lineTo(cx - 16, cy - 1); ctx.closePath(); ctx.fill();
}

function drawCloud(cl) {
    ctx.fillStyle = 'rgba(200,200,200,0.25)';
    ctx.beginPath();
    ctx.arc(cl.x, cl.y, 12, 0, Math.PI * 2);
    ctx.arc(cl.x + 15, cl.y - 5, 14, 0, Math.PI * 2);
    ctx.arc(cl.x + 32, cl.y - 3, 12, 0, Math.PI * 2);
    ctx.arc(cl.x + 15, cl.y + 3, 10, 0, Math.PI * 2);
    ctx.fill();
}

function drawGround() {
    var colors = getThemeColors();
    // Ground line
    ctx.strokeStyle = colors.line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, GROUND);
    ctx.lineTo(W, GROUND);
    ctx.stroke();

    // Bumps
    ctx.fillStyle = colors.ground;
    groundBumps.forEach(function (b) {
        ctx.fillRect(b.x, GROUND + 2, b.w, b.h);
        b.x -= speed;
        if (b.x + b.w < 0) { b.x = W + Math.random() * 30; b.w = 5 + Math.random() * 12; b.h = 2 + Math.random() * 3; }
    });
}

function drawScore() {
    ctx.fillStyle = '#888';
    ctx.font = 'bold 16px Courier New';
    ctx.textAlign = 'right';
    var hiStr = 'HI ' + padScore(hiScore);
    var scStr = padScore(score);
    ctx.fillText(hiStr + '  ' + scStr, W - 15, 25);
    ctx.textAlign = 'left';
}

function padScore(n) {
    var s = '' + n;
    while (s.length < 5) s = '0' + s;
    return s;
}

function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

// === GAME LOOP ===
function update() {
    if (!gameRunning) return;

    // Physics
    robo.vy += GRAVITY;
    robo.y += robo.vy;
    var ch = robo.ducking ? DUCK_H : robo.h;
    var gl = GROUND - ch;
    if (robo.y >= gl) { robo.y = gl; robo.vy = 0; robo.onGround = true; }

    // Score
    dist++;
    score = Math.floor(dist / 6);
    speed = 6 + dist * 0.0015;

    // Milestone flash
    if (score > 0 && score % 100 === 0 && dist % 6 === 0) {
        if (window.playSound) window.playSound('click');
    }

    // Spawn
    spawnTimer++;
    if (spawnTimer >= spawnInterval) {
        createObs();
        spawnTimer = 0;
        spawnInterval = Math.max(35, 90 - dist * 0.008) + Math.random() * 30;
    }

    // Obstacles
    for (var i = obstacles.length - 1; i >= 0; i--) {
        var ob = obstacles[i];
        ob.x -= speed;
        if (ob.x + ob.w < -30) { obstacles.splice(i, 1); continue; }

        // Collision (forgiving hitbox)
        var px = robo.x + 10, py = (robo.ducking ? GROUND - DUCK_H : robo.y) + 6;
        var pw = robo.w - 18, ph = ch - 12;
        if (px < ob.x + ob.w - 4 && px + pw > ob.x + 4 && py < ob.y + ob.h - 4 && py + ph > ob.y + 4) {
            die();
            return;
        }
    }

    // Clouds
    clouds.forEach(function (cl) {
        cl.x -= speed * 0.15;
        if (cl.x + cl.w < -10) { cl.x = W + Math.random() * 200; cl.y = 25 + Math.random() * 65; }
    });

    draw();
    animFrame = requestAnimationFrame(update);
}

function draw() {
    var colors = getThemeColors();
    // Background
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, W, H);

    // Clouds
    clouds.forEach((cl) => {
        ctx.fillStyle = isLightMode() ? 'rgba(0,0,0,0.08)' : 'rgba(200,200,200,0.15)';
        drawCloud(cl);
    });

    // Ground
    drawGround();

    // Obstacles
    obstacles.forEach(drawPenguin);

    // Robot
    drawRobo();

    // Score
    ctx.fillStyle = colors.text;
    ctx.font = 'bold 16px Courier New';
    ctx.textAlign = 'right';
    var hiStr = 'HI ' + padScore(hiScore);
    var scStr = padScore(score);
    ctx.fillText(hiStr + '  ' + scStr, W - 15, 25);
    ctx.textAlign = 'left';

    // Game over text
    if (gameOver) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 22px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('G A M E   O V E R', W / 2, H / 2 - 20);
        ctx.font = '14px Courier New';
        ctx.fillStyle = '#888';
        ctx.fillText('Press SPACE or Click to restart', W / 2, H / 2 + 10);
        ctx.textAlign = 'left';
    }
}

function die() {
    gameRunning = false;
    gameOver = true;
    if (animFrame) cancelAnimationFrame(animFrame);
    if (score > hiScore) hiScore = score;
    if (window.playSound) window.playSound('lose');
    if (window.submitScore) window.submitScore('endlessrunner', score);
    startBtn.innerText = 'RESTART';
    draw();
}

function startGame() {
    score = 0; dist = 0; speed = 6;
    obstacles = []; spawnTimer = 0; spawnInterval = 90;
    robo.y = GROUND - robo.h; robo.vy = 0; robo.onGround = true; robo.ducking = false; robo.legFrame = 0;
    gameRunning = true; gameOver = false;
    startBtn.innerText = 'RUNNING...';
    update();
}

// === CONTROLS ===
function jump() {
    if (robo.onGround && gameRunning) {
        robo.vy = JUMP_VEL;
        robo.onGround = false;
        if (window.playSound) window.playSound('click');
    }
}

document.addEventListener('keydown', function (e) {
    if (e.key === ' ' || e.key === 'ArrowUp') {
        if (gameOver) { startGame(); }
        else if (!gameRunning) { startGame(); }
        else { jump(); }
        e.preventDefault();
    }
    if ((e.key === 'ArrowDown') && gameRunning) { robo.ducking = true; e.preventDefault(); }
});
document.addEventListener('keyup', function (e) {
    if (e.key === 'ArrowDown') robo.ducking = false;
});

canvas.addEventListener('click', function () {
    if (gameOver || !gameRunning) startGame();
    else jump();
});

startBtn.addEventListener('click', function () {
    if (!gameRunning || gameOver) startGame();
});

// Initial idle draw
robo.y = GROUND - robo.h;
draw();
// Show start prompt
ctx.fillStyle = '#888';
ctx.font = '14px Courier New';
ctx.textAlign = 'center';
ctx.fillText('Press SPACE or Click to start', W / 2, H / 2);
ctx.textAlign = 'left';
