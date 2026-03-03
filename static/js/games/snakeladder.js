const board = document.getElementById('board');
const slCanvas = document.getElementById('slCanvas');
const slCtx = slCanvas.getContext('2d');
const mainDice = document.getElementById('mainDice');
const statusNotice = document.getElementById('statusNotice');

// Game State
let gameMode = 'ai'; // 'ai' or 'local'
let playerCount = 2; // 2 to 4
let currentPlayerIndex = 0;
let isAnimating = false;
let canRoll = true;

const P_COLORS = [
    { id: 'p1', hex: '#ff0033', name: 'You (RED)', class: 't-red', pawnClass: 'pawn-red' },
    { id: 'p2', hex: '#00ccff', name: 'BLUE', class: 't-blue', pawnClass: 'pawn-blue' },
    { id: 'p3', hex: '#00ff66', name: 'GREEN', class: 't-green', pawnClass: 'pawn-green' },
    { id: 'p4', hex: '#ffcc00', name: 'YELLOW', class: 't-yellow', pawnClass: 'pawn-yellow' }
];

let players = []; 

// Ludo-style snakes/ladders positions (1 to 100) -> array index 0 to 99
const snakes = { 16: 6, 46: 25, 49: 11, 62: 19, 64: 60, 74: 53, 89: 68, 92: 88, 95: 75, 99: 80 };
const ladders = { 2: 38, 7: 14, 8: 31, 15: 26, 21: 42, 28: 84, 36: 44, 51: 67, 71: 91, 78: 98, 87: 94 };

// Setup UI logic
function selectMode(mode) {
    gameMode = mode;
    document.getElementById('btn-mode-ai').classList.remove('selected');
    document.getElementById('btn-mode-local').classList.remove('selected');
    document.getElementById(`btn-mode-${mode}`).classList.add('selected');
    
    // In AI mode, we allow 2/3/4 player count. In Local, also 2/3/4.
    document.getElementById('pc-group').classList.add('active');
}

function selectPlayers(count) {
    playerCount = count;
    document.querySelectorAll('.pc-btn').forEach(b => b.classList.remove('selected'));
    document.getElementById(`pc-${count}`).classList.add('selected');
}

function startGame() {
    document.getElementById('setupModal').style.display = 'none';
    document.getElementById('gameLayout').style.visibility = 'visible';
    document.getElementById('gameLayout').style.opacity = '1';
    
    initGame();
}

// Board Init
function initGame() {
    board.innerHTML = '';
    players = [];
    
    // Init Players
    let turnStrips = document.getElementById('turnStrokes');
    turnStrips.innerHTML = '';
    
    for(let i=0; i<playerCount; i++) {
        let pName = P_COLORS[i].name;
        if(gameMode === 'ai' && i > 0) pName = `Bot ${i+1}`;
        if(gameMode === 'local' && i > 0) pName = `Player ${i+1}`;
        
        players.push({
            id: P_COLORS[i].id,
            name: pName,
            colorDef: P_COLORS[i],
            pos: 0, // Starts off board
            isBot: (gameMode === 'ai' && i > 0),
            pawnEl: null
        });
        
        turnStrips.innerHTML += `
            <div class="turn-indicator ${P_COLORS[i].class}" id="ti-${i}">
                <div class="ti-label">${pName}</div>
            </div>`;
    }
    
    // Draw grid cells
    for (let i = 0; i < 100; i++) {
        const cell = document.createElement('div');
        cell.className = 'sl-cell';
        let row = Math.floor(i / 10);
        let col = i % 10;
        
        let label = (i + 1);
        if (row % 2 === 1) col = 9 - col;
        
        cell.innerText = label;
        cell.style.gridRow = (9 - row) + 1; // 0 is bottom, meaning row 10 in CSS Grids (1-based)
        cell.style.gridColumn = col + 1;
        
        // Alternating color logic like physical boards
        if(i % 3 === 0) cell.classList.add('yellow');
        else if(i % 3 === 1) cell.classList.add('orange');
        else cell.classList.add('white');
        
        board.appendChild(cell);
    }
    
    drawCanvasElements();
    
    // Create physical Pawns over the grid
    players.forEach((player, i) => {
        let pEl = document.createElement('div');
        pEl.className = `pawn ${player.colorDef.pawnClass}`;
        pEl.id = `pawn-${i}`;
        board.parentElement.appendChild(pEl);
        player.pawnEl = pEl;
    });

    switchTurn(0); // init position
}

function getCoords(pos) {
    if(pos < 0) return { x: -20, y: 620 }; // Off-board bottom left (Unlocked Zone)
    if(pos > 99) pos = 99; // Cap
    let row = Math.floor(pos / 10); 
    let col = pos % 10;
    if (row % 2 === 1) col = 9 - col;
    
    // Total board is 600x600, cell is 60x60
    return { x: col * 60 + 30, y: 600 - (row * 60) - 30 };
}

function drawCanvasElements() {
    slCtx.clearRect(0,0,600,600);
    
    // Draw Electric Ladders (Cyan energy beams)
    for (let [s, e] of Object.entries(ladders)) {
        let sc = getCoords(s - 1);
        let ec = getCoords(e - 1);
        
        let dx = ec.x - sc.x;
        let dy = ec.y - sc.y;
        let angle = Math.atan2(dy, dx);
        let len = Math.sqrt(dx*dx + dy*dy);
        
        slCtx.save();
        slCtx.translate(sc.x, sc.y);
        slCtx.rotate(angle);
        
        // Neon Glow
        slCtx.shadowBlur = 15;
        slCtx.shadowColor = '#00f2ff';
        slCtx.lineJoin = 'round';
        
        // Rails
        slCtx.strokeStyle = 'rgba(0, 242, 255, 0.8)';
        slCtx.lineWidth = 4;
        slCtx.beginPath(); slCtx.moveTo(0, -15); slCtx.lineTo(len, -15); slCtx.stroke();
        slCtx.beginPath(); slCtx.moveTo(0, 15); slCtx.lineTo(len, 15); slCtx.stroke();
        
        // White Hot Cores
        slCtx.strokeStyle = '#ffffff';
        slCtx.lineWidth = 2;
        slCtx.beginPath(); slCtx.moveTo(0, -15); slCtx.lineTo(len, -15); slCtx.stroke();
        slCtx.beginPath(); slCtx.moveTo(0, 15); slCtx.lineTo(len, 15); slCtx.stroke();
        
        // Energy Rungs
        slCtx.strokeStyle = 'rgba(0, 242, 255, 0.6)';
        slCtx.lineWidth = 3;
        for(let j=15; j<len-10; j+=25) {
            slCtx.beginPath(); slCtx.moveTo(j, -15); slCtx.lineTo(j, 15); slCtx.stroke();
        }
        
        slCtx.restore();
    }
    
    // Draw Cyber Snakes (Magenta corrupted data streams)
    for (let [s, e] of Object.entries(snakes)) {
        let sc = getCoords(s - 1); // Head
        let ec = getCoords(e - 1); // Tail
        
        let dx = ec.x - sc.x;
        let dy = ec.y - sc.y;
        
        // Corrupted zig-zag control points
        let cx = sc.x + dx * 0.5 - dy * 0.4;
        let cy = sc.y + dy * 0.5 + dx * 0.4;
        
        slCtx.lineCap = 'square';
        slCtx.lineJoin = 'miter';

        // Neon Glow
        slCtx.shadowBlur = 20;
        slCtx.shadowColor = '#ff0044';

        // Outer Dark Trace
        slCtx.beginPath();
        slCtx.moveTo(sc.x, sc.y);
        slCtx.quadraticCurveTo(cx, cy, ec.x, ec.y);
        slCtx.strokeStyle = 'rgba(255, 0, 68, 0.4)';
        slCtx.lineWidth = 15;
        slCtx.stroke();
        
        // Core Wire
        slCtx.beginPath();
        slCtx.moveTo(sc.x, sc.y);
        slCtx.quadraticCurveTo(cx, cy, ec.x, ec.y);
        slCtx.strokeStyle = '#ff0044';
        slCtx.lineWidth = 6;
        slCtx.stroke();
        
        // Data Packets (Dashed Center)
        slCtx.setLineDash([10, 20]);
        slCtx.beginPath();
        slCtx.moveTo(sc.x, sc.y);
        slCtx.quadraticCurveTo(cx, cy, ec.x, ec.y);
        slCtx.strokeStyle = '#ffffff';
        slCtx.lineWidth = 3;
        slCtx.stroke();
        slCtx.setLineDash([]);
        
        // Digital Head / Terminal block
        let headAngle = Math.atan2(cy - sc.y, cx - sc.x);
        slCtx.save();
        slCtx.translate(sc.x, sc.y);
        slCtx.rotate(headAngle + Math.PI); // Facing outward
        
        slCtx.fillStyle = '#ff0044';
        slCtx.fillRect(-15, -15, 30, 30); // Square Cyber Head
        slCtx.fillStyle = '#111';
        slCtx.fillRect(-5, -5, 10, 10); // Processor eye
        
        slCtx.fillStyle = '#00f2ff';
        slCtx.fillRect(15, -5, 15, 2); // Data probe
        slCtx.fillRect(15, 5, 15, 2);
        
        slCtx.restore();
    }
}

function updateAllPawns() {
    players.forEach((p, idx) => {
        let posCoord = getCoords(p.pos === 0 ? -1 : p.pos - 1);
        
        // Micro adjust to prevent overlap
        let overlapIndex = 0;
        for(let i=0; i<idx; i++) {
            if(players[i].pos === p.pos) overlapIndex++;
        }
        
        let offX = (overlapIndex % 2) * 12 - 6;
        let offY = Math.floor(overlapIndex / 2) * -12;
        
        p.pawnEl.style.left = `${posCoord.x + offX}px`;
        p.pawnEl.style.top = `${posCoord.y + offY}px`;
    });
}

function switchTurn(forceIndex = -1) {
    if(forceIndex !== -1) {
        currentPlayerIndex = forceIndex;
    } else {
        currentPlayerIndex = (currentPlayerIndex + 1) % playerCount;
    }
    
    let activePlayer = players[currentPlayerIndex];
    canRoll = true;
    
    // UI Updates
    document.querySelectorAll('.turn-indicator').forEach(ti => ti.classList.remove('active'));
    document.getElementById(`ti-${currentPlayerIndex}`).classList.add('active');
    
    if(activePlayer.isBot) {
        statusNotice.innerText = `${activePlayer.name.toUpperCase()} THINKING...`;
        setTimeout(botTurn, 800);
    } else {
        statusNotice.innerText = `YOUR TURN (${activePlayer.name})`;
    }
    
    updateAllPawns();
}

function setDiceFace(number) {
    const faceRotations = {
        1: 'rotateX(0deg) rotateY(0deg)',
        2: 'rotateX(180deg) rotateY(0deg)',
        3: 'rotateX(0deg) rotateY(-90deg)',
        4: 'rotateX(0deg) rotateY(90deg)',
        5: 'rotateX(-90deg) rotateY(0deg)',
        6: 'rotateX(90deg) rotateY(0deg)',
    };
    mainDice.style.transform = `${faceRotations[number]} scale(1)`;
}

async function rollSnakesDice() {
    let p = players[currentPlayerIndex];
    if (!canRoll || isAnimating || p.isBot) return;
    
    executeRoll(p);
}

async function botTurn() {
    let p = players[currentPlayerIndex];
    if(!p.isBot) return;
    executeRoll(p);
}

async function executeRoll(player) {
    canRoll = false;
    isAnimating = true;
    window.playSound('click');
    
    mainDice.classList.add('rolling');
    let cycles = 12;
    let finalRoll = Math.floor(Math.random() * 6) + 1;
    
    for(let i=0; i<cycles; i++) {
        let r = Math.floor(Math.random() * 6) + 1;
        setDiceFace(r);
        let rx = Math.random()*360; let ry = Math.random()*360;
        mainDice.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) scale(1.2)`;
        await new Promise(r => setTimeout(r, 600/cycles));
    }
    
    mainDice.classList.remove('rolling');
    setDiceFace(finalRoll);
    await new Promise(r => setTimeout(r, 400));
    
    window.playSound('click'); // move sound
    
    // Calculate new position / Rules
    if (player.pos === 0) {
        if (finalRoll === 1 || finalRoll === 6) {
            statusNotice.innerText = 'UNLOCKED! ENTERED BOARD!';
            player.pos = 1;
            updateAllPawns();
            await new Promise(r => setTimeout(r, 400));
        } else {
            statusNotice.innerText = 'NEED 1 OR 6 TO START!';
            await new Promise(r => setTimeout(r, 800));
        }
    } else if (player.pos + finalRoll <= 100) {
        // Step by step visual crawl
        for(let step=1; step<=finalRoll; step++) {
            player.pos++;
            updateAllPawns();
            window.playSound('click'); // Coin step sound
            await new Promise(r => setTimeout(r, 400)); // Precise match to CSS rule
        }
    }
    
    // Check Snakes and Ladders
    let currentCell = player.pos;
    if (snakes[currentCell]) {
        await new Promise(r => setTimeout(r, 300));
        window.playSound('lose'); // snake slide
        player.pos = snakes[currentCell];
        updateAllPawns();
        statusNotice.innerText = 'OH NO! BITTEN BY A SNAKE!';
        await new Promise(r => setTimeout(r, 800));
    } else if (ladders[currentCell]) {
        await new Promise(r => setTimeout(r, 300));
        window.playSound('eat'); // ladder climb
        player.pos = ladders[currentCell];
        updateAllPawns();
        statusNotice.innerText = 'GREAT! CLIMBING LADDER!';
        await new Promise(r => setTimeout(r, 800));
    }
    
    isAnimating = false;
    
    // Win Condition
    if (player.pos === 100) {
        window.playSound('win');
        statusNotice.innerText = `${player.name} WINS!`;
        window.showResult(`${player.name} WON THE MATCH!`, 1000);
        if(!player.isBot && player.id === 'p1') {
            window.submitScore('snakeladder', 1000);
        }
        return; // stop game
    }
    
    // Six gives an extra turn
    if (finalRoll === 6) {
        statusNotice.innerText = 'ROLLED 6! EXTRA TURN!';
        canRoll = true;
        if(player.isBot) setTimeout(botTurn, 1000);
    } else {
        switchTurn();
    }
}

// Initial draw of canvas behind setup modal
drawCanvasElements();

window.rollSnakesDice = rollSnakesDice;
window.selectMode = selectMode;
window.selectPlayers = selectPlayers;
window.startGame = startGame;
