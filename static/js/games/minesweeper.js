let gridContainer;
let mineCountEl;
let board = [];
let mines = [];
let revealed = [];
let flagged = [];
let gameOver = false;

function init() {
    gridContainer = document.getElementById('gridMines');
    mineCountEl = document.getElementById('mine-count');
    if (!gridContainer) return;
    gridContainer.innerHTML = '';
    board = Array(100).fill(0);
    mines = [];
    revealed = Array(100).fill(false);
    flagged = Array(100).fill(false);
    gameOver = false;
    
    // Randomize 10 mines
    while(mines.length < 10) {
        let r = Math.floor(Math.random() * 100);
        if(!mines.includes(r)) mines.push(r);
    }

    for (let i = 0; i < 100; i++) {
        const cell = document.createElement('div');
        cell.className = 'mine-cell';
        cell.dataset.id = i;
        cell.addEventListener('click', () => reveal(i));
        cell.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            toggleFlag(i);
        });
        gridContainer.appendChild(cell);
    }
}

function reveal(i) {
    if (gameOver || revealed[i] || flagged[i]) return;
    revealed[i] = true;
    const cell = gridContainer.children[i];
    cell.classList.add('revealed');

    if (mines.includes(i)) {
        cell.classList.add('bomb');
        cell.innerText = '💣';
        gameOver = true;
        window.playSound('lose');
        window.showResult('TERMINATED', 0);
        return;
    }

    // Check adjacent
    let count = getAdjacentMines(i);
    if (count > 0) {
        cell.innerText = count;
    } else {
        // Recursive reveal
        getNeighbors(i).forEach(n => reveal(n));
    }
    
    if (revealed.filter(v => v).length === 90) {
        window.playSound('win');
        window.showResult('MISSION SECURED', 500);
        window.submitScore('minesweeper', 500);
    }
}

function toggleFlag(i) {
    if (gameOver || revealed[i]) return;
    flagged[i] = !flagged[i];
    const cell = gridContainer.children[i];
    cell.classList.toggle('flagged');
    cell.innerText = flagged[i] ? '🚩' : '';
    mineCountEl.innerText = 10 - flagged.filter(v => v).length;
}

function getAdjacentMines(i) {
    return getNeighbors(i).filter(n => mines.includes(n)).length;
}

function getNeighbors(i) {
    let neighbors = [];
    let r = Math.floor(i / 10);
    let c = i % 10;
    for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
            if (x === 0 && y === 0) continue;
            let nr = r + x;
            let nc = c + y;
            if (nr >= 0 && nr < 10 && nc >= 0 && nc < 10) {
                neighbors.push(nr * 10 + nc);
            }
        }
    }
    return neighbors;
}

window.resetGame = () => init();

const startApp = () => {
    init();
    
    const insBtn = document.getElementById('ins-btn');
    if (insBtn) {
        insBtn.onclick = () => {
            window.showInstruction('Minesweeper Rules', 'Left click to reveal. Right click to flag. Find all safe cells to win.');
        };
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApp);
} else {
    startApp();
}
