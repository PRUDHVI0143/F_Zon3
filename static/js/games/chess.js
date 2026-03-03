const boardEl = document.getElementById('board');
const statusEl = document.getElementById('status');
const modeDisplay = document.getElementById('mode-display');
const modeModal = document.getElementById('mode-modal');

const pieces = {
    'wk': '♔', 'wq': '♕', 'wr': '♖', 'wb': '♗', 'wn': '♘', 'wp': '♙',
    'bk': '♚', 'bq': '♛', 'br': '♜', 'bb': '♝', 'bn': '♞', 'bp': '♟'
};

let game = new Chess();
let selectedSquare = null;
let gameMode = 'pvp'; // 'pvp' or 'pve'

function getSquare(r, c) {
    return "abcdefgh"[c] + (8 - r);
}

function getRc(sq) {
    return {
        r: 8 - parseInt(sq[1]),
        c: "abcdefgh".indexOf(sq[0])
    };
}

function setGameMode(mode) {
    gameMode = mode;
    modeDisplay.innerText = mode === 'pvp' ? '2 PLAYER' : 'VS AI';
    modeModal.style.display = 'none';
    game.reset();
    selectedSquare = null;
    updateStatus();
    renderBoard();
}

function initBoard() {
    boardEl.innerHTML = '';
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const cell = document.createElement('div');
            cell.className = `c-cell ${(r + c) % 2 === 0 ? 'white' : 'black'}`;
            cell.dataset.row = r;
            cell.dataset.col = c;
            cell.addEventListener('click', () => handleCellClick(r, c));
            boardEl.appendChild(cell);
        }
    }
}

function handleCellClick(r, c) {
    if (game.game_over()) return;

    const sq = getSquare(r, c);
    
    if (selectedSquare) {
        // Attempt a move
        const moves = game.moves({ verbose: true });
        const move = moves.find(m => m.from === selectedSquare && m.to === sq);
        
        if (move) {
            // Found a valid move!
            game.move(move.san);
            selectedSquare = null;
            renderBoard();
            updateStatus();
            
            // Play a sound if available (assuming custom synth/sound func)
            if (window.playSound) window.playSound(move.captured ? 'eat' : 'click');
            
            // Trigger AI if it's AI mode and game is not over
            if (gameMode === 'pve' && !game.game_over()) {
                setTimeout(makeComputerMove, 400);
            }
        } else {
            // Clicking elsewhere! If clicking own piece, select it
            const piece = game.get(sq);
            if (piece && piece.color === game.turn()) {
                selectedSquare = sq;
                renderBoard();
            } else {
                selectedSquare = null;
                renderBoard();
            }
        }
    } else {
        // Nothing selected yet
        const piece = game.get(sq);
        // Only allow picking active player's pieces
        if (piece && piece.color === game.turn()) {
            selectedSquare = sq;
            renderBoard();
        }
    }
}

function makeComputerMove() {
    if (game.game_over()) return;
    
    // Quick random/heuristic engine
    const moves = game.moves({ verbose: true });
    if (moves.length === 0) return;
    
    // Try to find a capturing move or check
    let bestMove = null;
    let highestValue = -1;
    const pieceValues = { 'p': 10, 'n': 30, 'b': 30, 'r': 50, 'q': 90, 'k': 900 };
    
    moves.forEach(m => {
        let value = Math.random() * 5; // tiny random noise
        if (m.captured) value += pieceValues[m.captured] || 0;
        if (m.flags.includes('p')) value += 80; // Promotion
        if (value > highestValue) {
            highestValue = value;
            bestMove = m;
        }
    });
    
    const moveToPlay = bestMove || moves[Math.floor(Math.random() * moves.length)];
    game.move(moveToPlay.san);
    
    renderBoard();
    updateStatus();
    if (window.playSound) window.playSound(moveToPlay.captured ? 'eat' : 'click');
}

function renderBoard() {
    const board = game.board();
    const cells = document.querySelectorAll('.c-cell');
    
    // Clear legal moves visualization first
    cells.forEach(c => {
        c.classList.remove('selected', 'legal-move', 'legal-capture');
        const r = parseInt(c.dataset.row);
        const col = parseInt(c.dataset.col);
        const piece = board[r][col];
        
        if (piece) {
            const pieceCode = piece.color + piece.type; // e.g. 'wp'
            const colorClass = piece.color === 'w' ? 'piece-w' : 'piece-b';
            c.innerHTML = `<span class="${colorClass}">${pieces[pieceCode]}</span>`;
        } else {
            c.innerHTML = '';
        }
    });

    if (selectedSquare) {
        const { r, c } = getRc(selectedSquare);
        const selectedEl = document.querySelector(`.c-cell[data-row="${r}"][data-col="${c}"]`);
        if (selectedEl) selectedEl.classList.add('selected');
        
        // Highlight legal steps
        const moves = game.moves({ verbose: true, square: selectedSquare });
        moves.forEach(m => {
            const destRc = getRc(m.to);
            const targetEl = document.querySelector(`.c-cell[data-row="${destRc.r}"][data-col="${destRc.c}"]`);
            if (targetEl) {
                if (m.captured) {
                    targetEl.classList.add('legal-capture');
                } else {
                    targetEl.classList.add('legal-move');
                }
            }
        });
    }
}

function updateStatus() {
    let statusText = '';
    let moveColor = game.turn() === 'w' ? 'NEON (W)' : 'CRIMSON (B)';

    if (game.in_checkmate()) {
        statusText = `SYSTEM FAILURE! ${moveColor} TERMINATED.`;
    } else if (game.in_draw() || game.in_stalemate() || game.in_threefold_repetition()) {
        statusText = 'STALEMATE DETECTED.';
    } else {
        statusText = moveColor + (game.in_check() ? ' (WARNING: CHECK)' : '');
    }

    statusEl.innerText = statusText;
}

// Initial setup
initBoard();
// Do not render pieces until mode is selected (let mode selector handle first render)
