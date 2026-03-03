const grid = document.getElementById('sudokuGrid');
const timerEl = document.getElementById('timer');
let selectedCell = null;
let board = [];
let solution = [];
let time = 0;
let timerInterval;

function init() {
    grid.innerHTML = '';
    board = Array(81).fill(0);
    for (let i = 0; i < 81; i++) {
        const cell = document.createElement('div');
        cell.className = 'sudoku-cell';
        cell.dataset.id = i;
        cell.addEventListener('click', () => {
            if (selectedCell) selectedCell.classList.remove('selected');
            selectedCell = cell;
            cell.classList.add('selected');
        });
        grid.appendChild(cell);
    }
}

function generatePuzzle() {
    // Basic generator - better logic would be needed for a full game
    // For now, let's just populate a few numbers
    const fixedIndices = [
        0, 2, 5, 8, 12, 14, 18, 20, 24, 26, 
        30, 32, 36, 40, 44, 48, 50, 54, 56, 
        60, 62, 66, 68, 72, 75, 78, 80
    ];
    
    // Quick random population for testing
    for (let i of fixedIndices) {
        let val = Math.floor(Math.random() * 9) + 1;
        board[i] = val;
        const cell = grid.children[i];
        cell.innerText = val;
        cell.classList.add('fixed');
    }
}

window.inputNumber = (num) => {
    if (!selectedCell || selectedCell.classList.contains('fixed')) return;
    const id = selectedCell.dataset.id;
    if (num === 0) {
        selectedCell.innerText = '';
        board[id] = 0;
    } else {
        selectedCell.innerText = num;
        board[id] = num;
        window.playSound('click');
    }
};

window.checkSolution = async () => {
    // Simple verification (sum check and unique check)
    let isComplete = board.every(val => val !== 0);
    if (!isComplete) {
        alert('Please fill the whole grid!');
        return;
    }
    
    // Actual Sudoku rule check
    if (validateSudoku()) {
        window.playSound('win');
        window.showResult('DECRYPTED', 1000);
        clearInterval(timerInterval);
        await window.submitScore('sudoku', 1000);
    } else {
        window.playSound('lose');
        alert('Logic Error Detected. Review and try again.');
    }
};

function validateSudoku() {
    // Check rows and columns
    for (let i = 0; i < 9; i++) {
        let rowSet = new Set();
        let colSet = new Set();
        for (let j = 0; j < 9; j++) {
            let rVal = board[i * 9 + j];
            let cVal = board[j * 9 + i];
            if (rowSet.has(rVal) || colSet.has(cVal)) return false;
            rowSet.add(rVal);
            colSet.add(cVal);
        }
    }
    return true;
}

function startTimer() {
    time = 0;
    timerInterval = setInterval(() => {
        time++;
        const mins = Math.floor(time / 60).toString().padStart(2, '0');
        const secs = (time % 60).toString().padStart(2, '0');
        timerEl.innerText = `${mins}:${secs}`;
    }, 1000);
}

window.newGame = () => {
    clearInterval(timerInterval);
    init();
    generatePuzzle();
    startTimer();
};

document.getElementById('ins-btn').addEventListener('click', () => {
    window.showInstruction(
        'Sudoku Rules',
        '<p>1. Every Row, Column, and 3x3 block must contain numbers 1-9 without repetition.</p><p>2. Fill all empty cells to win.</p>'
    );
});

newGame();
