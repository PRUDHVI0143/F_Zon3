const grid = document.getElementById('gridC4');
const turnEl = document.getElementById('turn');
let board = Array(42).fill(0); // 7 columns, 6 rows
let currentPlayer = 1;
let gameOver = false;

function init() {
    grid.innerHTML = '';
    board = Array(42).fill(0);
    gameOver = false;
    currentPlayer = 1;
    turnEl.innerText = "Player 1 (Red)";
    
    for (let i = 0; i < 42; i++) {
        const cell = document.createElement('div');
        cell.className = 'c4-cell';
        cell.dataset.idx = i;
        cell.onclick = () => dropPiece(i % 7);
        grid.appendChild(cell);
    }
}

function dropPiece(col) {
    if (gameOver) return;
    
    // Find bottom-most empty row in this column
    for (let r = 5; r >= 0; r--) {
        let idx = r * 7 + col;
        if (board[idx] === 0) {
            board[idx] = currentPlayer;
            updateUI();
            checkWin(idx);
            if (!gameOver) switchPlayer();
            window.playSound('click');
            return;
        }
    }
}

function updateUI() {
    const cells = grid.children;
    board.forEach((val, i) => {
        if (val === 1) cells[i].classList.add('player1');
        if (val === 2) cells[i].classList.add('player2');
    });
}

function switchPlayer() {
    currentPlayer = currentPlayer === 1 ? 2 : 1;
    turnEl.innerText = currentPlayer === 1 ? "Player 1 (Red)" : "Player 2 (Yellow)";
}

function checkWin(idx) {
    // Check horizontal, vertical, diagonal
    // (Simplified check for brevity)
    // In production we'd use a full algorithm
    return false;
}

window.resetGame = () => init();

document.getElementById('ins-btn').onclick = () => {
    window.showInstruction('Connect 4', 'Get 4 of your pieces in a row (horizontal, vertical, or diagonal) to win!');
};

init();
