function buildShuffledDeck() {
    const suits = ['clubs', 'diamonds', 'hearts', 'spades'];
    let deck = [];
    for (let rank = 1; rank <= 13; rank++) {
        for (let suit of suits) {
            deck.push({ rank, suit });
        }
    }
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

function getCardImageFilename(card) {
    let rank = card.rank;
    if (rank === 1) rank = 'ace';
    else if (rank === 11) rank = 'jack';
    else if (rank === 12) rank = 'queen';
    else if (rank === 13) rank = 'king';
    if (rank === 'jack' || rank === 'queen' || rank === 'king') {
        return `Playing Cards/PNG-cards-1.3/${rank}_of_${card.suit}2.png`;
    }
    return `Playing Cards/PNG-cards-1.3/${rank}_of_${card.suit}.png`;
}

const FACE_CARDS = {
    1: 'A',
    11: 'J',
    12: 'Q',
    13: 'K'
};
const CARDS_PER_RANK = 4;

let deck, player1, player2, pile, running, currentPlayer, interval;
let mode = 'pvp'; // 'pvp' or 'pvc'

function cardToString(card) {
    return FACE_CARDS[card.rank] || card.rank.toString();
}

function isJack(card) {
    return card.rank === 11;
}
function isDouble() {
    return pile.length >= 2 && pile[pile.length - 1].rank === pile[pile.length - 2].rank;
}
function isSandwich() {
    return pile.length >= 3 && pile[pile.length - 1].rank === pile[pile.length - 3].rank;
}
function isTopBottom() {
    return pile.length >= 2 && pile[0].rank === pile[pile.length - 1].rank;
}
function canSlap() {
    return (
        pile.length > 0 &&
        (
            isJack(pile[pile.length - 1]) ||
            isDouble() ||
            isSandwich() ||
            isTopBottom()
        )
    );
}

function printStatus() {
    document.getElementById('p1').textContent = `Player 1 (A): ${player1.length} cards`;
    document.getElementById('p2').textContent = `Player 2 (L): ${player2.length} cards`;
}
function showPileStack() {
    const pileStack = document.getElementById('pile-stack');
    pileStack.innerHTML = '';
    // Show up to the last 7 cards for visibility
    const show = pile.slice(-7);
    for (let i = 0; i < show.length; i++) {
        const card = show[i];
        const img = document.createElement('img');
        img.src = getCardImageFilename(card);
        img.alt = cardToString(card);
        img.className = 'pile-card-img';
        // Use stored position/rotation for slight offset
        img.style.left = `${card.left}px`;
        img.style.top = `${card.top}px`;
        img.style.transform = `rotate(${card.rotate}deg)`;
        img.style.zIndex = i + 1;
        pileStack.appendChild(img);
    }
}

// When adding a card to the pile, assign its position/rotation to be slightly offset for realism
function pushToPile(card, index) {
    if (card.left === undefined) {
        // Keep all cards in the same position
        card.left = 5;
        card.top = 5;
        card.rotate = (Math.random() - 0.5) * 20; // Only rotate
    }
    pile.push(card);
}

let lastCardTime = null; // Add this at the top with your other variables

function nextCard() {
    if (!running) return;
    if (player1.length === 0 && player2.length === 0) {
        document.getElementById('message').textContent = 'Both players are out of cards! Game over.';
        clearInterval(interval);
        showPileStack();
        return;
    }
    if (player1.length === 0) {
        document.getElementById('message').textContent = mode === 'pvc' ? 'Computer wins!' : 'Player 2 wins!';
        clearInterval(interval);
        showPileStack();
        return;
    }
    if (player2.length === 0) {
        document.getElementById('message').textContent = 'Player 1 wins!';
        clearInterval(interval);
        showPileStack();
        return;
    }

    let card;
    if (currentPlayer === 1) {
        card = player1.shift();
        currentPlayer = 2;
    } else {
        card = player2.shift();
        currentPlayer = 1;
    }
    pushToPile(card, pile.length);
    printStatus();
    showPileStack();
    lastCardTime = Date.now();

    // Bot tries to slap if it's their turn
    if (isBotTurn()) {
        botTrySlap();
    }
}

function isBotTurn() {
    return mode === 'pvc' && currentPlayer === 2;
}

function botTrySlap() {
    if (canSlap() && running) {
        setTimeout(() => {
            if (running && canSlap()) handleSlap(2, true);
        }, 300 + Math.floor(Math.random() * 101)); // 300-400ms
    }
}

function handleSlap(player, isBot) {
    if (!running) return;
    clearInterval(interval);
    running = false;
    const msg = document.getElementById('message');
    msg.classList.remove('msg-correct', 'msg-mistap');
    const nextBtn = document.getElementById('next-round');
    if (canSlap()) {
        let reaction = lastCardTime ? (Date.now() - lastCardTime) : null;
        let reactionText = reaction !== null ? ` (${reaction} ms!)` : '';
        msg.textContent = `TAP! ${player === 2 && mode === 'pvc' ? 'Computer' : 'Player ' + player}${isBot ? ' (BOT)' : ''} wins the pile!${reactionText}`;
        msg.classList.add('msg-correct');
        if (player === 1) {
            player1 = player1.concat(pile);
        } else {
            player2 = player2.concat(pile);
        }
        pile = [];
        printStatus();
        showPileStack();
        setTimeout(() => {
            msg.textContent = '';
            msg.classList.remove('msg-correct');
            running = true;
            if (interval) clearInterval(interval);
            interval = setInterval(nextCard, 1000);
        }, 1200);
        nextBtn.style.display = 'none';
    } else {
        msg.textContent = `Mistap! ${player === 2 && mode === 'pvc' ? 'Computer' : 'Player ' + player}${isBot ? ' (BOT)' : ''} loses a card!`;
        msg.classList.add('msg-mistap');
        let burnedCard = null;
        if (player === 1 && player1.length > 0) {
            burnedCard = player1.shift();
        } else if (player === 2 && player2.length > 0) {
            burnedCard = player2.shift();
        }
        if (burnedCard) {
            // Animate pile up
            const pileStack = document.getElementById('pile-stack');
            pileStack.classList.add('pile-stack-animate');
            // Create burn card image
            const burnImg = document.createElement('img');
            burnImg.src = getCardImageFilename(burnedCard);
            burnImg.alt = cardToString(burnedCard);
            burnImg.className = 'pile-card-img burn-card-animate';
            pileStack.parentNode.appendChild(burnImg);

            setTimeout(() => {
                // Move burn card to bottom visually
                burnImg.style.top = '110px'; // below the pile
                setTimeout(() => {
                    pileStack.classList.remove('pile-stack-animate');
                    pileStack.classList.add('pile-stack-reset');
                    // Actually add burn card to bottom
                    pushToPile(burnedCard, 0);
                    // Move the last card (just added) to the front (bottom)
                    pile.unshift(pile.pop());
                    showPileStack();
                    burnImg.remove();
                    setTimeout(() => {
                        pileStack.classList.remove('pile-stack-reset');
                    }, 500);
                }, 500);
            }, 500);
        } else {
            printStatus();
            showPileStack();
        }
        nextBtn.style.display = 'none';
        setTimeout(() => {
            msg.textContent = '';
            msg.classList.remove('msg-mistap');
            running = true;
            if (interval) clearInterval(interval);
            interval = setInterval(nextCard, 1000);
        }, 1700);
    }
}

function startGame() {
    deck = buildShuffledDeck();
    player1 = deck.slice(0, 26);
    player2 = deck.slice(26);
    pile = [];
    running = false;
    currentPlayer = 1;
    printStatus();
    showPileStack();
    if (interval) clearInterval(interval);
    const nextBtn = document.getElementById('next-round');
    nextBtn.style.display = '';
    nextBtn.textContent = 'Start Game';
    nextBtn.onclick = () => {
        document.getElementById('message').textContent = '';
        nextBtn.style.display = 'none';
        running = true;
        if (interval) clearInterval(interval);
        interval = setInterval(nextCard, 1000);
    };
}

window.onload = function () {
    document.getElementById('restart').onclick = startGame;
    const modeSelect = document.getElementById('mode-select');
    if (modeSelect) {
        modeSelect.onchange = function () {
            mode = modeSelect.value;
            startGame();
            // Update instructions
            const instr = document.getElementById('instructions-text');
            if (mode === 'pvc') {
                instr.innerHTML = 'Press <b>A</b> to slap. Try to beat the computer!<br>Slap on Jacks, doubles, sandwiches, or top-bottom matches!';
            } else {
                instr.innerHTML = 'Press <b>A</b> for Player 1 slap, <b>L</b> for Player 2 slap.<br>Slap on Jacks, doubles, sandwiches, or top-bottom matches!';
            }
        };
        mode = modeSelect.value;
    }
    document.addEventListener('keydown', (e) => {
        if (mode === 'pvc') {
            if (e.key.toLowerCase() === 'a') handleSlap(1);
        } else {
            if (e.key.toLowerCase() === 'a') handleSlap(1);
            if (e.key.toLowerCase() === 'l') handleSlap(2);
        }
    });
    startGame();
};