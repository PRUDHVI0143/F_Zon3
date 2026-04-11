const boardEl = document.getElementById('ludoBoard');
const arenaEl = document.getElementById('arena');
const modalEl = document.getElementById('mode-modal');

let players = ['RED', 'GREEN', 'YELLOW', 'BLUE'];
let playerIndex = 0;
let currentTurn = players[playerIndex];

let pawnData = {
    'RED':    [{ id: 'r1', pos: -1 }, { id: 'r2', pos: -1 }, { id: 'r3', pos: -1 }, { id: 'r4', pos: -1 }],
    'GREEN':  [{ id: 'g1', pos: -1 }, { id: 'g2', pos: -1 }, { id: 'g3', pos: -1 }, { id: 'g4', pos: -1 }],
    'YELLOW': [{ id: 'y1', pos: -1 }, { id: 'y2', pos: -1 }, { id: 'y3', pos: -1 }, { id: 'y4', pos: -1 }],
    'BLUE':   [{ id: 'b1', pos: -1 }, { id: 'b2', pos: -1 }, { id: 'b3', pos: -1 }, { id: 'b4', pos: -1 }]
};

let currentRoll = 0;
let canRoll = true;
let isAnimating = false;
let gameMode = 'pvp'; // pvp or pve

function getFullMap() {
    return [
        [6,1],[6,2],[6,3],[6,4],[6,5], // 5
        [5,6],[4,6],[3,6],[2,6],[1,6],[0,6], // 6
        [0,7],[0,8], // 2
        [1,8],[2,8],[3,8],[4,8],[5,8], // 5
        [6,9],[6,10],[6,11],[6,12],[6,13],[6,14], // 6
        [7,14],[8,14], // 2
        [8,13],[8,12],[8,11],[8,10],[8,9], // 5
        [9,8],[10,8],[11,8],[12,8],[13,8],[14,8], // 6
        [14,7],[14,6], // 2
        [13,6],[12,6],[11,6],[10,6],[9,6], // 5
        [8,5],[8,4],[8,3],[8,2],[8,1],[8,0], // 6
        [7,0],[6,0] // 2 -> wraps smoothly
    ];
}

const COMMON_PATH = getFullMap();
const SAFE_INDEXES = [0, 8, 13, 21, 26, 34, 39, 47];

function getPlayerPath(player) {
    let startIdx = 0;
    if (player === 'GREEN') startIdx = 13;
    if (player === 'YELLOW') startIdx = 26;
    if (player === 'BLUE') startIdx = 39;
    
    let path = [];
    for(let i=0; i<51; i++) {
        path.push(COMMON_PATH[(startIdx + i) % 52]);
    }
    
    for(let i=1; i<=6; i++) {
        if(player === 'RED') path.push([7, i]);
        if(player === 'GREEN') path.push([i, 7]);
        if(player === 'YELLOW') path.push([7, 14-i]);
        if(player === 'BLUE') path.push([14-i, 7]);
    }
    return path;
}

let ludoPlayerCount = 2; // Default starting UI state is 2P
window.setLudoPlayers = function(count) {
    ludoPlayerCount = count;
    document.querySelectorAll('.pc-btn').forEach(b => b.classList.remove('pc-selected'));
    document.getElementById(`ludo-pc-${count}`).classList.add('pc-selected');
}

window.setMode = function(mode) {
    gameMode = mode;
    modalEl.style.display = 'none';
    arenaEl.style.display = 'flex';
    
    if (ludoPlayerCount === 2) {
        players = ['RED', 'YELLOW'];
    } else if (ludoPlayerCount === 3) {
        players = ['RED', 'GREEN', 'YELLOW'];
    } else {
        players = ['RED', 'GREEN', 'YELLOW', 'BLUE'];
    }
    
    ['RED', 'GREEN', 'YELLOW', 'BLUE'].forEach(c => {
        let panel = document.getElementById(`panel-${c.toLowerCase()}`);
        if(players.includes(c)) {
            panel.style.display = 'flex';
        } else {
            panel.style.display = 'none';
        }
    });

    if (gameMode === 'pvp') {
        let humanNames = ['Player 1', 'Player 2 (Human)', 'Player 3 (Human)', 'Player 4 (Human)'];
        players.forEach((p, idx) => {
            if(p !== 'RED') {
                document.getElementById(`${p.toLowerCase()}-name`).innerText = humanNames[idx];
            }
        });
    } else {
        ['BLUE', 'YELLOW', 'GREEN'].forEach(c => {
           if(players.includes(c)) {
               document.getElementById(`${c.toLowerCase()}-name`).innerText = `${c.charAt(0) + c.slice(1).toLowerCase()} CPU`;
           }
        });
    }

    currentTurn = players[0];
    playerIndex = 0;

    init();
    setTimeout(renderPawns, 200);
}

function init() {
    boardEl.innerHTML = '';
    
    for(let i=0; i<225; i++) {
        let cell = document.createElement('div');
        cell.className = 'cell';
        let row = Math.floor(i / 15);
        let col = i % 15;

        cell.style.gridRow = row + 1;
        cell.style.gridColumn = col + 1;

        if (row < 6 && col < 6) { cell.style.visibility = 'hidden'; }
        else if (row < 6 && col >= 9) { cell.style.visibility = 'hidden'; }
        else if (row >= 9 && col >= 9) { cell.style.visibility = 'hidden'; }
        else if (row >= 9 && col < 6) { cell.style.visibility = 'hidden'; }
        else if (row >= 6 && row <= 8 && col >= 6 && col <= 8) { cell.style.visibility = 'hidden'; }
        
        cell.dataset.row = row;
        cell.dataset.col = col;
        boardEl.appendChild(cell);
    }
    
    let mapPaths = {
        'RED': { class: 'bg-red', path: getPlayerPath('RED') },
        'GREEN': { class: 'bg-green', path: getPlayerPath('GREEN') },
        'YELLOW': { class: 'bg-yellow', path: getPlayerPath('YELLOW') },
        'BLUE': { class: 'bg-blue', path: getPlayerPath('BLUE') },
    };
    
    ['RED', 'GREEN', 'YELLOW', 'BLUE'].forEach(color => {
        let pp = mapPaths[color].path;
        for(let j=51; j<=55; j++) {
            let coords = pp[j];
            let c = document.querySelector(`.cell[data-row='${coords[0]}'][data-col='${coords[1]}']`);
            if(c) { c.classList.add(mapPaths[color].class); }
        }
        let startCoords = pp[0];
        let c = document.querySelector(`.cell[data-row='${startCoords[0]}'][data-col='${startCoords[1]}']`);
        if(c) c.classList.add(mapPaths[color].class);
    });

    SAFE_INDEXES.forEach(idx => {
        let coords = COMMON_PATH[idx];
        let c = document.querySelector(`.cell[data-row='${coords[0]}'][data-col='${coords[1]}']`);
        if(c) {
            c.innerHTML = '<i class="fa-solid fa-star"></i>';
            if(!c.className.includes('bg-')) c.style.background = 'rgba(0, 240, 255, 0.05)';
        }
    });

    const bases = [
        { color: 'red', rStyle: 'grid-row: 1 / 7; grid-column: 1 / 7;' },
        { color: 'green', rStyle: 'grid-row: 1 / 7; grid-column: 10 / 16;' },
        { color: 'yellow', rStyle: 'grid-row: 10 / 16; grid-column: 10 / 16;' },
        { color: 'blue', rStyle: 'grid-row: 10 / 16; grid-column: 1 / 7;' }
    ];
    
    bases.forEach(b => {
        let base = document.createElement('div');
        base.className = `home-${b.color}`;
        base.style = b.rStyle;
        base.innerHTML = `
            <div class="home-inner">
                <div class="home-circle" data-color="${b.color.toUpperCase()}" data-id="0"></div>
                <div class="home-circle" data-color="${b.color.toUpperCase()}" data-id="1"></div>
                <div class="home-circle" data-color="${b.color.toUpperCase()}" data-id="2"></div>
                <div class="home-circle" data-color="${b.color.toUpperCase()}" data-id="3"></div>
            </div>
        `;
        boardEl.appendChild(base);
    });

    let center = document.createElement('div');
    center.className = 'center-home';
    center.innerHTML = `
        <div class="triangle tri-red"></div>
        <div class="triangle tri-green"></div>
        <div class="triangle tri-yellow"></div>
        <div class="triangle tri-blue"></div>
    `;
    boardEl.appendChild(center);

    updateTurnDisplay();
    renderPawns();
}

function renderPawns() {
    let boardRect = boardEl.getBoundingClientRect();
    if(boardRect.width === 0) return;

    players.forEach(color => {
        let groupCounts = {}; 
        
        pawnData[color].forEach((p, idx) => {
            if (p.pos !== -1) {
                if (!groupCounts[p.pos]) groupCounts[p.pos] = [];
                groupCounts[p.pos].push(p);
            }
        });

        pawnData[color].forEach((p, idx) => {
            let pawnEl = document.getElementById(p.id);
            if (!pawnEl) {
                pawnEl = document.createElement('div');
                pawnEl.id = p.id;
                pawnEl.className = `pawn pawn-${color.toLowerCase()}`;
                pawnEl.dataset.color = color;
                pawnEl.dataset.idx = idx;
                pawnEl.onclick = (e) => { e.stopPropagation(); movePawn(color, idx); };
                boardEl.appendChild(pawnEl);
            }

            pawnEl.style.position = 'absolute';
            
            let destLeft = 0;
            let destTop = 0;
            let destTransform = 'scale(1)';

            if (p.pos === -1) {
                let hc = document.querySelector(`.home-circle[data-color='${color}'][data-id='${idx}']`);
                if(hc) {
                    let circleRect = hc.getBoundingClientRect();
                    if(circleRect.width > 0) {
                        destLeft = circleRect.left - boardRect.left - 4 + (circleRect.width / 2) - 15;
                        destTop = circleRect.top - boardRect.top - 4 + (circleRect.height / 2) - 15;
                    }
                }
            } else {
                let path = getPlayerPath(color);
                let coords = path[p.pos];
                let targetCell = document.querySelector(`.cell[data-row='${coords[0]}'][data-col='${coords[1]}']`);
                
                if (targetCell) {
                    let cellRect = targetCell.getBoundingClientRect();
                    if(cellRect.width > 0) {
                        destLeft = cellRect.left - boardRect.left - 4 + (cellRect.width / 2) - 15;
                        destTop = cellRect.top - boardRect.top - 4 + (cellRect.height / 2) - 15;
                    }
                    
                    let count = groupCounts[p.pos].length;
                    if(count > 1) {
                        let microOff = groupCounts[p.pos].indexOf(p);
                        let offsetValX = (microOff % 2 === 0 ? -6 : 6);
                        let offsetValY = (microOff < 2 ? -6 : 6);
                        destLeft += offsetValX;
                        destTop += offsetValY;
                        destTransform = 'scale(0.8)';
                    }
                }
            }
            
            pawnEl.style.left = destLeft + 'px';
            pawnEl.style.top = destTop + 'px';
            pawnEl.style.transform = destTransform;
            
            pawnEl.classList.remove('pulsing-pawn');
            if (!canRoll && !isAnimating && color === currentTurn && !isBot(color)) {
                if ((p.pos === -1 && currentRoll === 6) || (p.pos !== -1 && p.pos + currentRoll <= 56)) {
                    pawnEl.classList.add('pulsing-pawn');
                }
            }
        });
    });
}

function getMovablePawns() {
    return pawnData[currentTurn].filter(p => {
        if (p.pos === -1 && currentRoll === 6) return true;
        if (p.pos !== -1 && p.pos + currentRoll <= 56) return true;
        return false;
    });
}

async function movePawn(color, idx) {
    if (currentTurn !== color || canRoll || isAnimating) return;
    if (isBot(color)) return; // Bots trigger internally via logic.
    
    let p = pawnData[color][idx];
    
    if (p.pos === -1 && currentRoll !== 6) return;
    if (p.pos !== -1 && p.pos + currentRoll > 56) return;
    
    isAnimating = true;

    if (p.pos === -1) {
        p.pos = 0;
        renderPawns();
        if (window.playSound) window.playSound('click');
        await new Promise(r => setTimeout(r, 200));
        finishMove(p);
    } else {
        let targetPos = p.pos + currentRoll;
        for (let i = p.pos + 1; i <= targetPos; i++) {
            p.pos = i;
            renderPawns();
            if (window.playSound) window.playSound('click');
            await new Promise(r => setTimeout(r, 150));
        }
        finishMove(p);
    }
}

function isSafeZone(color, pos) {
    if (pos >= 51) return true; 
    let pPath = getPlayerPath(color);
    let targetCoords = pPath[pos];
    return SAFE_INDEXES.some(idx => {
        let safeCoords = COMMON_PATH[idx];
        return safeCoords[0] === targetCoords[0] && safeCoords[1] === targetCoords[1];
    });
}

function checkCapture(color, pos) {
    if (isSafeZone(color, pos)) return false;
    
    let pPath = getPlayerPath(color);
    let targetCoords = pPath[pos];
    let captured = false;

    players.forEach(otherColor => {
        if (otherColor === color) return;
        pawnData[otherColor].forEach(oppPawn => {
            if (oppPawn.pos === -1 || oppPawn.pos >= 51) return;
            let oppPath = getPlayerPath(otherColor);
            let oppCoords = oppPath[oppPawn.pos];
            if (oppCoords[0] === targetCoords[0] && oppCoords[1] === targetCoords[1]) {
                oppPawn.pos = -1; // Dead
                captured = true;
                if (window.playSound) window.playSound('lose');
            }
        });
    });
    return captured;
}

function finishMove(movedPawn) {
    let captured = checkCapture(currentTurn, movedPawn.pos);
    renderPawns();
    isAnimating = false;
    
    if (pawnData[currentTurn].every(p => p.pos === 56)) {
        if(window.showResult) window.showResult(currentTurn + " DOMINATION COMPLETE", 1000);
        if(window.submitScore) window.submitScore('ludo', 1000);
        return;
    }
    
    if (currentRoll === 6 || captured || movedPawn.pos === 56) {
        canRoll = true;
        renderPawns();
        if(isBot(currentTurn)) setTimeout(doBotTurn, 800);
    } else {
        switchTurn();
    }
}

function isBot(color) {
    if (gameMode === 'pvp') return false; // In PvP, NO ONE is a bot!
    return color !== 'RED';               // In PvE, everyone except RED is a bot!
}

async function doBotTurn() {
    if(!canRoll || !isBot(currentTurn)) return;
    
    // Automatically trigger rollDice
    await rollDice(currentTurn, true);
    
    // Once rolled, pick a pawn internally and move it
    if(currentRoll > 0) {
        let movable = getMovablePawns();
        if (movable.length > 0) {
            let selectedPawn = movable[Math.floor(Math.random() * movable.length)];
            let idx = pawnData[currentTurn].indexOf(selectedPawn);
            await botMovePawn(currentTurn, idx);
        }
    }
}

async function botMovePawn(color, idx) {
    let p = pawnData[color][idx];
    isAnimating = true;

    if (p.pos === -1) {
        p.pos = 0;
        renderPawns();
        if (window.playSound) window.playSound('click');
        await new Promise(r => setTimeout(r, 200));
        finishMove(p);
    } else {
        let targetPos = p.pos + currentRoll;
        for (let i = p.pos + 1; i <= targetPos; i++) {
            p.pos = i;
            renderPawns();
            if (window.playSound) window.playSound('click');
            await new Promise(r => setTimeout(r, 150));
        }
        finishMove(p);
    }
}

function switchTurn() {
    playerIndex = (playerIndex + 1) % players.length;
    currentTurn = players[playerIndex];
    canRoll = true;
    updateTurnDisplay();
    renderPawns();
    
    if (isBot(currentTurn)) {
        setTimeout(doBotTurn, 800);
    }
}

function updateTurnDisplay() {
    players.forEach(c => {
        document.getElementById(`panel-${c.toLowerCase()}`).classList.remove('active', 'active-red', 'active-green', 'active-yellow', 'active-blue');
    });
    
    let p = document.getElementById(`panel-${currentTurn.toLowerCase()}`);
    p.classList.add('active', `active-${currentTurn.toLowerCase()}`);
}

async function rollDice(requestingColor, isBotTrigger = false) {
    if (!canRoll || isAnimating || currentTurn !== requestingColor) return;
    if (isBot(requestingColor) && !isBotTrigger) return; // Prevent human click on bot dice
    
    canRoll = false;
    isAnimating = true;
    if (window.playSound) window.playSound('click'); 
    
    const diceNode = document.getElementById(`dice-${currentTurn.toLowerCase()}`);
    diceNode.classList.add('rolling');
    
    let rollDuration = 600;
    let cycles = 15;
    
    let finalRoll = Math.floor(Math.random() * 6) + 1;
    
    for(let i=0; i<cycles; i++) {
        let r = Math.floor(Math.random() * 6) + 1;
        setDiceFace(diceNode, r);
        let rx = Math.random()*360;
        let ry = Math.random()*360;
        diceNode.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) scale(1.2)`;
        await new Promise(r => setTimeout(r, rollDuration/cycles));
    }
    
    diceNode.classList.remove('rolling');
    setDiceFace(diceNode, finalRoll);
    
    const faceRotations = {
        1: 'rotateX(0deg) rotateY(0deg)',
        2: 'rotateX(180deg) rotateY(0deg)',
        3: 'rotateX(0deg) rotateY(-90deg)',
        4: 'rotateX(0deg) rotateY(90deg)',
        5: 'rotateX(-90deg) rotateY(0deg)',
        6: 'rotateX(90deg) rotateY(0deg)',
    };
    diceNode.style.transform = `${faceRotations[finalRoll]} scale(1)`;
    currentRoll = finalRoll;
    
    await new Promise(r => setTimeout(r, 400));
    isAnimating = false;
    
    let movable = getMovablePawns();
    
    if (movable.length === 0) {
        setTimeout(switchTurn, 1000);
    } else if (movable.length === 1 && !isBot(currentTurn)) {
        // Auto move human if only 1 option
        let selectedPawn = movable[0];
        setTimeout(() => movePawn(currentTurn, pawnData[currentTurn].indexOf(selectedPawn)), 300);
    } else {
        renderPawns();
    }
}

function setDiceFace(diceElement, number) {
    // Dice faces are statically defined in HTML using dots.
    // Changing standard view is handled by transforms. 
}

window.rollDice = rollDice;

window.addEventListener('resize', () => {
    if(!isAnimating && gameMode) renderPawns();
});
