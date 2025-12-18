// Enhanced Memory Matrix Game - Pattern Recognition Focus
class MemoryMatrixGame {
    constructor() {
        this.gameState = {
            currentLevel: 1,
            score: 0,
            streak: 0,
            maxStreak: 0,
            lives: 3,
            timeLeft: 0,
            maxTime: 0,
            gameTimer: null,
            playerName: '',
            gameActive: false,
            showingPattern: false
        };
        
        // Session tracking for live stats
        this.sessionStats = {
            gamesPlayed: 0,
            bestLevel: 0,
            totalScore: 0,
            currentRank: null
        };
        
        // Memory level definitions
        this.memoryLevels = [
            { min: 1, max: 2, badge: "🧠 NEURAL ROOKIE", desc: "Your memory journey begins!" },
            { min: 3, max: 4, badge: "🔋 SYNAPSE STARTER", desc: "Building neural pathways..." },
            { min: 5, max: 7, badge: "⚡ COGNITIVE CADET", desc: "Connections are strengthening!" },
            { min: 8, max: 10, badge: "🎯 PATTERN TRACKER", desc: "Your focus is impressive!" },
            { min: 11, max: 15, badge: "🚀 MEMORY MAVEN", desc: "Outstanding recall abilities!" },
            { min: 16, max: 20, badge: "💎 NEURAL NINJA", desc: "Elite pattern recognition!" },
            { min: 21, max: 25, badge: "🏆 COGNITIVE CHAMPION", desc: "Exceptional mental prowess!" },
            { min: 26, max: 30, badge: "👑 MEMORY MASTER", desc: "Legendary cognitive skills!" },
            { min: 31, max: 999, badge: "🌟 NEURAL LEGEND", desc: "Transcendent mental abilities!" }
        ];
        
        this.challenge = {
            sequence: [],
            userSequence: [],
            gridSize: 3,
            sequenceLength: 3,
            showSpeed: 800,
            currentStep: 0
        };
        
        this.elements = {};
        this.sounds = {
            success: this.createTone(800, 0.1),
            error: this.createTone(200, 0.3),
            activate: this.createTone(1000, 0.1),
            levelUp: this.createTone(1200, 0.2)
        };
        
        this.init();
    }
    
    // Initialize game
    init() {
        this.cacheElements();
        this.bindEvents();
        this.showWelcomeScreen();
        
        console.log('Memory Matrix initialized');
    }
    
    // Cache DOM elements
    cacheElements() {
        this.elements = {
            // Game elements
            currentLevel: document.getElementById('currentLevel'),
            currentScore: document.getElementById('currentScore'),
            currentStreak: document.getElementById('currentStreak'),
            gameTimer: document.getElementById('gameTimer'),
            timerFill: document.getElementById('timerFill'),
            challengeTitle: document.getElementById('challengeTitle'),
            challengeContent: document.getElementById('challengeContent'),
            challengeInstructions: document.getElementById('challengeInstructions'),
            actionBar: document.getElementById('actionBar'),
            
            // Sidebar elements
            liveLeaderboard: document.getElementById('liveLeaderboard'),
            currentRank: document.getElementById('currentRank'),
            levelBadge: document.getElementById('levelBadge'),
            levelDescription: document.getElementById('levelDescription'),
            miniLeaderboard: document.getElementById('miniLeaderboard'),
            sessionBestLevel: document.getElementById('sessionBestLevel'),
            sessionGames: document.getElementById('sessionGames'),
            sessionScore: document.getElementById('sessionScore'),
            
            // Screens
            welcomeScreen: document.getElementById('welcomeScreen'),
            gameOverScreen: document.getElementById('gameOverScreen'),
            leaderboardScreen: document.getElementById('leaderboardScreen'),
            
            // Inputs and buttons
            playerName: document.getElementById('playerName'),
            startGameBtn: document.getElementById('startGameBtn'),
            showLeaderboardBtn: document.getElementById('showLeaderboardBtn'),
            playAgainBtn: document.getElementById('playAgainBtn'),
            viewLeaderboardBtn: document.getElementById('viewLeaderboardBtn'),
            backFromLeaderboardBtn: document.getElementById('backFromLeaderboardBtn'),
            
            // Results
            gameOverSubtitle: document.getElementById('gameOverSubtitle'),
            finalStats: document.getElementById('finalStats'),
            rankDisplay: document.getElementById('rankDisplay'),
            leaderboardList: document.getElementById('leaderboardList'),
            
            // Status
            statusMessages: document.getElementById('statusMessages')
        };
    }
    
    // Bind event listeners
    bindEvents() {
        this.elements.startGameBtn.addEventListener('click', () => this.startGame());
        this.elements.showLeaderboardBtn.addEventListener('click', () => this.showLeaderboard());
        this.elements.playAgainBtn.addEventListener('click', () => this.restartGame());
        this.elements.viewLeaderboardBtn.addEventListener('click', () => this.showLeaderboard());
        this.elements.backFromLeaderboardBtn.addEventListener('click', () => this.showWelcomeScreen());
        
        // Enter key to start game
        this.elements.playerName.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && this.elements.playerName.value.trim()) {
                this.startGame();
            }
        });
        
        // Auto-focus name input
        this.elements.playerName.addEventListener('focus', () => {
            this.elements.startGameBtn.classList.add('pulse');
        });
        
        this.elements.playerName.addEventListener('blur', () => {
            this.elements.startGameBtn.classList.remove('pulse');
        });
    }
    
    // Create simple audio feedback
    createTone(frequency, duration) {
        return () => {
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.value = frequency;
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + duration);
            } catch (e) {
                // Audio not available, continue silently
            }
        };
    }
    
    // Show welcome screen
    showWelcomeScreen() {
        this.elements.welcomeScreen.classList.remove('hidden');
        this.elements.gameOverScreen.classList.add('hidden');
        this.elements.leaderboardScreen.classList.add('hidden');
        
        // Focus name input
        setTimeout(() => {
            this.elements.playerName.focus();
        }, 300);
    }
    
    // Start new game
    startGame() {
        const playerName = this.elements.playerName.value.trim();
        if (!playerName) {
            this.showMessage('Please enter your neural tag!', 'error');
            this.elements.playerName.focus();
            return;
        }
        
        // Initialize game state
        this.gameState = {
            currentLevel: 1,
            score: 0,
            streak: 0,
            maxStreak: 0,
            lives: 3,
            playerName: playerName,
            gameActive: true,
            showingPattern: false
        };
        
        this.elements.welcomeScreen.classList.add('hidden');
        this.updateDisplay();
        
        this.showMessage('NEURAL LINK ESTABLISHED', 'success');
        
        setTimeout(() => {
            this.generateChallenge();
        }, 1500);
    }
    
    // Generate challenge based on current level
    generateChallenge() {
        if (!this.gameState.gameActive) return;
        
        // Stop any existing timer
        this.stopTimer();
        
        // Calculate difficulty parameters
        const level = this.gameState.currentLevel;
        
        // Progressive difficulty scaling
        this.challenge.gridSize = Math.min(6, 3 + Math.floor(level / 4));
        this.challenge.sequenceLength = Math.min(12, 3 + Math.floor(level / 2));
        this.challenge.showSpeed = Math.max(400, 800 - (level * 15)); // Faster as levels increase
        
        // Dynamic time limit based on difficulty
        this.gameState.maxTime = Math.max(10, 30 - Math.floor(level / 3));
        this.gameState.timeLeft = this.gameState.maxTime;
        
        // Reset challenge state
        this.challenge.sequence = [];
        this.challenge.userSequence = [];
        this.challenge.currentStep = 0;
        this.gameState.showingPattern = true;
        
        // Generate random sequence
        const gridCells = this.challenge.gridSize * this.challenge.gridSize;
        for (let i = 0; i < this.challenge.sequenceLength; i++) {
            this.challenge.sequence.push(Math.floor(Math.random() * gridCells));
        }
        
        console.log(`Level ${level}: Grid ${this.challenge.gridSize}x${this.challenge.gridSize}, Sequence ${this.challenge.sequenceLength}, Speed ${this.challenge.showSpeed}ms`);
        
        // Update UI
        this.elements.challengeTitle.textContent = `LEVEL ${level} - NEURAL PATTERN`;
        this.elements.challengeInstructions.textContent = `Watch carefully! ${this.challenge.sequenceLength} cells will light up...`;
        
        // Create grid
        this.createGrid();
        
        // Show pattern after brief delay
        setTimeout(() => {
            this.showPattern();
        }, 1000);
        
        this.updateDisplay();
    }
    
    // Create memory grid
    createGrid() {
        const container = this.elements.challengeContent;
        container.innerHTML = '';
        
        const grid = document.createElement('div');
        grid.className = 'memory-grid';
        grid.style.gridTemplateColumns = `repeat(${this.challenge.gridSize}, 1fr)`;
        
        const totalCells = this.challenge.gridSize * this.challenge.gridSize;
        
        for (let i = 0; i < totalCells; i++) {
            const cell = document.createElement('div');
            cell.className = 'memory-cell';
            cell.dataset.index = i;
            cell.addEventListener('click', () => this.selectCell(i));
            grid.appendChild(cell);
        }
        
        container.appendChild(grid);
    }
    
    // Show pattern sequence
    showPattern() {
        let step = 0;
        this.gameState.showingPattern = true;
        
        const showStep = () => {
            // Clear previous highlights
            document.querySelectorAll('.memory-cell').forEach(cell => {
                cell.classList.remove('active');
            });
            
            if (step < this.challenge.sequence.length) {
                // Highlight current cell
                const cellIndex = this.challenge.sequence[step];
                const cell = document.querySelector(`.memory-cell[data-index="${cellIndex}"]`);
                
                if (cell) {
                    cell.classList.add('active');
                    this.sounds.activate();
                }
                
                step++;
                setTimeout(showStep, this.challenge.showSpeed);
            } else {
                // Pattern shown, now player's turn
                this.startPlayerTurn();
            }
        };
        
        showStep();
    }
    
    // Start player's turn
    startPlayerTurn() {
        this.gameState.showingPattern = false;
        
        // Clear all highlights
        document.querySelectorAll('.memory-cell').forEach(cell => {
            cell.classList.remove('active');
        });
        
        // Update UI
        this.elements.challengeTitle.textContent = 'REPEAT THE PATTERN';
        this.elements.challengeInstructions.textContent = 'Click the cells in the exact same order!';
        
        // Start timer
        this.startTimer();
        
        // Add visual feedback
        document.querySelectorAll('.memory-cell').forEach(cell => {
            cell.style.cursor = 'pointer';
        });
    }
    
    // Handle cell selection
    selectCell(index) {
        if (this.gameState.showingPattern || !this.gameState.gameActive) return;
        
        const cell = document.querySelector(`.memory-cell[data-index="${index}"]`);
        const stepIndex = this.challenge.userSequence.length;
        const expectedIndex = this.challenge.sequence[stepIndex];
        
        console.log(`Selected cell ${index}, expected ${expectedIndex} (step ${stepIndex})`);
        
        this.challenge.userSequence.push(index);
        
        if (index === expectedIndex) {
            // Correct selection
            cell.classList.add('correct');
            this.sounds.success();
            
            if (this.challenge.userSequence.length === this.challenge.sequence.length) {
                // Pattern completed successfully!
                this.completeLevel();
            }
        } else {
            // Wrong selection
            cell.classList.add('wrong');
            this.sounds.error();
            this.failLevel();
        }
    }
    
    // Complete level successfully
    completeLevel() {
        this.stopTimer();
        this.gameState.gameActive = false;
        
        // Calculate score
        const timeBonus = this.gameState.timeLeft * 10;
        const levelBonus = this.gameState.currentLevel * 100;
        const streakBonus = this.gameState.streak * 50;
        const levelScore = levelBonus + timeBonus + streakBonus;
        
        this.gameState.score += levelScore;
        this.gameState.streak++;
        this.gameState.maxStreak = Math.max(this.gameState.maxStreak, this.gameState.streak);
        
        // Update display
        this.updateDisplay();
        
        // Show success message
        const messages = [
            'NEURAL LINK STRONGER!',
            'PATTERN RECOGNIZED!',
            'SYNAPSES FIRING!',
            'MEMORY ENHANCED!',
            'COGNITIVE BOOST!'
        ];
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        
        this.showMessage(randomMessage, 'success');
        
        if (this.gameState.currentLevel % 5 === 0) {
            this.showMessage(`LEVEL ${this.gameState.currentLevel} COMPLETE!`, 'level-up');
            this.sounds.levelUp();
        }
        
        // Progress to next level
        setTimeout(() => {
            this.gameState.currentLevel++;
            this.gameState.gameActive = true;
            this.generateChallenge();
        }, 2000);
    }
    
    // Handle level failure
    failLevel() {
        this.stopTimer();
        this.gameState.gameActive = false;
        this.gameState.streak = 0;
        
        const failMessages = [
            'NEURAL INTERFERENCE!',
            'PATTERN DISRUPTED!',
            'CONNECTION LOST!',
            'COGNITIVE OVERLOAD!',
            'SYNAPTIC FAILURE!'
        ];
        const randomMessage = failMessages[Math.floor(Math.random() * failMessages.length)];
        
        this.showMessage(randomMessage, 'error');
        
        setTimeout(() => {
            this.gameOver();
        }, 2000);
    }
    
    // Game over
    gameOver() {
        this.stopTimer();
        this.gameState.gameActive = false;
        
        // Update session stats
        this.sessionStats.gamesPlayed++;
        this.sessionStats.bestLevel = Math.max(this.sessionStats.bestLevel, this.gameState.currentLevel);
        this.sessionStats.totalScore += this.gameState.score;
        
        // Get memory level assessment
        const memoryLevel = this.memoryLevels.find(ml => 
            this.gameState.currentLevel >= ml.min && this.gameState.currentLevel <= ml.max
        );
        
        // Determine final outcome with positive messaging
        const isHighScore = this.gameState.currentLevel >= 10;
        const subtitle = isHighScore ? 'NEURAL ENHANCEMENT ACHIEVED' : 'EXCELLENT NEURAL WORKOUT';
        
        this.elements.gameOverSubtitle.textContent = subtitle;
        
        // Show final statistics with positive memory assessment
        const memoryAssessment = this.getPositiveMemoryAssessment(this.gameState.currentLevel);
        
        const stats = `
            <div class="memory-assessment" style="background: rgba(0,255,255,0.1); padding: 15px; border-radius: 10px; margin-bottom: 20px; border: 1px solid rgba(0,255,255,0.3);">
                <div style="font-size: 14px; color: #00ffff; font-weight: bold; margin-bottom: 8px;">🧠 MEMORY ASSESSMENT</div>
                <div style="font-size: 16px; color: #00ff41; font-weight: bold; margin-bottom: 10px; font-family: 'Orbitron', monospace;">${memoryLevel ? memoryLevel.badge : '🧠 NEURAL TRAINEE'}</div>
                <div style="font-size: 12px; color: #ffffff; line-height: 1.4;">${memoryAssessment}</div>
            </div>
            <div class="performance-stats">
                <div class="stat-row">
                    <span class="stat-label">MAXIMUM LEVEL REACHED:</span>
                    <span class="stat-value">${this.gameState.currentLevel}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">NEURAL POINTS EARNED:</span>
                    <span class="stat-value">${this.gameState.score.toLocaleString()}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">MAXIMUM STREAK:</span>
                    <span class="stat-value">${this.gameState.maxStreak} levels</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">COGNITIVE PERFORMANCE:</span>
                    <span class="stat-value">${this.calculateEfficiency()}% efficiency</span>
                </div>
            </div>
        `;
        
        this.elements.finalStats.innerHTML = stats;
        
        // Add to leaderboard
        const rank = leaderboard.addScore(
            this.gameState.playerName,
            this.gameState.currentLevel,
            this.gameState.score
        );
        
        // Show ranking
        let rankText = '';
        if (rank <= 3) {
            const medals = ['🥇', '🥈', '🥉'];
            rankText = `${medals[rank - 1]} NEURAL ELITE RANK #${rank}!`;
        } else if (rank <= 10) {
            rankText = `🏆 TOP 10 SPECIALIST - RANK #${rank}`;
        } else {
            rankText = `RANKED #${rank} IN NEURAL NETWORK`;
        }
        
        this.elements.rankDisplay.innerHTML = `
            <div class="rank-text">${rankText}</div>
            <div class="rank-subtitle">Among ${leaderboard.scores.length} Neural Specialists</div>
        `;
        
        // Show game over screen
        this.elements.gameOverScreen.classList.remove('hidden');
    }
    
    // Get positive memory assessment based on level reached
    getPositiveMemoryAssessment(level) {
        if (level >= 25) return "🌟 Extraordinary! Your memory is operating at an elite level. You've demonstrated exceptional pattern recognition and recall abilities that place you among the cognitive elite.";
        if (level >= 20) return "👑 Outstanding! Your memory skills are truly impressive. You've shown remarkable ability to process and recall complex patterns with precision and speed.";
        if (level >= 15) return "💎 Excellent work! Your memory is performing exceptionally well. You've demonstrated strong pattern recognition and sustained attention that's well above average.";
        if (level >= 10) return "🏆 Great job! Your memory skills are really developing nicely. You've shown good focus and pattern recognition abilities that are steadily improving.";
        if (level >= 7) return "🚀 Well done! You're making solid progress with your memory training. Your brain is adapting well to pattern recognition challenges.";
        if (level >= 5) return "⚡ Good effort! Your memory is warming up beautifully. You're building strong neural pathways for pattern recognition.";
        if (level >= 3) return "🔋 Nice start! Your memory is getting into the groove. Every level completed strengthens your cognitive abilities.";
        return "🧠 Great beginning! You've taken the first steps in memory training. Your brain is already starting to form new neural connections. Keep practicing!";
    }
    
    // Update memory level assessment
    updateMemoryLevel() {
        const level = this.gameState.currentLevel;
        const memoryLevel = this.memoryLevels.find(ml => level >= ml.min && level <= ml.max);
        
        if (memoryLevel && this.elements.levelBadge && this.elements.levelDescription) {
            this.elements.levelBadge.textContent = memoryLevel.badge;
            this.elements.levelDescription.textContent = memoryLevel.desc;
        }
    }
    
    // Update current rank display
    updateCurrentRank() {
        if (!this.elements.currentRank) return;
        
        if (!this.gameState.playerName || !this.gameState.gameActive) {
            this.elements.currentRank.textContent = 'Play to get ranked!';
            return;
        }
        
        // Find approximate rank based on current performance
        const currentPerformance = {
            level: this.gameState.currentLevel,
            score: this.gameState.score
        };
        
        const betterPlayers = leaderboard.scores.filter(score => 
            score.level > currentPerformance.level || 
            (score.level === currentPerformance.level && score.score > currentPerformance.score)
        );
        
        const estimatedRank = betterPlayers.length + 1;
        this.sessionStats.currentRank = estimatedRank;
        
        if (estimatedRank <= 3) {
            this.elements.currentRank.innerHTML = `🏆 Currently #${estimatedRank}!`;
        } else if (estimatedRank <= 10) {
            this.elements.currentRank.innerHTML = `⚡ Currently #${estimatedRank}`;
        } else {
            this.elements.currentRank.innerHTML = `🧠 Currently #${estimatedRank}`;
        }
    }
    
    // Update mini leaderboard
    updateMiniLeaderboard() {
        if (!this.elements.miniLeaderboard) return;
        
        const topPlayers = leaderboard.getTopScores(5);
        const container = this.elements.miniLeaderboard;
        container.innerHTML = '';
        
        if (topPlayers.length === 0) {
            container.innerHTML = '<div style="text-align: center; color: #666; font-size: 10px;">No players yet</div>';
            return;
        }
        
        topPlayers.forEach((player, index) => {
            const entry = document.createElement('div');
            entry.className = 'mini-entry';
            
            // Add special styling for top 3
            if (index === 0) entry.classList.add('top-1');
            else if (index === 1) entry.classList.add('top-2');
            else if (index === 2) entry.classList.add('top-3');
            
            // Highlight current player
            if (player.name === this.gameState.playerName) {
                entry.classList.add('current-player');
            }
            
            entry.innerHTML = `
                <div class="mini-rank">${index + 1}</div>
                <div class="mini-name">${player.name}</div>
                <div class="mini-level">L${player.level}</div>
            `;
            
            container.appendChild(entry);
        });
    }
    
    // Update session statistics
    updateSessionStats() {
        if (this.elements.sessionBestLevel) {
            this.elements.sessionBestLevel.textContent = this.sessionStats.bestLevel;
        }
        if (this.elements.sessionGames) {
            this.elements.sessionGames.textContent = this.sessionStats.gamesPlayed;
        }
        if (this.elements.sessionScore) {
            this.elements.sessionScore.textContent = this.sessionStats.totalScore.toLocaleString();
        }
    }
    
    // Calculate efficiency percentage
    calculateEfficiency() {
        if (this.gameState.currentLevel <= 1) return 0;
        
        const maxPossibleScore = this.gameState.currentLevel * 150; // Rough estimate
        const efficiency = Math.min(100, (this.gameState.score / maxPossibleScore) * 100);
        return Math.round(efficiency);
    }
    
    // Start countdown timer
    startTimer() {
        this.gameTimer = setInterval(() => {
            this.gameState.timeLeft--;
            this.updateDisplay();
            
            if (this.gameState.timeLeft <= 5) {
                this.elements.gameTimer.classList.add('warning');
            }
            
            if (this.gameState.timeLeft <= 0) {
                this.stopTimer();
                this.failLevel();
            }
        }, 1000);
    }
    
    // Stop timer
    stopTimer() {
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            this.gameTimer = null;
        }
        this.elements.gameTimer.classList.remove('warning');
    }
    
    // Update display elements
    updateDisplay() {
        this.elements.currentLevel.textContent = this.gameState.currentLevel;
        this.elements.currentScore.textContent = this.gameState.score.toLocaleString();
        this.elements.currentStreak.textContent = this.gameState.streak;
        this.elements.gameTimer.textContent = this.gameState.timeLeft;
        
        // Update timer bar
        if (this.gameState.maxTime > 0) {
            const percentage = (this.gameState.timeLeft / this.gameState.maxTime) * 100;
            this.elements.timerFill.style.width = `${percentage}%`;
        }
        
        // Update sidebar
        this.updateSidebar();
    }
    
    // Update sidebar with live information
    updateSidebar() {
        // Only update sidebar if elements exist (sidebar might be hidden on welcome screen)
        if (!this.elements.liveLeaderboard || this.elements.welcomeScreen.classList.contains('hidden') === false) {
            return;
        }
        
        // Update memory level
        this.updateMemoryLevel();
        
        // Update current rank
        this.updateCurrentRank();
        
        // Update mini leaderboard
        this.updateMiniLeaderboard();
        
        // Update session stats
        this.updateSessionStats();
    }
    
    // Update memory level assessment
    updateMemoryLevel() {
        const level = this.gameState.currentLevel;
        const memoryLevel = this.memoryLevels.find(ml => level >= ml.min && level <= ml.max);
        
        if (memoryLevel) {
            this.elements.levelBadge.textContent = memoryLevel.badge;
            this.elements.levelDescription.textContent = memoryLevel.desc;
        }
    }
    
    // Update current rank display
    updateCurrentRank() {
        if (!this.gameState.playerName || !this.gameState.gameActive) {
            this.elements.currentRank.textContent = 'Play to get ranked!';
            return;
        }
        
        // Find approximate rank based on current performance
        const currentPerformance = {
            level: this.gameState.currentLevel,
            score: this.gameState.score
        };
        
        const betterPlayers = leaderboard.scores.filter(score => 
            score.level > currentPerformance.level || 
            (score.level === currentPerformance.level && score.score > currentPerformance.score)
        );
        
        const estimatedRank = betterPlayers.length + 1;
        this.sessionStats.currentRank = estimatedRank;
        
        if (estimatedRank <= 3) {
            this.elements.currentRank.innerHTML = `🏆 Currently #${estimatedRank}!`;
        } else if (estimatedRank <= 10) {
            this.elements.currentRank.innerHTML = `⚡ Currently #${estimatedRank}`;
        } else {
            this.elements.currentRank.innerHTML = `🧠 Currently #${estimatedRank}`;
        }
    }
    
    // Update mini leaderboard
    updateMiniLeaderboard() {
        const topPlayers = leaderboard.getTopScores(5);
        const container = this.elements.miniLeaderboard;
        container.innerHTML = '';
        
        if (topPlayers.length === 0) {
            container.innerHTML = '<div style="text-align: center; color: #666; font-size: 10px;">No players yet</div>';
            return;
        }
        
        topPlayers.forEach((player, index) => {
            const entry = document.createElement('div');
            entry.className = 'mini-entry';
            
            // Add special styling for top 3
            if (index === 0) entry.classList.add('top-1');
            else if (index === 1) entry.classList.add('top-2');
            else if (index === 2) entry.classList.add('top-3');
            
            // Highlight current player
            if (player.name === this.gameState.playerName) {
                entry.classList.add('current-player');
            }
            
            entry.innerHTML = `
                <div class="mini-rank">${index + 1}</div>
                <div class="mini-name">${player.name}</div>
                <div class="mini-level">L${player.level}</div>
            `;
            
            container.appendChild(entry);
        });
    }
    
    // Update session statistics
    updateSessionStats() {
        this.elements.sessionBestLevel.textContent = this.sessionStats.bestLevel;
        this.elements.sessionGames.textContent = this.sessionStats.gamesPlayed;
        this.elements.sessionScore.textContent = this.sessionStats.totalScore.toLocaleString();
    }
    
    // Show leaderboard
    showLeaderboard() {
        this.elements.leaderboardScreen.classList.remove('hidden');
        this.elements.welcomeScreen.classList.add('hidden');
        this.elements.gameOverScreen.classList.add('hidden');
        
        this.updateLeaderboardDisplay();
    }
    
    // Update leaderboard display
    updateLeaderboardDisplay() {
        const topScores = leaderboard.getTopScores(20);
        const container = this.elements.leaderboardList;
        container.innerHTML = '';
        
        if (topScores.length === 0) {
            container.innerHTML = '<div class="no-scores">No neural specialists recorded yet...</div>';
            return;
        }
        
        topScores.forEach((score, index) => {
            const entry = document.createElement('div');
            entry.className = 'leaderboard-entry';
            
            // Highlight current player
            if (score.name === this.gameState.playerName) {
                entry.classList.add('current-player');
            }
            
            const rank = index + 1;
            let rankClass = '';
            if (rank === 1) rankClass = 'gold';
            else if (rank === 2) rankClass = 'silver';
            else if (rank === 3) rankClass = 'bronze';
            
            entry.innerHTML = `
                <div class="rank-number ${rankClass}">${rank}</div>
                <div class="player-name">${score.name}</div>
                <div class="player-level">${score.level}</div>
                <div class="player-score">${score.score.toLocaleString()}</div>
            `;
            
            container.appendChild(entry);
        });
    }
    
    // Restart game
    restartGame() {
        this.elements.gameOverScreen.classList.add('hidden');
        this.showWelcomeScreen();
        
        // Keep the same player name
        this.elements.playerName.value = this.gameState.playerName;
    }
    
    // Show status message
    showMessage(text, type = 'info', duration = 2000) {
        const message = document.createElement('div');
        message.className = `status-message ${type}`;
        message.textContent = text;
        
        this.elements.statusMessages.appendChild(message);
        
        setTimeout(() => {
            if (message.parentNode) {
                message.remove();
            }
        }, duration);
    }
}

// Export for global access
window.MemoryMatrixGame = MemoryMatrixGame;