
import Swal from 'sweetalert2';

document.addEventListener('DOMContentLoaded', function () {

    const chatWindow  = document.getElementById('ai-chat-window');
    const chatContent = document.getElementById('chat-content');
    const input       = document.getElementById('ai-input');
    const sendBtn     = document.getElementById('send-message-btn');

    let isOpen = false;

    // ============================================
    // GET CSRF TOKEN
    // ============================================

    const getCsrfToken = () => {

        return window.Laravel?.csrfToken ||

               document
               .querySelector('meta[name="csrf-token"]')
               ?.getAttribute('content') ||

               '';

    };

    // ============================================
    // GET CURRENT TIME
    // ============================================

    function getTime() {

        return new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });

    }

    // ============================================
    // OPEN CHAT WITH ANIMATION
    // ============================================

    window.openChat = function () {

        isOpen = true;

        chatWindow?.classList.add('open');

        setTimeout(() => {

            input?.focus();

        }, 300);

    };

    // ============================================
    // CLOSE CHAT
    // ============================================

    document
        .getElementById('close-chat')
        ?.addEventListener('click', () => {

            isOpen = false;

            chatWindow?.classList.remove('open');

        });

    // ============================================
    // SHOW TYPING INDICATOR
    // ============================================

    function showTyping() {

        if (!chatContent) return;

        const t = document.createElement('div');

        t.id = 'typing-indicator';

        t.className = 'msg bot';

        t.innerHTML = `
        
            <div class="msg-bubble typing-indicator">

                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>

            </div>
        
        `;

        chatContent.appendChild(t);
        
        chatContent.scrollTop = chatContent.scrollHeight;

        chatContent.appendChild(t);

        scrollBottom();

    }

    // ============================================
    // REMOVE TYPING
    // ============================================

    function removeTyping() {

        document
            .getElementById('typing-indicator')
            ?.remove();

    }

    // ============================================
    // AUTO SCROLL
    // ============================================

    function scrollBottom() {

        chatContent.scrollTop = chatContent.scrollHeight;

    }

    // ============================================
    // APPEND MESSAGE
    // ============================================

    function appendMessage(text, type) {

        if (!chatContent) return;

        const msg = document.createElement('div');

        msg.className = `msg ${type}`;

        // ============================================
        // MESSAGE BUBBLE
        // ============================================

        const bbl = document.createElement('div');

        bbl.className = 'msg-bubble';

        // ============================================
        // USER MESSAGE
        // ============================================

        if (type === 'user') {

            bbl.innerText = text;

        }

        // ============================================
        // BOT MESSAGE
        // ============================================

        else {

            // Convert markdown bold
            let formatted = text.replace(
                /\*\*(.*?)\*\*/g,
                '<strong>$1</strong>'
            );

            // IMPORTANT
            // Use innerHTML for LaTeX
            bbl.innerHTML = formatted;

        }

        // ============================================
        // TIME
        // ============================================

        const time = document.createElement('span');

        time.className = 'msg-time';

        time.textContent = getTime();

        // ============================================
        // APPEND
        // ============================================

        msg.appendChild(bbl);

        msg.appendChild(time);

        chatContent.appendChild(msg);

        scrollBottom();

        // ============================================
        // RENDER LATEX
        // ============================================

        if (window.MathJax && type === 'bot') {

            MathJax.typesetClear([bbl]);

            MathJax.typesetPromise([bbl])
                .catch((err) => {

                    console.error(
                        'MathJax Error:',
                        err
                    );

                });

        }

    }

    // ============================================
    // SEND MESSAGE
    // ============================================

    async function sendMessage(text = null) {

        const message = text || input?.value.trim();

        if (!message) {
            Notification.warning('Please enter a message');
            return;
        }

        const token = getCsrfToken();

        // ============================================
        // CHECK TOKEN
        // ============================================

        if (!token) {

            Notification.error('CSRF token not found');
            return;

        }

        // ============================================
        // USER MESSAGE
        // ============================================

        appendMessage(message, 'user');

        if (input && !text) {

            input.value = '';
            input.style.height = 'auto';

        }

        // Disable send button while sending
        if (sendBtn) {
            sendBtn.disabled = true;
            sendBtn.classList.add('loading');
        }

        showTyping();

        try {

            // ============================================
            // FETCH AI
            // ============================================

            const response = await fetch('/chatbot/ask', {

                method: 'POST',

                headers: {

                    'Content-Type': 'application/json',

                    'X-CSRF-TOKEN': token,

                    'Accept': 'application/json'

                },

                body: JSON.stringify({

                    message: message

                })

            });

            if (!response.ok) {

                throw new Error(
                    `Server Error ${response.status}`
                );

            }

            const data = await response.json();

            removeTyping();

            // ============================================
            // SUCCESS
            // ============================================

            if (data.status === 'success') {

                appendMessage(
                    data.reply,
                    'bot'
                );
                Notification.success('Response received!');

            }

            // ============================================
            // FAILED
            // ============================================

            else {

                appendMessage(
                    'AI service failed. Please try again.',
                    'bot'
                );
                Notification.error('AI service failed');

            }

        }

        catch (error) {

            removeTyping();

            console.error(error);

            appendMessage(
                'Connection lost. Please check your internet connection.',
                'bot'
            );

            Notification.error('Connection error');

        }

        finally {
            if (sendBtn) {
                sendBtn.disabled = false;
                sendBtn.classList.remove('loading');
            }
        }

    }

    // ============================================
    // SEND BUTTON
    // ============================================

    document
        .getElementById('ai-send-btn')
        ?.addEventListener('click', () => {

            sendMessage();

        });

    // ============================================
    // ENTER KEY
    // ============================================

    input?.addEventListener('keypress', e => {

        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }

    });

    // ============================================
    // AUTO-RESIZE TEXTAREA
    // ============================================
    
    if (input) {
        input.addEventListener('input', () => {
            input.style.height = 'auto';
            input.style.height = Math.min(input.scrollHeight, 120) + 'px';
        });
    }

    // ============================================
    // CHARACTER COUNT (if needed)
    // ============================================
    
    if (input) {
        input.addEventListener('input', () => {
            const maxChars = 1000;
            if (input.value.length > maxChars) {
                input.value = input.value.substring(0, maxChars);
                Notification.warning(`Maximum ${maxChars} characters allowed`);
            }
        });
    }

    // ============================================
    // QUICK REPLIES
    // ============================================

    chatContent?.addEventListener('click', e => {

        if (
            e.target.classList.contains(
                'quick-reply-btn'
            )
        ) {

            sendMessage(
                e.target.textContent.trim()
            );

        }

    });

    // ============================================
    // OPEN CHAT BUTTONS
    // ============================================

    document
        .getElementById('sidebar-chat-btn')
        ?.addEventListener('click', openChat);

    document
        .getElementById('fab-chat')
        ?.addEventListener('click', openChat);

    document
        .getElementById('start-chat-btn')
        ?.addEventListener('click', openChat);

});
