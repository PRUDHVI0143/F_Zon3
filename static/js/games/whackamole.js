const moles = document.querySelectorAll('.mole');
const scoreEl = document.getElementById('current-score');
const timerEl = document.getElementById('timer');

let score = 0;
let timeLimit = 30;
let lastHole;
let timer;
let moleInterval;

function randomHole() {
    const idx = Math.floor(Math.random() * moles.length);
    if (idx === lastHole) return randomHole();
    lastHole = idx;
    return moles[idx];
}

function peep() {
    const time = Math.random() * (1000 - 500) + 500;
    const mole = randomHole();
    mole.classList.add('up');
    setTimeout(() => {
        mole.classList.remove('up');
        if (timeLimit > 0) peep();
    }, time);
}

window.startGame = () => {
    score = 0;
    timeLimit = 30;
    scoreEl.textContent = 0;
    timerEl.textContent = 30;

    peep();

    timer = setInterval(() => {
        timeLimit--;
        timerEl.textContent = timeLimit;
        if (timeLimit <= 0) {
            clearInterval(timer);
            window.playSound('win');
            window.showResult('PURGE COMPLETE', score);
            window.submitScore('whackamole', score);
        }
    }, 1000);
};

moles.forEach(mole => {
    mole.addEventListener('click', (e) => {
        if (!e.isTrusted) return; // Anti-cheat
        if (mole.classList.contains('up')) {
            score++;
            mole.classList.remove('up');
            scoreEl.textContent = score;
            window.playSound('click');
        }
    });
});

document.getElementById('ins-btn').onclick = () => {
    window.showInstruction('Mole Whacker', 'Wait for the mole to pop up and click it! You have 30 seconds.');
};
