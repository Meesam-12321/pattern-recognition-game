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
        
        // Initialize leaderboard and show welcome screen
        this.initializeLeaderboard();
        
        console.log('Memory Matrix initialized');
    }
    
    // Initialize leaderboard system
    async initializeLeaderboard() {
        try {
            // Ensure leaderboard is properly initialized
            await leaderboard.init();
            this.showWelcomeScreen();
        } catch (error) {
            console.error('Error initializing leaderboard:', error);
            this.showWelcomeScreen();
        }
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
        if (!this.gameState.gameActive) {
            console.log('Challenge generation skipped - game not active');
            return;
        }
        
        // Stop any existing timer
        this.stopTimer();
        
        // Calculate difficulty parameters
        const level = this.gameState.currentLevel;
        
        // Progressive difficulty scaling
        this.challenge.gridSize = Math.min(6, 3 + Math.floor(level / 4));
        this.challenge.sequenceLength = Math.min(12, 3 + Math.floor(level / 2));
        this.challenge.showSpeed = Math.max(400, 800 - (level * 15)); // Faster as levels increase
        
        // Dynamic time limit based on difficulty
        this.gameState.maxTime = Math.max(15, 35 - Math.floor(level / 2)); // More generous time
        this.gameState.timeLeft = this.gameState.maxTime;
        
        // Reset challenge state completely
        this.challenge.sequence = [];
        this.challenge.userSequence = [];
        this.challenge.currentStep = 0;
        this.gameState.showingPattern = true;
        
        // Generate random sequence avoiding consecutive duplicates
        const gridCells = this.challenge.gridSize * this.challenge.gridSize;
        
        for (let i = 0; i < this.challenge.sequenceLength; i++) {
            let newCell;
            let attempts = 0;
            
            do {
                newCell = Math.floor(Math.random() * gridCells);
                attempts++;
                
                // Safety check to prevent infinite loop in small grids
                if (attempts > 50) {
                    console.warn('Too many attempts to find unique cell, allowing duplicate');
                    break;
                }
            } while (i > 0 && newCell === this.challenge.sequence[i - 1] && gridCells > 1);
            
            this.challenge.sequence.push(newCell);
        }
        
        console.log(`Level ${level}: Grid ${this.challenge.gridSize}x${this.challenge.gridSize}, Sequence ${this.challenge.sequenceLength}, Speed ${this.challenge.showSpeed}ms, Time ${this.gameState.maxTime}s`);
        console.log('Generated sequence (no consecutive duplicates):', this.challenge.sequence);
        
        // Verify no consecutive duplicates (for debugging)
        const hasConsecutiveDuplicates = this.challenge.sequence.some((cell, index) => 
            index > 0 && cell === this.challenge.sequence[index - 1]
        );
        if (hasConsecutiveDuplicates) {
            console.warn('Warning: Sequence still has consecutive duplicates!');
        }
        
        // Update UI
        this.elements.challengeTitle.textContent = `LEVEL ${level} - NEURAL PATTERN`;
        this.elements.challengeInstructions.textContent = `Watch carefully! ${this.challenge.sequenceLength} cells will light up...`;
        
        // Create grid
        this.createGrid();
        
        // Show pattern after brief delay
        setTimeout(() => {
            if (this.gameState.gameActive) {
                this.showPattern();
            }
        }, 1200);
        
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
            cell.style.position = 'relative'; // For step indicators
            cell.addEventListener('click', () => this.selectCell(i));
            grid.appendChild(cell);
        }
        
        container.appendChild(grid);
        
        console.log(`Created ${totalCells} cells for ${this.challenge.gridSize}x${this.challenge.gridSize} grid`);
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
        // Make sure game is still active
        if (!this.gameState.gameActive) return;
        
        this.gameState.showingPattern = false;
        
        // Clear all highlights and reset all visual states
        document.querySelectorAll('.memory-cell').forEach(cell => {
            cell.classList.remove('active');
            // Clear any step indicators from previous attempts
            const indicators = cell.querySelectorAll('.step-indicator');
            indicators.forEach(indicator => indicator.remove());
            // Reset styles
            cell.style.boxShadow = '';
            cell.style.borderColor = '';
            cell.style.background = '';
            cell.style.cursor = 'pointer';
            cell.style.pointerEvents = 'auto';
        });
        
        // Reset user sequence
        this.challenge.userSequence = [];
        
        // Update UI
        this.elements.challengeTitle.textContent = 'REPEAT THE PATTERN';
        this.elements.challengeInstructions.textContent = 'Click the cells in the exact same order!';
        
        // Ensure we have valid time before starting timer
        if (this.gameState.timeLeft <= 0) {
            this.gameState.timeLeft = this.gameState.maxTime;
        }
        
        // Start timer
        this.startTimer();
        
        console.log('Player turn started, sequence to match:', this.challenge.sequence);
        console.log('Time available:', this.gameState.timeLeft);
    }
    
    // Handle cell selection
    selectCell(index) {
        // Multiple safety checks
        if (this.gameState.showingPattern || !this.gameState.gameActive) {
            console.log('Cell selection blocked:', { showingPattern: this.gameState.showingPattern, gameActive: this.gameState.gameActive });
            return;
        }
        
        const cell = document.querySelector(`.memory-cell[data-index="${index}"]`);
        if (!cell) {
            console.log('Cell not found:', index);
            return;
        }
        
        const stepIndex = this.challenge.userSequence.length;
        const expectedIndex = this.challenge.sequence[stepIndex];
        
        console.log(`Selected cell ${index}, expected ${expectedIndex} (step ${stepIndex + 1}/${this.challenge.sequence.length})`);
        console.log('Full sequence:', this.challenge.sequence);
        console.log('User sequence so far:', this.challenge.userSequence);
        
        // Add to user sequence
        this.challenge.userSequence.push(index);
        
        if (index === expectedIndex) {
            // Correct selection
            this.sounds.success();
            
            // Create a visual indicator for this step (don't use permanent classes)
            const stepIndicator = document.createElement('div');
            stepIndicator.className = 'step-indicator';
            stepIndicator.textContent = stepIndex + 1;
            stepIndicator.style.cssText = `
                position: absolute;
                top: 2px;
                right: 2px;
                background: #00ff41;
                color: #000;
                border-radius: 50%;
                width: 16px;
                height: 16px;
                font-size: 10px;
                font-weight: bold;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 5;
            `;
            cell.appendChild(stepIndicator);
            
            // Add temporary success effect without permanent class
            cell.style.boxShadow = '0 0 20px #00ff41';
            cell.style.borderColor = '#00ff41';
            
            setTimeout(() => {
                if (cell) {
                    cell.style.boxShadow = '';
                    cell.style.borderColor = '';
                }
            }, 500);
            
            if (this.challenge.userSequence.length === this.challenge.sequence.length) {
                // Pattern completed successfully!
                setTimeout(() => {
                    this.completeLevel();
                }, 300);
            }
        } else {
            // Wrong selection - end game immediately
            this.sounds.error();
            
            // Show error effect
            cell.style.boxShadow = '0 0 20px #ff4444';
            cell.style.borderColor = '#ff4444';
            cell.style.background = 'linear-gradient(135deg, #ff4444, #aa0000)';
            
            // Show correct sequence for debugging
            console.log('WRONG! Expected sequence:', this.challenge.sequence);
            console.log('User clicked:', this.challenge.userSequence);
            
            // Disable further clicks
            document.querySelectorAll('.memory-cell').forEach(c => {
                c.style.pointerEvents = 'none';
            });
            
            setTimeout(() => {
                this.failLevel();
            }, 800);
        }
    }
    
    // Complete level successfully
    completeLevel() {
        this.stopTimer();
        
        // Temporarily disable game to prevent double-clicks
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
        
        // Clean up visual indicators and disable cell interactions
        document.querySelectorAll('.memory-cell').forEach(cell => {
            cell.style.cursor = 'not-allowed';
            cell.style.pointerEvents = 'none';
            // Clear any step indicators
            const indicators = cell.querySelectorAll('.step-indicator');
            indicators.forEach(indicator => indicator.remove());
            // Reset styles
            cell.style.boxShadow = '';
            cell.style.borderColor = '';
            cell.style.background = '';
        });
        
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
        
        // Progress to next level after delay
        setTimeout(() => {
            this.gameState.currentLevel++;
            this.gameState.gameActive = true;
            this.generateChallenge();
        }, 2500);
        
        console.log(`Level ${this.gameState.currentLevel} completed successfully`);
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
        
        // Determine final outcome
        const isHighScore = this.gameState.currentLevel >= 10;
        const subtitle = isHighScore ? 'NEURAL ENHANCEMENT ACHIEVED' : 'SYSTEM RESET REQUIRED';
        
        this.elements.gameOverSubtitle.textContent = subtitle;
        
        // Show final statistics
        const stats = `
            <div class="stat-row">
                <span class="stat-label">MAXIMUM LEVEL REACHED:</span>
                <span class="stat-value">${this.gameState.currentLevel}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">TOTAL NEURAL POINTS:</span>
                <span class="stat-value">${this.gameState.score.toLocaleString()}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">MAXIMUM STREAK:</span>
                <span class="stat-value">${this.gameState.maxStreak}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">COGNITIVE EFFICIENCY:</span>
                <span class="stat-value">${this.calculateEfficiency()}%</span>
            </div>
        `;
        
        this.elements.finalStats.innerHTML = stats;
        
        // Add to leaderboard and show feedback
        console.log(`Adding score to leaderboard: ${this.gameState.playerName}, Level ${this.gameState.currentLevel}, Score ${this.gameState.score}`);
        
        const rank = leaderboard.addScore(
            this.gameState.playerName,
            this.gameState.currentLevel,
            this.gameState.score
        );
        
        console.log(`Player ranked #${rank} in leaderboard`);
        
        // Show ranking with more details
        const totalPlayers = leaderboard.scores.length;
        let rankText = '';
        let rankSubtext = '';
        
        if (rank <= 3) {
            const medals = ['🥇 NEURAL CHAMPION', '🥈 COGNITIVE ELITE', '🥉 PATTERN MASTER'];
            rankText = `${medals[rank - 1]}`;
            rankSubtext = `Rank #${rank} - You're in the top 3!`;
        } else if (rank <= 10) {
            rankText = `🏆 NEURAL SPECIALIST`;
            rankSubtext = `Rank #${rank} - Top 10 Elite!`;
        } else if (rank <= Math.ceil(totalPlayers * 0.25)) {
            rankText = `⚡ COGNITIVE OPERATIVE`;
            rankSubtext = `Rank #${rank} - Top 25% Performer`;
        } else {
            rankText = `🧠 NEURAL RECRUIT`;
            rankSubtext = `Rank #${rank} among ${totalPlayers} specialists`;
        }
        
        this.elements.rankDisplay.innerHTML = `
            <div class="rank-text">${rankText}</div>
            <div class="rank-subtitle">${rankSubtext}</div>
            <div class="rank-stats">
                <small>🎯 Best: Level ${this.gameState.currentLevel} • 💎 Score: ${this.gameState.score.toLocaleString()}</small>
            </div>
        `;
        
        // Show game over screen
        this.elements.gameOverScreen.classList.remove('hidden');
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
        // Clear any existing timer first
        this.stopTimer();
        
        // Make sure we have valid time
        if (this.gameState.timeLeft <= 0) {
            this.gameState.timeLeft = this.gameState.maxTime;
        }
        
        this.gameTimer = setInterval(() => {
            this.gameState.timeLeft--;
            this.updateDisplay();
            
            if (this.gameState.timeLeft <= 5) {
                this.elements.gameTimer.classList.add('warning');
            }
            
            if (this.gameState.timeLeft <= 0) {
                this.stopTimer();
                // Only fail if game is still active and not showing pattern
                if (this.gameState.gameActive && !this.gameState.showingPattern) {
                    this.failLevel();
                }
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
        
        // Add stats header
        const stats = leaderboard.getStats();
        const statsHeader = document.createElement('div');
        statsHeader.className = 'leaderboard-stats';
        statsHeader.style.cssText = `
            padding: 10px 20px;
            background: rgba(0, 255, 255, 0.05);
            border: 1px solid rgba(0, 255, 255, 0.2);
            border-radius: 5px;
            margin-bottom: 15px;
            font-size: 12px;
            color: #00ffff;
            text-align: center;
        `;
        statsHeader.innerHTML = `
            Total Specialists: ${stats.totalPlayers} | 
            Games Played: ${stats.totalGames} | 
            Highest Level: ${stats.highestLevel} | 
            Avg Level: ${stats.averageLevel}
        `;
        container.appendChild(statsHeader);
        
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
            
            // Format timestamp
            const date = new Date(score.timestamp);
            const timeAgo = this.getTimeAgo(date);
            
            entry.innerHTML = `
                <div class="rank-number ${rankClass}">${rank}</div>
                <div class="player-name" title="Played ${timeAgo}">${score.name}</div>
                <div class="player-level">${score.level}</div>
                <div class="player-score">${score.score.toLocaleString()}</div>
            `;
            
            container.appendChild(entry);
        });
        
        console.log(`Leaderboard updated with ${topScores.length} entries`);
    }
    
    // Get human-readable time ago
    getTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${diffDays}d ago`;
    }
    
    // Restart game
    restartGame() {
        // Stop any running timers
        this.stopTimer();
        
        // Reset game state completely
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
        
        // Reset challenge state
        this.challenge = {
            sequence: [],
            userSequence: [],
            gridSize: 3,
            sequenceLength: 3,
            showSpeed: 800,
            currentStep: 0
        };
        
        // Clear any existing grid
        this.elements.challengeContent.innerHTML = '';
        
        // Hide game over screen and show welcome
        this.elements.gameOverScreen.classList.add('hidden');
        this.showWelcomeScreen();
        
        // Clear the name input to force re-entry
        this.elements.playerName.value = '';
        
        console.log('Game restarted, ready for new player');
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

// Initialize game when DOM is ready
const game = new MemoryMatrixGame();

// Export for global access
window.game = game;