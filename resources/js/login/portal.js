document.addEventListener('DOMContentLoaded', () => {
    const loginForm  = document.getElementById('login-form-container');
    const signupForm = document.getElementById('signup-form-container');
    const loginTab   = document.getElementById('login-tab');
    const signupTab  = document.getElementById('signup-tab');
    const subText    = document.getElementById('sub-text');
    const portalCard = document.getElementById('portal-card');

    // Detect portal type from the <h1> text so we don't need extra data attributes
    const portalTitle = (document.querySelector('h1')?.innerText || '').toLowerCase();
    const portalLabel = portalTitle.includes('admin')   ? 'admin'
                      : portalTitle.includes('teacher') ? 'teacher'
                      : 'student';

    const signupText = {
        admin:   'Create your admin account',
        teacher: 'Create your teacher account',
        student: 'Create your student account',
    };

    // ============================================
    // SMOOTH TAB SWITCHING
    // ============================================
    loginTab.addEventListener('click', () => {
        loginTab.classList.add('active');
        signupTab.classList.remove('active');
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
        subText.innerText = 'Sign in to your account';
        portalCard.style.flexDirection = 'row';
    });

    signupTab.addEventListener('click', () => {
        signupTab.classList.add('active');
        loginTab.classList.remove('active');
        signupForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
        subText.innerText = signupText[portalLabel];
        portalCard.style.flexDirection = 'row-reverse';
    });

    // Keep layout correct on resize
    window.addEventListener('resize', () => {
        portalCard.style.flexDirection = signupTab.classList.contains('active')
            ? 'row-reverse'
            : 'row';
    });

    // ============================================
    // FORM VALIDATION & REAL-TIME FEEDBACK
    // ============================================
    FormValidator.setupRealtimeValidation('#login-form-container form');
    FormValidator.setupRealtimeValidation('#signup-form-container form');

    // ============================================
    // FORM SUBMISSION WITH LOADING STATE
    // ============================================
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', (e) => {
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;

            submitBtn.disabled = true;
            submitBtn.classList.add('loading');
            submitBtn.innerHTML = '<span class="spinner"></span> Processing...';

            // Restore button after response
            setTimeout(() => {
                submitBtn.disabled = false;
                submitBtn.classList.remove('loading');
                submitBtn.textContent = originalText;
            }, 500);
        });
    });

    // ============================================
    // SHOW REVEAL ANIMATIONS
    // ============================================
    // Removed: animations disabled

    // ============================================
    // FOCUS ANIMATIONS FOR INPUT FIELDS
    // ============================================
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            input.parentElement.classList.add('focused');
        });
        input.addEventListener('blur', () => {
            if (!input.value) {
                input.parentElement.classList.remove('focused');
            }
        });
    });
});
