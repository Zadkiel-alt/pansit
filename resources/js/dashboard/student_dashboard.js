/* ================================
   resources/js/dashboard/student_dashboard.js
   ================================ */

document.addEventListener('DOMContentLoaded', function () {

    /* ================================
       NAVIGATION
       ================================ */
    function navigate(page) {
        // Modules is a separate Blade view — use Laravel route
        if (page === 'modules') {
            // The route URL is injected by the Blade template via a meta tag
            const modulesUrl = document.querySelector('meta[name="modules-url"]');
            if (modulesUrl) {
                window.location.href = modulesUrl.getAttribute('content');
            } else {
                // Fallback: try /student/modules
                window.location.href = '/student/modules';
            }
            return;
        }

        // Smooth page transition
        const allPages = document.querySelectorAll('.page');
        allPages.forEach(p => {
            if (p.classList.contains('active')) {
                p.classList.remove('active');
                p.style.display = 'none';
            }
        });

        setTimeout(() => {
            const target = document.getElementById('page-' + page);
            if (target) {
                target.classList.add('active');
                target.style.display = 'block';
            }

            document.querySelectorAll('.nav-item[data-page]').forEach(b => {
                b.classList.toggle('active', b.dataset.page === page);
            });
            document.querySelectorAll('.sidebar-item[data-page]').forEach(b => {
                b.classList.toggle('active', b.dataset.page === page);
            });

            // ✅ Trigger loadDownloads when downloads page is opened
            if (page === 'downloads') {
                loadDownloads();
            }

            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 150);
    }

    document.querySelectorAll('[data-page]').forEach(btn => {
        btn.addEventListener('click', function () {
            navigate(this.dataset.page);
        });
    });

    // Expose globally for Blade inline onclick attributes
    window.navigate = navigate;

    // ✅ Auto-load if downloads page is already active on load
    if (document.getElementById('page-downloads')?.classList.contains('active')) {
        loadDownloads();
    }

    // ============================================
    // SETUP REVEAL ANIMATIONS
    // ============================================
    // Removed: animations disabled

    // ============================================
    // SEARCH FUNCTIONALITY FOR DOWNLOADS
    // ============================================
    const downloadSearch = document.querySelector('.download-search input');
    if (downloadSearch) {
        downloadSearch.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const items = document.querySelectorAll('.download-item');
            let visibleCount = 0;

            items.forEach(item => {
                const name = item.querySelector('.download-name')?.textContent || '';
                const matches = !query || name.toLowerCase().includes(query);
                item.style.display = matches ? '' : 'none';
                if (matches) visibleCount++;
            }
        );

            // Show "no results" message
            const noResults = document.querySelector('.no-results');
            if (visibleCount === 0 && !noResults) {
                const container = document.querySelector('.downloads-list');
                if (container) {
                    const msg = document.createElement('div');
                    msg.className = 'no-results';
                    msg.textContent = 'No downloads found matching your search';
                    container.appendChild(msg);
                }
            } else if (visibleCount > 0 && noResults) {
                noResults.remove();
            }
        });
    }

    /* ============================================================
       DOWNLOADS — merge published modules + hardcoded fallbacks
       ============================================================ */

    // Hardcoded fallbacks keyed by topic → array of items
    const HARDCODED_DOWNLOADS = {
        'Module 1: Sequences and Series': [
            { name: 'Arithmetic Sequence',          file: 'Arithmetic Sequence.pdf',          size: '472 KB' },
            { name: 'Geometric Sequence',           file: 'Geometric Sequence.pdf',           size: '532 KB' },
            { name: 'Harmonic Sequence',            file: 'Harmonic Sequence.pdf',            size: '89 KB'  },
            { name: 'Fibonacci Sequence',           file: 'Fibonacci Sequence.pdf',           size: '70 KB'  },
            { name: 'Finite and Infinite Sequence', file: 'Finite and Infinite Sequence.pdf', size: '512 KB' },
        ],
        'Module 2: Polynomials': [
            { name: 'Division of Polynomials',                    file: 'Division of Polynomials.pdf',         size: '514 KB' },
            { name: 'The Remainder Theorem and Factor Theorem',   file: 'The Remainder and Factor Theorem.pdf', size: '577 KB' },
            { name: 'Polynomial Equations',                       file: 'Polynomial Equation.pdf',             size: '661 KB' },
        ],
        'Module 3: Advanced Equations': [
            { name: 'Rational Equations',    file: 'Rational Functions.pdf',      size: '1.1 MB' },
            { name: 'Radical Equations',     file: 'Radical Equations.pdf',       size: '3.9 MB' },
            { name: 'Exponential Functions', file: 'Exponential Functions.pdf',   size: '1.5 MB' },
            { name: 'Logarithmic Functions', file: 'Logarithmic Functions.pdf',   size: '1.3 MB' },
        ],
    };

    const TOPIC_THEME = {
        'Module 1: Sequences and Series': 'green-theme',
        'Module 2: Polynomials':          'orange-theme',
        'Module 3: Advanced Equations':   'purple-theme',
    };

    const TOPIC_LABEL = {
        'Module 1: Sequences and Series': 'Module 1 — Sequences and Series',
        'Module 2: Polynomials':          'Module 2 — Polynomials and Polynomial Equations',
        'Module 3: Advanced Equations':   'Module 3 — Advanced Equations and Functions',
    };

    // Utility: HTML escape for XSS prevention
    function escapeHtml(text) {
        if (!text) return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, char => map[char]);
    }

    async function loadDownloads() {
        const SUPABASE_URL      = window.__ENV__?.SUPABASE_URL ?? '';
        const SUPABASE_ANON_KEY = window.__ENV__?.SUPABASE_ANON_KEY ?? '';

        let publishedModules = [];
        try {
            const res = await fetch(
                `${SUPABASE_URL}/rest/v1/module_status?select=*&status=eq.approved&module_topic=not.is.null`,
                { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` } }
            );
            if (res.ok) publishedModules = await res.json();
        } catch (e) {
            console.warn('Could not load published modules:', e.message);
            return;
        }

        function normalizeTopic(topic) {
            if (!topic) return '';
            const t = topic.toLowerCase();
            if (t.includes('module 1') || t.includes('sequence')) return 'mod1';
            if (t.includes('module 2') || t.includes('polynomial')) return 'mod2';
            if (t.includes('module 3') || t.includes('advanced') || t.includes('rational') || t.includes('radical') || t.includes('exponential') || t.includes('logarithm')) return 'mod3';
            return null;
        }

        const THEME = { mod1: 'green-theme', mod2: 'orange-theme', mod3: 'purple-theme' };

        publishedModules.forEach(m => {
            if (!m.file_url) return;

            const sectionKey = normalizeTopic(m.module_topic);
            if (!sectionKey) return;

            const section = document.getElementById('section-' + sectionKey);
            if (!section) return;

            const theme = THEME[sectionKey];
            const name  = escapeHtml(m.module_title || m.file_name || 'Teacher Upload');
            const url   = escapeHtml(m.file_url);

            const item = document.createElement('div');
            item.className = 'download-item';
            item.innerHTML = `
                <div class="download-icon ${theme}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                    </svg>
                </div>
                <div class="download-info">
                    <span class="download-name">${name} <span class="status-badge badge-good" style="font-size:10px;margin-left:6px">Teacher</span></span>
                    <span class="download-meta">Uploaded by teacher</span>
                </div>
                <button class="dl-btn" onclick="handleDownload('${url}', true)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                </button>`;

            section.appendChild(item);
        });
    }

    function renderDownloadItem(item, theme) {
        const publishedBadge = item.isPublished
            ? `<span class="status-badge badge-good" style="font-size:10px;margin-left:6px">Teacher</span>`
            : '';

        const dlButton = item.url
            ? `<button class="dl-btn" onclick="handleDownload('${escapeHtml(item.url)}', true)">
                   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
               </button>`
            : `<button class="dl-btn" onclick="handleDownload('${escapeHtml(item.file)}', false)">
                   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
               </button>`;

        return `
        <div class="download-item">
            <div class="download-icon ${theme}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <div class="download-info">
                <span class="download-name">${escapeHtml(item.name)}${publishedBadge}</span>
                <span class="download-meta">${escapeHtml(item.size)}</span>
            </div>
            ${dlButton}
        </div>`;
    }

    // Expose globally for Blade inline onclick attributes
    window.loadDownloads = loadDownloads;

    /* ================================
       TOAST (SweetAlert2 helper)
       ================================ */
    window.toast = function (icon, title) {
        if (typeof Swal === 'undefined') return;
        Swal.fire({
            position: 'center',
            showConfirmButton: false,
            timer: 2500,
            timerProgressBar: true,
            icon: icon,
            title: title,
        });
    };

    /* ================================
       CONFIRM LOGOUT
       ================================ */
    window.confirmLogout = function () {
        if (typeof Swal === 'undefined') {
            document.getElementById('logout-form').submit();
            return;
        }
        Swal.fire({
            position: 'center',
            title: 'Are you sure?',
            text: 'You will be logged out of your account.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#2563eb',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, logout!',
            cancelButtonText: 'Cancel',
        }).then(result => {
            if (result.isConfirmed) {
                Swal.fire({
                    position: 'center',
                    icon: 'success',
                    title: 'Logged out',
                    text: 'Goodbye!',
                    timer: 1500,
                    timerProgressBar: true,
                    showConfirmButton: false,
                }).then(() => {
                    document.getElementById('logout-form').submit();
                });
            }
        });
    };

    /* ================================
       SUMMATIVE TEST — Quiz Logic
       ================================ */
    const quizQuestions = [
        { q: "In an arithmetic sequence, the first term is 3 and the common difference is 4. What is the 6th term?",     choices: ["19","23","21","17"],                                                                                          answer: 1 },
        { q: "What is the sum of the first 5 terms of the geometric sequence 2, 6, 18, 54, ...?",                        choices: ["162","242","182","122"],                                                                                      answer: 1 },
        { q: "Which of the following is a polynomial expression?",                                                        choices: ["x⁻² + 3","√x + 2","3x³ − 2x + 1","1/x + 5"],                                                              answer: 2 },
        { q: "What is the remainder when P(x) = x³ − 2x² + x − 5 is divided by (x − 2)?",                              choices: ["-3","-1","3","1"],                                                                                            answer: 0 },
        { q: "Factor completely: x² − 9",                                                                                choices: ["(x−3)²","(x+3)(x−3)","(x−9)(x+1)","(x+3)²"],                                                              answer: 1 },
        { q: "Which is the correct form of the quadratic formula?",                                                       choices: ["x = (b ± √(b²−4ac)) / 2a","x = (−b ± √(b²+4ac)) / 2a","x = (−b ± √(b²−4ac)) / 2a","x = (−b ± √(b²−4ac)) / a"], answer: 2 },
        { q: "Solve for x: 2^x = 32",                                                                                    choices: ["4","5","6","3"],                                                                                              answer: 1 },
        { q: "What is log₂(64)?",                                                                                        choices: ["5","8","6","7"],                                                                                              answer: 2 },
        { q: "If f(x) = 2x + 3, what is f(4)?",                                                                         choices: ["10","11","12","9"],                                                                                            answer: 1 },
        { q: "An infinite geometric series converges when the common ratio r satisfies:",                                 choices: ["r > 1","|r| < 1","r = 1","r < 0"],                                                                            answer: 1 },
    ];

    let quizCurrent = 0;
    let quizAnswers = new Array(quizQuestions.length).fill(null);
    let quizScore   = 0;

    function startQuiz() {
        quizCurrent = 0;
        quizAnswers = new Array(quizQuestions.length).fill(null);
        quizScore   = 0;
        document.getElementById('quiz-start-screen').style.display    = 'none';
        document.getElementById('quiz-question-screen').style.display = 'block';
        document.getElementById('quiz-result-screen').style.display   = 'none';
        renderQuestion();
    }

    function renderQuestion() {
        const q     = quizQuestions[quizCurrent];
        const total = quizQuestions.length;

        document.getElementById('quiz-q-label').textContent      = `Question ${quizCurrent + 1} of ${total}`;
        document.getElementById('quiz-progress-bar').style.width = `${((quizCurrent + 1) / total) * 100}%`;
        document.getElementById('quiz-question-text').textContent = q.q;
        document.getElementById('quiz-score-badge').textContent   = `Score: ${quizScore}`;

        const choicesEl = document.getElementById('quiz-choices');
        choicesEl.innerHTML = '';
        ['A','B','C','D'].forEach((letter, i) => {
            const btn = document.createElement('button');
            btn.className = 'quiz-choice';
            if (quizAnswers[quizCurrent] === i) btn.classList.add('selected');
            btn.innerHTML = `<span class="choice-letter">${letter}</span>${q.choices[i]}`;
            btn.addEventListener('click', () => selectAnswer(i));
            choicesEl.appendChild(btn);
        });

        const prevBtn = document.getElementById('quiz-prev-btn');
        prevBtn.style.opacity = quizCurrent === 0 ? '0.3' : '1';
        prevBtn.disabled      = quizCurrent === 0;

        document.getElementById('quiz-next-btn').textContent =
            quizCurrent === total - 1 ? 'Submit ✓' : 'Next →';
    }

    function selectAnswer(index) {
        quizAnswers[quizCurrent] = index;
        document.querySelectorAll('.quiz-choice').forEach((btn, i) => {
            btn.classList.toggle('selected', i === index);
            const letter = btn.querySelector('.choice-letter');
            letter.style.background = i === index ? 'var(--blue)' : '';
            letter.style.color      = i === index ? 'white'       : '';
        });
    }

    function quizNext() {
        if (quizAnswers[quizCurrent] === null) {
            window.toast('warning', 'Please select an answer first!');
            return;
        }
        if (quizCurrent < quizQuestions.length - 1) {
            quizCurrent++;
            renderQuestion();
        } else {
            submitQuiz();
        }
    }

    function quizPrev() {
        if (quizCurrent > 0) { quizCurrent--; renderQuestion(); }
    }

    function submitQuiz() {
        quizScore = quizAnswers.reduce((acc, ans, i) =>
            acc + (ans === quizQuestions[i].answer ? 1 : 0), 0);

        const total = quizQuestions.length;
        const pct   = Math.round((quizScore / total) * 100);

        document.getElementById('quiz-question-screen').style.display = 'none';
        document.getElementById('quiz-result-screen').style.display   = 'block';
        document.getElementById('quiz-result-score').textContent      = `${quizScore}/${total}`;

        let emoji = '😢', title = 'Keep Practicing!', msg = 'Review your modules and try again.';
        if      (pct >= 90) { emoji = '🏆'; title = 'Outstanding!'; msg = 'Excellent work! You mastered the material.'; }
        else if (pct >= 75) { emoji = '🎉'; title = 'Great Job!';   msg = 'You passed! Keep reviewing for mastery.';   }
        else if (pct >= 50) { emoji = '👍'; title = 'Good Effort!'; msg = 'Almost there — review your weak areas.';    }

        document.getElementById('quiz-result-emoji').textContent = emoji;
        document.getElementById('quiz-result-title').textContent = title;
        document.getElementById('quiz-result-msg').textContent   = `${pct}% — ${msg}`;
    }

    function retakeQuiz() {
        document.getElementById('quiz-result-screen').style.display = 'none';
        startQuiz();
    }

    // Expose quiz functions globally for Blade inline onclick attributes
    window.startQuiz  = startQuiz;
    window.quizNext   = quizNext;
    window.quizPrev   = quizPrev;
    window.retakeQuiz = retakeQuiz;

});
window.handleDownload = async function(filePathOrUrl, isDirectUrl = false) {
    try {
        if (typeof toast === 'function') toast('info', 'Connecting...');

        if (isDirectUrl) {
            // Teacher-uploaded file: direct public URL from Supabase Storage
            const link = document.createElement('a');
            link.href     = filePathOrUrl;
            link.target   = '_blank';
            link.download = filePathOrUrl.split('/').pop();
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            // Hardcoded fallback: download from 'materials' bucket
            const { data, error } = await supabaseClient
                .storage
                .from('materials')
                .download(filePathOrUrl);
            if (error) throw error;
            const blobUrl = window.URL.createObjectURL(data);
            const link    = document.createElement('a');
            link.href     = blobUrl;
            link.download = filePathOrUrl.split('/').pop();
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        }

        if (typeof toast === 'function') toast('success', 'Download started!');
    } catch (err) {
        if (typeof toast === 'function') toast('error', 'Error: ' + err.message);
    }
};
