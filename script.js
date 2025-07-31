document.addEventListener("DOMContentLoaded", () => {
    
    let quizData = [];
    let currentQuestionIndex = 0;
    let correctAnswers = 0;
    let incorrectAnswers = 0;
    let answeredQuestions;
    let explanationsShown;
    let selectedAnswers;
    let markedForReview;

    // DOM Elements
    const questionText = document.getElementById("question-text");
    const choicesContainer = document.getElementById("choices-container");
    const explanationBox = document.getElementById("explanation");
    const referenceContainer = document.getElementById("reference-container"); // Get reference container
    const progressText = document.getElementById("progress");
    const progressBar = document.getElementById("progress-bar");
    const correctText = document.getElementById("correct");
    const incorrectText = document.getElementById("incorrect");
    const questionList = document.getElementById("question-list");
    const quizContent = document.querySelector(".quiz-content");
    const resultsContainer = document.getElementById("results-container");
    const questionNav = document.querySelector(".question-nav");
    const nextBtn = document.getElementById("next-btn");
    const prevBtn = document.getElementById("prev-btn");
    const restartBtn = document.getElementById("restart-btn");
    const reviewBtn = document.getElementById("review-btn");
    const markReviewBtn = document.getElementById("mark-review-btn");
    const helpBtn = document.getElementById("help-btn");
    const helpModal = document.getElementById("help-modal");
    const closeModalBtn = document.getElementById("close-modal-btn");

    function startQuiz() {
        fetch('questions.json')
            .then(response => response.json())
            .then(data => {
                quizData = data;
                initializeQuizState();
                setupEventListeners();
                renderSidebar();
                loadQuestion(0);
            })
            .catch(error => console.error('Error loading quiz data:', error));
    }

    function initializeQuizState() {
        answeredQuestions = JSON.parse(sessionStorage.getItem("answeredQuestions")) || new Array(quizData.length).fill(false);
        explanationsShown = JSON.parse(sessionStorage.getItem("explanationsShown")) || new Array(quizData.length).fill(false);
        selectedAnswers = JSON.parse(sessionStorage.getItem("selectedAnswers")) || new Array(quizData.length).fill(null);
        markedForReview = JSON.parse(sessionStorage.getItem("markedForReview")) || new Array(quizData.length).fill(false);
        recalculateScore();
    }

    function recalculateScore() {
        correctAnswers = 0;
        incorrectAnswers = 0;
        answeredQuestions.forEach((answered, index) => {
            if (answered && selectedAnswers[index] !== null) {
                if (selectedAnswers[index] === quizData[index].correctAnswer) {
                    correctAnswers++;
                } else {
                    incorrectAnswers++;
                }
            }
        });
    }

    function renderSidebar() {
        questionList.innerHTML = "";
        quizData.forEach((_, index) => {
            const listItem = document.createElement("li");
            listItem.textContent = index + 1;
            listItem.classList.add("question-bubble");

            if (answeredQuestions[index]) {
                listItem.style.backgroundColor = selectedAnswers[index] === quizData[index].correctAnswer ? "green" : "red";
            }
            if (markedForReview[index]) {
                listItem.classList.add("marked");
            }
            if (index === currentQuestionIndex) {
                listItem.classList.add("active");
            }

            listItem.onclick = () => loadQuestion(index);
            questionList.appendChild(listItem);
        });
    }

    function loadQuestion(index) {
        currentQuestionIndex = index;
        renderSidebar(); 

        const q = quizData[index];
        questionText.textContent = q.question;
        choicesContainer.innerHTML = "";
        choicesContainer.className = "";

        q.choices.forEach((choice, i) => {
            const button = document.createElement("button");
            button.textContent = choice;
            button.onclick = () => checkAnswer(i);
            
            button.addEventListener("contextmenu", (e) => {
                e.preventDefault();
                if (!answeredQuestions[index]) {
                    button.classList.toggle("strikethrough");
                }
            });

            choicesContainer.appendChild(button);
        });

        // --- MODIFIED SECTION ---
        if (answeredQuestions[index]) {
            choicesContainer.classList.add("answered");
            const correctChoiceIndex = q.correctAnswer;
            const selectedChoiceIndex = selectedAnswers[index];
            choicesContainer.children[correctChoiceIndex].classList.add("correct");
            if (selectedChoiceIndex !== null && selectedChoiceIndex !== correctChoiceIndex) {
                choicesContainer.children[selectedChoiceIndex].classList.add("incorrect");
            }
            
            // Show explanation
            explanationBox.className = explanationsShown[index] ? "" : "hidden";
            explanationBox.textContent = explanationsShown[index] ? q.explanation : "";

            // Show reference link if it exists and is in the correct format
            if (q.reference && q.reference.url && q.reference.text) {
                referenceContainer.innerHTML = `<a href="${q.reference.url}" target="_blank">${q.reference.text}</a>`;
                referenceContainer.className = "reference-box";
            } else {
                referenceContainer.className = "hidden";
            }

        } else {
            // Hide explanation and reference if question is not answered
            explanationBox.className = "hidden";
            referenceContainer.className = "hidden";
        }
        // --- END OF MODIFIED SECTION ---
        
        markReviewBtn.classList.toggle("marked", markedForReview[index]);
        updateProgress();
    }

    function checkAnswer(selectedIndex) {
        if (answeredQuestions[currentQuestionIndex]) return;

        answeredQuestions[currentQuestionIndex] = true;
        explanationsShown[currentQuestionIndex] = true;
        selectedAnswers[currentQuestionIndex] = selectedIndex;

        recalculateScore();
        
        sessionStorage.setItem("answeredQuestions", JSON.stringify(answeredQuestions));
        sessionStorage.setItem("explanationsShown", JSON.stringify(explanationsShown));
        sessionStorage.setItem("selectedAnswers", JSON.stringify(selectedAnswers));
        
        loadQuestion(currentQuestionIndex);
    }

    function updateProgress() {
        const totalAnswered = answeredQuestions.filter(Boolean).length;
        progressText.textContent = `${totalAnswered}/${quizData.length}`;
        correctText.textContent = correctAnswers;
        incorrectText.textContent = incorrectAnswers;
        const progressPercentage = quizData.length > 0 ? (totalAnswered / quizData.length) * 100 : 0;
        progressBar.style.width = `${progressPercentage}%`;
    }

    function showResultsPopup() {
        quizContent.classList.add("hidden");
        questionNav.classList.add("hidden");
        
        recalculateScore();
        updateProgress();
        
        const scorePercentage = quizData.length > 0 ? ((correctAnswers / quizData.length) * 100) : 0;
        document.getElementById("final-score").textContent = `You scored ${correctAnswers} out of ${quizData.length} (${scorePercentage.toFixed(2)}%)!`;
        
        const highScore = localStorage.getItem("quizHighScore") || 0;
        const highScoreText = document.getElementById("high-score-text");
        if (correctAnswers > highScore) {
            localStorage.setItem("quizHighScore", correctAnswers);
            highScoreText.textContent = "🏆 New High Score!";
        } else if (quizData.length > 0) {
            highScoreText.textContent = `High Score: ${highScore}/${quizData.length}`;
        }
        
        resultsContainer.classList.remove("hidden");
        
        if (scorePercentage >= 80) {
            confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
        }
    }

    function restartQuiz() {
        sessionStorage.clear();
        window.location.reload();
    }

    function reviewQuiz() {
        resultsContainer.classList.add("hidden");
        quizContent.classList.remove("hidden");
        questionNav.classList.remove("hidden");
        loadQuestion(0);
    }
    
    function setupEventListeners() {
        nextBtn.onclick = () => {
            if (currentQuestionIndex < quizData.length - 1) {
                loadQuestion(currentQuestionIndex + 1);
            } else {
                showResultsPopup();
            }
        };
        
        prevBtn.onclick = () => {
            if (currentQuestionIndex > 0) {
                loadQuestion(currentQuestionIndex - 1);
            }
        };

        restartBtn.onclick = restartQuiz;
        reviewBtn.onclick = reviewQuiz;
        
        markReviewBtn.onclick = () => {
            markedForReview[currentQuestionIndex] = !markedForReview[currentQuestionIndex];
            sessionStorage.setItem("markedForReview", JSON.stringify(markedForReview));
            renderSidebar();
            markReviewBtn.classList.toggle("marked", markedForReview[currentQuestionIndex]);
        };

        helpBtn.onclick = () => helpModal.classList.remove("hidden");
        closeModalBtn.onclick = () => helpModal.classList.add("hidden");
        
        document.addEventListener("keydown", (event) => {
            if (event.target.tagName !== 'BODY') return;
            if (event.code === "Space") nextBtn.click();
            if (event.code === "KeyB") prevBtn.click();
            if (event.key >= "1" && event.key <= "5") {
                const answerIndex = parseInt(event.key) - 1;
                if (choicesContainer.children[answerIndex]) {
                    choicesContainer.children[answerIndex].click();
                }
            }
        });
    }

    startQuiz();
});
