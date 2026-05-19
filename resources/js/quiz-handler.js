// Enhanced Quiz Handler with better UX

// ============= CONSTANTS =============
const ELEMENT_IDS = {
    fileInput: 'module_file',
    uploadArea: 'quiz-upload-area',
    filePreview: 'quiz-file-preview',
    previewName: 'quiz-file-name',
    previewSize: 'quiz-file-size',
    removeBtn: 'quiz-file-remove',
    generateBtn: 'generateBtn',
    quizForm: 'quizForm',
    loadingState: 'quiz-loading-state',
    errorState: 'quiz-error-state',
    errorMessage: 'quiz-error-message',
    resultContainer: 'quizResultContainer',
};

const API_ENDPOINTS = {
    generateQuiz: '/teacher/generate-quiz',
};

const CLASS_NAMES = {
    visible: 'visible',
    dragOver: 'drag-over',
};

const FILE_SIZE_UNITS = ['Bytes', 'KB', 'MB'];
const BYTES_PER_KB = 1024;

// ============= UTILITY FUNCTIONS =============
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(BYTES_PER_KB));
    return parseFloat((bytes / Math.pow(BYTES_PER_KB, i)).toFixed(2)) + ' ' + FILE_SIZE_UNITS[i];
}

function getElement(id) {
    const element = document.getElementById(id);
    if (!element) {
        console.warn(`Element with ID "${id}" not found`);
    }
    return element;
}

function toggleElement(element, show) {
    if (element) {
        element.style.display = show ? 'block' : 'none';
    }
}

function toggleButtonState(button, disabled) {
    if (button) {
        button.disabled = disabled;
    }
}

// ============= QUIZ UPLOAD INITIALIZATION =============
function initializeQuizUpload() {
    const fileInput = getElement(ELEMENT_IDS.fileInput);
    const uploadArea = getElement(ELEMENT_IDS.uploadArea);
    const filePreview = getElement(ELEMENT_IDS.filePreview);
    const previewName = getElement(ELEMENT_IDS.previewName);
    const previewSize = getElement(ELEMENT_IDS.previewSize);
    const removeBtn = getElement(ELEMENT_IDS.removeBtn);
    const generateBtn = getElement(ELEMENT_IDS.generateBtn);
    const quizForm = getElement(ELEMENT_IDS.quizForm);

    if (!fileInput || !uploadArea) return;

    // --------- File Preview Handler ---------
    function showPreview(file) {
        if (!file) {
            filePreview.classList.remove(CLASS_NAMES.visible);
            return;
        }

        if (previewName) previewName.textContent = file.name;
        if (previewSize) previewSize.textContent = formatFileSize(file.size);
        filePreview.classList.add(CLASS_NAMES.visible);
        toggleButtonState(generateBtn, false);
    }

    function clearFile() {
        fileInput.value = '';
        filePreview.classList.remove(CLASS_NAMES.visible);
        toggleButtonState(generateBtn, true);
    }

    // --------- Event Listeners: File Input ---------
    fileInput.addEventListener('change', () => {
        showPreview(fileInput.files?.[0] || null);
    });

    removeBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        clearFile();
    });

    // --------- Event Listeners: Drag and Drop ---------
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.add(CLASS_NAMES.dragOver);
    });

    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.remove(CLASS_NAMES.dragOver);
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.remove(CLASS_NAMES.dragOver);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            fileInput.files = files;
            fileInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
    });

    // --------- Event Listeners: Form Submission ---------
    quizForm.addEventListener('submit', handleQuizSubmit);

    async function handleQuizSubmit(e) {
        e.preventDefault();
        const formData = new FormData(quizForm);
        const csrfToken = document.querySelector('input[name="_token"]')?.value;

        if (!csrfToken) {
            showError('CSRF token not found. Please refresh and try again.');
            return;
        }

        showLoading(true);

        try {
            const response = await fetch(API_ENDPOINTS.generateQuiz, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }

            const data = await response.json();

            if (data.status === 'success') {
                displayQuizResults(data.data);
            } else {
                showError(data.message || 'Failed to generate quiz. Please try again.');
            }
        } catch (error) {
            console.error('Quiz generation error:', error);
            showError('Network error. Please check your connection and try again.');
        } finally {
            showLoading(false);
        }
    }

    // --------- UI State Management ---------
    function showLoading(isLoading) {
        const loadingState = getElement(ELEMENT_IDS.loadingState);
        const errorState = getElement(ELEMENT_IDS.errorState);
        
        toggleElement(generateBtn, !isLoading);
        toggleElement(loadingState, isLoading);
        toggleElement(errorState, false);
    }

    function showError(message) {
        const errorState = getElement(ELEMENT_IDS.errorState);
        const errorMsg = getElement(ELEMENT_IDS.errorMessage);
        
        if (errorMsg) errorMsg.textContent = message;
        toggleElement(errorState, true);
        toggleElement(generateBtn, true);
    }
}

// ============= QUIZ DISPLAY FUNCTIONS =============

/**
 * Generate HTML for an option element
 */
function renderOption(option, optionIndex, correctAnswerIndex) {
    const isCorrect = optionIndex === correctAnswerIndex;
    const letter = String.fromCharCode(65 + optionIndex);
    
    return `
        <div class="quiz-option">
            <span class="option-letter">${letter}</span>
            <span class="option-text">${option}</span>
            ${isCorrect ? '<span class="option-answer">✓ Answer</span>' : ''}
        </div>
    `;
}

/**
 * Generate HTML for a question element
 */
function renderQuestion(question, questionIndex) {
    const { question: questionText, options, answer } = question;
    const optionsHtml = options
        .map((opt, idx) => renderOption(opt, idx, answer))
        .join('');

    return `
        <div class="quiz-question-item">
            <div class="quiz-q-number">Q${questionIndex + 1}</div>
            <div class="quiz-q-content">
                <div class="quiz-q-text">${questionText}</div>
                <div class="quiz-q-options">
                    ${optionsHtml}
                </div>
            </div>
        </div>
    `;
}

/**
 * Generate HTML for a quiz section (Pre-Test or Post-Test)
 */
function renderQuizSection(title, icon, questions) {
    const sectionClass = title === 'Pre-Test' ? 'quiz-section-pre' : 'quiz-section-post';
    const questionsHtml = questions
        .map((q, idx) => renderQuestion(q, idx))
        .join('');

    return `
        <div class="quiz-result-section ${sectionClass}">
            <div class="quiz-result-header">
                <div class="quiz-result-icon">${icon}</div>
                <div class="quiz-result-title">${title}</div>
                <div class="quiz-result-count">${questions.length} Questions</div>
            </div>
            <div class="quiz-questions-list">
                ${questionsHtml}
            </div>
        </div>
    `;
}

/**
 * Display quiz results in the container
 */
function displayQuizResults(quizzes) {
    const resultContainer = getElement(ELEMENT_IDS.resultContainer);

    if (!resultContainer) {
        console.error('Result container not found');
        return;
    }

    const { pre_test: preTest, post_test: postTest } = quizzes;
    const html = `
        <div class="quiz-results-container">
            ${renderQuizSection('Pre-Test', '📝', preTest)}
            ${renderQuizSection('Post-Test', '📊', postTest)}
        </div>
    `;

    resultContainer.innerHTML = html;
}

// ============= INITIALIZATION =============
document.addEventListener('DOMContentLoaded', initializeQuizUpload);