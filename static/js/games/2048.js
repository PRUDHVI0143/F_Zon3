const gridContainer = document.getElementById('grid2048');
const scoreEl = document.getElementById('current-score');
let board = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
let score = 0;

function init() {
    gridContainer.innerHTML = '';
    for (let i = 0; i < 16; i++) {
        const div = document.createElement('div');
        div.classList.add('tile');
        gridContainer.appendChild(div);
    }
}

function updateBoard() {
    scoreEl.innerText = score;
    const tiles = gridContainer.children;
    for (let i = 0; i < 16; i++) {
        tiles[i].innerText = board[i] === 0 ? '' : board[i];
        tiles[i].className = 'tile';
        if (board[i] > 0) tiles[i].classList.add(`tile-${board[i]}`);
    }
}

function spawnTile() {
    const available = board.map((v, i) => v === 0 ? i : null).filter(v => v !== null);
    if (available.length > 0) {
        const idx = available[Math.floor(Math.random() * available.length)];
        board[idx] = Math.random() < 0.9 ? 2 : 4;
    }
}

function move(direction) {
    let moved = false;
    let newBoard = [...board];

    const getRow = (i) => newBoard.slice(i * 4, i * 4 + 4);
    const getCol = (i) => [newBoard[i], newBoard[i + 4], newBoard[i + 8], newBoard[i + 12]];

    const slide = (line) => {
        let arr = line.filter(v => v !== 0);
        for (let i = 0; i < arr.length - 1; i++) {
            if (arr[i] === arr[i + 1]) {
                arr[i] *= 2;
                score += arr[i];
                arr.splice(i + 1, 1);
                moved = true;
            }
        }
        while (arr.length < 4) arr.push(0);
        return arr;
    };

    if (direction === 'left') {
        for (let i = 0; i < 4; i++) {
            let row = getRow(i);
            let processed = slide(row);
            if (row.some((v, idx) => v !== processed[idx])) moved = true;
            newBoard.splice(i * 4, 4, ...processed);
        }
    } else if (direction === 'right') {
        for (let i = 0; i < 4; i++) {
            let row = getRow(i).reverse();
            let processed = slide(row).reverse();
            if (row.reverse().some((v, idx) => v !== processed[idx])) moved = true;
            newBoard.splice(i * 4, 4, ...processed);
        }
    } else if (direction === 'up' || direction === 'down') {
        for (let i = 0; i < 4; i++) {
            let col = getCol(i);
            if (direction === 'down') col.reverse();
            let processed = slide(col);
            if (direction === 'down') processed.reverse();
            if (col.some((v, idx) => v !== processed[idx])) moved = true;
            for (let r = 0; r < 4; r++) newBoard[i + r * 4] = processed[r];
        }
    }

    if (moved) {
        board = newBoard;
        spawnTile();
        updateBoard();
        if (window.playSound) window.playSound('click');
        if (isGameOver()) { if (window.showResult) window.showResult('CORE MELTDOWN', score); if (window.submitScore) window.submitScore('2048', score); } 
    }
}

function isGameOver() {
    return !board.includes(0);
}

window.resetGame = () => {
    board = Array(16).fill(0);
    score = 0;
    init();
    spawnTile();
    spawnTile();
    updateBoard();
};

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') move('left');
    if (e.key === 'ArrowRight') move('right');
    if (e.key === 'ArrowUp') move('up');
    if (e.key === 'ArrowDown') move('down');
});

document.getElementById('ins-btn').onclick = () => {
    window.showInstruction('2048 Instructions', 'Use arrow keys to merge tiles. Reach 2048 to win!');
};

window.resetGame();
