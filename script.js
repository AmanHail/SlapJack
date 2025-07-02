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
    const baseLeft = 30;
    const baseTop = 20;
    for (let i = 0; i < show.length; i++) {
        const card = show[i];
        const img = document.createElement('img');
        img.src = getCardImageFilename(card);
        img.alt = cardToString(card);
        img.className = 'pile-card-img';
        if (i < show.length - 1) {
            img.style.left = `${baseLeft + i * 8}px`;
            img.style.top = `${baseTop + i * 4}px`;
            img.style.transform = `rotate(-4deg)`;
        } else {
            // Top card: random position and rotation for flair
            const left = baseLeft + (Math.random() - 0.5) * 30 + i * 8;
            const top = baseTop + (Math.random() - 0.5) * 12 + i * 4;
            const rotate = (Math.random() - 0.5) * 18;
            img.style.left = `${left}px`;
            img.style.top = `${top}px`;
            img.style.transform = `rotate(${rotate}deg)`;
        }
        img.style.zIndex = i + 1;
        pileStack.appendChild(img);
    }
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
        document.getElementById('message').textContent = 'Player 2 wins!';
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
    pile.push(card);
    printStatus();
    showPileStack();
    lastCardTime = Date.now(); // Record the time the card was played
}

function handleSlap(player) {
    if (!running) return;

    clearInterval(interval);
    running = false;

    const msg = document.getElementById('message');
    msg.classList.remove('msg-correct', 'msg-mistap');

    if (canSlap()) {
        // Calculate reaction time
        let reaction = lastCardTime ? (Date.now() - lastCardTime) : null;
        let reactionText = reaction !== null ? ` (${reaction} ms!)` : '';
        msg.textContent = `TAP! Player ${player} wins the pile!${reactionText}`;
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
        }, 1800);
    } else {
        msg.textContent = `Mistap! Player ${player} loses a card!`;
        msg.classList.add('msg-mistap');
        let burnedCard = null;
        if (player === 1 && player1.length > 0) {
            burnedCard = player1.shift();
        } else if (player === 2 && player2.length > 0) {
            burnedCard = player2.shift();
        }
        if (burnedCard) {
            if (pile.length >= 1) {
                pile.splice(pile.length - 1, 0, burnedCard);
            } else {
                pile.push(burnedCard);
            }
        }
        printStatus();
        showPileStack();
        setTimeout(() => {
            msg.textContent = '';
            msg.classList.remove('msg-mistap');
            running = true;
            if (interval) clearInterval(interval);
            interval = setInterval(nextCard, 1000);
        }, 1800);
    }
}

function startGame() {
    deck = buildShuffledDeck();
    player1 = deck.slice(0, 26);
    player2 = deck.slice(26);
    pile = [];
    running = false; // Don't start running yet!
    currentPlayer = 1;
    printStatus();
    showPileStack();
    if (interval) clearInterval(interval);

    // Show the next round button to start the game
    const nextBtn = document.getElementById('next-round');
    nextBtn.style.display = '';
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
    document.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 'a') handleSlap(1);
        if (e.key.toLowerCase() === 'l') handleSlap(2);
    });
    startGame();
};