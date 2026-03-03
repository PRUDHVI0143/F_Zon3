const grid = document.getElementById('checkersBoard');
const turnEl = document.getElementById('turn');

let board = [];
let selectedPiece = null;
let turn = 'dark'; // 'dark' (red) or 'light' (blue)

function init() {
    grid.innerHTML = '';
    board = Array(64).fill(null);
    turn = 'dark';
    turnEl.innerText = "Red's Turn";
    
    for (let i = 0; i < 64; i++) {
        const cell = document.createElement('div');
        const r = Math.floor(i / 8);
        const c = i % 8;
        cell.className = (r + c) % 2 === 1 ? 'checkers-cell cell-dark' : 'checkers-cell cell-light';
        cell.dataset.idx = i;
        cell.onclick = () => onCellClick(i);
        
        // Add pieces
        if ((r + c) % 2 === 1) {
            if (r < 3) {
                board[i] = 'light';
                const p = createPiece('light');
                cell.appendChild(p);
            } else if (r > 4) {
                board[i] = 'dark';
                const p = createPiece('dark');
                cell.appendChild(p);
            }
        }
        grid.appendChild(cell);
    }
}

function createPiece(color) {
    const p = document.createElement('div');
    p.className = `piece ${color}`;
    return p;
}

function onCellClick(idx) {
    const cell = grid.children[idx];
    if (board[idx] === turn) {
        if (selectedPiece) selectedPiece.classList.remove('selected');
        selectedPiece = cell.firstChild;
        selectedPiece.classList.add('selected');
        window.playSound('click');
    } else if (selectedPiece && board[idx] === null) {
        // Move piece
        const oldIdx = parseInt(selectedPiece.parentElement.dataset.idx);
        if (isValidMove(oldIdx, idx)) {
            cell.appendChild(selectedPiece);
            selectedPiece.classList.remove('selected');
            board[idx] = turn;
            board[oldIdx] = null;
            selectedPiece = null;
            window.playSound('eat');
            switchTurn();
        }
    }
}

function isValidMove(from, to) {
    // Basic diagonal move check
    let fr = Math.floor(from / 8);
    let tr = Math.floor(to / 8);
    let fc = from % 8;
    let tc = to % 8;
    return Math.abs(fr - tr) === 1 && Math.abs(fc - tc) === 1;
}

function switchTurn() {
    turn = turn === 'dark' ? 'light' : 'dark';
    turnEl.innerText = turn === 'dark' ? "Red's Turn" : "Blue's Turn";
}

window.resetGame = () => init();

document.getElementById('ins-btn').onclick = () => {
    window.showInstruction('Cyber Checkers', 'Move your pieces diagonally forward to capture all opposing pieces!');
};

init();
