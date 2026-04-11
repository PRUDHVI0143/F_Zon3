document.addEventListener('DOMContentLoaded', () => {
    // Theme Management
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const body = document.body;

    // Load saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        themeIcon.className = 'fas fa-sun';
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            body.classList.add('theme-transition'); // Enable animation specifically during toggle
            
            body.classList.toggle('light-theme');
            const isLight = body.classList.contains('light-theme');
            themeIcon.className = isLight ? 'fas fa-sun' : 'fas fa-moon';
            localStorage.setItem('theme', isLight ? 'light' : 'dark');

            // Broadcast theme change globally (Games & Dynamic UI listen to this)
            window.dispatchEvent(new CustomEvent('themeChanged', { detail: { isLight: isLight } }));

            // Trigger a soft glow effect on toggle
            themeToggle.classList.add('switching');
            setTimeout(() => {
                themeToggle.classList.remove('switching');
                body.classList.remove('theme-transition'); // Disable animation after
            }, 500);
        });
    }

    // Mobile Menu Toggle
    const mobileMenu = document.getElementById('mobile-menu');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenu) {
        mobileMenu.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            mobileMenu.classList.toggle('is-active');
        });
    }

    // Sound Utility
    window.playSound = (type) => {
        const sounds = {
            'click': 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
            'win': 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
            'lose': 'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3',
            'eat': 'https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3'
        };
        if (sounds[type]) {
            const audio = new Audio(sounds[type]);
            audio.volume = 0.5;
            audio.play().catch(e => console.log('Audio auto-play blocked:', e));
        }
    };

    // Smooth Scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // Handle AJAX Score Submission Helper
    window.submitScore = async (gameSlug, score) => {
        const csrftoken = getCookie('csrftoken');
        try {
            const response = await fetch(`/${gameSlug}/submit-score/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken,
                },
                body: JSON.stringify({ score: score })
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error submitting score:', error);
        }
    };

    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    // Handle Modal
    // Modal Global Scoping Reference
    const modal = document.getElementById('instructionModal');
    const resultOverlay = document.getElementById('resultOverlay');
    const closeBtn = document.querySelector('.close-btn');
    const closeResultBtn = document.getElementById('closeResultBtn');

    if (closeBtn) closeBtn.onclick = () => modal.style.display = 'none';
    if (closeResultBtn) closeResultBtn.onclick = () => resultOverlay.style.display = 'none';

    window.onclick = (event) => {
        if (event.target == modal) modal.style.display = 'none';
        if (event.target == resultOverlay) resultOverlay.style.display = 'none';
    };

    window.showInstruction = (title, content) => {
        if (!modal) return;
        document.getElementById('modalTitle').innerText = title;
        document.getElementById('modalBody').innerHTML = content;
        modal.style.display = 'block';
    };

    window.showResult = (title, score, type = 'normal') => {
        if (!resultOverlay) return;
        const card = document.getElementById('resultCard');

        // Reset classes
        card.classList.remove('result-win', 'result-loss');
        if (type === 'win') card.classList.add('result-win');
        if (type === 'loss') card.classList.add('result-loss');

        document.getElementById('resTitle').innerText = title;
        document.getElementById('resScore').innerText = score;
        resultOverlay.style.display = 'flex';
        setTimeout(() => card.classList.add('active'), 10);
    };
});
