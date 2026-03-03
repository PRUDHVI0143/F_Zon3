const gameArea = document.getElementById('game-area');
const scoreEl = document.getElementById('score');
const timerEl = document.getElementById('timer');
const startBtn = document.getElementById('start-btn');
const startMsg = document.getElementById('start-msg');

let score = 0;
let timeLeft = 30;
let gameActive = false;
let timerInterval;

function spawnDot() {
    if(!gameActive) return;
    
    // Remove existing dots
    const oldDot = document.querySelector('.red-dot');
    if(oldDot) oldDot.remove();

    const dot = document.createElement('div');
    dot.className = 'red-dot';
    
    const x = Math.random() * (gameArea.clientWidth - 40);
    const y = Math.random() * (gameArea.clientHeight - 40);
    
    dot.style.left = `${x}px`;
    dot.style.top = `${y}px`;
    
    dot.addEventListener('mousedown', () => {
        window.playSound('click');
        score++;
        scoreEl.innerText = score;
        spawnDot();
    });
    
    gameArea.appendChild(dot);
}

function startGame() {
    score = 0;
    timeLeft = 30;
    gameActive = true;
    scoreEl.innerText = score;
    timerEl.innerText = timeLeft;
    startMsg.style.display = 'none';
    
    spawnDot();
    
    timerInterval = setInterval(() => {
        timeLeft--;
        timerEl.innerText = timeLeft;
        if(timeLeft <= 0) {
            endGame();
        }
    }, 1000);
}

async function endGame() {
    gameActive = false;
    clearInterval(timerInterval);
    
    // Clear game area and remove any remaining dot
    gameArea.innerHTML = ''; 
    
    window.playSound('lose');
    window.showResult('Time\'s Up!', score); // Use showResult instead of alert/innerHTML modification
    
    startBtn.style.display = 'block'; // Show start button again
    startMsg.style.display = 'block'; // Show start message again
    startMsg.innerHTML = `<h2 style='margin-bottom:20px;'>Final Score: ${score}</h2><p>Click Start to play again!</p>`;

    await window.submitScore('reddot', score);
}

startBtn.addEventListener('click', startGame);
