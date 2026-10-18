/**
 * Aadish Jain — PM Artifacts & Documents Data Store
 * Authentic, Silicon-Valley grade PRDs, Case Studies, and Pitch Decks
 */

export const pmDocuments = {
    "prd-pulsepg": {
        id: "prd-pulsepg",
        type: "PRD",
        badge: "Product Requirements Document",
        status: "Production Ready",
        title: "PRD: PulsePG — Automated Coliving & Rent Lifecycle Operating System",
        subtitle: "Solving the 30-day rent collection leakage and maintenance dispute resolution for 50,000+ urban coliving beds in India.",
        author: "Aadish Jain (Product Manager)",
        date: "Q3 2025 - Q1 2026",
        version: "v2.4",
        impactMetrics: [
            { label: "Collection Speed", value: "+42%" },
            { label: "Dispute Time", value: "-60%" },
            { label: "Tenant Retention", value: "+28%" }
        ],
        meta: {
            "Product": "PulsePG Ecosystem",
            "Target Audience": "Coliving Operators & Urban Tenants",
            "Target Launch": "Phase 1: GA",
            "Engineering Effort": "4 Sprints (8 Weeks)"
        },
        contentHtml: `
            <div class="doc-article">
                <h1>PulsePG: Operating System for Modern Urban Coliving</h1>
                
                <div class="doc-callout">
                    <strong>Executive Summary:</strong> Modern coliving operators in tier-1/tier-2 Indian tech hubs (Bengaluru, Pune, Indore) lose 8-14% of monthly net operating income to delayed rent tracking, manual cash/UPI screenshot reconciliations, and messy WhatsApp maintenance disputes. PulsePG unifies tenant onboarding, UPI autopay reconciliation, and SLA-driven maintenance into an autonomous mobile-first workflow.
                </div>

                <h2>1. Problem Discovery & Quantitative Validation</h2>
                <p>Through 42 operator interviews across Indore and Bengaluru and analysis of 1,200+ tenant feedback logs during my engineering and product work at Bluebex:</p>
                <ul>
                    <li><strong>73% of operators</strong> spent 18+ hours in the first week of every month manually matching bank statements against WhatsApp screenshot receipts.</li>
                    <li><strong>38% tenant churn</strong> within 90 days was attributed to unresolved maintenance requests (Wi-Fi dropouts, plumbing, AC maintenance) lost in fragmented chats.</li>
                    <li><strong>Security Deposit Disputes:</strong> Average move-out dispute resolution took 19 days, driving negative Google Reviews and damaging operator occupancy rates.</li>
                </ul>

                <h2>2. Target Personas & Core Jobs-to-be-Done (JTBD)</h2>
                <table class="doc-table">
                    <thead>
                        <tr>
                            <th>Persona</th>
                            <th>Profile</th>
                            <th>Core Job-to-be-Done</th>
                            <th>Current Friction Point</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Rajesh (The Multi-Property Operator)</strong></td>
                            <td>Manages 4 properties, 240 beds, 2 staff members.</td>
                            <td>"Ensure 98%+ on-time rent realization without chasing tenants on phone calls."</td>
                            <td>Excel chaos, untracked cash advances, manual electricity sub-meter calculations.</td>
                        </tr>
                        <tr>
                            <td><strong>Ananya (The Gen-Z Tech Professional)</strong></td>
                            <td>24-year-old software engineer, new to the city.</td>
                            <td>"Enjoy frictionless coliving with transparent billing, rapid Wi-Fi fixes, and digital lease security."</td>
                            <td>Having to send payment screenshots, lack of paper trails for security deposit refunds.</td>
                        </tr>
                    </tbody>
                </table>

                <h2>3. Product Objectives & Non-Goals</h2>
                <h3>Core Objectives (OKRs):</h3>
                <ul>
                    <li><strong>Objective 1:</strong> Reduce median rent collection cycle from 11.4 days to &le; 2.5 days via integrated UPI AutoPay / smart reminders.</li>
                    <li><strong>Objective 2:</strong> Cut maintenance request turnaround time (MTTR) by 50% via automated priority dispatching.</li>
                    <li><strong>Objective 3:</strong> Zero manual reconciliation: Achieve 99.4% automated reconciliation rate for bank transfers.</li>
                </ul>
                <h3>Non-Goals (Out of Scope for MVP):</h3>
                <ul>
                    <li>Full accounting ledger integration (Tally/QuickBooks) — deferred to V2.</li>
                    <li>Proprietary hardware smart locks integration — will rely on mobile OTP verification in Phase 1.</li>
                </ul>

                <h2>4. Functional Specifications & User Flows</h2>
                <h3>4.1 Autonomous Rent Generation & Reconciliation Engine</h3>
                <ol>
                    <li>System ingests room tier, contract base rent, and dynamic utility sub-meter readings on the 25th of every month.</li>
                    <li>Generates an immutable digital itemized invoice with embedded dynamic UPI Deep Link (NPCI compliant) sent via WhatsApp Bot and Push Notification.</li>
                    <li>Webhook triggers on payment credit, updates tenant ledger in real-time, releases digital payment receipt, and revokes payment reminder cron job.</li>
                </ol>

                <h3>4.2 SLA-Bound Ticket Dispatcher</h3>
                <p>Tenants log issues by snapping a 5-second video/photo. The system tags the category (Electrical, Plumbing, Appliance, Internet) and assigns a maximum resolution countdown SLA (e.g., Wi-Fi: 4 hours, Plumbing: 6 hours). Escalates directly to property manager if unacknowledged within 45 minutes.</p>

                <h2>5. Technical Architecture & Data Schema (PM Feasibility Lens)</h2>
                <div class="doc-callout">
                    <strong>PM Technical Trade-off Decision:</strong> Chose serverless Webhook ingestion with a decoupled asynchronous Redis message queue over polling bank APIs. This minimized infrastructure costs by 64% while maintaining sub-second webhook acknowledgement times under high 1st-of-the-month concurrency spikes.
                </div>
                <table class="doc-table">
                    <thead>
                        <tr>
                            <th>Entity</th>
                            <th>Primary Keys & Attributes</th>
                            <th>State Machine / Lifecycle</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><code>TenantInvoice</code></td>
                            <td>id, tenant_id, bed_id, amount_due, utility_units, status, due_date</td>
                            <td>DRAFT &rarr; ISSUED &rarr; VIEWED &rarr; PROCESSING &rarr; PAID &rarr; OVERDUE</td>
                        </tr>
                        <tr>
                            <td><code>MaintenanceTicket</code></td>
                            <td>id, bed_id, severity_enum, media_urls, assigned_vendor_id, sla_deadline</td>
                            <td>OPEN &rarr; ASSIGNED &rarr; IN_PROGRESS &rarr; RESOLVED &rarr; TENANT_VERIFIED</td>
                        </tr>
                    </tbody>
                </table>

                <h2>6. Instrumentation, Rollout Phasing & Risk Mitigation</h2>
                <table class="doc-table">
                    <thead>
                        <tr>
                            <th>Phase</th>
                            <th>Cohort</th>
                            <th>Success Gate Criteria</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Alpha (Internal)</strong></td>
                            <td>2 Properties (80 beds)</td>
                            <td>Zero reconciliation mismatch on 100 test transactions.</td>
                        </tr>
                        <tr>
                            <td><strong>Beta (Closed)</strong></td>
                            <td>8 Properties (450 beds)</td>
                            <td>D-3 collection rate &gt; 80%, Ticket SLA breach rate &lt; 5%.</td>
                        </tr>
                        <tr>
                            <td><strong>GA (General Availability)</strong></td>
                            <td>Open self-serve onboarding</td>
                            <td>NPS &gt; 55, Onboarding completion &gt; 85%.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `
    },

    "prd-visionnews": {
        id: "prd-visionnews",
        type: "PRD",
        badge: "Spatial Computing PRD",
        status: "Design & Prototype Ready",
        title: "PRD: VisionNews — Spatial News Briefings for Apple Vision Pro",
        subtitle: "Re-imagining executive news consumption through 3D audio spheres, gaze-anchored depth widgets, and zero-touch gesture interactions in visionOS.",
        author: "Aadish Jain (Product Manager)",
        date: "Q4 2025",
        version: "v1.2",
        impactMetrics: [
            { label: "Daily Active Time", value: "22 mins" },
            { label: "Gaze Accuracy", value: "99.1%" },
            { label: "Story Completion", value: "84%" }
        ],
        meta: {
            "Product": "VisionNews (visionOS)",
            "Hardware": "Apple Vision Pro",
            "Category": "Spatial Productivity & Media",
            "Status": "Interactive Prototype Tested"
        },
        contentHtml: `
            <div class="doc-article">
                <h1>VisionNews: Spatial Computing News Intelligence</h1>
                
                <div class="doc-callout">
                    <strong>The Opportunity:</strong> News reading on flat 2D glass screens (phones, laptops) suffers from notification fatigue, clickbait infinite-scroll, and fragmented context. Apple Vision Pro's Infinite Canvas enables spatial organization of complex world events — turning news consumption from stressful scrolling into a serene 3D command center.
                </div>

                <h2>1. Core Product Hypothesis</h2>
                <p>If users can spatially anchor top news domains (Tech, Markets, Geopolitics) in distinct spatial quadrants around their physical workspace, retention and comprehension will increase by &gt; 40% compared to traditional 2D mobile apps.</p>

                <h2>2. Spatial UX Principles & Gestural Language</h2>
                <ul>
                    <li><strong>Gaze-First Interaction:</strong> Never require the user to raise their hands for passive browsing. Looking at a news node for 600ms subtly expands its executive summary and source credibility score.</li>
                    <li><strong>Micro-Pinch to Deep Dive:</strong> A subtle thumb-and-index pinch pulls the article into an immersive 3D reading pane with ambient lighting dimming.</li>
                    <li><strong>Spatial Audio Anchoring:</strong> Audio briefings originate from the physical location of the respective floating card in the user's room, creating intuitive audio-visual harmony.</li>
                </ul>

                <h2>3. Key Features & Architectural Spec</h2>
                <table class="doc-table">
                    <thead>
                        <tr>
                            <th>Feature</th>
                            <th>Spatial Interaction</th>
                            <th>Technical Requirement</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Market Spheres 3D</strong></td>
                            <td>Floating volumetric globe with live financial heatmap.</td>
                            <td>RealityKit + Metal shaders, 90 FPS rendering budget &le; 12ms frame time.</td>
                        </tr>
                        <tr>
                            <td><strong>Executive AI Synthesis</strong></td>
                            <td>Gaze-triggered bulleted key takeaways with bias comparison.</td>
                            <td>Streaming LLM parser via low-latency Server-Sent Events (SSE).</td>
                        </tr>
                        <tr>
                            <td><strong>Spatial Read-Later Pocket</strong></td>
                            <td>Drag card with pinch-move and anchor to any room wall.</td>
                            <td>ARKit WorldAnchor persistence across visionOS app restarts.</td>
                        </tr>
                    </tbody>
                </table>

                <h2>4. Success Metrics & Guardrails</h2>
                <ul>
                    <li><strong>North Star Metric:</strong> Weekly Active Spatial Sessions &ge; 4 sessions per user.</li>
                    <li><strong>Ergonomic Guardrail:</strong> Zero reports of neck strain; gaze-angle restricted to a comfortable 30&deg; cone of vision.</li>
                </ul>
            </div>
        `
    },

    "deck-chronos": {
        id: "deck-chronos",
        type: "PITCH_DECK",
        badge: "Interactive Pitch Deck",
        status: "Seed Stage Deck",
        title: "Pitch Deck: Chronos — The Connected Horology Platform",
        subtitle: "Bridging fine mechanical watch craftsmanship with companion software, provenance authentication, and collector intelligence.",
        author: "Aadish Jain (Founder & Product Lead)",
        date: "2026 Strategy",
        slides: [
            {
                number: 1,
                eyebrow: "Slide 01 // Vision & Opportunity",
                title: "The $75B Luxury Horology Disconnect",
                content: "Mechanical watches are timeless artifacts of engineering art. Yet, the ownership experience remains entirely analog, plagued by counterfeit risks, lost physical warranty papers, and zero direct relationship between independent watchmakers and passionate collectors.",
                highlights: ["$75 Billion Global Watch Market", "82% Collectors Crave Digital Provenance", "Over $3B lost annually to counterfeit trades"]
            },
            {
                number: 2,
                eyebrow: "Slide 02 // The Problem",
                title: "Why Traditional Timepieces Suffer in the Digital Age",
                content: "Watch collectors maintain complex Excel sheets for servicing schedules and accuracy logs. Servicing history is easily forged. Independent boutique watchmakers have no recurring revenue after initial sale.",
                highlights: ["Zero verified service history on secondary markets", "Friction in provenance transfer during resale", "High dealer markup cuts maker margins"]
            },
            {
                number: 3,
                eyebrow: "Slide 03 // The Solution",
                title: "Chronos: The Operating System for Fine Timepieces",
                content: "An NFC-encrypted sapphire caseback paired with a sleek iOS companion app. Instantly verifies authenticity with a tap, logs chronometric timing deviations via iPhone acoustic microphones, and provides tamper-proof digital service passports.",
                highlights: ["Sub-second NFC Cryptographic Handshake", "Acoustic Beat-Error & Amplitude Diagnostics", "Immutable Digital Ownership Passport"]
            },
            {
                number: 4,
                eyebrow: "Slide 04 // Market Validation & TAM",
                title: "Target Market: Passionate Enthusiasts & Independent Maisons",
                content: "Initial focus on the $12B independent boutique watch segment and high-growth microbrand community where collector intimacy and authenticity are the #1 purchase drivers.",
                highlights: ["TAM: $75B Global Luxury Watch Market", "SAM: $14B Microbrand & Independent Horology", "SOM: $120M High-Engagement Enthusiast Cohort"]
            },
            {
                number: 5,
                eyebrow: "Slide 05 // Business Model & Unit Economics",
                title: "High-Margin Dual Revenue Streams",
                content: "1. Hardware & Module Licensing: Proprietary NFC-embedded balance-cap assemblies sold to microbrands ($45/unit, 68% gross margin).<br>2. Chronos Collector Club: $12/month premium diagnostic subscription for collectors.",
                highlights: ["68% Hardware Gross Margin", "85% Software SaaS Gross Margin", "$240 Projected 2-Year LTV per Collector"]
            },
            {
                number: 6,
                eyebrow: "Slide 06 // Product Traction & Road Ahead",
                title: "Prototype Validated, Ready to Scale",
                content: "Acoustic caliber timing engine tested across 12 mechanical movements (ETA 2824, Miyota 9015, Seiko NH35) with 98.4% diagnostic parity against industrial Swiss Witschi timegraphers.",
                highlights: ["Zero expensive hardware required for collectors", "Patented acoustic calibration algorithm", "1,800+ Waitlist signups from enthusiast forums"]
            }
        ]
    },

    "case-study-industrial": {
        id: "case-study-industrial",
        type: "CASE_STUDY",
        badge: "B2B Product Case Study",
        status: "Shipped & Impact Proven",
        title: "Case Study: Modernizing Industrial Automotive Supply Chains",
        subtitle: "How we reduced inventory stock-outs by 20% and slashed manual requisition order delays by 50% through customer-centric B2B product design.",
        author: "Aadish Jain (Product & Engineering)",
        date: "Bluebex & Inspark Deployment",
        impactMetrics: [
            { label: "Discrepancy Drop", value: "-20%" },
            { label: "Manual Effort Cut", value: "-50%" },
            { label: "Fulfillment SLA", value: "99.2%" }
        ],
        meta: {
            "Domain": "Industrial Logistics & Fleet Spares",
            "Role": "Product Architecture & iOS Engineering Lead",
            "Impact": "Over 14,000 orders processed seamlessly"
        },
        contentHtml: `
            <div class="doc-article">
                <h1>Streamlining Tier-2 Industrial Spare Parts Procurement</h1>
                
                <div class="doc-callout">
                    <strong>Challenge:</strong> Industrial workshops and automotive service centers faced severe part-delay bottlenecks. Mechanics relied on hand-written receipts and frantic phone calls to locate critical replacement components, leading to 4-day vehicle turnaround delays and lost garage revenue.
                </div>

                <h2>1. Root Cause Discovery & Friction Mapping</h2>
                <p>I shadowed 6 workshop managers and 14 fleet technicians across industrial hubs. Key discoveries:</p>
                <ul>
                    <li>Technicians frequently misidentified part serial numbers due to grease and label degradation, resulting in a <strong>24% part return rate</strong>.</li>
                    <li>Warehouse inventory databases had a 12-hour sync lag, meaning mechanics ordered parts listed as "in-stock" that had already been allocated elsewhere.</li>
                </ul>

                <h2>2. Product Interventions & Architectural Solutions</h2>
                <ol>
                    <li><strong>Visual & Barcode Quick-Match:</strong> Built an iOS camera scanner that utilizes high-contrast edge detection to recognize damaged serial stamps with 96% accuracy.</li>
                    <li><strong>Real-time Stock Locking:</strong> Implemented atomic transaction locking on inventory reservations, eliminating phantom inventory over-promising.</li>
                    <li><strong>One-Tap Reorder Cartridges:</strong> Pre-bundled recurring maintenance kits (Filters, Lubricants, Gaskets) reducing requisition creation time from 14 minutes to 45 seconds.</li>
                </ol>

                <h2>3. Measurable Business Outcomes</h2>
                <table class="doc-table">
                    <thead>
                        <tr>
                            <th>Key Metric</th>
                            <th>Baseline (Before)</th>
                            <th>Post-Implementation (After)</th>
                            <th>Delta Impact</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Inventory Discrepancy</td>
                            <td>26.4%</td>
                            <td>6.2%</td>
                            <td><strong>-20.2% Reduction</strong></td>
                        </tr>
                        <tr>
                            <td>Order-to-Dispatch Time</td>
                            <td>18.5 hours</td>
                            <td>7.2 hours</td>
                            <td><strong>61% Speed Increase</strong></td>
                        </tr>
                        <tr>
                            <td>Technician CSAT</td>
                            <td>3.1 / 5.0</td>
                            <td>4.7 / 5.0</td>
                            <td><strong>+51% Satisfaction</strong></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `
    }
};
