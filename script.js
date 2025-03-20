// DOM elements
const paragraphInput = document.getElementById('paragraph-input');
const submitParagraphBtn = document.getElementById('submit-paragraph');
const paragraphInputSection = document.getElementById('paragraph-input-section');
const paragraphDisplaySection = document.getElementById('paragraph-display-section');
const paragraphDisplay = document.getElementById('paragraph-display');
const editParagraphBtn = document.getElementById('edit-paragraph');
const chatContainer = document.getElementById('chat-container');
const chatMessages = document.getElementById('chat-messages');
const questionInput = document.getElementById('question-input');
const sendQuestionBtn = document.getElementById('send-question');
const loadingStatus = document.getElementById('loading-status');
const modelStatus = document.getElementById('model-status');
const notification = document.getElementById('notification');

// State variables
let paragraph = '';
let model = null;

// Show notification
function showNotification(message, duration = 3000) {
    notification.textContent = message;
    notification.classList.add('show');

    setTimeout(() => {
        notification.classList.remove('show');
    }, duration);
}

// Initialize the TensorFlow QnA model
async function loadModel() {
    try {
        modelStatus.textContent = 'Model: Loading...';
        modelStatus.className = 'status loading';

        model = await qna.load();

        modelStatus.textContent = 'Model: Ready';
        modelStatus.className = 'status ready';

        questionInput.disabled = false;
        sendQuestionBtn.disabled = false;
        showNotification('QnA model loaded successfully!');
    } catch (error) {
        console.error('Error loading model:', error);
        modelStatus.textContent = 'Model: Failed to Load';
        modelStatus.className = 'status inactive';

        addMessage('Sorry, there was an error loading the QnA model. Please refresh and try again.', 'ai');
        showNotification('Error loading model. Please try again.', 5000);
    }
}

// Handle paragraph submission
submitParagraphBtn.addEventListener('click', () => {
    paragraph = paragraphInput.value.trim();

    if (paragraph.length < 20) {
        showNotification('Please enter a longer paragraph (at least 20 characters).');
        return;
    }

    // Display the paragraph
    paragraphDisplay.textContent = paragraph;
    paragraphInputSection.classList.add('hidden');
    paragraphDisplaySection.classList.remove('hidden');
    chatContainer.classList.remove('hidden');

    // Load the model if not already loaded
    if (!model) {
        loadModel();
    } else {
        questionInput.disabled = false;
        sendQuestionBtn.disabled = false;
    }

    // Add first message
    chatMessages.innerHTML = ''; // Clear welcome message
    addMessage('Hi there! Ask me questions about the paragraph you provided.', 'ai');
});

// Handle edit paragraph button
editParagraphBtn.addEventListener('click', () => {
    paragraphInputSection.classList.remove('hidden');
    paragraphDisplaySection.classList.add('hidden');

    // Disable question input while editing
    questionInput.disabled = true;
    sendQuestionBtn.disabled = true;
});

// Add a message to the chat
function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message-bubble ${sender}`;
    messageDiv.textContent = text;
    chatMessages.appendChild(messageDiv);

    // Scroll to the bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Handle sending a question
async function sendQuestion() {
    const question = questionInput.value.trim();

    if (question.length === 0) return;

    // Add the question to the chat
    addMessage(question, 'user');

    // Clear the input
    questionInput.value = '';

    // Disable input while processing
    questionInput.disabled = true;
    sendQuestionBtn.disabled = true;
    loadingStatus.classList.remove('hidden');

    try {
        // Get answer from the model
        const answers = await model.findAnswers(question, paragraph);

        // Process the answer
        if (answers && answers.length > 0) {
            // Sort by score and get the best answer
            answers.sort((a, b) => b.score - a.score);
            const bestAnswer = answers[0];

            if (bestAnswer.score > 0.01) {
                addMessage(bestAnswer.text, 'ai');
            } else {
                addMessage("I couldn't find a specific answer to that question in the paragraph. Could you try rephrasing?", 'ai');
            }
        } else {
            addMessage("I couldn't find an answer to that in the paragraph. Try asking something else?", 'ai');
        }
    } catch (error) {
        console.error('Error getting answer:', error);
        addMessage('Sorry, there was an error processing your question. Please try again.', 'ai');
    } finally {
        // Re-enable input
        questionInput.disabled = false;
        sendQuestionBtn.disabled = false;
        loadingStatus.classList.add('hidden');
        questionInput.focus();
    }
}

// Event listeners for sending questions
sendQuestionBtn.addEventListener('click', sendQuestion);
questionInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendQuestion();
    }
});
