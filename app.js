// מחלקה לניהול אחסון מקומי
class StorageManager {
    constructor() {
        this.storageKey = 'multiplicationAppData';
        this.data = this.loadData();
    }

    loadData() {
        const saved = localStorage.getItem(this.storageKey);
        if (saved) {
            return JSON.parse(saved);
        }
        return {
            totalQuestions: 0,
            correctAnswers: 0,
            bestStreak: 0,
            byNumber: {}, // סטטיסטיקות לפי מספר
            history: []
        };
    }

    saveData() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    }

    addAnswer(num1, num2, userAnswer, correctAnswer, isCorrect) {
        this.data.totalQuestions++;
        if (isCorrect) {
            this.data.correctAnswers++;
        }

        // עדכון סטטיסטיקות לפי מספר
        [num1, num2].forEach(num => {
            if (!this.data.byNumber[num]) {
                this.data.byNumber[num] = {
                    asked: 0,
                    correct: 0
                };
            }
            this.data.byNumber[num].asked++;
            if (isCorrect) {
                this.data.byNumber[num].correct++;
            }
        });

        // שמירת היסטוריה
        this.data.history.push({
            num1,
            num2,
            userAnswer,
            correctAnswer,
            isCorrect,
            timestamp: new Date().toISOString()
        });

        // שמירה רק ל-100 השאלות האחרונות
        if (this.data.history.length > 100) {
            this.data.history.shift();
        }

        this.saveData();
    }

    updateBestStreak(streak) {
        if (streak > this.data.bestStreak) {
            this.data.bestStreak = streak;
            this.saveData();
        }
    }

    getStats() {
        return {
            totalQuestions: this.data.totalQuestions,
            correctAnswers: this.data.correctAnswers,
            successRate: this.data.totalQuestions > 0 
                ? Math.round((this.data.correctAnswers / this.data.totalQuestions) * 100) 
                : 0,
            bestStreak: this.data.bestStreak,
            byNumber: this.data.byNumber
        };
    }

    reset() {
        this.data = {
            totalQuestions: 0,
            correctAnswers: 0,
            bestStreak: 0,
            byNumber: {},
            history: []
        };
        this.saveData();
    }
}

// מחלקה לניהול המשחק
class MultiplicationGame {
    constructor() {
        this.storage = new StorageManager();
        this.maxNumber = 10;
        this.currentStreak = 0;
        this.sessionScore = 0;
        this.sessionTotal = 0;
        this.currentQuestion = null;
        
        this.initElements();
        this.initEventListeners();
        this.updateHomeStats();
    }

    initElements() {
        // מסכים
        this.homeScreen = document.getElementById('homeScreen');
        this.gameScreen = document.getElementById('gameScreen');
        this.statsScreen = document.getElementById('statsScreen');

        // כפתורים ראשיים
        this.startBtn = document.getElementById('startBtn');
        this.backBtn = document.getElementById('backBtn');
        this.viewStatsBtn = document.getElementById('viewStatsBtn');
        this.backFromStatsBtn = document.getElementById('backFromStatsBtn');
        this.resetBtn = document.getElementById('resetBtn');

        // כפתורי רמת קושי
        this.difficultyBtns = document.querySelectorAll('.difficulty-btn');

        // אלמנטי משחק
        this.num1El = document.getElementById('num1');
        this.num2El = document.getElementById('num2');
        this.answerInput = document.getElementById('answerInput');
        this.submitBtn = document.getElementById('submitBtn');
        this.answerButtons = document.getElementById('answerButtons');
        this.feedback = document.getElementById('feedback');
        this.currentStreakEl = document.getElementById('currentStreak');
        this.currentScoreEl = document.getElementById('currentScore');
        this.totalAskedEl = document.getElementById('totalAsked');

        // סטטיסטיקות בית
        this.totalQuestionsEl = document.getElementById('totalQuestions');
        this.correctAnswersEl = document.getElementById('correctAnswers');
        this.successRateEl = document.getElementById('successRate');
        this.bestStreakEl = document.getElementById('bestStreak');

        // סטטיסטיקות מפורטות
        this.summaryStats = document.getElementById('summaryStats');
        this.numberStats = document.getElementById('numberStats');
    }

    initEventListeners() {
        this.startBtn.addEventListener('click', () => this.startGame());
        this.backBtn.addEventListener('click', () => this.showScreen('home'));
        this.viewStatsBtn.addEventListener('click', () => this.showDetailedStats());
        this.backFromStatsBtn.addEventListener('click', () => this.showScreen('home'));
        this.resetBtn.addEventListener('click', () => this.resetData());

        this.difficultyBtns.forEach(btn => {
            btn.addEventListener('click', () => this.selectDifficulty(btn));
        });

        this.submitBtn.addEventListener('click', () => this.checkAnswer());
        this.answerInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.checkAnswer();
            }
        });
    }

    selectDifficulty(btn) {
        this.difficultyBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.maxNumber = parseInt(btn.dataset.max);
    }

    showScreen(screen) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        
        if (screen === 'home') {
            this.homeScreen.classList.add('active');
            this.updateHomeStats();
        } else if (screen === 'game') {
            this.gameScreen.classList.add('active');
        } else if (screen === 'stats') {
            this.statsScreen.classList.add('active');
        }
    }

    startGame() {
        this.sessionScore = 0;
        this.sessionTotal = 0;
        this.currentStreak = 0;
        this.updateGameDisplay();
        this.showScreen('game');
        this.nextQuestion();
    }

    nextQuestion() {
        const num1 = Math.floor(Math.random() * this.maxNumber) + 1;
        const num2 = Math.floor(Math.random() * this.maxNumber) + 1;
        
        this.currentQuestion = {
            num1,
            num2,
            answer: num1 * num2
        };

        this.num1El.textContent = num1;
        this.num2El.textContent = num2;
        this.answerInput.value = '';
        this.answerInput.focus();
        
        this.feedback.classList.remove('show', 'correct', 'wrong');
        
        // יצירת כפתורי תשובה (אופציונלי - מוסתר כרגע)
        this.generateAnswerButtons();
    }

    generateAnswerButtons() {
        // ניתן להפעיל תכונה זו אם רוצים כפתורים במקום שדה טקסט
        this.answerButtons.innerHTML = '';
        // כרגע משתמשים בשדה קלט
    }

    checkAnswer() {
        const userAnswer = parseInt(this.answerInput.value);
        
        if (isNaN(userAnswer)) {
            return;
        }

        const isCorrect = userAnswer === this.currentQuestion.answer;
        this.sessionTotal++;

        if (isCorrect) {
            this.sessionScore++;
            this.currentStreak++;
            this.storage.updateBestStreak(this.currentStreak);
            this.showFeedback(true);
        } else {
            this.currentStreak = 0;
            this.showFeedback(false);
        }

        this.storage.addAnswer(
            this.currentQuestion.num1,
            this.currentQuestion.num2,
            userAnswer,
            this.currentQuestion.answer,
            isCorrect
        );

        this.updateGameDisplay();

        setTimeout(() => {
            this.nextQuestion();
        }, 1500);
    }

    showFeedback(isCorrect) {
        this.feedback.classList.remove('correct', 'wrong');
        this.feedback.classList.add('show');
        
        if (isCorrect) {
            this.feedback.classList.add('correct');
            const messages = [
                '🎉 מעולה!',
                '⭐ נהדר!',
                '🌟 כל הכבוד!',
                '🚀 יופי של תשובה!',
                '💪 מצוין!',
                '👏 אלוף!',
                '🎯 פגעת במטרה!'
            ];
            this.feedback.textContent = messages[Math.floor(Math.random() * messages.length)];
        } else {
            this.feedback.classList.add('wrong');
            this.feedback.textContent = `❌ התשובה הנכונה היא ${this.currentQuestion.answer}`;
        }
    }

    updateGameDisplay() {
        this.currentStreakEl.textContent = this.currentStreak;
        this.currentScoreEl.textContent = this.sessionScore;
        this.totalAskedEl.textContent = this.sessionTotal;
    }

    updateHomeStats() {
        const stats = this.storage.getStats();
        this.totalQuestionsEl.textContent = stats.totalQuestions;
        this.correctAnswersEl.textContent = stats.correctAnswers;
        this.successRateEl.textContent = stats.successRate + '%';
        this.bestStreakEl.textContent = stats.bestStreak;
    }

    showDetailedStats() {
        const stats = this.storage.getStats();
        
        // סיכום כללי
        this.summaryStats.innerHTML = `
            <div class="number-stat">
                <span class="number-stat-label">סה"כ שאלות</span>
                <span class="number-stat-value">${stats.totalQuestions}</span>
            </div>
            <div class="number-stat">
                <span class="number-stat-label">תשובות נכונות</span>
                <span class="number-stat-value">${stats.correctAnswers}</span>
            </div>
            <div class="number-stat">
                <span class="number-stat-label">אחוז הצלחה</span>
                <span class="number-stat-value">${stats.successRate}%</span>
            </div>
            <div class="number-stat">
                <span class="number-stat-label">רצף הכי טוב</span>
                <span class="number-stat-value">${stats.bestStreak} 🔥</span>
            </div>
        `;

        // סטטיסטיקות לפי מספר
        let numberStatsHtml = '';
        const sortedNumbers = Object.keys(stats.byNumber)
            .map(num => parseInt(num))
            .sort((a, b) => a - b);

        if (sortedNumbers.length === 0) {
            numberStatsHtml = '<p style="text-align: center; color: #999;">עדיין אין נתונים</p>';
        } else {
            sortedNumbers.forEach(num => {
                const data = stats.byNumber[num];
                const rate = Math.round((data.correct / data.asked) * 100);
                numberStatsHtml += `
                    <div class="number-stat">
                        <span class="number-stat-label">לוח כפל של ${num}</span>
                        <span class="number-stat-value">${data.correct}/${data.asked} (${rate}%)</span>
                    </div>
                `;
            });
        }

        this.numberStats.innerHTML = numberStatsHtml;
        this.showScreen('stats');
    }

    resetData() {
        if (confirm('האם אתה בטוח שברצונך למחוק את כל הנתונים? פעולה זו אינה ניתנת לביטול!')) {
            this.storage.reset();
            this.updateHomeStats();
            this.showScreen('home');
            alert('הנתונים נמחקו בהצלחה! 🗑️');
        }
    }
}

// אתחול האפליקציה
document.addEventListener('DOMContentLoaded', () => {
    new MultiplicationGame();
});
