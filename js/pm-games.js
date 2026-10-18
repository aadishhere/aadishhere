/**
 * Aadish Jain — PM Interactive Lab & Simulators Engine
 * Powers:
 * 1. The PM Sprint Dilemma Simulator Game
 * 2. The Interactive RICE Prioritization Engine
 * 3. The A/B Test Impact Calculator
 */

// ==========================================================================
// 1. PM Sprint Dilemma Game Data & Logic
// ==========================================================================
export const sprintScenarios = [
    {
        id: 1,
        badge: "Sev-1 Incident // Sprint Crunch",
        title: "Latency Spike vs. The CEO's Surprise Investor Demo",
        description: "It is Thursday afternoon, 36 hours before sprint release. A sudden latency spike on your coliving rent checkout page causes a 7.4% payment failure rate. Meanwhile, your CEO asks for a live AI-powered rent estimation demo for a critical venture investor meeting tomorrow morning. The engineering team is already stretched.",
        decisions: [
            {
                letter: "A",
                text: "Prioritize Payment Reliability: Reassign 2 engineers to hotfix the checkout latency; give the CEO a polished Figma interactive click-through instead of live production code.",
                hint: "Protects immediate revenue & user trust; manages executive expectations pragmatically.",
                impact: { delight: +15, velocity: 0, roi: +10, debt: -10 },
                tags: ["+15% Delight", "+10% ROI", "-10% Tech Debt"],
                rationale: "Outstanding PM choice! High-performing PMs know that checkout failures directly burn customer trust and cash flow. Using high-fidelity design prototypes for pitch meetings gives the CEO 95% of the visual excitement without destabilizing production systems."
            },
            {
                letter: "B",
                text: "Split Team Sprint: Push 1 engineer to hotfix payments while 2 engineers work overnight to hack together an AI demo in production.",
                hint: "Attempts to satisfy everyone, but risks dev burnout and brittle codebase.",
                impact: { delight: -5, velocity: -15, roi: +15, debt: +25 },
                tags: ["-15% Velocity", "+25% Tech Debt", "-5% Delight"],
                rationale: "Risky compromise. Splitting a crunch sprint often results in a half-tested payment patch and an unmaintainable hack that balloons technical debt for subsequent sprints."
            },
            {
                letter: "C",
                text: "Deploy Quick Gateway Fallback: Route checkout traffic to an alternate secondary payment provider and ship a lightweight rule-based mock for the demo.",
                hint: "Fast tactical mitigation with minimal engineering hours.",
                impact: { delight: +8, velocity: +5, roi: +8, debt: +5 },
                tags: ["+8% Delight", "+5% Velocity", "+8% ROI"],
                rationale: "Pragmatic engineering-informed decision. Utilizing existing redundant infrastructure protects conversion while preserving developer bandwidth."
            }
        ]
    },
    {
        id: 2,
        badge: "User Research vs. Roadmap Pressure",
        title: "The 30-Day Churn Spike vs. Technical Debt Paydown",
        description: "Product analytics reveals a 14% month-over-month spike in coliving tenant churn after month 1. User interviews highlight frustration with slow maintenance ticket resolution (broken ACs, water supply). However, your lead architect warns that the core database query latency is nearing critical threshold and needs an immediate 2-week refactor.",
        decisions: [
            {
                letter: "A",
                text: "The Dual-Track Sprint: Dedicate 70% of sprint capacity to an SLA-bound Maintenance Ticketing MVP; allocate 30% capacity to index the highest-impact database bottlenecks.",
                hint: "Balances burning user pain with architectural stability.",
                impact: { delight: +18, velocity: +5, roi: +12, debt: -5 },
                tags: ["+18% Delight", "+12% ROI", "-5% Tech Debt"],
                rationale: "Textbook PM excellence! Customer churn is an existential threat. Tackling the core maintenance pain while addressing the top 20% of database bottlenecks prevents system collapse while stopping the retention leak."
            },
            {
                letter: "B",
                text: "Total Code Freeze: Halt all feature work for 2 weeks to execute a comprehensive database rewrite.",
                hint: "Engineering-centric; leaves user churn unaddressed.",
                impact: { delight: -12, velocity: +20, roi: -10, debt: -30 },
                tags: ["-12% Delight", "+20% Velocity", "-30% Tech Debt"],
                rationale: "While engineers love full refactors, shutting down product delivery while users are churning damages retention and business confidence."
            },
            {
                letter: "C",
                text: "Automate Via Third-Party Tool: Integrate an off-the-shelf WhatsApp ticketing bot within 2 days, freeing the entire engineering team to execute the database refactor.",
                hint: "High-leverage leverage of buy vs. build.",
                impact: { delight: +14, velocity: +15, roi: +14, debt: -15 },
                tags: ["+14% Delight", "+15% Velocity", "+14% ROI"],
                rationale: "Elite product leverage! Leveraging third-party integrations to validate solutions before custom code is the hallmark of senior product leaders."
            }
        ]
    },
    {
        id: 3,
        badge: "Growth Dilemma // Ethical UX",
        title: "Aggressive Monetization vs. Long-term User Trust",
        description: "The marketing director proposes adding pre-checked recurring cleaning add-ons (+$15/mo) in the tenant onboarding flow, projecting a quick $30,000 monthly revenue bump. Several team members worry this constitutes a dark pattern that will damage organic word-of-mouth.",
        decisions: [
            {
                letter: "A",
                text: "Reject Dark Pattern: Keep add-ons unselected by default, but design a high-converting 'First Month 50% Off Bundle' banner with transparent opt-in.",
                hint: "Protects brand equity and reduces chargeback disputes.",
                impact: { delight: +20, velocity: +5, roi: +10, debt: 0 },
                tags: ["+20% Delight", "+10% ROI", "High Trust"],
                rationale: "Exceptional ethics and product sense. Pre-checked boxes spike short-term revenue but trigger refund disputes, app store negative reviews, and high unsubscription rates."
            },
            {
                letter: "B",
                text: "Execute A/B Test: Run a 50/50 test measuring 90-day retention and net NPS alongside gross revenue.",
                hint: "Data-driven approach to discover true customer elasticity.",
                impact: { delight: +5, velocity: +10, roi: +15, debt: 0 },
                tags: ["+15% ROI", "+10% Velocity", "Data Backed"],
                rationale: "Strong empirical mindset. Testing with guardrail metrics (NPS and cancellation velocity) keeps the team grounded in true lifetime value rather than vanity conversion."
            },
            {
                letter: "C",
                text: "Implement Default Opt-In: Ship the pre-checked add-on to hit quarterly revenue targets, planning to revisit it later.",
                hint: "Short-term vanity spike at the expense of customer trust.",
                impact: { delight: -22, velocity: 0, roi: +18, debt: +15 },
                tags: ["-22% Delight", "+18% Short-term ROI", "-15 Trust"],
                rationale: "Dangerous short-termism. Seasoned product managers resist pressure to use deceptive UI patterns that poison user loyalty."
            }
        ]
    },
    {
        id: 4,
        badge: "Launch Strategy // Scope Control",
        title: "The 80/20 Scoped MVP Launch vs. 100% Perfection",
        description: "Your team is launching a new Roommate Matching algorithm. The engineering team has built a working compatibility score based on sleep schedule, cleanliness, and diet. The design team wants to delay launch by 4 weeks to add animated 3D personality avatars and social badge integrations.",
        decisions: [
            {
                letter: "A",
                text: "Ship MVP Now: Launch with clean 2D UI and baseline compatibility scoring. Gather real roommate retention data before investing in visual polish.",
                hint: "Accelerates time-to-value and rapid hypothesis validation.",
                impact: { delight: +16, velocity: +20, roi: +18, debt: -5 },
                tags: ["+20% Velocity", "+18% ROI", "+16% Delight"],
                rationale: "Masterclass in Lean PM. You validated that users care about living with compatible roommates, not shiny 3D avatars. Shipping early accelerates feedback cycles."
            },
            {
                letter: "B",
                text: "Delay for Perfection: Grant the 4-week extension to ensure a visually viral, Apple Design Award caliber launch.",
                hint: "High visual polish at the risk of delayed market learning.",
                impact: { delight: +8, velocity: -20, roi: -8, debt: +10 },
                tags: ["-20% Velocity", "-8% ROI", "Delayed Launch"],
                rationale: "Perfection is the enemy of shipping. In early product stages, market feedback is infinitely more valuable than decorative animations."
            },
            {
                letter: "C",
                text: "Phased Beta Rollout: Release the functional MVP to 20% of users while design finalizes micro-interactions for the GA release.",
                hint: "Smooth ramp-up with controlled user cohorts.",
                impact: { delight: +14, velocity: +12, roi: +14, debt: 0 },
                tags: ["+14% Delight", "+12% Velocity", "+14% ROI"],
                rationale: "Solid, battle-tested launch strategy. A closed cohort gives you early qualitative feedback while giving design time to polish edge cases."
            }
        ]
    }
];

export class PMSprintGame {
    constructor() {
        this.currentScenarioIndex = 0;
        this.scores = {
            delight: 70,
            velocity: 70,
            roi: 70,
            debt: 30
        };
        this.history = [];
    }

    init() {
        this.renderScenario();
        this.updateHud();
    }

    renderScenario() {
        const scenario = sprintScenarios[this.currentScenarioIndex];
        const scenarioCard = document.getElementById("scenario-card");
        const feedbackBox = document.getElementById("decision-feedback");
        if (!scenarioCard) return;

        if (feedbackBox) feedbackBox.style.display = "none";

        document.getElementById("scenario-badge").textContent = scenario.badge;
        document.getElementById("scenario-counter").textContent = `Scenario ${scenario.id} of ${sprintScenarios.length}`;
        document.getElementById("scenario-title").textContent = scenario.title;
        document.getElementById("scenario-desc").textContent = scenario.description;

        const decisionsGrid = document.getElementById("decisions-grid");
        decisionsGrid.innerHTML = "";

        scenario.decisions.forEach((decision, idx) => {
            const btn = document.createElement("button");
            btn.className = "decision-btn";
            btn.innerHTML = `
                <div class="decision-letter">${decision.letter}</div>
                <div class="decision-content">
                    <div class="decision-text">${decision.text}</div>
                    <div class="decision-hint"><i class="fa-solid fa-lightbulb"></i> ${decision.hint}</div>
                </div>
            `;
            btn.addEventListener("click", () => this.handleDecision(decision));
            decisionsGrid.appendChild(btn);
        });
    }

    handleDecision(decision) {
        // Disable decision buttons
        const btns = document.querySelectorAll(".decision-btn");
        btns.forEach(b => b.disabled = true);

        // Apply impacts
        this.scores.delight = Math.min(100, Math.max(10, this.scores.delight + decision.impact.delight));
        this.scores.velocity = Math.min(100, Math.max(10, this.scores.velocity + decision.impact.velocity));
        this.scores.roi = Math.min(100, Math.max(10, this.scores.roi + decision.impact.roi));
        this.scores.debt = Math.min(100, Math.max(5, this.scores.debt + decision.impact.debt));

        this.updateHud();

        // Show feedback
        const feedbackBox = document.getElementById("decision-feedback");
        const tagsContainer = document.getElementById("feedback-tags");
        const textContainer = document.getElementById("feedback-text");
        const nextBtn = document.getElementById("btn-next-scenario");

        tagsContainer.innerHTML = decision.tags.map(t => {
            const isPos = t.includes("+") || t.includes("High");
            return `<span class="impact-tag ${isPos ? 'pos' : 'neg'}">${t}</span>`;
        }).join("");

        textContainer.innerHTML = `<strong>PM Rationale:</strong> ${decision.rationale}`;
        feedbackBox.style.display = "block";

        nextBtn.onclick = () => {
            if (this.currentScenarioIndex < sprintScenarios.length - 1) {
                this.currentScenarioIndex++;
                this.renderScenario();
            } else {
                this.showScorecard();
            }
        };
    }

    updateHud() {
        const updateMetric = (id, val) => {
            const valEl = document.getElementById(`val-${id}`);
            const barEl = document.getElementById(`bar-${id}`);
            if (valEl) valEl.textContent = `${val}%`;
            if (barEl) barEl.style.width = `${val}%`;
        };

        updateMetric("delight", this.scores.delight);
        updateMetric("velocity", this.scores.velocity);
        updateMetric("roi", this.scores.roi);
        updateMetric("debt", this.scores.debt);
    }

    showScorecard() {
        const gameHud = document.getElementById("game-hud");
        const scenarioCard = document.getElementById("scenario-card");
        const decisionsGrid = document.getElementById("decisions-grid");
        const feedbackBox = document.getElementById("decision-feedback");
        const scorecard = document.getElementById("game-scorecard");

        if (scenarioCard) scenarioCard.style.display = "none";
        if (decisionsGrid) decisionsGrid.style.display = "none";
        if (feedbackBox) feedbackBox.style.display = "none";

        const overallScore = Math.round((this.scores.delight + this.scores.velocity + this.scores.roi + (100 - this.scores.debt)) / 4);

        let archetype = "The Pragmatic Product Strategist";
        let desc = "You demonstrate exceptional equilibrium between user empathy, technical reality, and commercial impact. You resist shiny distractions and ship high-leverage products.";

        if (this.scores.delight > 85) {
            archetype = "The Customer-Obsessed Innovator";
            desc = "Your priority is uncompromising user delight and trust. You protect customers from dark patterns and high-friction edge cases.";
        } else if (this.scores.velocity > 85) {
            archetype = "The High-Velocity Execution Machine";
            desc = "You prioritize rapid time-to-market, lean MVPs, and ruthless scope cutting. Teams love your bias for action.";
        }

        document.getElementById("scorecard-score").textContent = `${overallScore}/100`;
        document.getElementById("scorecard-archetype").textContent = archetype;
        document.getElementById("scorecard-desc").textContent = desc;
        document.getElementById("score-delight").textContent = `${this.scores.delight}%`;
        document.getElementById("score-velocity").textContent = `${this.scores.velocity}%`;
        document.getElementById("score-roi").textContent = `${this.scores.roi}%`;
        document.getElementById("score-debt").textContent = `${this.scores.debt}%`;

        scorecard.style.display = "block";

        document.getElementById("btn-restart-game").onclick = () => {
            this.currentScenarioIndex = 0;
            this.scores = { delight: 70, velocity: 70, roi: 70, debt: 30 };
            scenarioCard.style.display = "block";
            decisionsGrid.style.display = "flex";
            scorecard.style.display = "none";
            this.renderScenario();
            this.updateHud();
        };

        const copyBtn = document.getElementById("btn-copy-report");
        if (copyBtn) {
            copyBtn.onclick = () => {
                const text = `Aadish Jain's PM Sprint Simulator Result:\nScore: ${overallScore}/100\nPM Archetype: ${archetype}\nDelight: ${this.scores.delight}% | Velocity: ${this.scores.velocity}% | Business ROI: ${this.scores.roi}% | Tech Debt: ${this.scores.debt}%\nTested at: https://aadishjain.com`;
                navigator.clipboard.writeText(text).then(() => {
                    copyBtn.innerHTML = `<i class="fa-solid fa-check"></i> Copied to Clipboard!`;
                    setTimeout(() => {
                        copyBtn.innerHTML = `<i class="fa-solid fa-share-nodes"></i> Share / Copy Result`;
                    }, 2500);
                });
            };
        }
    }
}

// ==========================================================================
// 2. Interactive RICE Prioritization Engine
// ==========================================================================
export const riceFeaturesData = [
    {
        id: "f1",
        title: "Automated UPI AutoPay for Coliving Rent",
        category: "Fintech & Payments",
        reach: 4200,
        impact: 2.0, // 0.25 to 3
        confidence: 0.9, // 0.5 to 1.0
        effort: 2.0 // 0.5 to 5
    },
    {
        id: "f2",
        title: "SLA-Bound Maintenance Video Dispatcher",
        category: "Operations & Retention",
        reach: 3100,
        impact: 1.5,
        confidence: 0.8,
        effort: 1.5
    },
    {
        id: "f3",
        title: "AI Roommate Compatibility Matching",
        category: "Growth & Community",
        reach: 1800,
        impact: 2.0,
        confidence: 0.6,
        effort: 3.5
    },
    {
        id: "f4",
        title: "Digital Lease e-Sign with Aadhaar KYC",
        category: "Compliance & Security",
        reach: 2200,
        impact: 1.0,
        confidence: 0.95,
        effort: 1.0
    }
];

export class RICEEngine {
    constructor() {
        this.features = [...riceFeaturesData];
    }

    init() {
        this.renderTable();
    }

    calculateScore(f) {
        return Math.round((f.reach * f.impact * f.confidence) / f.effort);
    }

    renderTable() {
        const tbody = document.getElementById("rice-tbody");
        if (!tbody) return;

        // Sort by RICE score descending
        const sorted = [...this.features].sort((a, b) => this.calculateScore(b) - this.calculateScore(a));

        tbody.innerHTML = "";

        sorted.forEach((feat, index) => {
            const score = this.calculateScore(feat);
            const tr = document.createElement("tr");
            tr.className = "rice-row";
            tr.innerHTML = `
                <td><div class="rice-rank-badge">#${index + 1}</div></td>
                <td>
                    <div class="rice-feature-title">${feat.title}</div>
                    <div class="rice-feature-category">${feat.category}</div>
                </td>
                <td>
                    <div class="rice-slider-group">
                        <span class="rice-slider-val">${feat.reach.toLocaleString()}</span>
                        <input type="range" class="rice-slider" min="500" max="10000" step="100" value="${feat.reach}" data-id="${feat.id}" data-param="reach">
                    </div>
                </td>
                <td>
                    <div class="rice-slider-group">
                        <span class="rice-slider-val">${feat.impact.toFixed(1)}x</span>
                        <input type="range" class="rice-slider" min="0.25" max="3" step="0.25" value="${feat.impact}" data-param="impact" data-id="${feat.id}">
                    </div>
                </td>
                <td>
                    <div class="rice-slider-group">
                        <span class="rice-slider-val">${Math.round(feat.confidence * 100)}%</span>
                        <input type="range" class="rice-slider" min="0.5" max="1.0" step="0.05" value="${feat.confidence}" data-param="confidence" data-id="${feat.id}">
                    </div>
                </td>
                <td>
                    <div class="rice-slider-group">
                        <span class="rice-slider-val">${feat.effort.toFixed(1)} mo</span>
                        <input type="range" class="rice-slider" min="0.5" max="5" step="0.5" value="${feat.effort}" data-param="effort" data-id="${feat.id}">
                    </div>
                </td>
                <td>
                    <div class="rice-score-badge">${score.toLocaleString()}</div>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Attach listeners
        tbody.querySelectorAll(".rice-slider").forEach(slider => {
            slider.addEventListener("input", (e) => {
                const id = e.target.dataset.id;
                const param = e.target.dataset.param;
                const val = parseFloat(e.target.value);

                const item = this.features.find(f => f.id === id);
                if (item) {
                    item[param] = val;
                    this.renderTable();
                }
            });
        });
    }
}

// ==========================================================================
// 3. A/B Testing & Funnel Impact Simulator
// ==========================================================================
export class ABTestSimulator {
    constructor() {
        this.visitors = 45000;
        this.baselineConversion = 3.2; // 3.2%
        this.expectedLift = 15; // 15% relative lift
        this.avgValue = 45; // $45 / Rs 3,500
    }

    init() {
        const visitorSlider = document.getElementById("ab-visitors");
        const convSlider = document.getElementById("ab-baseline");
        const liftSlider = document.getElementById("ab-lift");
        const valueSlider = document.getElementById("ab-val");

        if (!visitorSlider) return;

        const updateAll = () => {
            this.visitors = parseInt(visitorSlider.value);
            this.baselineConversion = parseFloat(convSlider.value);
            this.expectedLift = parseInt(liftSlider.value);
            this.avgValue = parseInt(valueSlider.value);

            document.getElementById("lbl-ab-visitors").textContent = this.visitors.toLocaleString();
            document.getElementById("lbl-ab-baseline").textContent = `${this.baselineConversion.toFixed(1)}%`;
            document.getElementById("lbl-ab-lift").textContent = `+${this.expectedLift}%`;
            document.getElementById("lbl-ab-val").textContent = `$${this.avgValue}`;

            this.calculate();
        };

        [visitorSlider, convSlider, liftSlider, valueSlider].forEach(s => {
            s.addEventListener("input", updateAll);
        });

        updateAll();
    }

    calculate() {
        const p1 = this.baselineConversion / 100;
        const relativeLift = this.expectedLift / 100;
        const p2 = p1 * (1 + relativeLift);
        const absoluteLift = p2 - p1;

        // Statistical sample size formula for proportions (alpha = 0.05, beta = 0.20 -> Z = 16)
        const pooledVariance = (p1 * (1 - p1)) + (p2 * (1 - p2));
        const sampleSizePerVariant = Math.round((16 * pooledVariance) / Math.pow(p2 - p1, 2));
        const totalSampleSize = sampleSizePerVariant * 2;

        const dailyVisitors = this.visitors / 30;
        const daysRequired = Math.max(2, Math.ceil(totalSampleSize / dailyVisitors));

        // Projected incremental annual revenue
        const currentMonthlyConversions = this.visitors * p1;
        const newMonthlyConversions = this.visitors * p2;
        const incrementalMonthlyOrders = newMonthlyConversions - currentMonthlyConversions;
        const annualRevenueLift = Math.round(incrementalMonthlyOrders * this.avgValue * 12);

        document.getElementById("res-sample-size").textContent = `${totalSampleSize.toLocaleString()} users`;
        document.getElementById("res-duration").textContent = `${daysRequired} days`;
        document.getElementById("res-rev-lift").textContent = `+$${annualRevenueLift.toLocaleString()}/yr`;
        document.getElementById("res-new-rate").textContent = `${(p2 * 100).toFixed(2)}% (+${(absoluteLift * 100).toFixed(2)}% abs)`;
    }
}
