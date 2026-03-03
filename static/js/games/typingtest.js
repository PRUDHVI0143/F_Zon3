const display = document.getElementById('displayText');
const input = document.getElementById('typeInput');
const wpmEl = document.getElementById('wpm');
const accEl = document.getElementById('acc');
const timerEl = document.getElementById('timer');

let text = "The quick brown fox jumps over the lazy dog. Programming is the art of telling a computer what to do. JavaScript and Django make a powerful combination for building modern gaming platforms like F ZoN3. Speed and accuracy are the keys to victory in this typing speed test. Practice every day to become a master typist.";
let words = text.split(' ');
let typedChars = "";
let mistakes = 0;
let time = 60;
let gameRunning = false;
let startTime;

function renderText() {
    display.innerHTML = '';
    text.split('').forEach((char, i) => {
        const span = document.createElement('span');
        if (i < typedChars.length) {
            span.innerText = char;
            span.className = (char === typedChars[i]) ? 'correct' : 'wrong';
        } else if (i === typedChars.length) {
            span.innerText = char;
            span.innerHTML += '<span class="cursor"></span>';
        } else {
            span.innerText = char;
        }
        display.appendChild(span);
    });
}

window.startGame = () => {
    typedChars = "";
    mistakes = 0;
    time = 60;
    gameRunning = true;
    input.disabled = false;
    input.value = "";
    input.focus();
    startTime = Date.now();
    renderText();
    
    const interval = setInterval(() => {
        if (!gameRunning) { clearInterval(interval); return; }
        time--;
        timerEl.innerText = time;
        if (time <= 0 || typedChars.length === text.length) {
            clearInterval(interval);
            gameRunning = false;
            input.disabled = true;
            let finalWpm = Math.round((typedChars.length / 5) / (60 / 60));
            window.showResult('TRANSFER COMPLETE', finalWpm);
            window.submitScore('typingtest', finalWpm);
        }
    }, 1000);
};

input.addEventListener('input', (e) => {
    if (!gameRunning) return;
    const currentTyped = input.value;
    
    // Count mistakes
    let m = 0;
    for (let i = 0; i < currentTyped.length; i++) {
        if (currentTyped[i] !== text[i]) m++;
    }
    mistakes = m;
    typedChars = currentTyped;
    
    renderText();
    
    // Calculate stats
    const timeElapsed = (Date.now() - startTime) / 60000;
    let wpm = Math.round((typedChars.length / 5) / timeElapsed);
    wpmEl.innerText = isFinite(wpm) ? wpm : 0;
    
    let acc = Math.round(((typedChars.length - mistakes) / typedChars.length) * 100);
    accEl.innerText = (isFinite(acc) && typedChars.length > 0) ? acc + "%" : "100%";
});

document.getElementById('ins-btn').onclick = () => {
    window.showInstruction('Typing Speed', 'Type the text provided exactly as shown. Your speed is measured in WPM (Words Per Minute).');
};

renderText();
