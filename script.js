// script.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";

class ChatInterface {
    constructor() {
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.newChatButton = document.getElementById('newChatButton');
        this.chatHistoryList = document.getElementById('chatHistoryList');
        this.sidebarToggle = document.getElementById('sidebarToggle');
        this.sidebar = document.querySelector('.sidebar');
        this.botsPanel = document.getElementById('botsPanel');
        this.botsGrid = document.getElementById('botsGrid');
        this.botsToggle = document.getElementById('botsToggle');
        this.compareToggle = document.getElementById('compareToggle');
        this.compareContainer = document.getElementById('compareContainer');
        this.compareResponses = document.getElementById('compareResponses');
        this.chatTitle = document.getElementById('chatTitle');
        this.carouselTrack = document.getElementById('carouselTrack');
        this.carouselPrev = document.getElementById('carouselPrev');
        this.carouselNext = document.getElementById('carouselNext');
        this.authButtons = document.getElementById('authButtons');
        this.authModal = document.getElementById('authModal');
        this.modalTitle = document.getElementById('modalTitle');
        this.modalEmail = document.getElementById('modalEmail');
        this.modalPassword = document.getElementById('modalPassword');
        this.modalSubmit = document.getElementById('modalSubmit');
        this.modalClose = document.getElementById('modalClose');
        this.toggleModalAuth = document.getElementById('toggleModalAuth');
        this.logoutBtn = document.querySelector('.logout-btn');

        this.currentChatId = null;
        this.chatHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];
        this.selectedBots = [];
        this.compareMode = false;
        this.messages = [];

        this.aiModels = {
            "gpt-4": { name: "GPT-4", icon: "🤖", description: "Advanced reasoning and analysis", responses: ["Sure, how can I help you?", "Let me look that up for you.", "That’s a great question!"] },
            "claude": { name: "Claude", icon: "🧠", description: "Helpful and balanced responses", responses: ["I’d be happy to assist!", "How can I support you today?", "Let’s solve this together."] },
            "gemini": { name: "Gemini", icon: "✨", description: "Creative and innovative thinking", responses: ["Here’s a creative take!", "Imagination is key. Let me think...", "Let’s explore that idea."] },
            "perplexity": { name: "Perplexity", icon: "📚", description: "Real-time web information", responses: ["Here's what I found.", "Fetching info from the web...", "Let me provide the most recent data."] },
            "copilot": { name: "Copilot", icon: "👨‍💻", description: "Your coding partner", responses: ["Let’s code it out!", "Try this snippet.", "Here’s a quick fix."] },
            "bard": { name: "Bard", icon: "🎤", description: "Google's creative assistant", responses: ["Let’s get poetic.", "Here’s a story you might enjoy.", "Creating something special…"] },
            "llama": { name: "LLaMA", icon: "🦙", description: "Meta's open model", responses: ["Analyzing from my knowledge base.", "That’s interesting!", "Let’s dive in."] },
            "mistral": { name: "Mistral", icon: "🐉", description: "Lightweight performant AI", responses: ["Fast and efficient — here’s your answer.", "No delays, just solutions.", "Responding swiftly."] }
        };

        this.faqs = [];
        fetch('python_faq.json')
            .then(res => res.json())
            .then(data => { this.faqs = data; });

        // Firebase Initialization
         const firebaseConfig = {
    apiKey: "AIzaSyDy7fz3i5qVNDgAaAj7E4RvGpjJbglixMA",
    authDomain: "prudenceai-4046f.firebaseapp.com",
    databaseURL: "https://prudenceai-4046f-default-rtdb.firebaseio.com",
    projectId: "prudenceai-4046f",
    storageBucket: "prudenceai-4046f.firebasestorage.app",
    messagingSenderId: "896774332544",
    appId: "1:896774332544:web:eaf6d39a7d0a24e5cf0665"
  };
        this.app = initializeApp(firebaseConfig);
        this.auth = getAuth(this.app);
        this.database = getDatabase(this.app);

        this.initializeEventListeners();
        this.initializeCarousel();
        this.renderChatHistory();
        this.startNewChat();
        this.updateBotSelection();
        this.checkAuthState();
    }

    // Authentication Methods
    checkAuthState() {
        onAuthStateChanged(this.auth, (user) => {
            if (user) {
                this.authButtons.querySelector('.login-btn').style.display = 'none';
                this.authButtons.querySelector('.signup-btn').style.display = 'none';
                this.authButtons.querySelector('.logout-btn').style.display = 'block';
                this.showChatArea();
            } else {
                this.authButtons.querySelector('.login-btn').style.display = 'block';
                this.authButtons.querySelector('.signup-btn').style.display = 'block';
                this.authButtons.querySelector('.logout-btn').style.display = 'none';
                this.hideChatArea();
            }
        });
    }

    showAuthModal(isLogin = true) {
        this.authModal.style.display = 'block';
        this.modalTitle.textContent = isLogin ? 'Login' : 'Sign Up';
        this.modalSubmit.textContent = isLogin ? 'Login' : 'Sign Up';
    }

    hideAuthModal() {
        this.authModal.style.display = 'none';
        this.modalEmail.value = '';
        this.modalPassword.value = '';
    }

    loginUser(email, password) {
        signInWithEmailAndPassword(this.auth, email, password)
            .then((userCredential) => {
                console.log("User signed in with UID:", userCredential.user.uid);
                alert("Login successful!");
                this.hideAuthModal();
            })
            .catch((error) => {
                console.error("Error signing in:", error.code, error.message);
            });
    }

    signUpUser(email, password) {
        createUserWithEmailAndPassword(this.auth, email, password)
            .then((userCredential) => {
                const userId = userCredential.user.uid;
                set(ref(this.database, 'users/' + userId), { email: email })
                    .then(() => {
                        console.log("User signed up and data saved with UID:", userId);
                        alert("Signup successful!");
                        // Auto-login after sign-up
                        return signInWithEmailAndPassword(this.auth, email, password);
                    })
                    .then(() => {
                        this.hideAuthModal();
                    })
                    .catch((error) => {
                        console.error("Error saving data or signing in:", error.message);
                    });
            })
            .catch((error) => {
                console.error("Error signing up:", error.code, error.message);
            });
    }

    logoutUser() {
        signOut(this.auth)
            .then(() => {
                console.log("User signed out");
                alert("Logout successful!");
                this.startNewChat(); // Reset chat state
            })
            .catch((error) => {
                console.error("Error signing out:", error.message);
            });
    }

    // Existing Methods (with minor adjustments)
    getFaqAnswer(message) {
        const clean = (txt) => txt.toLowerCase().replace(/[?.!]/g, '').trim();
        const userText = clean(message);
        let result = this.faqs.find(faq => clean(faq.question) === userText);

        if (!result) {
            result = this.faqs.find(faq => clean(faq.question).includes(userText));
        }

        return result ? result.answer : null;
    }

    formatAnswer(text) {
        return text
            .replace(/```python([\s\S]*?)```/g, '<pre><code class="language-python">$1</code></pre>')
            .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
            .replace(/\n/g, '<br>');
    }

    initializeEventListeners() {
        if (this.sendButton) {
            this.sendButton.addEventListener('click', () => this.sendMessage());
        }
        if (this.messageInput) {
            this.messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.sendMessage();
            });
        }
        if (this.newChatButton) {
            this.newChatButton.addEventListener('click', () => this.startNewChat());
        }
        if (this.sidebarToggle) {
            this.sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        }
        if (this.botsToggle) {
            this.botsToggle.addEventListener('click', () => this.toggleBotsPanel());
        }
        if (this.compareToggle) {
            this.compareToggle.addEventListener('click', () => this.toggleCompareMode());
        }

        if (this.botsGrid) {
            this.botsGrid.addEventListener('click', (e) => {
                e.preventDefault();
                alert("Please select models using the bottom Quick Select AI section.");
            });
        }

        const closeBots = document.querySelector('.close-bots');
        if (closeBots) {
            closeBots.addEventListener('click', () => {
                if (this.botsPanel) this.botsPanel.classList.remove('active');
                if (this.botsToggle) this.botsToggle.classList.remove('active');
            });
        }

        if (this.carouselPrev) {
            this.carouselPrev.addEventListener('click', () => this.scrollCarousel('prev'));
        }
        if (this.carouselNext) {
            this.carouselNext.addEventListener('click', () => this.scrollCarousel('next'));
        }

        document.querySelector('.login-btn').addEventListener('click', () => this.showAuthModal(true));
        document.querySelector('.signup-btn').addEventListener('click', () => this.showAuthModal(false));
        this.modalSubmit.addEventListener('click', () => {
            const email = this.modalEmail.value.trim();
            const password = this.modalPassword.value.trim();
            if (!email || !password) {
                alert("Email and password are required");
                return;
            }
            if (this.modalTitle.textContent === 'Login') {
                this.loginUser(email, password);
            } else {
                this.signUpUser(email, password);
            }
        });
        this.modalClose.addEventListener('click', () => this.hideAuthModal());
        this.toggleModalAuth.addEventListener('click', () => this.showAuthModal(this.modalTitle.textContent === 'Sign Up'));
        this.logoutBtn.addEventListener('click', () => this.logoutUser());

        document.addEventListener('click', (e) => {
            if (this.botsPanel && this.botsToggle && 
                !this.botsPanel.contains(e.target) && !this.botsToggle.contains(e.target)) {
                this.botsPanel.classList.remove('active');
                this.botsToggle.classList.remove('active');
            }
        });
    }

    toggleSidebar() {
        if (this.sidebar) this.sidebar.classList.toggle('active');
    }

    toggleBotsPanel() {
        if (this.botsPanel) this.botsPanel.classList.toggle('active');
        if (this.botsToggle) this.botsToggle.classList.toggle('active');
    }

    toggleCompareMode() {
        this.compareMode = !this.compareMode;
        if (this.compareToggle) this.compareToggle.classList.toggle('active', this.compareMode);
        if (this.compareContainer) this.compareContainer.classList.toggle('active', this.compareMode);

        if (this.compareMode && this.selectedBots.length < 2) {
            this.selectedBots = ['gpt-4', 'claude'];
        }

        this.updateBotSelection();
    }

    toggleBotSelection(botId) {
        if (!this.compareMode) {
            this.selectedBots = [botId];
        } else {
            if (this.selectedBots.includes(botId)) {
                this.selectedBots = this.selectedBots.filter(id => id !== botId);
            } else if (this.selectedBots.length < 3) {
                this.selectedBots.push(botId);
            }
        }

        this.updateBotSelection();
        this.updateCarouselSelection();

        const botsPanelVisible = this.botsPanel?.classList.contains("active");
        if (botsPanelVisible) {
            this.botsPanel.classList.remove("active");
            this.botsToggle?.classList.remove("active");
        }
    }

    updateBotSelection() {
        const limitReached = this.selectedBots.length >= 3;

        const botsGrid = document.getElementById('botsGrid');
        if (botsGrid) {
            botsGrid.innerHTML = '';
            this.selectedBots.forEach(botId => {
                const model = this.aiModels[botId];
                if (!model) return;

                const card = document.createElement('div');
                card.className = 'bot-card selected';
                card.dataset.bot = botId;
                card.innerHTML = `
                    <div class="bot-icon">${model.icon}</div>
                    <div class="bot-name">${model.name}</div>
                    <div class="bot-description">${model.description}</div>
                `;
                botsGrid.appendChild(card);
            });

            if (this.selectedBots.length === 0) {
                botsGrid.innerHTML = `<p style="padding: 1rem; color: #999;">No AI models selected. Choose from below.</p>`;
            }
        }

        if (this.carouselTrack) {
            const cards = this.carouselTrack.querySelectorAll('.carousel-bot-card');
            cards.forEach(card => {
                const selected = this.selectedBots.includes(card.dataset.bot);
                card.classList.toggle('selected', selected);
                card.classList.toggle('disabled', limitReached && !selected);
            });
        }
    }

    startNewChat() {
        this.currentChatId = 'chat_' + Date.now();
        this.messages = [];
        if (this.chatMessages) {
            this.chatMessages.innerHTML = `
                <div class="welcome-message">
                    <div class="welcome-content">
                        <h2>Welcome to AI Chat Interface</h2>
                        <p>Start a conversation with your AI assistant. Select different models or use compare mode to see responses from multiple AIs.</p>
                    </div>
                </div>
            `;
        }
        
        if (this.compareResponses) this.compareResponses.innerHTML = '';
        if (this.messageInput) this.messageInput.focus();

        this.updateBotSelection();
    }

    sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message) return;

        if (!this.selectedBots || this.selectedBots.length === 0) {
            this.addMessage("Please select an AI model before sending a message.", 'ai');
            this.messageInput.value = '';
            return;
        }

        const welcomeMessage = this.chatMessages.querySelector('.welcome-message');
        if (welcomeMessage) welcomeMessage.remove();

        this.addMessage(message, 'user');
        this.messageInput.value = '';
        this.sendButton.disabled = true;

        if (this.compareMode) {
            this.handleCompareMode(message);
        } else {
            this.handleSingleResponse(message);
        }

        this.saveChatHistory();
    }

    handleSingleResponse(message) {
        this.showTypingIndicator();

        const botId = this.selectedBots[0];
        if (!botId || !this.aiModels[botId]) {
            this.hideTypingIndicator();
            this.addMessage("No valid AI model selected. Please choose a model.", 'ai');
            this.sendButton.disabled = false;
            return;
        }

        setTimeout(() => {
            this.hideTypingIndicator();
            const response = this.generateAIResponse(message, botId);
            this.addMessage(response, 'ai', botId);
            this.sendButton.disabled = false;
        }, Math.random() * 2000 + 1000);
    }

    handleCompareMode(message) {
        this.compareResponses.innerHTML = '';
        
        this.selectedBots.forEach((botId, index) => {
            const responseDiv = document.createElement('div');
            responseDiv.className = 'compare-response';
            responseDiv.innerHTML = `
                <div class="compare-response-header">
                    <div class="compare-response-icon">${this.aiModels[botId].icon}</div>
                    <div class="compare-response-name">${this.aiModels[botId].name}</div>
                </div>
                <div class="compare-response-content">
                    <div class="typing-indicator">
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                    </div>
                </div>
            `;
            this.compareResponses.appendChild(responseDiv);

            setTimeout(() => {
                const response = this.generateAIResponse(message, botId);
                responseDiv.querySelector('.compare-response-content').innerHTML = response;
                
                if (index === this.selectedBots.length - 1) {
                    this.sendButton.disabled = false;
                }
            }, Math.random() * 2000 + 1000 + (index * 500));
        });
    }

    addMessage(content, sender, botId = null) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;

        const currentTime = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

        if (sender === 'user') {
            messageDiv.innerHTML = `
                <div class="message-content">${this.escapeHtml(content)}</div>
                <div class="message-time">${currentTime}</div>
            `;
        } else {
            const botName = botId ? this.aiModels[botId].name : 'AI Assistant';
            const botIcon = botId ? this.aiModels[botId].icon : '🤖';
            messageDiv.innerHTML = `
                <div class="message-content">
                    <strong>${botIcon} ${botName}:</strong>
                    <div>${this.formatAnswer(content)}</div>
                </div>
                <div class="message-time">${currentTime}</div>
            `;
        }

        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();

        this.messages.push({
            content,
            sender,
            botId,
            timestamp: Date.now()
        });
    }

    showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message ai-message';
        typingDiv.id = 'typing-indicator';
        typingDiv.innerHTML = `
            <div class="message-content typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;
        this.chatMessages.appendChild(typingDiv);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) typingIndicator.remove();
    }

    generateAIResponse(userMessage, botId) {
        const model = this.aiModels[botId];
        const lowerMessage = userMessage.toLowerCase();

        const faqAnswer = this.getFaqAnswer(userMessage);
        if (faqAnswer) return faqAnswer;

        if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
            return `Hello! I'm ${model.name}, your AI assistant. ${model.description}. How can I help you today?`;
        } else if (lowerMessage.includes('how are you')) {
            return `I'm doing great, thank you for asking! As ${model.name}, I'm here and ready to assist you with any questions or tasks you might have.`;
        } else if (lowerMessage.includes('what can you do')) {
            return `As ${model.name}, I can help you with a wide variety of tasks. ${model.description}. What would you like to explore?`;
        } else if (lowerMessage.includes('joke')) {
            const jokes = {
                'gpt-4': "Why don't scientists trust atoms? Because they make up everything! *adjusts digital glasses analytically*",
                'claude': "I'd be happy to share a joke! Why don't scientists trust atoms? Because they make up everything! Hope that brought a smile to your face!",
                'gemini': "Ooh, I love jokes! Here's a creative one: Why don't scientists trust atoms? Because they make up everything! *sparkles with digital creativity*"
            };
            return jokes[botId] || jokes['gpt-4'];
        } else if (lowerMessage.includes('thank')) {
            return `You're very welcome! I'm glad I could help. Feel free to ask me anything else you'd like to know!`;
        } else {
            const responses = model.responses;
            return responses[Math.floor(Math.random() * responses.length)];
        }
    }

    saveChatHistory() {
        if (this.messages.length > 0) {
            const existingChatIndex = this.chatHistory.findIndex(chat => chat.id === this.currentChatId);
            const chatData = {
                id: this.currentChatId,
                title: this.messages[0].content.substring(0, 30) + (this.messages[0].content.length > 30 ? '...' : ''),
                messages: this.messages,
                lastUpdated: Date.now()
            };

            if (existingChatIndex !== -1) {
                this.chatHistory[existingChatIndex] = chatData;
            } else {
                this.chatHistory.unshift(chatData);
            }

            this.chatHistory = this.chatHistory.slice(0, 20);
            localStorage.setItem('chatHistory', JSON.stringify(this.chatHistory));
            this.renderChatHistory();
        }
    }

    renderChatHistory() {
        this.chatHistoryList.innerHTML = '';
        
        this.chatHistory.forEach(chat => {
            const chatItem = document.createElement('div');
            chatItem.className = 'chat-history-item';
            if (chat.id === this.currentChatId) chatItem.classList.add('active');

            const lastMessage = chat.messages[chat.messages.length - 1];
            const preview = lastMessage ? lastMessage.content.substring(0, 50) + '...' : '';

            chatItem.innerHTML = `
                <div class="chat-item-title">${chat.title}</div>
                <div class="chat-item-preview">${preview}</div>
            `;

            chatItem.addEventListener('click', () => this.loadChat(chat));
            this.chatHistoryList.appendChild(chatItem);
        });
    }

    loadChat(chat) {
        this.currentChatId = chat.id;
        this.messages = chat.messages;
        this.chatMessages.innerHTML = '';
        this.messages.forEach(message => this.addMessageToDisplay(message));
        this.renderChatHistory();
        this.scrollToBottom();
    }

    addMessageToDisplay(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.sender}-message`;

        const messageTime = new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

        if (message.sender === 'user') {
            messageDiv.innerHTML = `
                <div class="message-content">${this.escapeHtml(message.content)}</div>
                <div class="message-time">${messageTime}</div>
            `;
        } else {
            const botName = message.botId ? this.aiModels[message.botId].name : 'AI Assistant';
            const botIcon = message.botId ? this.aiModels[message.botId].icon : '🤖';
            messageDiv.innerHTML = `
                <div class="message-content">
                    <strong>${botIcon} ${botName}:</strong> ${this.escapeHtml(message.content)}
                </div>
                <div class="message-time">${messageTime}</div>
            `;
        }

        this.chatMessages.appendChild(messageDiv);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    initializeCarousel() {
        if (!this.carouselTrack) return;

        this.carouselTrack.innerHTML = '';

        Object.keys(this.aiModels).forEach(botId => {
            const model = this.aiModels[botId];
            const botCard = document.createElement('div');
            botCard.className = 'carousel-bot-card';
            botCard.dataset.bot = botId;

            botCard.innerHTML = `
                <div class="carousel-bot-icon">${model.icon}</div>
                <div class="carousel-bot-name">${model.name}</div>
                <div class="carousel-bot-desc">${model.description.split(' ').slice(0, 3).join(' ')}...</div>
            `;

            botCard.addEventListener('click', () => this.toggleBotSelection(botId));
            this.carouselTrack.appendChild(botCard);
        });

        this.updateCarouselSelection();
    }

    updateCarouselSelection() {
        if (!this.carouselTrack) return;

        const botCards = this.carouselTrack.querySelectorAll('.carousel-bot-card');
        botCards.forEach(card => {
            const isSelected = this.selectedBots.includes(card.dataset.bot);
            card.classList.toggle('selected', isSelected);
        });
    }

    scrollCarousel(direction) {
        if (!this.carouselTrack) return;

        const scrollAmount = 140;
        const currentScroll = this.carouselTrack.scrollLeft;
        
        if (direction === 'next') {
            this.carouselTrack.scrollTo({ left: currentScroll + scrollAmount, behavior: 'smooth' });
        } else {
            this.carouselTrack.scrollTo({ left: currentScroll - scrollAmount, behavior: 'smooth' });
        }
    }

    scrollToBottom() {
        setTimeout(() => {
            if (this.chatMessages) this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }, 100);
    }

    showChatArea() {
        this.authButtons.querySelector('.login-btn').style.display = 'none';
        this.authButtons.querySelector('.signup-btn').style.display = 'none';
        this.authButtons.querySelector('.logout-btn').style.display = 'block';
        this.chatMessages.style.display = 'block';
        this.messageInput.style.display = 'inline';
        this.sendButton.style.display = 'flex';
    }

    hideChatArea() {
        this.authButtons.querySelector('.login-btn').style.display = 'block';
        this.authButtons.querySelector('.signup-btn').style.display = 'block';
        this.authButtons.querySelector('.logout-btn').style.display = 'none';
        this.chatMessages.style.display = 'none';
        this.messageInput.style.display = 'none';
        this.sendButton.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ChatInterface();
});

document.addEventListener("DOMContentLoaded", function () {
    const themeToggle = document.getElementById("themeToggle");
    document.body.classList.add("light-mode");
    themeToggle.textContent = "☀️";

    themeToggle.addEventListener("click", () => {
        const isLight = document.body.classList.toggle("light-mode");
        themeToggle.textContent = isLight ? "☀️" : "🌙";
    });
});
