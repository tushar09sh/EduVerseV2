const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const livesEl = document.getElementById('lives');
const bossCountEl = document.getElementById('boss-count');
const questionEl = document.getElementById('question');
const answersEl = document.getElementById('answers');
const modal = document.getElementById('modal');
const modalMessageEl = document.getElementById('modal-message');
const restartBtn = document.getElementById('restart-btn');
const quizArea = document.getElementById('quiz-area');

// --- Game State ---
let lives;
let currentBossIndex;
let player, boss;
let bullets = [];
let explosions = [];
let backgroundOffset = 0;


// --- Questions Database ---
const questions = [
    // Mini Boss 1
    { question: "3 + 8 = ?", answers: [11, 10, 12, 9], correct: 0 },
    // Mini Boss 2
    { question: "15 - 6 = ?", answers: [8, 9, 10, 7], correct: 1 },
    // Mini Boss 3
    { question: "7 x 4 = ?", answers: [28, 32, 21, 24], correct: 0 },
    // Mini Boss 4
    { question: "36 / 6 = ?", answers: [6, 7, 5, 8], correct: 0 },
    // Mini Boss 5
    { question: "9 x 9 = ?", answers: [81, 72, 80, 90], correct: 0 },
    // Final Boss
    { question: "12 x 11 = ?", answers: [121, 132, 122, 144], correct: 1 }
];

// --- Drawing Functions ---

function drawBackground() {
    // Sky
    ctx.fillStyle = '#68b0e8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Far hills (parallax layer 1)
    ctx.fillStyle = '#2c6f3b';
    const drawHill = (x, y, radius) => {
        ctx.beginPath();
        ctx.arc(x, y, radius, Math.PI, 0);
        ctx.fill();
    };
    let hillOffset = (backgroundOffset * 0.2) % 200;
    for (let i = -200; i < canvas.width + 200; i += 200) {
        drawHill(i + hillOffset, 380, 100);
    }

    // Closer trees (parallax layer 2)
    ctx.fillStyle = '#1e4d29';
    let treeOffset = (backgroundOffset * 0.5) % 150;
    for (let i = -150; i < canvas.width + 150; i += 150) {
        ctx.fillRect(i + treeOffset, 320, 20, 60); // Trunk
        ctx.beginPath();
        ctx.arc(i + 10 + treeOffset, 320, 30, 0, Math.PI * 2); // Leaves
        ctx.fill();
    }

    // Ground
    ctx.fillStyle = '#4a2e1f'; // Brown ground
    ctx.fillRect(0, 380, canvas.width, 20);

    // Move the background slowly for parallax effect
    backgroundOffset -= 0.5;
}

// Player Drawing
function drawPlayer(p) {
    ctx.fillStyle = '#ff4d4d'; // Red bandana
    ctx.fillRect(p.x + 5, p.y, 20, 10);
    ctx.fillStyle = '#ffc87c'; // Skin
    ctx.fillRect(p.x + 5, p.y + 10, 20, 15);
    ctx.fillStyle = '#0066cc'; // Blue shirt
    ctx.fillRect(p.x, p.y + 25, 30, 20);
    ctx.fillStyle = '#333333'; // Dark pants
    ctx.fillRect(p.x + 5, p.y + 45, 20, 15);
     // Gun
    ctx.fillStyle = '#4a4a4a';
    ctx.fillRect(p.x + 25, p.y + 28, 30, 8);
}

// Bosses Drawing
function drawBoss(b) {
    if (b.dead) return;
    // Common body parts
    ctx.fillStyle = b.colors.body;
    ctx.fillRect(b.x, b.y + 20, 60, 60);

    // Unique head for each boss
    ctx.fillStyle = b.colors.head;
    switch(b.type) {
        case 0: // Round head
            ctx.beginPath();
            ctx.arc(b.x + 30, b.y + 10, 15, 0, Math.PI * 2);
            ctx.fill();
            break;
        case 1: // Square head
            ctx.fillRect(b.x + 15, b.y, 30, 30);
            break;
        case 2: // Triangle head
            ctx.beginPath();
            ctx.moveTo(b.x + 30, b.y - 10);
            ctx.lineTo(b.x + 10, b.y + 20);
            ctx.lineTo(b.x + 50, b.y + 20);
            ctx.closePath();
            ctx.fill();
            break;
        case 3: // Two eyes
            ctx.fillRect(b.x + 10, b.y, 20, 20);
            ctx.fillRect(b.x + 30, b.y, 20, 20);
            break;
         case 4: // Horns
            ctx.fillRect(b.x + 15, b.y + 5, 30, 30);
            ctx.beginPath();
            ctx.moveTo(b.x + 15, b.y + 5);
            ctx.lineTo(b.x, b.y - 10);
            ctx.lineTo(b.x + 20, b.y + 5);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(b.x + 45, b.y + 5);
            ctx.lineTo(b.x + 60, b.y - 10);
            ctx.lineTo(b.x + 40, b.y + 5);
            ctx.fill();
            break;
        case 5: // Final Boss - Larger and more complex
            ctx.fillStyle = b.colors.body;
            ctx.fillRect(b.x - 10, b.y, b.width, b.height); // Big Body

            ctx.fillStyle = b.colors.head;
            ctx.beginPath();
            ctx.arc(b.x + (b.width/2) - 10 , b.y - 15, 40, 0, Math.PI * 2); // Big Head
            ctx.fill();

            // Angry Eyes
            ctx.fillStyle = 'yellow';
            // Left Eye
            ctx.save();
            ctx.translate(b.x + 25, b.y - 25);
            ctx.rotate(-0.2); // rotate for angry look
            ctx.fillRect(0, 0, 15, 8);
            ctx.restore();
            
            // Right Eye
            ctx.save();
            ctx.translate(b.x + 65, b.y - 35);
            ctx.rotate(0.2); // rotate for angry look
            ctx.fillRect(0, 0, 15, 8);
            ctx.restore();

            // Mouth
             ctx.strokeStyle = '#000000';
             ctx.lineWidth = 3;
             ctx.beginPath();
             ctx.arc(b.x + 45, b.y, 15, 0.2 * Math.PI, 0.8 * Math.PI); // Frown
             ctx.stroke();
            break;
    }
}

function getBossData(index) {
    const bossTypes = [
        { type: 0, colors: { head: '#4CAF50', body: '#3e8e41' } },
        { type: 1, colors: { head: '#2196F3', body: '#0b7dda' } },
        { type: 2, colors: { head: '#f44336', body: '#d32f2f' } },
        { type: 3, colors: { head: '#FFEB3B', body: '#FBC02D' } },
        { type: 4, colors: { head: '#9C27B0', body: '#7B1FA2' } },
        { type: 5, colors: { head: '#E91E63', body: '#C2185B' } }, // Final Boss
    ];
    const data = bossTypes[index];
    const isFinalBoss = index === 5;
    
    return {
        x: 680,
        y: isFinalBoss ? 240 : 300, // Adjusted Y to stand on ground
        width: isFinalBoss ? 100 : 60,
        height: isFinalBoss ? 120 : 80,
        dead: false,
        ...data,
    }
}

// --- Game Logic ---
function init() {
    lives = 3;
    currentBossIndex = 0;
    bullets = [];
    explosions = [];

    player = {
        x: 50,
        y: 320, // Player feet at 380
        width: 55,
        height: 60
    };

    boss = getBossData(currentBossIndex);

    modal.classList.add('hidden');
    quizArea.classList.remove('hidden');

    updateHUD();
    loadQuestion();
    gameLoop();
}

function loadQuestion() {
    if (currentBossIndex >= questions.length) {
        return;
    }
    const q = questions[currentBossIndex];
    questionEl.textContent = q.question;
    answersEl.innerHTML = '';
    
    const btnColors = ['bg-blue-600 border-blue-800', 'bg-green-600 border-green-800', 'bg-red-600 border-red-800', 'bg-yellow-600 border-yellow-800'];

    q.answers.forEach((answer, index) => {
        const button = document.createElement('button');
        button.textContent = answer;
        button.className = `p-4 text-white text-xl rounded-md answer-btn ${btnColors[index]}`;
        button.onclick = () => handleAnswer(index);
        answersEl.appendChild(button);
    });
}

function handleAnswer(selectedIndex) {
    const isCorrect = selectedIndex === questions[currentBossIndex].correct;

    if (isCorrect) {
        bullets.push({x: player.x + player.width - 5, y: player.y + 32, width: 15, height: 5 });
    } else {
        lives--;
        updateHUD();
        document.body.style.animation = 'shake 0.5s';
        setTimeout(() => document.body.style.animation = '', 500);

        if (lives <= 0) {
            gameOver();
        } else {
            loadQuestion(); 
        }
    }
}

function bossDefeated() {
    boss.dead = true;
    for (let i = 0; i < 30; i++) {
        explosions.push({
            x: boss.x + boss.width / 2,
            y: boss.y + boss.height / 2,
            dx: (Math.random() - 0.5) * 8,
            dy: (Math.random() - 0.5) * 8,
            radius: Math.random() * 5 + 2,
            alpha: 1
        });
    }

    setTimeout(() => {
        currentBossIndex++;
        if (currentBossIndex >= questions.length) {
            victory();
        } else {
            boss = getBossData(currentBossIndex);
            loadQuestion();
            updateHUD();
        }
    }, 1000); 
}

function gameOver() {
    modalMessageEl.innerHTML = "GAME OVER";
    modal.classList.remove('hidden');
    quizArea.classList.add('hidden');
}

function victory() {
    modalMessageEl.innerHTML = "YOU WIN!<br>MISSION COMPLETE!";
    modal.classList.remove('hidden');
    quizArea.classList.add('hidden');
}

function updateHUD() {
    livesEl.textContent = '★'.repeat(lives) + '☆'.repeat(3 - lives);
    bossCountEl.textContent = `${currentBossIndex + 1}/${questions.length}`;
}

// --- Animation Loop ---
function gameLoop() {
    drawBackground();

    // Draw game objects
    drawPlayer(player);
    drawBoss(boss);

    // Update and Draw Bullets
    bullets.forEach((bullet, index) => {
        bullet.x += 15; // Bullet speed
        ctx.fillStyle = 'yellow';
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);

        // Collision detection
        if (bullet.x > boss.x && !boss.dead) {
            bullets.splice(index, 1);
            bossDefeated();
        }

        if (bullet.x > canvas.width) {
            bullets.splice(index, 1);
        }
    });

    // Update and Draw Explosions
    explosions.forEach((p, index) => {
        p.x += p.dx;
        p.y += p.dy;
        p.alpha -= 0.03;

        if (p.alpha <= 0) {
            explosions.splice(index, 1);
        } else {
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = ['#ff0', '#f80', '#f00'][Math.floor(Math.random() * 3)];
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    });

    if (!modal.classList.contains('hidden')) {
        return; // Stop the loop if modal is shown
    }
    requestAnimationFrame(gameLoop);
}

// --- Responsive Scaling ---
function resizeGame() {
    const gameContainer = document.querySelector('.game-container');
    const wrapper = document.querySelector('#game-wrapper');

    // The game's fixed design dimensions
    const baseWidth = 800;
    const baseHeight = 620; // Approximate height of canvas + quiz area

    const screenWidth = wrapper.offsetWidth;
    const screenHeight = wrapper.offsetHeight;

    // Calculate the best scale to fit the game within the screen
    const scale = Math.min(screenWidth / baseWidth, screenHeight / baseHeight);

    // Apply the scale transformation
    if(gameContainer) {
        gameContainer.style.transform = `scale(${scale})`;
    }
}

// --- Event Listeners ---
restartBtn.addEventListener('click', init);
window.addEventListener('resize', resizeGame);
// Set initial size after everything is loaded
window.addEventListener('load', () => {
     // A tiny delay ensures all elements are rendered before scaling
    setTimeout(resizeGame, 50);
});


// Initial Start
init();
