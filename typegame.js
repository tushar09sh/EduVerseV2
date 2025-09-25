// DOM Elements
const gameScreen = document.getElementById('game-screen');
const typingInput = document.getElementById('typing-input');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const waveEl = document.getElementById('wave');
const modal = document.getElementById('modal');
const modalMessageEl = document.getElementById('modal-message');
const finalStatsEl = document.getElementById('final-stats');
const restartBtn = document.getElementById('restart-btn');
const waveModal = document.getElementById('wave-modal');
const waveMessageEl = document.getElementById('wave-message');

// Game State
let score = 0;
let castleHP = 100;
let wave = 1;
let enemies = [];
let gameLoopInterval;
let enemySpawnInterval;
let isGameOver = false;
let waveInProgress = false;

// Config
const wordLists = {
    1: ['jet', 'sky', 'fly', 'air', 'wing', 'fast', 'high', 'blue'],
    2: ['pilot', 'engine', 'cloud', 'flight', 'speed', 'sonic', 'eagle', 'rocket'],
    3: ['airplane', 'propeller', 'altitude', 'tailwind', 'velocity', 'squadron', 'aviation', 'supersonic'],
};

const enemyEmojis = ['✈️', '🛩️', '🛫', '🛬'];
const enemiesPerWave = [8, 12, 15]; // Enemies for wave 1, 2, 3
let enemiesSpawnedThisWave = 0;

// --- Game Functions ---
function init() {
    score = 0;
    castleHP = 100;
    wave = 1;
    isGameOver = false;
    enemies.forEach(enemy => gameScreen.removeChild(enemy.element));
    enemies = [];

    updateHUD();
    typingInput.value = '';
    typingInput.disabled = false;
    typingInput.focus();
    
    modal.classList.add('hidden');
    
    clearInterval(gameLoopInterval);
    clearInterval(enemySpawnInterval);
    gameLoopInterval = setInterval(gameLoop, 1000 / 60); // 60 FPS
    startWave();
}

function updateHUD() {
    scoreEl.textContent = `SCORE: ${score}`;
    livesEl.textContent = `CASTLE HP: ${castleHP}%`;
    waveEl.textContent = `WAVE: ${wave}`;
}

function showWaveTransition(callback) {
    waveMessageEl.textContent = `WAVE ${wave}`;
    waveModal.style.display = 'flex';
    setTimeout(() => {
        waveModal.style.display = 'none';
        callback();
    }, 2000); // Show message for 2 seconds
}

function startWave() {
    showWaveTransition(() => {
        waveInProgress = true;
        enemiesSpawnedThisWave = 0;
        const spawnRate = Math.max(2500 - (wave * 500), 800);
        enemySpawnInterval = setInterval(spawnEnemy, spawnRate);
        updateHUD();
    });
}

function spawnEnemy() {
    if (isGameOver || enemiesSpawnedThisWave >= enemiesPerWave[wave - 1]) {
        clearInterval(enemySpawnInterval);
        return;
    }
    
    enemiesSpawnedThisWave++;

    const word = getRandomWord();
    const element = document.createElement('div');
    element.classList.add('enemy');
    
    const emoji = document.createElement('span');
    emoji.textContent = enemyEmojis[Math.floor(Math.random() * enemyEmojis.length)];
    
    const wordTag = document.createElement('div');
    wordTag.classList.add('word-tag');
    wordTag.innerHTML = `<span>${word}</span>`;
    
    element.appendChild(emoji);
    element.appendChild(wordTag);
    
    const startSide = Math.random() < 0.5 ? 'left' : 'right';
    const topPosition = 50 + Math.random() * 200; // Planes fly higher
    
    element.style.top = `${topPosition}px`;
    if (startSide === 'left') {
        element.style.left = '-100px';
    } else {
        element.style.left = `${gameScreen.offsetWidth + 100}px`;
    }

    const enemy = {
        word: word,
        element: element,
        wordTag: wordTag.firstElementChild,
        speed: 0.8 + (wave - 1) * 0.4 + Math.random() * 0.3, // Faster planes each wave
        x: startSide === 'left' ? -100 : gameScreen.offsetWidth + 100,
        y: topPosition,
        targetX: gameScreen.offsetWidth / 2 - 50,
    };

    enemies.push(enemy);
    gameScreen.appendChild(element);
}

function getRandomWord() {
    const currentWordList = wordLists[wave] || wordLists[Object.keys(wordLists).length];
    return currentWordList[Math.floor(Math.random() * currentWordList.length)];
}

function shootLaser(targetEnemy) {
    const laser = document.createElement('div');
    laser.classList.add('laser');
    
    const castleCenterX = gameScreen.offsetWidth / 2;
    const laserOriginBottom = 200; // From top of the new taller castle
    
    laser.style.left = `${castleCenterX - 4}px`;
    laser.style.bottom = `${laserOriginBottom}px`;
    
    gameScreen.appendChild(laser);

    // Calculate target position
    const targetX = targetEnemy.x + targetEnemy.element.offsetWidth / 2;
    const castleTopForCalc = gameScreen.offsetHeight - laserOriginBottom;

    requestAnimationFrame(() => {
        laser.style.transform = `translate(${targetX - castleCenterX}px, -${castleTopForCalc - targetEnemy.y}px) scale(1, 2)`;
        laser.style.backgroundColor = '#ff6b6b';
    });
    
    setTimeout(() => {
        if(gameScreen.contains(laser)) gameScreen.removeChild(laser);
    }, 200);
}

function gameLoop() {
    if (isGameOver) return;

    enemies.forEach((enemy, index) => {
        const direction = enemy.targetX > enemy.x ? 1 : -1;
        enemy.x += enemy.speed * direction;
        enemy.element.style.left = `${enemy.x}px`;

        if ((direction === 1 && enemy.x >= enemy.targetX) || (direction === -1 && enemy.x <= enemy.targetX + 100)) {
            gameScreen.removeChild(enemy.element);
            enemies.splice(index, 1);
            castleHP -= 10;
            if (castleHP < 0) castleHP = 0;
            
            document.querySelector('.castle').style.animation = 'shake 0.5s';
            setTimeout(() => document.querySelector('.castle').style.animation = '', 500);

            updateHUD();
            if (castleHP <= 0) {
                gameOver(false);
            }
            checkWaveCompletion();
        }
    });
}

function handleTyping(event) {
    const currentText = event.target.value;
    let enemyFound = false;

    for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i];
        if (enemy.word.startsWith(currentText)) {
            enemyFound = true;
            enemy.wordTag.innerHTML = `<span class="typed-char">${currentText}</span>${enemy.word.substring(currentText.length)}`;

            if (currentText === enemy.word) {
                shootLaser(enemy);
                score += enemy.word.length * 10;
                
                enemy.element.style.transition = 'transform 0.2s ease-out, opacity 0.2s ease-out';
                enemy.element.style.transform = 'scale(1.5)';
                enemy.element.style.opacity = '0';

                setTimeout(() => {
                   if(gameScreen.contains(enemy.element)) {
                       gameScreen.removeChild(enemy.element);
                   }
                }, 200);
                
                enemies.splice(i, 1);
                typingInput.value = '';
                
                updateHUD();
                checkWaveCompletion();
                break;
            }
        } else {
            enemy.wordTag.innerHTML = `<span>${enemy.word}</span>`;
        }
    }

    if (currentText.length > 0 && !enemyFound) {
        typingInput.style.backgroundColor = '#7f1d1d';
        setTimeout(() => typingInput.style.backgroundColor = '#2d3748', 200);
        typingInput.value = currentText.slice(0, -1);
    }
}

function checkWaveCompletion() {
    if (enemies.length === 0 && enemiesSpawnedThisWave >= enemiesPerWave[wave - 1] && waveInProgress) {
        waveInProgress = false;
        wave++;
        if (wave > Object.keys(wordLists).length) {
            gameOver(true); // Victory
        } else {
            setTimeout(startWave, 2000); // Pause before next wave
        }
    }
}

function gameOver(isVictory) {
    isGameOver = true;
    clearInterval(gameLoopInterval);
    clearInterval(enemySpawnInterval);
    typingInput.disabled = true;

    if (isVictory) {
        modalMessageEl.textContent = "VICTORY!";
        finalStatsEl.textContent = `You defended the skies! Final Score: ${score}`;
    } else {
        modalMessageEl.textContent = "GAME OVER";
        finalStatsEl.textContent = `The castle has fallen. Final Score: ${score}`;
    }

    modal.style.display = 'flex';
}

// Event Listeners
typingInput.addEventListener('input', handleTyping);
restartBtn.addEventListener('click', init);

// Initial Start
window.onload = init;
