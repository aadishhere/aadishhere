/**
 * Aadish Jain — Conversational Interview Engine
 * A fun, interactive conversational experience where recruiters & hiring managers
 * chat directly with "Virtual Aadish", test his PM instincts, raise their conviction meter,
 * and seamlessly book an interview!
 */

export const interviewDialogue = {
    start: {
        speaker: "Aadish",
        text: "Hey! 👋 I'm Aadish. Thanks for dropping by! Most portfolio sites are boring walls of text, so let's have a casual conversation instead. What's on your mind?",
        conviction: 15,
        options: [
            { text: "Why are you switching from iOS Developer to PM?", next: "why_pm" },
            { text: "Show me your PRDs and actual product work 📄", next: "show_prds" },
            { text: "Let's do a rapid 60-second interview right now ⚡", next: "rapid_interview_1" },
            { text: "I'm already impressed. How do I book an interview? ☕", next: "book_now" },
            { text: "Tell me something unexpected about you 📖", next: "story_author" }
        ]
    },

    why_pm: {
        speaker: "Aadish",
        text: "Honest truth? I loved building apps with Swift and APIs, but my favorite moments were never just typing code—they were discovering *why* users were dropping off, redesigning the customer journey, and aligning the team. Because I've built apps from scratch, I know exactly what's feasible in a 2-day sprint vs. a 3-week rabbit hole. That means zero communication friction between product and engineering!",
        conviction: 40,
        options: [
            { text: "That makes a lot of sense. Show me a PRD you wrote!", next: "show_prds" },
            { text: "How did you prove this in your previous role at Bluebex?", next: "bluebex_story" },
            { text: "I'm loving this perspective. Can we book a chat?", next: "book_now" }
        ]
    },

    bluebex_story: {
        speaker: "Aadish",
        text: "At Bluebex, we were building a PG (Paying Guest) coliving management platform. Landlords were losing hours every month matching bank deposits against WhatsApp screenshots. I researched the problem with 40+ operators, spec'd automated UPI Autopay and an SLA maintenance dispatcher, and helped roll it out. Result: on-time rent collection accelerated by +42%, and dispute turnaround dropped by 60%!",
        conviction: 65,
        options: [
            { text: "Can I inspect the full PRD document for this?", next: "open_pulsepg_doc" },
            { text: "Impressive numbers! What about stakeholder management?", next: "tedx_story" },
            { text: "You have real product chops. Let's schedule an interview!", next: "book_now" }
        ]
    },

    tedx_story: {
        speaker: "Aadish",
        text: "Stakeholders? I organized TEDx conferences for over 1,000 attendees! Led a 35-person cross-functional team across stage production, curation, sponsors, and media. Managed 14 high-profile speakers under tight deadlines. When you can keep sponsors, speakers, volunteers, and an audience of 1,000 happy simultaneously, sprint planning meetings feel like a breeze. 😉",
        conviction: 85,
        options: [
            { text: "Haha, fair point! Tell me about your book on Amazon?", next: "story_author" },
            { text: "Okay, I'm sold. 100% conviction reached!", next: "book_now" },
            { text: "What's your product superpower in one sentence?", next: "superpower" }
        ]
    },

    story_author: {
        speaker: "Aadish",
        text: "I authored and published 'The Kala's Of Shri Krishna' on Amazon! Writing a book taught me narrative discipline, clarity of thought, and empathy for how readers interpret ideas. In product management, storytelling is everything—whether pitching a roadmap to leadership or aligning designers and developers on the 'Why'.",
        conviction: 75,
        options: [
            { text: "A developer, author, and TEDx organizer? That's rare.", next: "superpower" },
            { text: "Let's definitely get you in for an interview!", next: "book_now" }
        ]
    },

    superpower: {
        speaker: "Aadish",
        text: "My superpower? 'An engineer's technical rigor, an author's storytelling clarity, and a founder's obsession with customer value.' I don't just write specs; I make sure high-value products actually get shipped and adopted.",
        conviction: 95,
        options: [
            { text: "Let's lock this in: How do we set up an interview? 📅", next: "book_now" },
            { text: "Can I play the Bunny Hop mini-game first? 🐰", next: "play_game" }
        ]
    },

    show_prds: {
        speaker: "Aadish",
        text: "I've published two full interactive PRDs and an interactive Pitch Deck right here! Which one would you like to inspect?",
        conviction: 50,
        options: [
            { text: "1. PulsePG: Coliving Operating System & Rent Automation (PRD)", action: "doc:prd-pulsepg", next: "after_doc" },
            { text: "2. VisionNews: Spatial News for Apple Vision Pro (Spatial PRD)", action: "doc:prd-visionnews", next: "after_doc" },
            { text: "3. Chronos: Connected Horology Platform (Pitch Deck)", action: "doc:deck-chronos", next: "after_doc" },
            { text: "Let's jump to booking an interview!", next: "book_now" }
        ]
    },

    after_doc: {
        speaker: "Aadish",
        text: "Hope you enjoyed inspecting that! Every document reflects real customer discovery, acceptance criteria, metrics instrumentation, and technical trade-offs. Ready to chat in person?",
        conviction: 85,
        options: [
            { text: "Yes! Let's book a coffee chat / interview ☕", next: "book_now" },
            { text: "Ask me a question from the rapid interview", next: "rapid_interview_1" }
        ]
    },

    rapid_interview_1: {
        speaker: "Aadish",
        text: "Rapid Fire Round 1: How do I handle a CEO who demands a brand new generative-AI feature 48 hours before sprint freeze?",
        conviction: 60,
        options: [
            { text: "Say yes to everything and make the engineers work 18 hours", next: "rapid_wrong" },
            { text: "Understand the core business goal, offer a clickable prototype for immediate demo, and scope properly for next sprint", next: "rapid_right" }
        ]
    },

    rapid_wrong: {
        speaker: "Aadish",
        text: "Haha, classic trap! 😅 Making engineers pull all-nighters for unvalidated scope burns trust and causes production outages. A great PM discovers the underlying *intent* (like an upcoming investor meeting) and delivers a high-fidelity prototype or scoped solution without derailing the team.",
        conviction: 70,
        options: [
            { text: "Well played. What's Question 2?", next: "rapid_interview_2" },
            { text: "Let's cut to the chase and book an interview!", next: "book_now" }
        ]
    },

    rapid_right: {
        speaker: "Aadish",
        text: "Spot on! 🎯 You protect the team's velocity while giving the CEO what they actually need—a compelling demonstration without breaking production stability.",
        conviction: 80,
        options: [
            { text: "Hit me with Question 2!", next: "rapid_interview_2" },
            { text: "I've seen enough—you're hired! Let's book an interview.", next: "book_now" }
        ]
    },

    rapid_interview_2: {
        speaker: "Aadish",
        text: "Round 2: Your North Star Metric is up 12%, but 30-day user retention dropped by 8%. What do you do first?",
        conviction: 85,
        options: [
            { text: "Celebrate the 12% rise and launch marketing ads", next: "rapid_retention_wrong" },
            { text: "Halt vanity celebration; dig into cohort drop-off logs and interview churned users to find the leaky bucket", next: "rapid_retention_right" }
        ]
    },

    rapid_retention_wrong: {
        speaker: "Aadish",
        text: "Ouch! Pouring water into a leaky bucket is the fastest way to burn runway. Retention always trumps top-of-funnel vanity metrics!",
        conviction: 90,
        options: [
            { text: "Agreed. You have strong PM fundamentals! Let's talk.", next: "book_now" }
        ]
    },

    rapid_retention_right: {
        speaker: "Aadish",
        text: "Bingo! 🧠 A product with poor retention is a leaky bucket. You don't scale growth until your core value loop retains customers. Dig into the cohort behavior first!",
        conviction: 95,
        options: [
            { text: "Outstanding! 100% conviction reached. Let's schedule!", next: "book_now" }
        ]
    },

    book_now: {
        speaker: "Aadish",
        text: "🎉 Woohoo! 100% Conviction Reached! I'd love to chat with you about how I can bring high technical empathy, speed, and product rigor to your team. Choose your preferred way to connect below:",
        conviction: 100,
        isBooking: true,
        options: [
            { text: "📧 Send Quick Interview Email", action: "email" },
            { text: "📞 Call / WhatsApp (+91 8770554511)", action: "call" },
            { text: "📄 Download PM Resume (PDF)", action: "resume" },
            { text: "🔄 Start chat from beginning", next: "start" }
        ]
    },

    play_game: {
        speaker: "Aadish",
        text: "Haha, let's do it! 🐰 Scroll right below this chat to play 'Bunny Hop: The PM Sprint Runner'. Jump over Scope Creep and collect Carrots! See you on the leaderboard!",
        conviction: 90,
        action: "scroll:game",
        options: [
            { text: "Awesome! Let's jump to the game!", action: "scroll:game" },
            { text: "Actually, let's book that interview first! ☕", next: "book_now" }
        ]
    }
};

export class ConversationalInterview {
    constructor() {
        this.container = document.getElementById('chat-messages-container');
        this.optionsContainer = document.getElementById('chat-options-container');
        this.convictionBar = document.getElementById('conviction-bar-fill');
        this.convictionPercent = document.getElementById('conviction-percent');
        this.currentNodeKey = 'start';
        this.isTyping = false;
    }

    init() {
        if (!this.container) return;
        this.renderNode('start');
    }

    setConviction(pct) {
        if (this.convictionBar) this.convictionBar.style.width = `${pct}%`;
        if (this.convictionPercent) this.convictionPercent.textContent = `${pct}%`;

        if (pct >= 100) {
            this.triggerConfetti();
        }
    }

    renderNode(nodeKey) {
        const node = interviewDialogue[nodeKey];
        if (!node) return;

        this.currentNodeKey = nodeKey;
        this.optionsContainer.innerHTML = '';

        // Show typing indicator
        this.showTypingIndicator();

        setTimeout(() => {
            this.hideTypingIndicator();
            this.appendMessage(node.speaker, node.text);
            this.setConviction(node.conviction);

            if (node.isBooking) {
                this.renderBookingCard();
            }

            this.renderOptions(node.options);
        }, 600);
    }

    showTypingIndicator() {
        const typingEl = document.createElement('div');
        typingEl.id = 'chat-typing-indicator';
        typingEl.className = 'chat-bubble bubble-speaker typing';
        typingEl.innerHTML = `
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
        `;
        this.container.appendChild(typingEl);
        this.container.scrollTop = this.container.scrollHeight;
    }

    hideTypingIndicator() {
        const el = document.getElementById('chat-typing-indicator');
        if (el) el.remove();
    }

    appendMessage(speaker, text, isUser = false) {
        const msg = document.createElement('div');
        msg.className = `chat-bubble ${isUser ? 'bubble-user' : 'bubble-speaker'}`;
        
        if (!isUser) {
            msg.innerHTML = `
                <div class="bubble-avatar-tag">
                    <img src="assets/aadishjain.webp" alt="Aadish" class="bubble-mini-avatar">
                    <span class="bubble-speaker-name">Aadish Jain</span>
                </div>
                <div class="bubble-text-content">${text}</div>
            `;
        } else {
            msg.innerHTML = `<div class="bubble-text-content">${text}</div>`;
        }

        this.container.appendChild(msg);
        this.container.scrollTop = this.container.scrollHeight;
    }

    renderBookingCard() {
        const card = document.createElement('div');
        card.className = 'chat-booking-highlight-card';
        card.innerHTML = `
            <div class="booking-card-header">
                <i class="fa-solid fa-calendar-check" style="color: var(--brand-success); font-size: 20px;"></i>
                <div>
                    <div style="font-weight: 800; font-size: 15px; color: var(--text-primary);">Let's Chat! Open to APM & PM Roles</div>
                    <div style="font-size: 12px; color: var(--text-secondary);">Direct access to Aadish • Quick 15-30 min Coffee Screen</div>
                </div>
            </div>
            <div class="booking-card-actions">
                <a href="mailto:aadishhere@gmail.com?subject=Product%20Management%20Interview%20Chat%20-%20Aadish%20Jain" class="btn btn-primary btn-sm">
                    <i class="fa-solid fa-envelope"></i> Email: aadishhere@gmail.com
                </a>
                <a href="tel:+918770554511" class="btn btn-secondary btn-sm">
                    <i class="fa-solid fa-phone"></i> +91 8770554511
                </a>
                <a href="assets/iOS Dev - AadishJain.pdf" target="_blank" class="btn btn-secondary btn-sm">
                    <i class="fa-solid fa-file-pdf"></i> Resume PDF
                </a>
            </div>
        `;
        this.container.appendChild(card);
        this.container.scrollTop = this.container.scrollHeight;
    }

    renderOptions(options) {
        this.optionsContainer.innerHTML = '';
        if (!options) return;

        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'chat-choice-btn';
            btn.textContent = opt.text;
            btn.addEventListener('click', () => {
                // User speech bubble
                this.appendMessage("You", opt.text, true);

                if (opt.action) {
                    this.handleAction(opt.action);
                }

                if (opt.next) {
                    this.renderNode(opt.next);
                }
            });
            this.optionsContainer.appendChild(btn);
        });
    }

    handleAction(action) {
        if (action.startsWith('doc:')) {
            const docId = action.split(':')[1];
            // Trigger document modal open event
            const btn = document.querySelector(`.js-open-doc[data-doc="${docId}"]`);
            if (btn) btn.click();
        } else if (action === 'email') {
            window.location.href = "mailto:aadishhere@gmail.com?subject=Product%20Management%20Interview%20Chat%20-%20Aadish%20Jain";
        } else if (action === 'call') {
            window.location.href = "tel:+918770554511";
        } else if (action === 'resume') {
            window.open('assets/iOS Dev - AadishJain.pdf', '_blank');
        } else if (action === 'scroll:game') {
            const el = document.getElementById('bunny-game-section') || document.getElementById('pm-lab');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
        }
    }

    triggerConfetti() {
        const colors = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#38bdf8'];
        for (let i = 0; i < 40; i++) {
            const conf = document.createElement('div');
            conf.className = 'confetti-particle';
            conf.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            conf.style.left = `${Math.random() * 100}vw`;
            conf.style.top = `-20px`;
            conf.style.transform = `rotate(${Math.random() * 360}deg)`;
            document.body.appendChild(conf);

            setTimeout(() => {
                conf.style.transition = `all ${Math.random() * 2 + 1.5}s ease-out`;
                conf.style.top = `${window.innerHeight + 50}px`;
                conf.style.left = `${parseFloat(conf.style.left) + (Math.random() * 80 - 40)}vw`;
                conf.style.opacity = '0';
            }, 30);

            setTimeout(() => conf.remove(), 3500);
        }
    }
}
