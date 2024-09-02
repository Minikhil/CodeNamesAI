
const MY_API_KEY = process.env.MY_API_KEY;
//'sk-weeYv5J_XIVcW1qa9uuVOwZqjGqu12J_TyXpgK6pzkT3BlbkFJWmI6VBwdFcaXbjPnmWlJ_j_nSF45ODvExG52x2Jx0A';

let words = [];
        let gameState = {
            currentTeam: 'red',
            redCardsLeft: 9,
            blueCardsLeft: 8,
            cards: []
        };

async function generateWordsFromCategories(categories) {
    //const apiKey = 'sk-weeYv5J_XIVcW1qa9uuVOwZqjGqu12J_TyXpgK6pzkT3BlbkFJWmI6VBwdFcaXbjPnmWlJ_j_nSF45ODvExG52x2Jx0A'; // Replace with your actual API key
    const apiUrl = 'https://api.openai.com/v1/chat/completions';

    const prompt = `Generate 5 single words for each of the following categories, suitable for a game of Codenames. The words should be related to their category but not too obvious. Categories: ${categories.join(', ')}. Format the response as a JSON array of arrays, where each inner array represents a category.`;

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${MY_API_KEY}`
        },
        body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{"role": "user", "content": prompt}],
            temperature: 0.7
        })
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices[0].message.content.trim();

    // Check if content is wrapped in ```json and remove it
    if (content.startsWith("```json") && content.endsWith("```")) {
        content = content.slice(7, -3).trim(); // Remove ```json at the start and ``` at the end
    }

    console.log("Cleaned Response Content:", content);

    try {
        return JSON.parse(content);
    } catch (error) {
        console.error("Failed to parse JSON:", error);
        throw new Error("Invalid JSON response from API");
    }
}
        

// async function generateWordsFromCategories(categories) {
//     const apiKey = 'sk-weeYv5J_XIVcW1qa9uuVOwZqjGqu12J_TyXpgK6pzkT3BlbkFJWmI6VBwdFcaXbjPnmWlJ_j_nSF45ODvExG52x2Jx0A'; // Replace with your actual API key
//     const apiUrl = 'https://api.openai.com/v1/chat/completions';

//     const prompt = `Generate 5 single words for each of the following categories, suitable for a game of Codenames. The words should be related to their category but not too obvious. Categories: ${categories.join(', ')}. Format the response as a JSON array of arrays, where each inner array represents a category.`;

//     const response = await fetch(apiUrl, {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${apiKey}`
//         },
//         body: JSON.stringify({
//             model: "gpt-4o-mini",
//             messages: [{"role": "user", "content": prompt}],
//             temperature: 0.7
//         })
//     });

//     if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//     }

//     // const data = await response.json();
//     // console.log("Response: " + data)
//     // return JSON.parse(data.choices[0].message.content);
//     const data = await response.json();
//     const content = data.choices[0].message.content.trim();

//     console.log("Response Content:", content);

//     try {
//         return JSON.parse(content);
//     } catch (error) {
//         console.error("Failed to parse JSON:", error);
//         throw new Error("Invalid JSON response from API");
//     }
// }

async function handleGenerateWords() {
    const categories = [
        document.getElementById('category1').value,
        document.getElementById('category2').value,
        document.getElementById('category3').value,
        document.getElementById('category4').value,
        document.getElementById('category5').value
    ].filter(cat => cat.trim() !== '');
    
    if (categories.length !== 5) {
        alert('Please enter all 5 categories.');
        return;
    }

    const loadingIndicator = document.getElementById('loading-indicator');
    loadingIndicator.style.display = 'block';

    try {
        words = await generateWordsFromCategories(categories);
        words = words.flat(); // Flatten the array of arrays
        createBoard();
    } catch (error) {
        console.error('Error generating words:', error);
        alert('There was an error generating words. Please try again.');
    } finally {
        loadingIndicator.style.display = 'none';
    }
}

function createBoard() {
    const gameBoard = document.querySelector('.game-board');
    gameBoard.innerHTML = '';
    gameState.cards = [];
    gameState.redCardsLeft = 9;
    gameState.blueCardsLeft = 8;
    gameState.currentTeam = 'red';
    updateTurnIndicator();

    const shuffledWords = shuffleArray(words).slice(0, 25);
    const cardTypes = shuffleArray(['red', 'red', 'red', 'red', 'red', 'red', 'red', 'red', 'red',
                                    'blue', 'blue', 'blue', 'blue', 'blue', 'blue', 'blue', 'blue',
                                    'neutral', 'neutral', 'neutral', 'neutral', 'neutral', 'neutral', 'neutral',
                                    'assassin']);

    for (let i = 0; i < 25; i++) {
        const card = document.createElement('div');
        card.classList.add('card');
        card.textContent = shuffledWords[i];
        card.dataset.type = cardTypes[i];
        card.addEventListener('click', () => revealCard(card));
        gameBoard.appendChild(card);
        gameState.cards.push(card);
    }

    updateSpymasterView();
}

function revealCard(card) {
    if (card.classList.contains('revealed')) return;
    
    card.classList.add('revealed');
    card.classList.add(card.dataset.type);

    if (card.dataset.type === 'assassin') {
        endGame(gameState.currentTeam === 'red' ? 'blue' : 'red');
    } else if (card.dataset.type === 'red') {
        gameState.redCardsLeft--;
        if (gameState.redCardsLeft === 0) endGame('red');
        if (gameState.currentTeam === 'blue') endTurn();
    } else if (card.dataset.type === 'blue') {
        gameState.blueCardsLeft--;
        if (gameState.blueCardsLeft === 0) endGame('blue');
        if (gameState.currentTeam === 'red') endTurn();
    } else {
        endTurn();
    }
}

function endTurn() {
    gameState.currentTeam = gameState.currentTeam === 'red' ? 'blue' : 'red';
    updateTurnIndicator();
}

function endGame(winner) {
    alert(`${winner.charAt(0).toUpperCase() + winner.slice(1)} team wins!`);
    createBoard();
}

function updateTurnIndicator() {
    document.querySelector('.turn-indicator').textContent = `${gameState.currentTeam.charAt(0).toUpperCase() + gameState.currentTeam.slice(1)} Team's Turn`;
}

function updateSpymasterView() {
    const isSpymaster = document.getElementById('spymaster-view').checked;
    gameState.cards.forEach(card => {
        if (isSpymaster) {
            card.classList.add(card.dataset.type);
        } else {
            card.classList.remove('red', 'blue', 'neutral', 'assassin');
        }
    });
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

document.getElementById('generate-words').addEventListener('click', handleGenerateWords);
document.getElementById('new-game').addEventListener('click', createBoard);
document.getElementById('end-turn').addEventListener('click', endTurn);
document.getElementById('spymaster-view').addEventListener('change', updateSpymasterView);