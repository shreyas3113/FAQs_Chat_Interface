// script.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";

class ChatInterface {
    constructor() {
        // Enable compareMode by default
        this.compareMode = true;
        // Default selected bots for ensemble mode
        this.selectedBots = ['gpt-4', 'claude', 'gemini'];

        // Always activate ensemble toggle and container
        if (this.compareToggle) this.compareToggle.classList.add('active');
        if (this.compareContainer) this.compareContainer.classList.add('active');

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
        this.messages = [];
        this.faqs = [];
        this.personalityFaqs = []; // Added for personality development FAQs

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
        console.log("Firebase initialized successfully");

        this.initializeEventListeners();
        this.initializeCarousel();
        this.renderChatHistory();
        this.startNewChat();
        this.updateBotSelection();
        this.checkAuthState();
        this.loadFaqsFromFirebase();
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
        // Clear any previous success message
        const successMessage = this.authModal.querySelector('.success-message');
        if (successMessage) successMessage.remove();
    }

    hideAuthModal() {
        this.authModal.style.display = 'none';
        this.modalEmail.value = '';
        this.modalPassword.value = '';
        // Clear success message when closing
        const successMessage = this.authModal.querySelector('.success-message');
        if (successMessage) successMessage.remove();
    }

    loginUser(email, password) {
        signInWithEmailAndPassword(this.auth, email, password)
            .then((userCredential) => {
                console.log("User signed in with UID:", userCredential.user.uid);
                // Add welcome message to chat interface
                this.addMessage(`Welcome ${email.split('@')[0]}! You have successfully logged in.`, 'ai');
                // Hide modal
                this.hideAuthModal();
            })
            .catch((error) => {
                console.error("Error signing in:", error.code, error.message);
                // Add error message to the modal
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-message';
                errorDiv.style.cssText = 'color: red; text-align: center; margin-top: 10px;';
                errorDiv.textContent = `Error: ${error.message}`;
                this.authModal.querySelector('div').appendChild(errorDiv);
                setTimeout(() => {
                    if (errorDiv.parentNode) errorDiv.remove();
                }, 3000);
            });
    }

    signUpUser(email, password) {
        createUserWithEmailAndPassword(this.auth, email, password)
            .then((userCredential) => {
                const userId = userCredential.user.uid;
                set(ref(this.database, 'users/' + userId), { email: email })
                    .then(() => {
                        console.log("User signed up and data saved with UID:", userId);
                        // Add welcome message to chat interface
                        this.addMessage(`Welcome ${email.split('@')[0]}! You have successfully signed up.`, 'ai');
                        // Auto-login and hide modal
                        return signInWithEmailAndPassword(this.auth, email, password);
                    })
                    .then(() => {
                        this.hideAuthModal();
                    })
                    .catch((error) => {
                        console.error("Error saving data or signing in:", error.message);
                        const errorDiv = document.createElement('div');
                        errorDiv.className = 'error-message';
                        errorDiv.style.cssText = 'color: red; text-align: center; margin-top: 10px;';
                        errorDiv.textContent = `Error: ${error.message}`;
                        this.authModal.querySelector('div').appendChild(errorDiv);
                        setTimeout(() => {
                            if (errorDiv.parentNode) errorDiv.remove();
                        }, 3000);
                    });
            })
            .catch((error) => {
                console.error("Error signing up:", error.code, error.message);
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-message';
                errorDiv.style.cssText = 'color: red; text-align: center; margin-top: 10px;';
                errorDiv.textContent = `Error: ${error.message}`;
                this.authModal.querySelector('div').appendChild(errorDiv);
                setTimeout(() => {
                    if (errorDiv.parentNode) errorDiv.remove();
                }, 3000);
            });
    }

    logoutUser() {
        signOut(this.auth)
            .then(() => {
                console.log("User signed out");
                this.addMessage("You have successfully logged out.", 'ai');
                this.startNewChat(); // Reset chat state
            })
            .catch((error) => {
                console.error("Error signing out:", error.message);
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-message';
                errorDiv.style.cssText = 'color: red; text-align: center; margin-top: 10px;';
                errorDiv.textContent = `Error: ${error.message}`;
                this.authModal.querySelector('div').appendChild(errorDiv);
                setTimeout(() => {
                    if (errorDiv.parentNode) errorDiv.remove();
                }, 3000);
            });
    }

    // FAQ Methods
    loadFaqsFromFirebase() {
        const faqsRef = ref(this.database, 'faqs');
        const personalityFaqsRef = ref(this.database, 'personalityFaqs'); // Added for personality development FAQs
        onValue(faqsRef, (snapshot) => {
            const data = snapshot.val();
            this.faqs = data ? Object.values(data) : [];
            // Initialize with default web development FAQs if empty
            if (!data) {
                const defaultFaqs = [
                    { question: "What is HTML?", answer: "HTML (HyperText Markup Language) is the standard language for creating web pages.", language: "Web Development" },
                    { question: "Who developed HTML?", answer: "HTML was developed by Tim Berners-Lee and released in 1991.", language: "Web Development" },
                    { question: "What are the key features of HTML?", answer: "HTML provides structure with tags, supports multimedia, and is the foundation of web content.", language: "Web Development" },
                    { question: "How do you create a heading in HTML?", answer: "Use <h1> to <h6> tags:\n\nExample:\n```html\n<h1>Main Heading</h1>\n```", language: "Web Development" },
                    { question: "What is a div in HTML?", answer: "A div is a block-level container for grouping elements.\n\nExample:\n```html\n<div>Content here</div>\n```", language: "Web Development" },
                    { question: "How do you add an image in HTML?", answer: "Use the <img> tag with a src attribute:\n\nExample:\n```html\n<img src=\"image.jpg\" alt=\"Description\">\n```", language: "Web Development" },
                    { question: "What is CSS?", answer: "CSS (Cascading Style Sheets) is used to style and layout web pages.", language: "Web Development" },
                    { question: "How do you link CSS to HTML?", answer: "Use the <link> tag in the <head>:\n\nExample:\n```html\n<link rel=\"stylesheet\" href=\"styles.css\">\n```", language: "Web Development" },
                    { question: "What is a class in CSS?", answer: "A class is a reusable style identifier defined with a dot (.).\n\nExample:\n```css\n.className { color: blue; }\n```", language: "Web Development" },
                    { question: "How do you center an element with CSS?", answer: "Use margin: auto; or flexbox:\n\nExample:\n```css\n.centered { margin: 0 auto; width: 50%; }\n```", language: "Web Development" },
                    { question: "What is JavaScript?", answer: "JavaScript is a programming language that adds interactivity to web pages.", language: "Web Development" },
                    { question: "How do you add JavaScript to HTML?", answer: "Use the <script> tag:\n\nExample:\n```html\n<script src=\"script.js\"></script>\n```", language: "Web Development" },
                    { question: "What is a variable in JavaScript?", answer: "A variable stores data using let, const, or var.\n\nExample:\n```javascript\nlet x = 5;\n```", language: "Web Development" },
                    { question: "How do you write a function in JavaScript?", answer: "Use the function keyword:\n\nExample:\n```javascript\nfunction greet() { console.log(\"Hello\"); }\n```", language: "Web Development" },
                    { question: "What is the DOM?", answer: "The DOM (Document Object Model) is a tree-like structure representing HTML elements.", language: "Web Development" },
                    { question: "How do you select an element in JavaScript?", answer: "Use document.getElementById() or querySelector():\n\nExample:\n```javascript\ndocument.getElementById(\"myId\");\n```", language: "Web Development" },
                    { question: "What is an event in JavaScript?", answer: "An event is an action like a click or keypress that triggers code.\n\nExample:\n```javascript\ndocument.addEventListener(\"click\", function() { alert(\"Clicked\"); });\n```", language: "Web Development" },
                    { question: "What is responsive design?", answer: "Responsive design adapts a website to different screen sizes using CSS media queries.", language: "Web Development" },
                    { question: "How do you create a media query in CSS?", answer: "Use @media:\n\nExample:\n```css\n@media (max-width: 600px) { body { font-size: 14px; } }\n```", language: "Web Development" },
                    { question: "What is a flexbox?", answer: "Flexbox is a CSS layout model for arranging items in a container.\n\nExample:\n```css\ndisplay: flex;\n```", language: "Web Development" },
                    { question: "What is a grid in CSS?", answer: "CSS Grid is a 2D layout system for rows and columns.\n\nExample:\n```css\ndisplay: grid; grid-template-columns: 1fr 1fr;\n```", language: "Web Development" },
                    { question: "How do you style a button in CSS?", answer: "Use CSS properties:\n\nExample:\n```css\nbutton { background-color: blue; color: white; }\n```", language: "Web Development" },
                    { question: "What is a semantic HTML tag?", answer: "A semantic tag describes its meaning, like <header> or <footer>.\n\nExample:\n```html\n<header>Website Header</header>\n```", language: "Web Development" },
                    { question: "How do you create a form in HTML?", answer: "Use the <form> tag with input elements:\n\nExample:\n```html\n<form><input type=\"text\"><button>Submit</button></form>\n```", language: "Web Development" },
                    { question: "What is HTTP?", answer: "HTTP (HyperText Transfer Protocol) is the foundation of data communication on the web.", language: "Web Development" },
                    { question: "What is a GET request?", answer: "A GET request retrieves data from a server.\n\nExample:\n```javascript\nfetch('https://api.example.com');\n```", language: "Web Development" },
                    { question: "What is a POST request?", answer: "A POST request sends data to a server.\n\nExample:\n```javascript\nfetch('https://api.example.com', { method: 'POST', body: JSON.stringify(data) });\n```", language: "Web Development" },
                    { question: "What is REST API?", answer: "REST (Representational State Transfer) is an architectural style for web services.", language: "Web Development" },
                    { question: "How do you use Bootstrap?", answer: "Include Bootstrap CSS and JS via CDN:\n\nExample:\n```html\n<link href=\"https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css\" rel=\"stylesheet\">\n```", language: "Web Development" },
                    { question: "What is a CDN?", answer: "A CDN (Content Delivery Network) delivers web content like CSS or JS from multiple servers.", language: "Web Development" },
                    { question: "How do you debug JavaScript?", answer: "Use console.log() or browser developer tools.\n\nExample:\n```javascript\nconsole.log(\"Debug message\");\n```", language: "Web Development" },
                    { question: "What is a callback function?", answer: "A callback is a function passed as an argument to another function.\n\nExample:\n```javascript\nsetTimeout(() => console.log(\"Delayed\"), 1000);\n```", language: "Web Development" },
                    { question: "What is a promise in JavaScript?", answer: "A promise handles asynchronous operations with .then() and .catch().\n\nExample:\n```javascript\nlet promise = new Promise((resolve) => resolve(\"Success\"));\npromise.then(console.log);\n```", language: "Web Development" },
                    { question: "What is async/await?", answer: "async/await simplifies asynchronous code with promises.\n\nExample:\n```javascript\nasync function fetchData() { let response = await fetch('https://api.example.com'); }\n```", language: "Web Development" },
                    { question: "What is JSON?", answer: "JSON (JavaScript Object Notation) is a lightweight data format.\n\nExample:\n```javascript\nlet data = { name: \"John\", age: 30 };\n```", language: "Web Development" },
                    { question: "How do you parse JSON?", answer: "Use JSON.parse():\n\nExample:\n```javascript\nlet obj = JSON.parse('{\"name\": \"John\"}');\n```", language: "Web Development" },
                    { question: "What is a framework?", answer: "A framework is a pre-built structure for developing web applications, like React or Vue.", language: "Web Development" },
                    { question: "What is React?", answer: "React is a JavaScript library for building user interfaces.\n\nExample:\n```jsx\nfunction App() { return <h1>Hello</h1>; }\n```", language: "Web Development" },
                    { question: "What is a component in React?", answer: "A component is a reusable building block in React.\n\nExample:\n```jsx\nfunction Button() { return <button>Click</button>; }\n```", language: "Web Development" },
                    { question: "What is state in React?", answer: "State is an object that stores data and can change over time.\n\nExample:\n```jsx\nconst [count, setCount] = useState(0);\n```", language: "Web Development" },
                    { question: "What is props in React?", answer: "Props are read-only data passed to components.\n\nExample:\n```jsx\nfunction Welcome(props) { return <h1>Hello, {props.name}</h1>; }\n```", language: "Web Development" },
                    { question: "What is CSS-in-JS?", answer: "CSS-in-JS is a technique to write CSS inside JavaScript files.\n\nExample:\n```javascript\nconst style = { color: 'blue' };\n```", language: "Web Development" },
                    { question: "What is a media query?", answer: "A media query applies styles based on device characteristics.\n\nExample:\n```css\n@media (max-width: 600px) { body { font-size: 14px; } }\n```", language: "Web Development" },
                    { question: "How do you create a table in HTML?", answer: "Use <table>, <tr>, <th>, and <td> tags:\n\nExample:\n```html\n<table><tr><th>Name</th></tr><tr><td>John</td></tr></table>\n```", language: "Web Development" },
                    { question: "What is a meta tag?", answer: "A meta tag provides metadata about the HTML document.\n\nExample:\n```html\n<meta name=\"description\" content=\"Web page description\">\n```", language: "Web Development" },
                    { question: "What is SEO?", answer: "SEO (Search Engine Optimization) improves a website's visibility on search engines.", language: "Web Development" },
                    { question: "How do you optimize images for the web?", answer: "Use compressed formats like JPEG or WebP and add alt text.\n\nExample:\n```html\n<img src=\"image.webp\" alt=\"Description\">\n```", language: "Web Development" },
                    { question: "What is a browser?", answer: "A browser is software like Chrome or Firefox that renders web pages.", language: "Web Development" },
                    { question: "What is a viewport?", answer: "A viewport is the visible area of a web page in a browser.\n\nExample:\n```html\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n```", language: "Web Development" },
                    { question: "What is a cookie?", answer: "A cookie is a small text file stored by a browser to track user data.\n\nExample:\n```javascript\ndocument.cookie = \"name=John\";\n```", language: "Web Development" },
                    { question: "What is localStorage?", answer: "localStorage is a web storage API for storing data locally.\n\nExample:\n```javascript\nlocalStorage.setItem(\"key\", \"value\");\n```", language: "Web Development" },
                    { question: "What is sessionStorage?", answer: "sessionStorage stores data for one session, cleared when the tab closes.\n\nExample:\n```javascript\nsessionStorage.setItem(\"key\", \"value\");\n```", language: "Web Development" },
                    { question: "What is CORS?", answer: "CORS (Cross-Origin Resource Sharing) manages cross-origin HTTP requests.", language: "Web Development" },
                    { question: "How do you handle forms in JavaScript?", answer: "Use the addEventListener on form submit:\n\nExample:\n```javascript\ndocument.querySelector('form').addEventListener('submit', (e) => { e.preventDefault(); });\n```", language: "Web Development" },
                    { question: "What is a RESTful API?", answer: "A RESTful API follows REST principles for CRUD operations.\n\nExample:\n```javascript\nfetch('https://api.example.com/users', { method: 'POST' });\n```", language: "Web Development" },
                    { question: "What is a single-page application?", answer: "An SPA is a web app that loads a single HTML page and updates dynamically.", language: "Web Development" },
                    { question: "What is WebSocket?", answer: "WebSocket provides full-duplex communication channels over a single TCP connection.", language: "Web Development" },
                    { question: "What is a CDN for JavaScript?", answer: "A CDN delivers JavaScript files, like jQuery, from a global network.\n\nExample:\n```html\n<script src=\"https://code.jquery.com/jquery-3.6.0.min.js\"></script>\n```", language: "Web Development" },
                    { question: "How do you create a hover effect in CSS?", answer: "Use the :hover pseudo-class:\n\nExample:\n```css\nbutton:hover { background-color: yellow; }\n```", language: "Web Development" },
                    { question: "What is a framework vs library?", answer: "A framework provides structure (e.g., Angular), while a library is a toolset (e.g., jQuery).", language: "Web Development" },
                    { question: "What is a build tool?", answer: "A build tool like Webpack or Gulp automates tasks like minification.\n\nExample:\n```javascript\nmodule.exports = { mode: 'production' };\n```", language: "Web Development" },
                    { question: "What is versioning in web development?", answer: "Versioning tracks changes in code using tools like Git.\n\nExample:\n```bash\ngit commit -m \"Update CSS\"\n```", language: "Web Development" },
                    { question: "What is a 404 error?", answer: "A 404 error indicates a page is not found on the server.", language: "Web Development" },
                    { question: "How do you redirect a page in JavaScript?", answer: "Use window.location:\n\nExample:\n```javascript\nwindow.location.href = \"https://newpage.com\";\n```", language: "Web Development" },
                    { question: "What is a favicon?", answer: "A favicon is a small icon displayed in the browser tab.\n\nExample:\n```html\n<link rel=\"icon\" type=\"image/x-icon\" href=\"/favicon.ico\">\n```", language: "Web Development" },
                    { question: "What is progressive enhancement?", answer: "Progressive enhancement builds a basic version first, then adds advanced features.", language: "Web Development" },
                    { question: "What is lazy loading?", answer: "Lazy loading delays loading of non-critical resources like images.\n\nExample:\n```html\n<img src=\"image.jpg\" loading=\"lazy\" alt=\"Description\">\n```", language: "Web Development" },
                    { question: "What is a CSS preprocessor?", answer: "A preprocessor like Sass adds features like variables to CSS.\n\nExample:\n```scss\n$primary-color: blue;\nbody { color: $primary-color; }\n```", language: "Web Development" },
                    { question: "What is a web server?", answer: "A web server hosts and delivers web content, like Apache or Nginx.", language: "Web Development" },
                    { question: "What is HTTPS?", answer: "HTTPS is HTTP with encryption via SSL/TLS for secure communication.", language: "Web Development" },
                    { question: "How do you validate a form?", answer: "Use HTML5 attributes or JavaScript:\n\nExample:\n```html\n<input type=\"email\" required>\n```", language: "Web Development" },
                    { question: "What is a CDN for CSS?", answer: "A CDN delivers CSS files, like Bootstrap, from a global network.\n\nExample:\n```html\n<link href=\"https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css\" rel=\"stylesheet\">\n```", language: "Web Development" },
                    { question: "What is a CSS reset?", answer: "A CSS reset standardizes browser default styles.\n\nExample:\n```css\n* { margin: 0; padding: 0; }\n```", language: "Web Development" },
                    { question: "What is a z-index?", answer: "z-index controls the stack order of elements on the z-axis.\n\nExample:\n```css\n.element { z-index: 10; }\n```", language: "Web Development" },
                    { question: "What is a transition in CSS?", answer: "A transition smoothly changes property values over time.\n\nExample:\n```css\ndiv { transition: width 2s; }\n```", language: "Web Development" },
                    { question: "What is an animation in CSS?", answer: "An animation creates dynamic effects using @keyframes.\n\nExample:\n```css\n@keyframes slide { from { margin-left: 0; } to { margin-left: 100px; } }\n```", language: "Web Development" },
                    { question: "What is a web accessibility?", answer: "Web accessibility ensures websites are usable by people with disabilities.", language: "Web Development" },
                    { question: "How do you add ARIA roles?", answer: "Use aria-* attributes:\n\nExample:\n```html\n<div role=\"button\" aria-label=\"Close\">X</div>\n```", language: "Web Development" },
                    { question: "What is a CDN fallback?", answer: "A fallback loads local files if a CDN fails.\n\nExample:\n```html\n<script>if (!window.jQuery) document.write('<script src=\"local.js\">');</script>\n```", language: "Web Development" }
                ];
                defaultFaqs.forEach((faq, index) => {
                    set(ref(this.database, `faqs/${index}`), faq);
                });
                this.faqs = defaultFaqs;
            }
        });

        onValue(personalityFaqsRef, (snapshot) => {
            const data = snapshot.val();
            this.personalityFaqs = data ? Object.values(data) : [];
            // Initialize with default personality development FAQs if empty
            if (!data) {
                const defaultPersonalityFaqs = [
                    { question: "What is personality development?", answer: "Personality development involves enhancing personal traits like confidence, communication, and emotional intelligence to improve overall behavior and interactions. It includes self-awareness, goal-setting, and adapting to social situations, often through training or self-help techniques.", language: "Personality Development" },
                    { question: "How can I improve my confidence?", answer: "Improving confidence starts with positive self-talk, setting achievable goals, and practicing skills regularly. Engage in public speaking or join groups to gain experience, and maintain good posture and eye contact to project assurance.", language: "Personality Development" },
                    { question: "What are the benefits of good communication skills?", answer: "Good communication skills enhance relationships, boost career prospects, and resolve conflicts effectively. They involve active listening, clear expression, and empathy, leading to better teamwork and personal influence.", language: "Personality Development" },
                    { question: "How do I manage stress effectively?", answer: "Managing stress includes techniques like deep breathing, exercise, and time management. Identify triggers, practice mindfulness, and seek support from friends or professionals to maintain balance and resilience.", language: "Personality Development" },
                    { question: "What is emotional intelligence?", answer: "Emotional intelligence is the ability to recognize and manage your emotions and those of others. It includes self-awareness, self-regulation, motivation, empathy, and social skills, which are key to personal and professional success.", language: "Personality Development" },
                    { question: "How can I improve my communication skills?", answer: "Practice active listening, maintain eye contact, and use clear, concise language. Join workshops, read books on communication, and seek feedback to refine your verbal and non-verbal skills.", language: "Personality Development" },
                    { question: "What is active listening?", answer: "Active listening involves fully focusing on the speaker, understanding their message, and responding thoughtfully. It includes nodding, paraphrasing, and asking clarifying questions to show engagement.", language: "Personality Development" },
                    { question: "How do I set personal goals?", answer: "Use the SMART framework (Specific, Measurable, Achievable, Relevant, Time-bound). Write down goals, break them into steps, and track progress regularly to stay motivated.", language: "Personality Development" },
                    { question: "What is self-awareness?", answer: "Self-awareness is understanding your emotions, strengths, weaknesses, and triggers. Reflect through journaling or feedback from others to gain insight into your behavior and improve.", language: "Personality Development" },
                    { question: "How can I develop a positive attitude?", answer: "Focus on gratitude, surround yourself with positive people, and reframe challenges as opportunities. Practice mindfulness and avoid negative self-talk to maintain optimism.", language: "Personality Development" },
                    { question: "What is the importance of body language?", answer: "Body language communicates emotions and intentions non-verbally. Good posture, eye contact, and open gestures enhance trust and clarity in interactions.", language: "Personality Development" },
                    { question: "How do I improve my time management?", answer: "Prioritize tasks, use tools like calendars or to-do lists, and avoid multitasking. Set deadlines and allocate time for breaks to maintain productivity.", language: "Personality Development" },
                    { question: "What is assertiveness?", answer: "Assertiveness is expressing your needs and opinions confidently while respecting others. Practice using 'I' statements and maintaining calm, direct communication.", language: "Personality Development" },
                    { question: "How can I handle criticism?", answer: "Listen without defensiveness, evaluate feedback objectively, and use it for growth. Thank the critic and ask for specific suggestions to improve.", language: "Personality Development" },
                    { question: "What is the role of empathy in relationships?", answer: "Empathy builds trust and understanding by allowing you to connect with others' emotions. Practice active listening and validate others' feelings to strengthen bonds.", language: "Personality Development" },
                    { question: "How do I overcome shyness?", answer: "Start with small social interactions, prepare conversation topics, and practice deep breathing to reduce anxiety. Gradually increase exposure to social settings.", language: "Personality Development" },
                    { question: "What is the importance of self-discipline?", answer: "Self-discipline helps achieve goals by maintaining focus and consistency. Create routines, avoid distractions, and reward progress to build discipline.", language: "Personality Development" },
                    { question: "How can I improve my decision-making skills?", answer: "Gather relevant information, weigh pros and cons, and consider long-term impacts. Practice making small decisions quickly to build confidence.", language: "Personality Development" },
                    { question: "What is resilience?", answer: "Resilience is the ability to bounce back from setbacks. Develop it through optimism, problem-solving skills, and seeking support during challenges.", language: "Personality Development" },
                    { question: "How do I build better relationships?", answer: "Communicate openly, show appreciation, and respect boundaries. Invest time in understanding others and resolving conflicts constructively.", language: "Personality Development" },
                    { question: "What is the importance of self-esteem?", answer: "Self-esteem affects confidence and mental health. Build it by celebrating achievements, avoiding comparison, and practicing self-compassion.", language: "Personality Development" },
                    { question: "How can I develop leadership skills?", answer: "Practice decision-making, inspire others, and delegate effectively. Seek mentorship and take on small leadership roles to gain experience.", language: "Personality Development" },
                    { question: "What is the role of motivation in personal growth?", answer: "Motivation drives action toward goals. Find intrinsic motivators, set clear objectives, and visualize success to stay committed.", language: "Personality Development" },
                    { question: "How do I improve my public speaking?", answer: "Practice regularly, prepare content thoroughly, and engage the audience with stories or questions. Join groups like Toastmasters for feedback.", language: "Personality Development" },
                    { question: "What is conflict resolution?", answer: "Conflict resolution involves addressing disagreements constructively. Use active listening, stay calm, and seek win-win solutions.", language: "Personality Development" },
                    { question: "How can I develop a growth mindset?", answer: "Embrace challenges, learn from failures, and seek continuous improvement. Replace 'I can't' with 'I can learn' to foster growth.", language: "Personality Development" },
                    { question: "What is the importance of networking?", answer: "Networking builds professional and personal connections. Attend events, listen actively, and follow up to maintain relationships.", language: "Personality Development" },
                    { question: "How do I manage anger?", answer: "Use deep breathing, count to ten, or step away to cool down. Reflect on triggers and communicate feelings calmly to resolve issues.", language: "Personality Development" },
                    { question: "What is the role of gratitude in personal development?", answer: "Gratitude improves mental health and perspective. Keep a gratitude journal and express appreciation to others regularly.", language: "Personality Development" },
                    { question: "How can I improve my problem-solving skills?", answer: "Break problems into smaller parts, brainstorm solutions, and test them. Learn from past solutions to improve future outcomes.", language: "Personality Development" },
                    { question: "What is the importance of adaptability?", answer: "Adaptability allows you to thrive in changing environments. Stay open to new ideas and practice flexibility in daily tasks.", language: "Personality Development" },
                    { question: "How do I build trust with others?", answer: "Be honest, reliable, and respectful. Communicate clearly and follow through on promises to establish trust.", language: "Personality Development" },
                    { question: "What is the role of self-reflection?", answer: "Self-reflection helps identify strengths and areas for growth. Set aside time to journal or meditate on your experiences.", language: "Personality Development" },
                    { question: "How can I improve my listening skills?", answer: "Focus fully on the speaker, avoid interrupting, and summarize their points to confirm understanding.", language: "Personality Development" },
                    { question: "What is the importance of teamwork?", answer: "Teamwork enhances collaboration and productivity. Contribute ideas, respect others, and share responsibilities.", language: "Personality Development" },
                    { question: "How do I handle failure?", answer: "View failure as a learning opportunity. Analyze what went wrong, adjust your approach, and try again.", language: "Personality Development" },
                    { question: "What is the role of positivity in personal growth?", answer: "Positivity boosts resilience and motivation. Surround yourself with positive influences and practice optimistic thinking.", language: "Personality Development" },
                    { question: "How can I improve my social skills?", answer: "Engage in conversations, practice empathy, and attend social events to build comfort in social settings.", language: "Personality Development" },
                    { question: "What is the importance of goal-setting?", answer: "Goal-setting provides direction and motivation. Set clear, achievable goals and track progress regularly.", language: "Personality Development" },
                    { question: "How do I develop patience?", answer: "Practice mindfulness, focus on the present, and accept delays calmly. Reflect on long-term benefits of patience.", language: "Personality Development" },
                    { question: "What is the role of feedback in personal growth?", answer: "Feedback provides insights for improvement. Seek constructive feedback and act on it to grow.", language: "Personality Development" },
                    { question: "How can I improve my creativity?", answer: "Explore new hobbies, brainstorm freely, and embrace diverse perspectives to spark creativity.", language: "Personality Development" },
                    { question: "What is the importance of self-care?", answer: "Self-care maintains physical and mental health. Prioritize sleep, nutrition, exercise, and relaxation.", language: "Personality Development" },
                    { question: "How do I build emotional resilience?", answer: "Develop coping strategies, seek support, and maintain a positive outlook to handle emotional challenges.", language: "Personality Development" },
                    { question: "What is the role of optimism in success?", answer: "Optimism fosters persistence and creative problem-solving. Focus on possibilities rather than obstacles.", language: "Personality Development" },
                    { question: "How can I improve my negotiation skills?", answer: "Prepare thoroughly, listen actively, and aim for mutually beneficial outcomes in negotiations.", language: "Personality Development" },
                    { question: "What is the importance of authenticity?", answer: "Authenticity builds trust and self-confidence. Be true to your values and express yourself honestly.", language: "Personality Development" },
                    { question: "How do I overcome fear of public speaking?", answer: "Practice regularly, visualize success, and start with small audiences to build confidence.", language: "Personality Development" },
                    { question: "What is the role of discipline in achieving goals?", answer: "Discipline ensures consistent effort toward goals. Create routines and avoid distractions.", language: "Personality Development" },
                    { question: "How can I improve my interpersonal skills?", answer: "Practice empathy, active listening, and clear communication to build stronger relationships.", language: "Personality Development" },
                    { question: "What is the importance of self-motivation?", answer: "Self-motivation drives personal growth and goal achievement. Set clear goals and reward progress.", language: "Personality Development" },
                    { question: "How do I develop a strong work ethic?", answer: "Stay committed, prioritize tasks, and maintain consistency in your efforts.", language: "Personality Development" },
                    { question: "What is the role of humility in personal growth?", answer: "Humility fosters learning and respect. Acknowledge your limits and value others' contributions.", language: "Personality Development" },
                    { question: "How can I improve my emotional regulation?", answer: "Practice mindfulness, identify triggers, and use calming techniques like deep breathing.", language: "Personality Development" },
                    { question: "What is the importance of persistence?", answer: "Persistence overcomes obstacles and achieves long-term goals. Stay focused and keep trying.", language: "Personality Development" },
                    { question: "How do I develop better habits?", answer: "Start small, be consistent, and track progress. Replace bad habits with positive ones gradually.", language: "Personality Development" },
                    { question: "What is the role of mindfulness in personal development?", answer: "Mindfulness enhances focus and emotional balance. Practice meditation or mindful activities daily.", language: "Personality Development" },
                    { question: "How can I improve my conflict management?", answer: "Stay calm, listen to all sides, and seek fair solutions. Practice empathy and clear communication.", language: "Personality Development" },
                    { question: "What is the importance of self-confidence?", answer: "Self-confidence enables risk-taking and resilience. Build it through achievements and positive self-talk.", language: "Personality Development" },
                    { question: "How do I develop cultural sensitivity?", answer: "Learn about different cultures, listen respectfully, and avoid assumptions to foster inclusivity.", language: "Personality Development" },
                    { question: "What is the role of assertiveness in communication?", answer: "Assertiveness ensures your needs are expressed clearly while respecting others, enhancing mutual understanding.", language: "Personality Development" },
                    { question: "How can I improve my teamwork skills?", answer: "Collaborate actively, respect diverse opinions, and contribute to team goals effectively.", language: "Personality Development" },
                    { question: "What is the importance of adaptability in leadership?", answer: "Adaptable leaders adjust to change, inspiring teams to navigate challenges effectively.", language: "Personality Development" },
                    { question: "How do I handle rejection?", answer: "View rejection as feedback, stay positive, and focus on future opportunities for growth.", language: "Personality Development" },
                    { question: "What is the role of self-compassion?", answer: "Self-compassion promotes resilience by treating yourself kindly during setbacks.", language: "Personality Development" },
                    { question: "How can I improve my critical thinking?", answer: "Question assumptions, analyze evidence, and consider multiple perspectives to make informed decisions.", language: "Personality Development" },
                    { question: "What is the importance of active listening in leadership?", answer: "Active listening builds trust and ensures team members feel valued and understood.", language: "Personality Development" },
                    { question: "How do I develop a sense of purpose?", answer: "Reflect on your values, set meaningful goals, and pursue activities that align with your passions.", language: "Personality Development" },
                    { question: "What is the role of patience in relationships?", answer: "Patience fosters understanding and reduces conflict, strengthening interpersonal bonds.", language: "Personality Development" },
                    { question: "How can I improve my stress resilience?", answer: "Practice relaxation techniques, maintain a healthy lifestyle, and build a strong support network.", language: "Personality Development" },
                    { question: "What is the importance of emotional balance?", answer: "Emotional balance enhances decision-making and relationships by managing moods effectively.", language: "Personality Development" },
                    { question: "How do I develop better decision-making habits?", answer: "Evaluate options carefully, seek advice, and reflect on past decisions to improve.", language: "Personality Development" },
                    { question: "What is the role of gratitude in mental health?", answer: "Gratitude reduces stress and increases happiness by focusing on positive aspects of life.", language: "Personality Development" },
                    { question: "How can I improve my adaptability to change?", answer: "Embrace new experiences, stay open-minded, and learn from challenges to become more flexible.", language: "Personality Development" },
                    { question: "What is the importance of empathy in leadership?", answer: "Empathy in leadership builds trust, fosters collaboration, and enhances team morale.", language: "Personality Development" },
                    { question: "How do I develop a positive self-image?", answer: "Focus on strengths, avoid negative comparisons, and practice self-affirmations daily.", language: "Personality Development" },
                    { question: "What is the role of confidence in career success?", answer: "Confidence enhances performance, decision-making, and leadership, driving career advancement.", language: "Personality Development" },
                    { question: "How can I improve my presentation skills?", answer: "Prepare thoroughly, practice delivery, and engage the audience with clear visuals and stories.", language: "Personality Development" },
                    { question: "What is the importance of self-discipline in leadership?", answer: "Self-discipline ensures leaders stay focused, meet deadlines, and set a positive example.", language: "Personality Development" },
                    { question: "How do I handle difficult conversations?", answer: "Stay calm, listen actively, and use clear, respectful language to address issues constructively.", language: "Personality Development" },
                    { question: "What is the role of optimism in problem-solving?", answer: "Optimism encourages creative solutions and persistence in overcoming challenges.", language: "Personality Development" },
                    { question: "How can I improve my networking skills?", answer: "Attend events, ask open-ended questions, and follow up to build lasting connections.", language: "Personality Development" },
                    { question: "What is the importance of emotional intelligence in teamwork?", answer: "Emotional intelligence enhances collaboration by understanding and managing team dynamics.", language: "Personality Development" },
                    { question: "How do I develop better self-awareness?", answer: "Reflect regularly, seek feedback, and practice mindfulness to understand your emotions and actions.", language: "Personality Development" },
                    { question: "What is the role of motivation in leadership?", answer: "Motivation inspires teams, drives goal achievement, and fosters a positive work environment.", language: "Personality Development" },
                    { question: "How can I improve my conflict resolution skills?", answer: "Listen to all parties, remain neutral, and seek fair solutions to resolve disputes.", language: "Personality Development" },
                    { question: "What is the importance of resilience in career growth?", answer: "Resilience helps overcome setbacks, adapt to challenges, and pursue long-term career goals.", language: "Personality Development" },
                    { question: "How do I develop better time management habits?", answer: "Prioritize tasks, use planners, and set boundaries to maximize productivity.", language: "Personality Development" },
                    { question: "What is the role of authenticity in leadership?", answer: "Authentic leaders build trust and inspire teams by being genuine and transparent.", language: "Personality Development" },
                    { question: "How can I improve my emotional intelligence?", answer: "Practice self-awareness, empathy, and active listening to enhance emotional understanding.", language: "Personality Development" },
                    { question: "What is the importance of goal-setting in leadership?", answer: "Goal-setting provides direction and motivates teams to achieve shared objectives.", language: "Personality Development" },
                    { question: "How do I develop better public speaking habits?", answer: "Practice regularly, seek feedback, and use storytelling to engage audiences effectively.", language: "Personality Development" },
                    { question: "What is the role of empathy in personal relationships?", answer: "Empathy strengthens bonds by understanding and validating others' emotions.", language: "Personality Development" },
                    { question: "How can I improve my self-discipline?", answer: "Set clear goals, create routines, and eliminate distractions to stay focused.", language: "Personality Development" },
                    { question: "What is the importance of adaptability in personal growth?", answer: "Adaptability enables you to navigate challenges and embrace new opportunities for growth.", language: "Personality Development" },
                    { question: "How do I develop better problem-solving habits?", answer: "Analyze issues systematically, explore multiple solutions, and learn from outcomes.", language: "Personality Development" },
                    { question: "What is the role of self-reflection in leadership?", answer: "Self-reflection helps leaders identify strengths, weaknesses, and areas for improvement.", language: "Personality Development" },
                    { question: "How can I improve my leadership presence?", answer: "Project confidence, communicate clearly, and inspire others through consistent actions.", language: "Personality Development" },
                    { question: "What is the importance of positivity in teamwork?", answer: "Positivity fosters collaboration, boosts morale, and enhances team productivity.", language: "Personality Development" },
                    { question: "How do I develop better stress management habits?", answer: "Practice mindfulness, exercise regularly, and seek support to manage stress effectively.", language: "Personality Development" },
                    { question: "What is the role of confidence in public speaking?", answer: "Confidence enhances delivery, engages audiences, and conveys credibility in speeches.", language: "Personality Development" },
                    { question: "How can I improve my resilience to setbacks?", answer: "Reframe challenges as opportunities, seek support, and maintain a positive mindset.", language: "Personality Development" },
                    { question: "What is the importance of self-awareness in leadership?", answer: "Self-awareness helps leaders understand their impact and make informed decisions.", language: "Personality Development" }
                ];
                defaultPersonalityFaqs.forEach((faq, index) => {
                    set(ref(this.database, `personalityFaqs/${index}`), faq);
                });
                this.personalityFaqs = defaultPersonalityFaqs;
            }
        });
    }

    getFaqAnswer(message) {
        const clean = (txt) => txt.toLowerCase().replace(/[?.!]/g, '').trim();
        const userText = clean(message);
        let result = this.faqs.find(faq => clean(faq.question) === userText);

        if (!result) {
            result = this.faqs.find(faq => clean(faq.question).includes(userText));
        }

        // Search personalityFaqs if not found in faqs
        if (!result) {
            result = this.personalityFaqs.find(faq => clean(faq.question) === userText);
        }
        if (!result) {
            result = this.personalityFaqs.find(faq => clean(faq.question).includes(userText));
        }

        return result ? result.answer : null;
    }

    // Existing Methods (with minor adjustments)
    formatAnswer(text) {
        return text
            .replace(/```html([\s\S]*?)```/g, '<pre><code class="language-html">$1</code></pre>')
            .replace(/```css([\s\S]*?)```/g, '<pre><code class="language-css">$1</code></pre>')
            .replace(/```javascript([\s\S]*?)```/g, '<pre><code class="language-javascript">$1</code></pre>')
            .replace(/```scss([\s\S]*?)```/g, '<pre><code class="language-scss">$1</code></pre>')
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
        const previousBots = [...this.selectedBots];

        if (!this.compareMode) {
            this.selectedBots = [botId];
        } else {
            if (this.selectedBots.includes(botId)) {
                this.selectedBots = this.selectedBots.filter(id => id !== botId);
            } else if (this.selectedBots.length < 3) {
                this.selectedBots.push(botId);
            }
        }

        // If bots changed and there are messages, save and start new chat
        const botsChanged = previousBots.sort().join(',') !== this.selectedBots.sort().join(',');
        if (botsChanged && this.messages.length > 0) {
            this.saveChatHistory();
            this.startNewChat();
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
                'gpt-4': "Why don't web developers prefer dark mode? Because the light attracts bugs! *adjusts digital glasses analytically*",
                'claude': "I'd be happy to share a joke! Why don't web developers prefer dark mode? Because the light attracts bugs! Hope that brought a smile to your face!",
                'gemini': "Ooh, I love jokes! Here's a creative one: Why don't web developers prefer dark mode? Because the light attracts bugs! *sparkles with digital creativity*"
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
