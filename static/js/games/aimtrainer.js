const container = document.getElementById('targetContainer');
const hitEl = document.getElementById('score-val');
const missEl = document.getElementById('miss-count');
const timerValEl = document.getElementById('timer-val');
const accValEl = document.getElementById('acc-val');

let hits = 0;
let misses = 0;
let timeRemaining = 30;
let gameRunning = false;

function spawnTarget() {
    if (!gameRunning) return;
    const target = document.createElement('div');
    target.className = 'target-dot';
    
    let x = Math.random() * (container.clientWidth - 50);
    let y = Math.random() * (container.clientHeight - 50);
    
    target.style.left = `${x}px`;
    target.style.top = `${y}px`;
    
    target.onclick = (e) => {
        e.stopPropagation();
        hits++;
        hitEl.innerText = hits;
        target.remove();
        window.playSound('click');
        updateAccuracy();
        spawnTarget();
    };

    container.appendChild(target);
    
    setTimeout(() => {
        if (target.parentElement) {
            target.remove();
            if (gameRunning) spawnTarget();
        }
    }, 1200);
}

function updateAccuracy() {
    let acc = (hits / (hits + misses) * 100).toFixed(0);
    if (accValEl) accValEl.innerText = (isFinite(acc) ? acc : 100) + '%';
}

window.startGame = () => {
    hits = 0;
    misses = 0;
    timeRemaining = 30;
    hitEl.innerText = 0;
    if (missEl) missEl.innerText = 0;
    container.innerHTML = '';
    gameRunning = true;
    updateAccuracy();
    
    spawnTarget();
    
    const interval = setInterval(() => {
        if (!gameRunning) { clearInterval(interval); return; }
        timeRemaining--;
        if (timerValEl) timerValEl.innerText = timeRemaining;
        
        if (timeRemaining <= 0) {
            clearInterval(interval);
            gameRunning = false;
            window.showResult('TRIAL ENDED', hits);
            window.submitScore('aimtrainer', hits);
        }
    }, 1000);
};

container.onclick = () => {
    if (gameRunning) {
        misses++;
        if (missEl) missEl.innerText = misses;
        updateAccuracy();
        window.playSound('lose');
    }
};

document.getElementById('ins-btn').onclick = () => {
    window.showInstruction('Aim Training', 'Click the red target dots as fast as you can. Avoid clicking the empty space.');
};
