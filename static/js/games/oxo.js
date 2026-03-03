const board = document.getElementById('board');
const cells = document.querySelectorAll('.cell');
const statusText = document.getElementById('status');
const resetBtn = document.getElementById('reset-btn');
const modeModal = document.getElementById('oxo-mode-modal');
const modeDisplay = document.getElementById('mode-display');

let currentPlayer = 'X';
let gameState = ["", "", "", "", "", "", "", "", ""];
let gameActive = false;
let gameMode = 'pvp'; // 'pvp' or 'pve'

const winningConditions = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
];

// === MODE SELECTION ===
function setGameMode(mode) {
    gameMode = mode;
    modeModal.style.display = 'none';
    modeDisplay.innerText = mode === 'pvp' ? '2 PLAYER' : 'VS AI';
    gameActive = true;
    handleRestartGame();
}
window.setGameMode = setGameMode;

// === CELL CLICK ===
function handleCellClick(e) {
    const clickedCell = e.target;
    const clickedCellIndex = parseInt(clickedCell.getAttribute('data-index'));

    if (gameState[clickedCellIndex] !== "" || !gameActive) return;

    // In PvE mode, only allow human to play X
    if (gameMode === 'pve' && currentPlayer === 'O') return;

    handleCellPlayed(clickedCell, clickedCellIndex);
    handleResultValidation();
}

function handleCellPlayed(clickedCell, clickedCellIndex) {
    gameState[clickedCellIndex] = currentPlayer;
    clickedCell.innerText = currentPlayer;
    clickedCell.classList.add(currentPlayer.toLowerCase());
    
    // Animate placement
    clickedCell.style.transform = 'scale(1.15)';
    setTimeout(function() { clickedCell.style.transform = 'scale(1)'; }, 150);
}

function handleResultValidation() {
    var roundWon = false;
    var winCombo = null;
    
    for (var i = 0; i <= 7; i++) {
        var winCondition = winningConditions[i];
        var a = gameState[winCondition[0]];
        var b = gameState[winCondition[1]];
        var c = gameState[winCondition[2]];
        if (a === '' || b === '' || c === '') continue;
        if (a === b && b === c) {
            roundWon = true;
            winCombo = winCondition;
            break;
        }
    }

    if (roundWon) {
        statusText.innerText = 'NODE ' + currentPlayer + ' SUPREME';
        statusText.style.color = currentPlayer === 'X' ? '#ff003c' : '#00f0ff';
        gameActive = false;
        
        // Highlight winning cells
        if (winCombo) {
            winCombo.forEach(function(idx) {
                cells[idx].classList.add('win-cell');
            });
        }
        
        if (window.playSound) window.playSound('win');
        if (window.showResult) window.showResult('DOMINATION: ' + currentPlayer, 100);
        if (window.submitScore) window.submitScore('oxo', 100);
        return;
    }

    var roundDraw = !gameState.includes("");
    if (roundDraw) {
        statusText.innerText = "LINK SYNC FAILURE (DRAW)";
        statusText.style.color = '#fcee0a';
        gameActive = false;
        if (window.showResult) window.showResult("SYNC FAILURE", 50);
        return;
    }

    handlePlayerChange();
}

function handlePlayerChange() {
    currentPlayer = currentPlayer === "X" ? "O" : "X";
    if (gameMode === 'pve' && currentPlayer === 'O') {
        statusText.innerText = 'AI COMPUTING...';
    } else {
        statusText.innerText = 'PLAYER ' + currentPlayer + "'S TURN";
    }
    statusText.style.color = '#00f0ff';

    // If PvE and it's O's turn, trigger AI
    if (gameMode === 'pve' && currentPlayer === 'O' && gameActive) {
        setTimeout(makeComputerMove, 500);
    }
}

// === COMPUTER AI (Minimax - Unbeatable) ===
function makeComputerMove() {
    if (!gameActive || currentPlayer !== 'O') return;

    var bestScore = -Infinity;
    var bestMove = -1;

    for (var i = 0; i < 9; i++) {
        if (gameState[i] === "") {
            gameState[i] = 'O';
            var score = minimax(gameState, 0, false);
            gameState[i] = "";
            if (score > bestScore) {
                bestScore = score;
                bestMove = i;
            }
        }
    }

    if (bestMove !== -1) {
        var cell = cells[bestMove];
        handleCellPlayed(cell, bestMove);
        if (window.playSound) window.playSound('click');
        handleResultValidation();
    }
}

function minimax(brd, depth, isMaximizing) {
    // Check for terminal states
    var winner = checkWinner(brd);
    if (winner === 'O') return 10 - depth;
    if (winner === 'X') return depth - 10;
    if (brd.indexOf("") === -1) return 0; // Draw

    if (isMaximizing) {
        var best = -Infinity;
        for (var i = 0; i < 9; i++) {
            if (brd[i] === "") {
                brd[i] = 'O';
                best = Math.max(best, minimax(brd, depth + 1, false));
                brd[i] = "";
            }
        }
        return best;
    } else {
        var best2 = Infinity;
        for (var j = 0; j < 9; j++) {
            if (brd[j] === "") {
                brd[j] = 'X';
                best2 = Math.min(best2, minimax(brd, depth + 1, true));
                brd[j] = "";
            }
        }
        return best2;
    }
}

function checkWinner(brd) {
    for (var i = 0; i < winningConditions.length; i++) {
        var a = winningConditions[i][0];
        var b = winningConditions[i][1];
        var c = winningConditions[i][2];
        if (brd[a] !== '' && brd[a] === brd[b] && brd[b] === brd[c]) {
            return brd[a];
        }
    }
    return null;
}

// === RESTART ===
function handleRestartGame() {
    gameActive = true;
    currentPlayer = "X";
    gameState = ["", "", "", "", "", "", "", "", ""];
    statusText.innerText = "PLAYER X'S TURN";
    statusText.style.color = '#00f0ff';
    cells.forEach(function(cell) {
        cell.innerText = "";
        cell.classList.remove('x', 'o', 'win-cell');
        cell.style.transform = 'scale(1)';
    });
}

// === EVENT LISTENERS ===
cells.forEach(function(cell) { cell.addEventListener('click', handleCellClick); });
resetBtn.addEventListener('click', handleRestartGame);
