const grid = document.getElementById('gridMemory');
const movesEl = document.getElementById('move-count');
const matchesEl = document.getElementById('match-count');

let cards = ['🎮', '🕹️', '🎲', '🧩', '🚀', '🛸', '🎯', '🔥'];
let cardSet = [...cards, ...cards];
let flipped = [];
let moves = 0;
let matches = 0;
let lock = false;

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function init() {
    grid.innerHTML = '';
    moves = 0;
    matches = 0;
    movesEl.innerText = 0;
    matchesEl.innerText = 0;
    cardSet = shuffle(cardSet);
    
    cardSet.forEach((icon, i) => {
        const card = document.createElement('div');
        card.className = 'card-mem';
        card.innerHTML = `<div class="front">?</div><div class="back">${icon}</div>`;
        card.dataset.icon = icon;
        card.onclick = () => flipCard(card);
        grid.appendChild(card);
    });
}

function flipCard(card) {
    if (lock || card.classList.contains('flipped') || flipped.includes(card)) return;
    
    card.classList.add('flipped');
    flipped.push(card);
    window.playSound('click');

    if (flipped.length === 2) {
        moves++;
        movesEl.innerText = moves;
        checkMatch();
    }
}

function checkMatch() {
    lock = true;
    const [c1, c2] = flipped;
    if (c1.dataset.icon === c2.dataset.icon) {
        matches++;
        matchesEl.innerText = matches;
        window.playSound('eat');
        setTimeout(() => {
            c1.classList.add('matched');
            c2.classList.add('matched');
            flipped = [];
            lock = false;
            if (matches === 8) {
                alert('Success! Total Moves: ' + moves);
                window.submitScore('memorymatch', 1000 - moves);
            }
        }, 800);
    } else {
        setTimeout(() => {
            c1.classList.remove('flipped');
            c2.classList.remove('flipped');
            flipped = [];
            lock = false;
        }, 1000);
    }
}

window.resetGame = () => init();

document.getElementById('ins-btn').onclick = () => {
    window.showInstruction('Memory Mastery', 'Match pairs of identical icons with the fewest moves possible!');
};

init();
