// --- DOM Elements ---
const gameBoard = document.getElementById('game-board');
const movesEl = document.getElementById('moves');
const timeEl = document.getElementById('time');
const modal = document.getElementById('modal');
const modalStats = document.getElementById('modal-stats');
const modalBtn = document.getElementById('modal-btn');

// --- Game Settings & State ---
const planets = ['🌍', '🪐', '🚀', '⭐', '🌕', '☀️', '☄️', '🛰️'];
let cards = [];
let flippedCards = [];
let matchedPairs = 0;
let moves = 0;
let timer = 0;
let timerInterval = null;
let canFlip = true;

// --- Game Logic ---

// Create and shuffle the deck
function createDeck() {
    const cardPairs = [...planets, ...planets];
    shuffle(cardPairs);
    return cardPairs;
}

// Fisher-Yates Shuffle Algorithm
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Build the game board
function buildBoard() {
    gameBoard.innerHTML = '';
    cards.forEach(planet => {
        const cardElement = document.createElement('div');
        cardElement.classList.add('card');
        cardElement.dataset.planet = planet;

        cardElement.innerHTML = `
            <div class="card-face card-back">?</div>
            <div class="card-face card-front">${planet}</div>
        `;

        cardElement.addEventListener('click', handleCardClick);
        gameBoard.appendChild(cardElement);
    });
}

// Handle clicking on a card
function handleCardClick(event) {
    if (!canFlip) return;
    const clickedCard = event.currentTarget;

    // Prevent clicking the same card twice or a matched card
    if (clickedCard.classList.contains('flipped') || clickedCard.classList.contains('matched')) {
        return;
    }

    flipCard(clickedCard);

    if (flippedCards.length === 2) {
        canFlip = false; // Disable flipping while checking
        incrementMoves();
        checkForMatch();
    }
}

// Flip a card
function flipCard(card) {
    card.classList.add('flipped');
    flippedCards.push(card);
}

// Check if the two flipped cards match
function checkForMatch() {
    const [card1, card2] = flippedCards;
    if (card1.dataset.planet === card2.dataset.planet) {
        // It's a match!
        card1.classList.add('matched');
        card2.classList.add('matched');
        matchedPairs++;
        flippedCards = [];
        canFlip = true;
        checkForWin();
    } else {
        // Not a match, flip back after a delay
        setTimeout(() => {
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
            flippedCards = [];
            canFlip = true;
        }, 1000);
    }
}

// Check if the game is won
function checkForWin() {
    if (matchedPairs === planets.length) {
        clearInterval(timerInterval);
        modalStats.textContent = `You found all pairs in ${timer} seconds with ${moves} moves!`;
        modal.classList.remove('hidden');
    }
}

// --- HUD & Timer ---
function incrementMoves() {
    moves++;
    movesEl.textContent = moves;
}

function startTimer() {
    timerInterval = setInterval(() => {
        timer++;
        timeEl.textContent = timer;
    }, 1000);
}

// --- Initialization ---
function init() {
    // Reset state
    flippedCards = [];
    matchedPairs = 0;
    moves = 0;
    timer = 0;
    canFlip = true;
    if (timerInterval) clearInterval(timerInterval);
    
    // Update HUD
    movesEl.textContent = moves;
    timeEl.textContent = timer;
    modal.classList.add('hidden');

    // Setup game
    cards = createDeck();
    buildBoard();
    startTimer();
}

// Event Listeners
modalBtn.addEventListener('click', init);

// Initial start
init();
