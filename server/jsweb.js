// منصة المذاكرة التفاعلية
class StudyPlatform {
    constructor(){
        this.currentCardSet = [];
        this.currentCardIndex = 0;
        this.quizSet = [];
        this.currentQuizIndex = 0;
        this.quizScore = 0;
        this.knownCards = new Set();
        this.reviewCards = new Set();

        this.initializeApp();
        this.bindEvents();
        this.checkSharedCards();
    }

    initializeApp() {
        console.log('🚀 منصة المذاكرة جاهزة للعمل!');
        this.updateStats();
    }

    bindEvents() {
        //أحداث التنقل
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if(e.target.disabled) return;
                this.showSection(e.target.dataset.section);
            });
        });

        //أحداث قسم الإدخال
        document.getElementById('convert-btn').addEventListener('click', () => this.convertNotesToCards());
        document.getElementById('load-sets-btn').addEventListener('click', () => this.showSavedSets());
        document.getElementById('sample-data-btn').addEventListener('click', () => this.loadSampleData());

        //أحداث البطاقات
        document.getElementById('flashcard-container').addEventListener('click', () => this.flipCard());
        document.getElementById('prev-card-btn').addEventListener('click', () => this.previousCard());
        document.getElementById('next-card-btn').addEventListener('click', () => this.nextCard());

        //أحداث التقييم
        document.querySelector('.mark-correct').addEventListener('click',(e)=> {
            e.stopPropagation();
            this.markCardAsKnown();
        });

        document.querySelector('.mark-wrong').addEventListener('click',(e)=> {
            e.stopPropagation();
            this.markCardForReview();
        });

        //أحداث المشاركة والحفظ
        document.getElementById('copy-share-btn').addEventListener('click', () => this.copyShareLink());
        document.getElementById('save-db-btn').addEventListener('click', () => this.saveCardSet());

        //أحداث الاختبارات
        document.getElementById('submit-answer-btn').addEventListener('click', () => this.submitAnswer());
        document.getElementById('next-quiz-btn').addEventListener('click', () => this.nextQuizQuestion());
        document.getElementById('restart-quiz-btn').addEventListener('click', () => this.setupQuiz());
        document.getElementById('back-to-cards-btn').addEventListener('click', () => this.showSection('flashcard-section'));

        //أحداث النوافذ المنبثقة
        document.querySelector('.close-modal').addEventListener('click', () => this.hideModal());
        document.getElementById('sets-modal').addEventListener('click', (e) => {
            if(e.target.id === 'sets-modal') this.hideModal();
        });

        //إدخال الإجابة بزر Enter
        document.getElementById('quiz-answer-input').addEventListener('keypress', (e) => {
            if(e.key === 'Enter') this.submitAnswer();
        });
    }

    // === إدارة الأقسام ===
    showSection(sectionId) {
        // إخفاء جميع الأقسام
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        //إلغاء تفعيل جميع أزرار التنقل
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        //إظهار القسم المطلوب
        document.getElementById(sectionId).classList.add('active');

        //تفعيل زر التنقل المناسب
        document.querySelector(`[data-section="${sectionId}"]`).classList.add('active');
        
        //إجراءات خاصة بكل قسم
        if(sectionId === 'quiz-section') {
            this.setupQuiz();
        }
    }

    // === معالجة النص وإنشاء البطاقات ===
    convertNotesToCards() {
        const notesInput = document.getElementById('notes-input');
        const notes = notesInput.value.trim();

        if(!notes) {
            this.showNotification('الرجاء إدخال النصوص أولاً', 'warning');
            return;
        }

        this.showLoading(true);

        //محاكاة معالجة الخادم
        setTimeout(() => {
            try {
                const cards = this.parseNotesToCards(notes);

                if(cards.length === 0) {
                    this.showNotification('لم يتم العثور على أزواج سؤال/إجابة. تأكد من استخدام النقطتين (:) لفصل السؤال عن الإجابة.', 'error');
                    return;
                }

                this.currentCardSet = cards;
                this.currentCardIndex = 0;
                this.knownCards.clear();
                this.reviewCards.clear();

                //تفعيل أزرار التنقل
                document.querySelectorAll('.nav-btn').forEach(btn => {
                    btn.disabled = false;
                });

                //تحديث الواجهة
                this.updateCardsDisplay();
                this.updateStats();

                this.showNotification(`تم تحويل ${cards.length} بطاقة بنجاح! 🎉`, 'success');
                this.showSection('flashcard-section');

            } catch (error) {
                this.showNotification('حدث خطأ في معالجة النص', 'error');
                console.error('Conversion error:', error);
            } finally {
                this.showLoading(false);
            }
        }, 1000);
    }

    parseNotesToCards(notes) {
        const lines = notes.split('\n').filter(line => line.trim());
        const cards = [];

        lines.forEach((line, index) => {
            //دعم تنسيقات متعددة
            let question, answer;
        
            if(line.includes(':')) {
                const parts = line.split(':');
                question = parts[0].trim();
                answer = parts.slice(1).join(':').trim();
            } else if(line.includes('-')) {
                const parts = line.split('-');
                question = parts[0].trim();
                answer = parts.slice(1).join('-').trim();
            } else {    
                // إذا لم يكن هناك فاصل، استخدم رقم السطر
                question = `سؤال ${index + 1}`;
                answer = line.trim();
            }

            if(question && answer) {
                cards.push({
                    question: question,
                    answer: answer,
                    id: Date.now() + index
                });
            }
        });

        return cards;
    }

    loadSampleData() {
        const sampleNotes = `ما هي عاصمة فرنسا؟:باريس
ما هو العنصر الكيميائي للذهب؟:Au
كم عدد كواكب المجموعة الشمسية؟:8 كواكب
ما هي لغة البرمجة المستخدمة في تطوير الويب؟:JavaScript
ما هو أصغر عدد أولي؟:2
ما هي وحدة قياس التيار الكهربائي؟:أمبير
من هو مخترع المصباح الكهربائي؟:توماس إديسون
ما هي أطول سلسلة جبال في العالم؟:جبال الأنديز
ما هو الغاز الأكثر انتشاراً في الغلاف الجوي؟:النيتروجين
ما هي عملة اليابان؟:الين`;

        document.getElementById('notes-input').value = sampleNotes;
        this.showNotification('تم تحميل البيانات التجريبية', 'info');
    }

    // === إدارة البطاقات ===
    flipCard() {
        const card = document.getElementById('flashcard-container');
        card.classList.toggle('flipped');
    }

    previousCard() {
        if (this.currentCardSet.length === 0) return;

        this.currentCardIndex = (this.currentCardIndex - 1 + this.currentCardSet.length) % this.currentCardSet.length;
        this.updateCardsDisplay();
    }

    nextCard() {
        if (this.currentCardSet.length === 0) return;

        this.currentCardIndex = (this.currentCardIndex + 1) % this.currentCardSet.length;
        this.updateCardsDisplay();
    }

    updateCardsDisplay() {
        if (this.currentCardSet.length === 0) {
            document.getElementById('card-question').textContent = 'لا توجد بطاقات متاحة';
            document.getElementById('card-answer').textContent = 'ارجع إلى قسم إنشاء المحتوى';
            document.getElementById('card-counter').textContent = '0/0';
            return;
        }
        
        const currentCard = this.currentCardSet[this.currentCardIndex];

        document.getElementById('card-question').textContent = currentCard.question;
        document.getElementById('card-answer').textContent = currentCard.answer;
        document.getElementById('card-counter').textContent = `${this.currentCardIndex + 1}/${this.currentCardSet.length}`;
       
        //تحديث شريط التقدم
        const progress = ((this.currentCardIndex + 1) / this.currentCardSet.length) * 100;
        document.querySelector('.progress-fill').style.width = `${progress}%`;

        //إعادة البطاقة إلى الوضع الطبيعي
        document.getElementById('flashcard-container').classList.remove('flipped');

        // تحديث العداد
        document.getElementById('cards-count').textContent = `${this.currentCardSet.length} بطاقة متاحة`;
    }

    markCardAsKnown() {
        const cardId = this.currentCardSet[this.currentCardIndex].id;
        this.knownCards.add(cardId);
        this.reviewCards.delete(cardId);
        this.updateStats();
        this.nextCard();
    }

    markCardForReview() {
        const cardId = this.currentCardSet[this.currentCardIndex].id;
        this.reviewCards.add(cardId);
        this.knownCards.delete(cardId);
        this.updateStats();
        this.nextCard();
    }

    updateStats() {
        document.getElementById('total-cards').textContent = this.currentCardSet.length;
        document.getElementById('known-cards').textContent = this.knownCards.size;
        document.getElementById('review-cards').textContent = this.reviewCards.size;
    }

    // === المشاركة والتخزين ===
    generateShareLink() {
        if (this.currentCardSet.length === 0) {
            document.getElementById('share-link-output').value = '';
            return;
        }

        const data = JSON.stringify(this.currentCardSet);
        const encoded = btoa(unescape(encodeURIComponent(data)));
        const shareLink = `${window.location.origin}${window.location.pathname}?cards=${encoded}`;

        document.getElementById('share-link-output').value = shareLink;
    }

    copyShareLink() {
        const shareInput = document.getElementById('share-link-output');

        if(!shareInput.value) {
            this.showNotification('لا يوجد رابط للمشاركة', 'warning');
            return;
        }

        shareInput.select();
        navigator.clipboard.writeText(shareInput.value).then(() => {
            this.showNotification('تم نسخ رابط المشاركة إلى الحافظة! 📋', 'success');
        })
        .catch(err => {
            //Fallback للنسخ اليدوي
            document.execCommand('copy');
            this.showNotification('تم نسخ رابط المشاركة إلى الحافظة! 📋', 'success');
        });
    }

    checkSharedCards() {
        const urlParams = new URLSearchParams(window.location.search);
        const cardsData = urlParams.get('cards');

        if(cardsData) {
            try {
                const decoded = decodeURIComponent(escape(atob(cardsData)));
                const sharedCards = JSON.parse(decoded);

                if (sharedCards && sharedCards.length > 0) {
                    this.currentCardSet = sharedCards;
                    this.currentCardIndex = 0;

                    //تفعيل أزرار التنقل
                    document.querySelectorAll('.nav-btn').forEach(btn => {
                        btn.disabled = false;
                    });

                    this.updateCardsDisplay();
                    this.generateShareLink();
                    this.showSection('flashcard-section');
                    this.showNotification(`تم تحميل ${sharedCards.length} بطاقة من رابط مشترك 👥`, 'success');
                }
            } catch (error) {
                console.error('Error loading shared cards:', error);
            }
        }
    }

    // === الاختبارات ===
    setupQuiz() {
        if(this.currentCardSet.length === 0) {
            this.showNotification('لا توجد بطاقات متاحة للاختبار', 'warning');
            this.showSection('flashcard-section');
            return;
        }

        this.quizSet = [...this.currentCardSet];
        this.quizScore = 0;
        this.currentQuizIndex = 0;

        //خلط الأسئلة عشوائياً
        this.shuffleArray(this.quizSet);

        document.getElementById('final-result').classList.add('hidden');
        document.querySelector('.quiz-card').classList.remove('hidden');

        this.displayQuizQuestion();
    }

    displayQuizQuestion() {
        if(this.currentQuizIndex >= this.quizSet.length) {
            this.showFinalResults();
            return;
        }

        const currentQuizCard = this.quizSet[this.currentQuizIndex];

        document.getElementById('quiz-question-text').textContent = currentQuizCard.question;
        document.getElementById('quiz-answer-input').value = '';
        document.getElementById('quiz-answer-input').disabled = false;
        document.getElementById('submit-answer-btn').style.display = 'block';
        document.getElementById('next-quiz-btn').style.display = 'none';
        document.getElementById('quiz-feedback').classList.add('hidden');
        document.getElementById('result-message').textContent = '';

        //تحديث العداد والنتيجة
        document.querySelector('.quiz-counter').textContent = `سؤال ${this.currentQuizIndex + 1} من ${this.quizSet.length}`;
        document.querySelector('.quiz-score').textContent = `الدرجة: ${this.quizScore}/${this.currentQuizIndex}`;

        document.getElementById('quiz-info').textContent = `اختبر معرفتك - ${this.quizSet.length} سؤال`;
    }

    submitAnswer() {
        if(this.currentQuizIndex >= this.quizSet.length) return;

        const userAnswer = document.getElementById('quiz-answer-input').value.trim().toLowerCase();
        const correctAnswer = this.quizSet[this.currentQuizIndex].answer.trim().toLowerCase();

        if(!userAnswer) {
            this.showNotification('الرجاء إدخال إجابتك أولاً', 'warning');
            return;
        }

        document.getElementById('quiz-answer-input').disabled = true;
        document.getElementById('submit-answer-btn').style.display = 'none';

        const feedback = document.getElementById('quiz-feedback');
        const resultMessage = document.getElementById('result-message');

        // مقارنة متساهلة للإجابات
        if(this.normalizeString(userAnswer) === this.normalizeString(correctAnswer)) {
            this.quizScore++;
            resultMessage.innerHTML = '<span style="color: #2ecc71; font-weight: bold;">🎉 إجابة صحيحة! أحسنت!</span>';
        } else {
            resultMessage.innerHTML = `
                <span style="color: #e74c3c; font-weight: bold;">❌ إجابة خاطئة</span>
                <br>
                <span style="color: #7f8c8d; margin-top: 0.5rem; display: block;">
                    الإجابة الصحيحة هي: <strong>${this.quizSet[this.currentQuizIndex].answer}</strong>
                </span>
            `;
        }

        feedback.classList.remove('hidden');
        document.getElementById('next-quiz-btn').style.display = 'block';

        document.querySelector('.quiz-score').textContent = `الدرجة: ${this.quizScore}/${this.currentQuizIndex + 1}`;
    }

    nextQuizQuestion() {
        this.currentQuizIndex++;
        this.displayQuizQuestion();
    }

    showFinalResults() {
        document.querySelector('.quiz-card').classList.add('hidden');
        document.getElementById('final-result').classList.remove('hidden');

        const percentage = Math.round((this.quizScore / this.quizSet.length) * 100);

        document.getElementById('final-score').textContent = `${percentage}%`;

        //تحديث دائرة النتيجة
        const scoreCircle = document.querySelector('.score-circle');
        scoreCircle.style.background = `conic-gradient(var(--success-color) ${percentage}%, var(--bg-tertiary) ${percentage}%)`;

        //رسالة الأداء
        const scoreMessage = document.getElementById('score-message');
        if(percentage >= 90) {
            scoreMessage.textContent = 'أداء متميز! 🏆 أنت على مستوى عالٍ من المعرفة';
        } else if (percentage >= 70) {
            scoreMessage.textContent = 'أداء جيد! 👍 استمر في المذاكرة';
        } else if (percentage >= 50) {
            scoreMessage.textContent = 'أداء مقبول 📚 راجع البطاقات مرة أخرى';
        } else {
            scoreMessage.textContent = 'يحتاج تحسين 🔄 راجع المادة جيداً';
        }
    }

    // === قاعدة البيانات ===
    async saveCardSet() {
        if(this.currentCardSet.length === 0) {
            this.showNotification('لا توجد بطاقات لحفظها', 'warning');
            return;
        }

        const setName = prompt('أدخل اسماً لمجموعة البطاقات:');
        if(!setName || setName.trim() === '') {
            this.showNotification('اسم المجموعة لا يمكن أن يكون فارغاً', 'warning');
            return;
        }

        this.showLoading(true);

        try {
            const response = await fetch('/api/sets/save-set', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: setName.trim(),
                    cards: this.currentCardSet,
                    knownCards: Array.from(this.knownCards),
                    reviewCards: Array.from(this.reviewCards),
                }),
            });

            const result = await response.json();

            if(result.success) {
                this.showNotification(`تم حفظ المجموعة "${setName}" بنجاح 💾`, 'success');
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Save error:', error);
            this.showNotification('فشل في حفظ المجموعة. تأكد من اتصال الإنترنت.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async showSavedSets() {
        this.showLoading(true);

        try {
            const response = await fetch('/api/sets');
            const result = await response.json();

            this.displaySavedSets(result);
        } catch (error) {
            console.error('Load sets error:', error);
            this.showNotification('فشل في تحميل المجموعات', 'error');
        } finally {
            this.showLoading(false);
        }       
    }

    displaySavedSets(sets) {
        const setsList = document.getElementById('saved-sets-list');
        if (!sets || sets.length === 0) {
            setsList.innerHTML = '<p style="text-align: center; color: var(--text-light);">لا توجد مجموعات محفوظة</p>';
        } else {
            setsList.innerHTML = sets.map(set => `
                <div class="set-item" data-set-id="${set.id}">
                    <div class="set-name">${set.name}</div>
                    <div class="set-meta">
                        <span>${set.cards.length} بطاقة</span>
                        <span>${new Date(set.createdAt).toLocaleDateString('ar-EG')}</span>
                    </div>
                </div>
            `).join('');

            //إضافة أحداث النقر
            setsList.querySelectorAll('.set-item').forEach(item => {
                item.addEventListener('click', () => this.loadSet(item.dataset.setId));
            });
        }

        this.showModal();
    }

    async loadSet(setId) {
        this.showLoading(true);

        try {
            const response = await fetch(`/api/sets/${setId}`);
            const setData = await response.json();

            this.currentCardSet = setData.cards;
            this.currentCardIndex = 0;
            this.knownCards = new Set(setData.knownCards || []);
            this.reviewCards = new Set(setData.reviewCards || []);

            //تفعيل أزرار التنقل
            document.querySelectorAll('.nav-btn').forEach(btn => {
                btn.disabled = false;
            });

            this.updateCardsDisplay();
            this.updateStats();
            this.generateShareLink();
            this.hideModal();

            this.showNotification(`تم تحميل مجموعة "${setData.name}" بنجاح 📂`, 'success');
            this.showSection('flashcard-section');

        } catch (error) {
            console.error('Load set error:', error);
            this.showNotification('فشل في تحميل المجموعة', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    // === أدوات مساعدة ===
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    normalizeString(str) {
        return str
            .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
            .replace(/\s{2,}/g, ' ')
            .trim()
            .toLowerCase();
    }

    showModal() {
        document.getElementById('sets-modal').classList.add('show');
        document.getElementById('sets-modal').style.display = 'flex';
    }

    hideModal() {
        document.getElementById('sets-modal').classList.remove('show');
        document.getElementById('sets-modal').style.display = 'none';
    }

    showLoading(show) {
        const loading = document.getElementById('loading');
        if(show) {
            loading.classList.remove('hidden');
        } else {
            loading.classList.add('hidden');
        }
    }

    showNotification(message, type = 'info') {
        //إنشاء إشعار مؤقت
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;

        // إضافة الأنماط
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#2ecc71' : type === 'error' ? '#e74c3c' : type === 'warning' ? '#f39c12' : '#3498db'};
            color: white;
            padding: 1rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 4000;
            animation: slideIn 0.3s ease;
            max-width: 400px;
        `;

        document.body.appendChild(notification);

        //إغلاق الإشعار
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.remove();
        });

        //إزالة الإشعار تلقائياً بعد 5 ثواني
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
}

// تهيئة الموقع عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    window.studyPlatform = new StudyPlatform();
});

// إضافة أنماط للرسوم المتحركة
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateY(-100px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
    
    .notification-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: white;
        font-size: 1.2rem;
        cursor: pointer;
        padding: 0;
        margin-right: 0.5rem;
    }

    .modal.show {
        display: flex !important;
    }
`;
document.head.appendChild(style);