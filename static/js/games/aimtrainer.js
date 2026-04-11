/* AIM TRAINER V2.0 ENGINE */

const container = document.getElementById('targetContainer');
const arenaWrapper = document.getElementById('arenaWrapper');
const hitEl = document.getElementById('score-val');
const missEl = document.getElementById('miss-count');
const timerValEl = document.getElementById('timer-val');
const accValEl = document.getElementById('acc-val');
const pointsValEl = document.getElementById('points-val');
const startBtn = document.getElementById('startBtn');

let crosshair;
let hits = 0;
let misses = 0;
let totalPoints = 0;
let timeRemaining = 30.0;
let gameRunning = false;
let gameLoopInterval = null;
let currentTarget = null;
let mouseX = 0, mouseY = 0;

// Track Cursor
container.addEventListener('mousemove', (e) => {
    const rect = container.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
    if (crosshair && crosshair.style.display !== 'none') {
        crosshair.style.left = mouseX + 'px';
        crosshair.style.top = mouseY + 'px';
    }
});

container.addEventListener('mouseenter', () => { if(crosshair) crosshair.style.display = 'block'; });
container.addEventListener('mouseleave', () => { if(crosshair) crosshair.style.display = 'none'; });

function spawnTarget() {
    if (!gameRunning) return;
    if (currentTarget) currentTarget.remove();

    const targetSize = Math.max(25, 60 - (hits * 0.8)); // Shrinks rapidly
    const maxLife = Math.max(500, 1400 - (hits * 35)); // Time limit decreases

    const node = document.createElement('div');
    node.className = 'target-node';
    node.style.width = targetSize + 'px';
    node.style.height = targetSize + 'px';

    let x = Math.random() * (container.clientWidth - targetSize - 60) + 30;
    let y = Math.random() * (container.clientHeight - targetSize - 60) + 30;
    
    node.style.left = `${x}px`;
    node.style.top = `${y}px`;

    const core = document.createElement('div');
    core.className = 'target-core';
    const ring = document.createElement('div');
    ring.className = 'target-ring';
    
    node.appendChild(ring);
    node.appendChild(core);

    const spawnTime = performance.now();

    node.onmousedown = (e) => {
        e.stopPropagation();
        if (!gameRunning) return;
        
        const rect = node.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dist = Math.hypot(e.clientX - centerX, e.clientY - centerY);
        
        let pts = 100;
        let pText = "HIT!";
        let col = "#00f2ff";
        
        if (dist <= targetSize * 0.25) {
            pts = 300; pText = "PERFECT!"; col = "#fcee0a";
        } else if (dist <= targetSize * 0.5) {
            pts = 150; pText = "GREAT!"; col = "#00f2ff";
        }

        const reactionTime = performance.now() - spawnTime;
        if (reactionTime < 350) { pts += 100; pText = "INSTINCT!"; col = "#ff003c"; }

        hits++;
        totalPoints += pts;
        hitEl.innerText = hits;
        pointsValEl.innerText = totalPoints;

        window.playSound('click');
        createExplosion(x, y, col);
        showFloatingText(x, y, pText, col);
        fireRecoil();

        node.remove();
        updateAccuracy();
        spawnTarget();
    };

    currentTarget = node;
    container.appendChild(node);
    
    setTimeout(() => {
        if (node.parentElement && gameRunning) {
            node.remove();
            misses++;
            totalPoints = Math.max(0, totalPoints - 50);
            pointsValEl.innerText = totalPoints;
            triggerError();
            if (gameRunning) spawnTarget();
        }
    }, maxLife);
}

function updateAccuracy() {
    let acc = (hits / (hits + misses) * 100).toFixed(1);
    if (accValEl) accValEl.innerText = (isFinite(acc) ? acc : 100) + '%';
    if (missEl) missEl.innerText = misses;
}

function triggerError() {
    updateAccuracy();
    window.playSound('lose');
    createExplosion(mouseX, mouseY, '#ff003c', true);
    
    if (arenaWrapper) {
        arenaWrapper.classList.remove('shake');
        void arenaWrapper.offsetWidth; // Reflow
        arenaWrapper.classList.add('shake');
    }
}

container.onmousedown = () => {
    if (gameRunning) {
        misses++;
        totalPoints = Math.max(0, totalPoints - 50);
        pointsValEl.innerText = totalPoints;
        triggerError();
        fireRecoil();
    }
};

function fireRecoil() {
    if(!crosshair) return;
    crosshair.classList.add('firing');
    setTimeout(() => {
        crosshair.classList.remove('firing');
        crosshair.classList.add('recoil');
        setTimeout(() => crosshair.classList.remove('recoil'), 100);
    }, 50);
}

function createExplosion(x, y, color, isMiss=false) {
    const amount = isMiss ? 6 : 18;
    for (let i = 0; i < amount; i++) {
        const spark = document.createElement('div');
        spark.className = 'spark';
        const size = Math.random() * 4 + 2;
        spark.style.width = size + 'px';
        spark.style.height = size + 'px';
        spark.style.background = color;
        spark.style.boxShadow = `0 0 10px ${color}`;
        spark.style.left = x + 'px';
        spark.style.top = y + 'px';
        
        const angle = Math.random() * Math.PI * 2;
        const vel = Math.random() * 70 + 20;
        const tx = Math.cos(angle) * vel;
        const ty = Math.sin(angle) * vel;
        
        spark.style.transition = 'transform 0.4s cubic-bezier(0.1, 0.8, 0.2, 1), opacity 0.4s ease-out';
        container.appendChild(spark);
        
        requestAnimationFrame(() => {
            spark.style.transform = `translate(${tx}px, ${ty}px) scale(0)`;
            spark.style.opacity = '0';
        });
        
        setTimeout(() => spark.remove(), 400);
    }
}

function showFloatingText(x, y, text, color) {
    const el = document.createElement('div');
    el.className = 'float-text';
    el.innerText = text;
    el.style.color = color;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    container.appendChild(el);
    setTimeout(() => el.remove(), 800);
}

window.initTraining = () => {
    if (gameRunning) return;
    startBtn.disabled = true;
    startBtn.innerText = "INITIALIZING...";
    container.innerHTML = `<div id="countdown-overlay"><div id="countdown-text"></div></div>
            <div id="custom-crosshair" style="display:none;">
                <div class="crosshair-h"></div><div class="crosshair-v"></div><div class="crosshair-dot"></div>
            </div>`;
    
    const cOverlay = document.getElementById('countdown-overlay');
    const cText = document.getElementById('countdown-text');
    crosshair = document.getElementById('custom-crosshair');
    
    cOverlay.style.opacity = '1';
    
    let count = 3;
    cText.innerText = count;
    window.playSound('click');
    
    const countInt = setInterval(() => {
        count--;
        if (count > 0) {
            cText.innerText = count;
            cText.style.animation = 'none'; void cText.offsetWidth; cText.style.animation = 'popIn 1s infinite';
            window.playSound('click');
        } else if (count === 0) {
            cText.innerText = "ENGAGE";
            cText.style.color = "#ff003c";
            window.playSound('win');
        } else {
            clearInterval(countInt);
            cOverlay.style.opacity = '0';
            startGameProtocol();
        }
    }, 850);
};

function startGameProtocol() {
    hits = 0; misses = 0; totalPoints = 0; timeRemaining = 30.0;
    hitEl.innerText = 0; pointsValEl.innerText = 0;
    if (missEl) missEl.innerText = 0;
    gameRunning = true;
    updateAccuracy();
    startBtn.innerText = "SIMULATION ACTIVE";
    
    spawnTarget();
    
    let lastTick = performance.now();
    gameLoopInterval = setInterval(() => {
        if (!gameRunning) { clearInterval(gameLoopInterval); return; }
        const now = performance.now();
        const dt = (now - lastTick) / 1000;
        lastTick = now;
        
        timeRemaining -= dt;
        if (timerValEl) timerValEl.innerText = Math.max(0, timeRemaining).toFixed(1) + 's';
        
        if (timeRemaining <= 0) {
            clearInterval(gameLoopInterval);
            gameRunning = false;
            startBtn.disabled = false;
            startBtn.innerText = "RESTART SIMULATION";
            if (currentTarget) currentTarget.remove();
            if (crosshair) crosshair.style.display = 'none';
            window.showResult('SIMULATION ENDED', totalPoints);
            window.submitScore('aimtrainer', totalPoints);
        }
    }, 50);
}

document.getElementById('ins-btn').onclick = () => {
    window.showInstruction('Aim Training Protocol', 'Click the holographic targets as fast as possible. Faster and more precise clicks yield higher scores. Missing targets or letting them expire subtracts points. Improve your flick accuracy.');
};
