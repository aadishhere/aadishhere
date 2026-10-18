/**
 * 🐰 BunnyState — Global State Management & Firebase Adapter for Blinky
 * Persists bunny health, food, rest, and life/death state across sessions and websites.
 * Pre-wired for Firebase Realtime Database & Firestore.
 */

const STORAGE_KEY = 'aadish_bunny_global_state';

const DEFAULT_STATE = {
    health: 100,            // 0 - 100
    oxygen: 100,            // 0 - 100 (%SpO2)
    isDead: false,          // Persisted life/death flag
    deathCount: 0,          // Number of times bunny died today
    deadSince: null,        // Timestamp of death or null
    carrotsEatenToday: 0,   // Number of carrots eaten today
    lastFedTime: Date.now(),
    lastFedDate: new Date().toISOString().split('T')[0],
    isSick: false,          // Critical condition flag
    lastUpdated: Date.now()
};

export class BunnyState {
    constructor() {
        this.listeners = [];
        this.state = this.loadState();
        this.checkDayReset();
    }

    loadState() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                return { ...DEFAULT_STATE, ...JSON.parse(saved) };
            }
        } catch (e) {
            console.warn('[BunnyState] Error reading localStorage:', e);
        }
        return { ...DEFAULT_STATE };
    }

    saveState() {
        this.state.lastUpdated = Date.now();
        this.state.isSick = !this.state.isDead && (this.state.health < 45 || this.state.oxygen < 65);
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
        } catch (e) {
            console.warn('[BunnyState] Error saving localStorage:', e);
        }
        this.notifyListeners();
        this.syncToFirebase();
    }

    checkDayReset() {
        const today = new Date().toISOString().split('T')[0];
        if (this.state.lastFedDate !== today) {
            this.state.lastFedDate = today;
            this.state.carrotsEatenToday = 0;
            this.state.deathCount = 0;
            this.saveState();
        }
    }

    // --- State Mutations ---
    setDead(isDead) {
        this.state.isDead = !!isDead;
        if (isDead) {
            this.state.health = 0;
            this.state.oxygen = 0;
            this.state.deathCount = (this.state.deathCount || 0) + 1;
            this.state.deadSince = Date.now();
        } else {
            this.state.deadSince = null;
            this.state.oxygen = 100;
            this.state.health = 100;
        }
        this.saveState();
    }

    setHealth(val) {
        this.state.health = Math.max(0, Math.min(100, val));
        if (this.state.health === 0) {
            this.setDead(true);
            return;
        }
        this.saveState();
    }

    setOxygen(val) {
        this.state.oxygen = Math.max(0, Math.min(100, val));
        if (this.state.oxygen === 0) {
            this.setDead(true);
            return;
        }
        this.saveState();
    }

    recordCarrotEaten() {
        this.checkDayReset();
        this.state.carrotsEatenToday = (this.state.carrotsEatenToday || 0) + 1;
        this.state.lastFedTime = Date.now();
        this.state.health = Math.min(100, this.state.health + 20);
        this.state.oxygen = Math.min(100, this.state.oxygen + 15);
        this.saveState();
    }

    // --- Admin Revival ---
    adminRevive() {
        this.state.isDead = false;
        this.state.health = 100;
        this.state.oxygen = 100;
        this.state.deadSince = null;
        this.saveState();
    }

    // --- Observer Pattern ---
    subscribe(callback) {
        this.listeners.push(callback);
        callback(this.state);
        return () => {
            this.listeners = this.listeners.filter(cb => cb !== callback);
        };
    }

    notifyListeners() {
        this.listeners.forEach(cb => {
            try {
                cb(this.state);
            } catch (e) {
                console.error(e);
            }
        });
    }

    // --- Firebase Hook ---
    syncToFirebase() {
        if (window.bunnyFirebaseRef) {
            try {
                window.bunnyFirebaseRef.set(this.state);
            } catch (err) {
                console.warn('[BunnyState] Firebase sync error:', err);
            }
        }
    }

    connectFirebase(firebaseDatabaseRef) {
        window.bunnyFirebaseRef = firebaseDatabaseRef;
        firebaseDatabaseRef.on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                this.state = { ...this.state, ...data };
                localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
                this.notifyListeners();
            }
        });
    }

    applyRemoteState(remoteData) {
        if (!remoteData) return;
        this.state = {
            ...this.state,
            ...remoteData
        };
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
        } catch (e) {}
        this.notifyListeners();
    }
}

export const bunnyGlobalState = new BunnyState();
