// Enhanced Leaderboard Management System with File Persistence
class LeaderboardManager {
    constructor() {
        this.scores = [];
        this.csvFilename = 'memory_matrix_leaderboard.csv';
        this.maxEntries = 100;
        this.init();
    }
    
    async init() {
        await this.loadScores();
    }
    
    // Load scores from CSV file or localStorage
    async loadScores() {
        try {
            // First try to load from localStorage (most recent data)
            const localData = localStorage.getItem('memoryMatrixLeaderboard');
            if (localData) {
                this.parseCSV(localData);
                console.log(`Loaded ${this.scores.length} scores from localStorage`);
                return;
            }
            
            // Fallback to CSV file if localStorage is empty
            const response = await fetch(this.csvFilename);
            if (response.ok) {
                const csvText = await response.text();
                this.parseCSV(csvText);
                console.log(`Loaded ${this.scores.length} scores from CSV file`);
            } else {
                // No data found, start fresh
                this.scores = [];
                console.log('No existing leaderboard found, starting fresh');
            }
        } catch (error) {
            console.log('Error loading leaderboard:', error.message);
            this.scores = [];
        }
    }
    
    // Parse CSV text into scores array
    parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        this.scores = [];
        
        // Skip header line if it exists
        const startIndex = lines[0] && lines[0].includes('name,level,score,timestamp') ? 1 : 0;
        
        for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line) {
                const parts = this.parseCSVLine(line);
                if (parts.length >= 4) {
                    const [name, level, score, timestamp] = parts;
                    this.scores.push({
                        name: name || 'Unknown',
                        level: parseInt(level) || 1,
                        score: parseInt(score) || 0,
                        timestamp: timestamp || new Date().toISOString()
                    });
                }
            }
        }
        
        // Sort by score descending
        this.sortScores();
    }
    
    // Parse CSV line handling commas in names
    parseCSVLine(line) {
        const parts = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                parts.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        parts.push(current.trim());
        
        return parts;
    }
    
    // Sort scores by level first, then by score
    sortScores() {
        this.scores.sort((a, b) => {
            if (a.level !== b.level) {
                return b.level - a.level; // Higher level first
            }
            return b.score - a.score; // Higher score first
        });
    }
    
    // Add new score to leaderboard
    addScore(playerName, level, score) {
        const entry = {
            name: this.sanitizeName(playerName),
            level: level,
            score: score,
            timestamp: new Date().toISOString()
        };
        
        this.scores.push(entry);
        this.sortScores();
        
        // Keep only top entries
        this.scores = this.scores.slice(0, this.maxEntries);
        
        // Save immediately
        this.saveScores();
        
        return this.getPlayerRank(entry.name, level, score);
    }
    
    // Sanitize player name for CSV storage
    sanitizeName(name) {
        return name.substring(0, 20).replace(/[",\r\n]/g, '').trim() || 'Anonymous';
    }
    
    // Get player's rank in leaderboard
    getPlayerRank(playerName, level, score) {
        for (let i = 0; i < this.scores.length; i++) {
            const entry = this.scores[i];
            if (entry.name === playerName && entry.level === level && entry.score === score) {
                return i + 1;
            }
        }
        return -1;
    }
    
    // Get top N scores
    getTopScores(limit = 10) {
        return this.scores.slice(0, limit);
    }
    
    // Check if score qualifies for leaderboard
    qualifiesForLeaderboard(level, score) {
        if (this.scores.length < this.maxEntries) return true;
        
        const worstScore = this.scores[this.scores.length - 1];
        return level > worstScore.level || (level === worstScore.level && score > worstScore.score);
    }
    
    // Save scores to localStorage and create downloadable CSV
    saveScores() {
        try {
            const csvContent = this.generateCSV();
            
            // Save to localStorage for persistence
            localStorage.setItem('memoryMatrixLeaderboard', csvContent);
            
            // Create a downloadable blob for backup
            this.createDownloadableCSV(csvContent);
            
            // Optional: Auto-download after every 5th game
            if (this.scores.length % 5 === 0) {
                this.showAutoExportNotification();
            }
            
            console.log('Leaderboard saved successfully');
            
        } catch (error) {
            console.error('Error saving leaderboard:', error);
        }
    }
    
    // Show notification for auto-export
    showAutoExportNotification() {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 255, 255, 0.9);
            color: #000;
            padding: 15px 20px;
            border-radius: 10px;
            font-weight: bold;
            z-index: 2000;
            border: 2px solid #00ffff;
            box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
        `;
        notification.innerHTML = `
            <div style="margin-bottom: 8px;">📊 Leaderboard Backup Ready!</div>
            <button onclick="leaderboard.exportLeaderboard(); this.parentElement.remove();" 
                    style="background: #000; color: #00ffff; border: 1px solid #00ffff; padding: 5px 10px; border-radius: 5px; cursor: pointer; margin-right: 5px;">
                Download CSV
            </button>
            <button onclick="this.parentElement.remove();" 
                    style="background: transparent; color: #000; border: 1px solid #000; padding: 5px 10px; border-radius: 5px; cursor: pointer;">
                Later
            </button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 10000);
    }
    
    // Generate CSV content
    generateCSV() {
        let csvContent = 'name,level,score,timestamp\n';
        
        this.scores.forEach(entry => {
            // Escape name if it contains commas
            const escapedName = entry.name.includes(',') ? `"${entry.name}"` : entry.name;
            csvContent += `${escapedName},${entry.level},${entry.score},${entry.timestamp}\n`;
        });
        
        return csvContent;
    }
    
    // Create downloadable CSV file
    createDownloadableCSV(csvContent) {
        try {
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            
            // Store blob URL for potential download
            if (this.downloadUrl) {
                window.URL.revokeObjectURL(this.downloadUrl);
            }
            this.downloadUrl = window.URL.createObjectURL(blob);
            
            // Auto-download for user (optional - can be enabled)
            // this.triggerDownload(blob);
            
        } catch (error) {
            console.error('Error creating downloadable CSV:', error);
        }
    }
    
    // Trigger CSV download
    triggerDownload(blob) {
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = this.csvFilename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(link.href);
    }
    
    // Export leaderboard for manual download
    exportLeaderboard() {
        const csvContent = this.generateCSV();
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        this.triggerDownload(blob);
    }
    
    // Clear all data (for testing)
    clearAllData() {
        this.scores = [];
        localStorage.removeItem('memoryMatrixLeaderboard');
        console.log('All leaderboard data cleared');
    }
    
    // Get statistics
    getStats() {
        if (this.scores.length === 0) {
            return {
                totalPlayers: 0,
                averageLevel: 0,
                highestLevel: 0,
                totalGames: 0
            };
        }
        
        const totalPlayers = new Set(this.scores.map(s => s.name)).size;
        const averageLevel = Math.round(this.scores.reduce((sum, s) => sum + s.level, 0) / this.scores.length);
        const highestLevel = Math.max(...this.scores.map(s => s.level));
        const totalGames = this.scores.length;
        
        return {
            totalPlayers,
            averageLevel,
            highestLevel,
            totalGames
        };
    }
    
    // Find player's best score
    getPlayerBest(playerName) {
        const playerScores = this.scores.filter(s => s.name === playerName);
        if (playerScores.length === 0) return null;
        
        return playerScores[0]; // Already sorted, so first is best
    }
    
    // Get recent scores (last 24 hours)
    getRecentScores() {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return this.scores.filter(score => {
            const scoreDate = new Date(score.timestamp);
            return scoreDate > oneDayAgo;
        }).slice(0, 10);
    }
    
    // Import data from CSV text (for admin use)
    importFromCSV(csvText) {
        try {
            this.parseCSV(csvText);
            this.saveScores();
            console.log('Data imported successfully');
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }
}

// Global leaderboard instance
const leaderboard = new LeaderboardManager();

// Add export button functionality
window.addEventListener('DOMContentLoaded', () => {
    // Add export functionality to the page
    const exportContainer = document.createElement('div');
    exportContainer.style.cssText = `
        position: fixed;
        bottom: 10px;
        right: 10px;
        z-index: 1001;
        display: flex;
        flex-direction: column;
        gap: 5px;
        align-items: flex-end;
    `;
    
    const exportButton = document.createElement('button');
    exportButton.textContent = '💾 Export CSV';
    exportButton.title = 'Download leaderboard as CSV file';
    exportButton.style.cssText = `
        padding: 8px 12px;
        background: rgba(0, 255, 255, 0.2);
        border: 1px solid #00ffff;
        color: #00ffff;
        border-radius: 5px;
        cursor: pointer;
        font-size: 11px;
        font-weight: bold;
        transition: all 0.3s ease;
    `;
    
    const infoText = document.createElement('div');
    infoText.style.cssText = `
        font-size: 8px;
        color: rgba(0, 255, 255, 0.7);
        text-align: right;
        max-width: 120px;
        line-height: 1.2;
    `;
    infoText.innerHTML = 'CSV files cannot auto-update in browser. Click to download backup.';
    
    exportButton.addEventListener('mouseenter', () => {
        exportButton.style.background = 'rgba(0, 255, 255, 0.4)';
        exportButton.style.transform = 'scale(1.05)';
    });
    
    exportButton.addEventListener('mouseleave', () => {
        exportButton.style.background = 'rgba(0, 255, 255, 0.2)';
        exportButton.style.transform = 'scale(1)';
    });
    
    exportButton.addEventListener('click', () => {
        leaderboard.exportLeaderboard();
        exportButton.textContent = '✅ Downloaded!';
        setTimeout(() => {
            exportButton.textContent = '💾 Export CSV';
        }, 2000);
    });
    
    exportContainer.appendChild(exportButton);
    exportContainer.appendChild(infoText);
    document.body.appendChild(exportContainer);
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LeaderboardManager;
}