# 🐰 Blinky Companion Engine (`rabbit-logic`)

A standalone, framework-agnostic interactive companion designed to live on top of any website or online store. Built with Three.js orthographic surface rendering, realistic procedural hopping physics, authentic paw prints, scruff-of-neck dragging physics, clinical VITALS telemetry, global persistence, and WhatsApp/Email revival alerts.

---

## 📁 Package Architecture

```
rabbit-logic/
├── bunny.js           # Core standalone Three.js companion engine & event system
├── bunny-brain.js     # Autonomous artificial life simulation (drives, loafing, binkies)
├── bunny-state.js     # Global state manager, localStorage & Firebase sync hooks
├── bunny-firebase.js  # Realtime Firebase Firestore synchronization
├── bunny.css          # Standalone styles (Corner Capsule Pill, Vitals & Brain Drawer)
└── README.md          # Integration guide and documentation
```

---

## 🚀 Quick Start (Embed in Any Website)

### 1. Include Three.js & GLTF Loader
Add Three.js and the GLTF loader to your `<head>`:

```html
<!-- Three.js 3D Library & GLTF Loader -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"></script>

<!-- Bunny Companion Stylesheet -->
<link rel="stylesheet" href="rabbit-logic/bunny.css">
```

### 2. Initialize in JavaScript

```javascript
import { BunnyCompanion } from './rabbit-logic/bunny.js';

const companion = new BunnyCompanion({
    modelPath: 'assets/rabbit.glb',   // Path to GLTF/GLB rabbit model
    adminEmail: 'aadishhere@gmail.com'
});

companion.init();
```

That's it! Blinky will materialize and begin exploring naturally across the screen.

---

## ⚙️ Configuration Options

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `modelPath` | `string` | `'assets/rabbit.glb'` | Path to the 3D rabbit GLB model file. |
| `scale` | `number` | `0.58` | Normalized mesh size on screen. |
| `primaryColor` | `string` | `'#38bdf8'` | Accent color used in HUD and particles. |
| `adminEmail` | `string` | `'aadishhere@gmail.com'` | Destination email address for death/revival requests. |

---

## 💾 Global State & Firebase Integration (`bunny-state.js`)

Blinky's state is persistent across browser sessions and across different pages of your website.

### State Schema
```typescript
{
    health: number,            // 0 - 100
    oxygen: number,            // 0 - 100 (%SpO2)
    isDead: boolean,          // Permanent life/death flag
    deathCount: number,        // Number of times bunny died today
    deadSince: number | null,  // Timestamp of death or null
    carrotsEatenToday: number,// Daily food counter
    lastFedDate: string,       // YYYY-MM-DD (auto-resets food counter daily)
    restMinutes: number,       // Cumulative minutes rested today
    restingSince: number | null,// Timestamp if currently resting, else null
    isResting: boolean,       // Currently asleep in loaf mode
    isSick: boolean,          // Sickness flag (health < 45)
    energy: number,            // Biological energy drive (0 - 100)
    hunger: number,            // Biological hunger drive (0 - 100)
    curiosity: number,         // Biological curiosity drive (0 - 100)
    mood: string,              // e.g. "Happy", "Loafing", "Tummy Rumbling"
    thought: string,           // Current realtime thought
    lastUpdated: number        // Timestamp (ms)
}
```

### Automatic Realtime Firebase Firestore Sync (`bunny-firebase.js`)
Blinky is automatically connected to Aadish's Firebase Firestore project (`myportfolio-aadishhere`) via `rabbit-logic/bunny-firebase.js`.

The sync handles:
- **Realtime Listener**: Whenever Aadish or any admin updates the Firestore document (`bunny/blinky_vitals`), every open browser window immediately reflects the new state in real time.
- **Bi-directional Updates**: Dragging, suffocation, feeding, or reviving automatically syncs back to Firestore.
- **Graceful Fallback**: If offline or if Firestore write permissions are restricted, Blinky automatically falls back to `localStorage` without interrupting site operation.

#### 🔒 Enabling Firestore Permissions in Firebase Console
In your Firebase Console for project **`myportfolio-aadishhere`**, go to **Firestore Database** ➔ **Rules**, and add this rule:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Existing rules...
    match /reviews/{review} {
      allow read, write: if true;
    }
    match /projects/{project} {
      allow read: if true;
    }

    // ✨ Enable Blinky Companion Vitals Sync:
    match /bunny/{doc} {
      allow read, write: if true;
    }
  }
}
```

---

## 🧠 Autonomous Brain & Sleek Corner Capsule Pill Widget

1. **Pure Singular Animal Experience**:
   - Zero intrusive sticky notes, prompts, or speech bubbles hovering above Blinky. Blinky lives freely as an organic 3D companion on the webpage.
2. **Autonomous Brain (`bunny-brain.js`)**:
   - **Page Exploration**: Blinky picks interesting elements on the webpage (projects, headings, navigation) and hops over to inspect them.
   - **Loaf Napping**: When tired, Blinky tucks his paws in, enters a cozy "rabbit loaf" pose, squishes down, and takes a peaceful snooze (accumulating rest minutes).
   - **Joyful Binkies**: When healthy and fed, occasionally performs a rabbit mid-air kick & twist jump.
   - **Carrot Foraging**: Smells carrots dropped on the page, hops over, and munches contentedly.
3. **Corner Capsule Pill Widget**:
   - Always visible in the bottom-right corner.
   - Shows live glowing status orb (🟢 Alive / 🟡 Loafing / 🟠 Sick / 🔴 Choking / 💀 Dead), mood badge, and instant `[🥕 Feed]` button.
   - Expandable Drawer displays:
     - 🥕 Carrots eaten today
     - 💤 Rest minutes today
     - ❤️ Health & Sickness status
     - 💀 Death counter & "Dead since [time]" timer
     - 🫁 Realtime SpO2 & PR bpm with live EKG waveform
     - Direct WhatsApp & Email notification buttons to Aadish when Blinky dies.
     - Discreet Admin Defibrillator Revive button.
