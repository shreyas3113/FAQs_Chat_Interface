
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
        
        this.currentChatId = null;
        this.chatHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];
        this.selectedBots = ['gpt-4'];
        this.compareMode = false;
        this.messages = [];

       this.aiModels = {
  "gpt-4": {
    name: "GPT-4", icon: "🤖",
    description: "Advanced reasoning and analysis",
    responses: ["Sure, how can I help you?", "Let me look that up for you.", "That’s a great question!"]
  },
  "claude": {
    name: "Claude", icon: "🧠",
    description: "Helpful and balanced responses",
    responses: ["I’d be happy to assist!", "How can I support you today?", "Let’s solve this together."]
  },
  "gemini": {
    name: "Gemini", icon: "✨",
    description: "Creative and innovative thinking",
    responses: ["Here’s a creative take!", "Imagination is key. Let me think...", "Let’s explore that idea."]
  },
  "perplexity": {
    name: "Perplexity", icon: "📚",
    description: "Real-time web information",
    responses: ["Here's what I found.", "Fetching info from the web...", "Let me provide the most recent data."]
  },
  "copilot": {
    name: "Copilot", icon: "👨‍💻",
    description: "Your coding partner",
    responses: ["Let’s code it out!", "Try this snippet.", "Here’s a quick fix."]
  },
  "bard": {
    name: "Bard", icon: "🎤",
    description: "Google's creative assistant",
    responses: ["Let’s get poetic.", "Here’s a story you might enjoy.", "Creating something special…"]
  },
  "llama": {
    name: "LLaMA", icon: "🦙",
    description: "Meta's open model",
    responses: ["Analyzing from my knowledge base.", "That’s interesting!", "Let’s dive in."]
  },
  "mistral": {
    name: "Mistral", icon: "🐉",
    description: "Lightweight performant AI",
    responses: ["Fast and efficient — here’s your answer.", "No delays, just solutions.", "Responding swiftly."]
  }
};

this.faqs = [];

fetch('python_faq.json')  // Put this file in the same folder as index.html or in public
  .then(res => res.json())
  .then(data => {
    this.faqs = data;
  });


        this.initializeEventListeners();
        this.initializeCarousel();
        this.renderChatHistory();
        this.startNewChat();
        

    }
    getFaqAnswer(message) {
    const clean = (txt) => txt.toLowerCase().replace(/[?.!]/g, '').trim();
    const userText = clean(message);
    let result = this.faqs.find(faq => clean(faq.question) === userText);

    // If exact match not found, try partial match
    if (!result) {
        result = this.faqs.find(faq => clean(faq.question).includes(userText));
    }

    return result ? result.answer : null;
}

    initializeEventListeners() {
        if (this.sendButton) {
            this.sendButton.addEventListener('click', () => this.sendMessage());
        }
        if (this.messageInput) {
            this.messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendMessage();
                }
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

        // Bot selection
        if (this.botsGrid) {
    this.botsGrid.addEventListener('click', (e) => {
        e.preventDefault();
        alert("Please select models using the bottom Quick Select AI section.");
    });
}


        // Close bots panel
        const closeBots = document.querySelector('.close-bots');
        if (closeBots) {
            closeBots.addEventListener('click', () => {
                if (this.botsPanel) this.botsPanel.classList.remove('active');
                if (this.botsToggle) this.botsToggle.classList.remove('active');
            });
        }

        // Carousel navigation
        if (this.carouselPrev) {
            this.carouselPrev.addEventListener('click', () => this.scrollCarousel('prev'));
        }
        if (this.carouselNext) {
            this.carouselNext.addEventListener('click', () => this.scrollCarousel('next'));
        }

        // Carousel bot selection
        if (this.carouselTrack) {
          /*  this.carouselTrack.addEventListener('click', (e) => {
                const botCard = e.target.closest('.carousel-bot-card');
                if (botCard) {
                    this.toggleBotSelection(botCard.dataset.bot);
                    this.updateCarouselSelection();
                }
            });*/
        }

        // Click outside to close panels
        document.addEventListener('click', (e) => {
            if (this.botsPanel && this.botsToggle && 
                !this.botsPanel.contains(e.target) && !this.botsToggle.contains(e.target)) {
                this.botsPanel.classList.remove('active');
                this.botsToggle.classList.remove('active');
            }
        });
    }

    toggleSidebar() {
        if (this.sidebar) {
            this.sidebar.classList.toggle('active');
        }
    }

    toggleBotsPanel() {
        if (this.botsPanel) {
            this.botsPanel.classList.toggle('active');
        }
        if (this.botsToggle) {
            this.botsToggle.classList.toggle('active');
        }
    }

   toggleCompareMode() {
    this.compareMode = !this.compareMode;
    if (this.compareToggle) {
        this.compareToggle.classList.toggle('active', this.compareMode);
    }
    if (this.compareContainer) {
        this.compareContainer.classList.toggle('active', this.compareMode);
    }

    if (this.compareMode) {
        // ✅ Only set default if fewer than 2 selected
        if (this.selectedBots.length < 2) {
            this.selectedBots = ['gpt-4', 'claude'];
        }
    }

    // ✅ Don't reset bot selection when compareMode is turned OFF
    this.updateBotSelection();
}


    toggleBotSelection(botId) {
    const isSelected = this.selectedBots.includes(botId);

    if (isSelected) {
        // Deselect the bot
        this.selectedBots = this.selectedBots.filter(id => id !== botId);
    } else {
        // Select only if fewer than 3 are already selected
        if (this.selectedBots.length < 3) {
            this.selectedBots.push(botId);
        } else {
            alert("You can select only up to 3 AI models.");
            return; // Stop further action
        }
    }

    // Fallback default
    if (this.selectedBots.length === 0) {
        this.selectedBots = ['gpt-4'];
    }

    this.updateBotSelection();
}


   updateBotSelection() {
    const limitReached = this.selectedBots.length >= 3;

    // ===== TOP DROPDOWN PANEL =====
    const botsGrid = document.getElementById('botsGrid');
    if (botsGrid) {
        botsGrid.innerHTML = ''; // Clear previous

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

        // If none selected, show a default message
        if (this.selectedBots.length === 0) {
            botsGrid.innerHTML = `<p style="padding: 1rem; color: #999;">No AI models selected. Choose from below.</p>`;
        }
    }

    // ===== BOTTOM CAROUSEL =====
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
        if (this.chatTitle) {
            this.chatTitle.textContent = 'New Chat';
        }
        
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
        
        if (this.compareResponses) {
            this.compareResponses.innerHTML = '';
        }
        if (this.messageInput) {
            this.messageInput.focus();
        }
    }

    sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message) return;

        // Clear welcome message if it exists
        const welcomeMessage = this.chatMessages.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.remove();
        }

        this.addMessage(message, 'user');
        this.messageInput.value = '';
        this.sendButton.disabled = true;

        // Update chat title if it's a new chat
        if (this.messages.length === 1) {
            this.chatTitle.textContent = message.substring(0, 30) + (message.length > 30 ? '...' : '');
        }

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
        this.addMessage("No AI model is selected to respond. Please select a bot.", 'ai');
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
                    <strong>${botIcon} ${botName}:</strong> ${this.escapeHtml(content)}
                </div>
                <div class="message-time">${currentTime}</div>
            `;
        }

        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();

        // Store message
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
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    generateAIResponse(userMessage, botId) {
        const model = this.aiModels[botId];
        const lowerMessage = userMessage.toLowerCase();

        const faqAnswer = this.getFaqAnswer(userMessage);
if (faqAnswer) return faqAnswer;


        // Context-aware responses
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
            // Random response from the model's response pool
            const responses = model.responses;
            return responses[Math.floor(Math.random() * responses.length)];
        }
    }

    saveChatHistory() {
        if (this.messages.length > 0) {
            const existingChatIndex = this.chatHistory.findIndex(chat => chat.id === this.currentChatId);
            const chatData = {
                id: this.currentChatId,
                title: this.chatTitle.textContent,
                messages: this.messages,
                lastUpdated: Date.now()
            };

            if (existingChatIndex !== -1) {
                this.chatHistory[existingChatIndex] = chatData;
            } else {
                this.chatHistory.unshift(chatData);
            }

            // Keep only last 20 chats
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
            if (chat.id === this.currentChatId) {
                chatItem.classList.add('active');
            }

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
        this.chatTitle.textContent = chat.title;

        this.chatMessages.innerHTML = '';
        this.messages.forEach(message => {
            this.addMessageToDisplay(message);
        });

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
            <div class="carousel-bot-i  con">${model.icon}</div>
            <div class="carousel-bot-name">${model.name}</div>
            <div class="carousel-bot-desc">${model.description.split(' ').slice(0, 3).join(' ')}...</div>
        `;

        // ✅ Add click event listener to update selection
        botCard.addEventListener('click', () => {
            this.toggleBotSelection(botId);  // Update selection state
        });

        this.carouselTrack.appendChild(botCard);
    });

    this.updateCarouselSelection(); // Reflect initial selection (if any)
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

        const scrollAmount = 140; // width of card + gap
        const currentScroll = this.carouselTrack.scrollLeft;
        
        if (direction === 'next') {
            this.carouselTrack.scrollTo({
                left: currentScroll + scrollAmount,
                behavior: 'smooth'
            });
        } else {
            this.carouselTrack.scrollTo({
                left: currentScroll - scrollAmount,
                behavior: 'smooth'
            });
        }
    }

   updateBotSelection() {
    const limitReached = this.selectedBots.length >= 3;

    // ===== TOP DROPDOWN PANEL =====
    if (this.botsGrid) {
        this.botsGrid.innerHTML = ''; // Clear previous

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
            this.botsGrid.appendChild(card);
        });

        // If none selected, show a default message
        if (this.selectedBots.length === 0) {
            this.botsGrid.innerHTML = `<p style="padding: 1rem; color: #999;">No AI models selected. Choose from below.</p>`;
        }
    }

    // ===== BOTTOM CAROUSEL =====
    if (this.carouselTrack) {
        const cards = this.carouselTrack.querySelectorAll('.carousel-bot-card');
        cards.forEach(card => {
            const selected = this.selectedBots.includes(card.dataset.bot);
            card.classList.toggle('selected', selected);
            card.classList.toggle('disabled', limitReached && !selected);
        });
    }
}


    scrollToBottom() {
        setTimeout(() => {
            if (this.chatMessages) {
                this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
            }
        }, 100);
    }
}

// Initialize the chat interface when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ChatInterface();
});

//dark mode toggle functionality    
document.addEventListener("DOMContentLoaded", function () {
    const themeToggle = document.getElementById("themeToggle");

    // Default to dark
   document.body.classList.add("light-mode");
themeToggle.textContent = "☀️";

    themeToggle.addEventListener("click", () => {
        const isLight = document.body.classList.toggle("light-mode");
        themeToggle.textContent = isLight ? "☀️" : "🌙";
    });
});

