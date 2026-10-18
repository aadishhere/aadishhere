/**
 * 🐰 BunnyFirebaseSync — Realtime Firebase Firestore Sync for Blinky
 * Connects Blinky's vitals, death state, food count, and rest time to Aadish's Firebase database.
 * Syncs seamlessly across visitors, tabs, and sessions.
 */

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/9.6.7/firebase-app.js";
import { getFirestore, doc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/9.6.7/firebase-firestore.js";
import { bunnyGlobalState } from "./bunny-state.js";

export const defaultFirebaseConfig = {
    apiKey: "AIzaSyAy8bC4VPqwOajedDs-vLldSoKDjcJVZd0",
    authDomain: "myportfolio-aadishhere.firebaseapp.com",
    projectId: "myportfolio-aadishhere",
    storageBucket: "myportfolio-aadishhere.appspot.com",
    messagingSenderId: "483800227478",
    appId: "1:483800227478:web:994bda2c2d41a7377eecb7"
};

export class BunnyFirebaseSync {
    constructor(config = defaultFirebaseConfig, collectionName = "bunny", docId = "blinky_vitals") {
        this.config = config;
        this.collectionName = collectionName;
        this.docId = docId;
        this.app = null;
        this.db = null;
        this.docRef = null;
        this.unsubscribe = null;
        this.isSyncing = false;
        this.hasWritePermission = true;
        this.debounceTimer = null;
    }

    async init() {
        try {
            this.app = !getApps().length ? initializeApp(this.config) : getApps()[0];
            this.db = getFirestore(this.app);
            this.docRef = doc(this.db, this.collectionName, this.docId);

            // 1. Initial snapshot & realtime listener
            this.unsubscribe = onSnapshot(this.docRef, (snapshot) => {
                if (snapshot.exists()) {
                    const remoteData = snapshot.data();
                    this.isSyncing = true;
                    bunnyGlobalState.applyRemoteState(remoteData);
                    this.isSyncing = false;
                } else {
                    // Document does not exist yet; try creating it with initial state
                    this.pushToFirestore(bunnyGlobalState.state);
                }
            }, (error) => {
                if (error.code === 'permission-denied') {
                    console.info('[BunnyFirebase] Firestore security rule for /bunny collection needed in Firebase Console. Using persistent localStorage until rule is added.');
                    this.hasWritePermission = false;
                } else {
                    console.warn('[BunnyFirebase] onSnapshot listener warning:', error);
                }
            });

            // 2. Subscribe to local state mutations to sync outbound
            bunnyGlobalState.subscribe((state) => {
                if (!this.isSyncing && this.hasWritePermission) {
                    this.debouncedPush(state);
                }
            });

            console.log('[BunnyFirebase] Connected to Firebase Firestore database: myportfolio-aadishhere');
        } catch (e) {
            console.warn('[BunnyFirebase] Initialization notice:', e);
        }
    }

    debouncedPush(state) {
        if (this.debounceTimer) clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.pushToFirestore(state);
        }, 400);
    }

    async pushToFirestore(state) {
        if (!this.docRef || !this.hasWritePermission) return;
        try {
            await setDoc(this.docRef, {
                health: state.health,
                oxygen: state.oxygen,
                isDead: state.isDead,
                deathCount: state.deathCount || 0,
                deadSince: state.deadSince || null,
                carrotsEatenToday: state.carrotsEatenToday || 0,
                lastFedDate: state.lastFedDate,
                isSick: state.isSick || false,
                lastUpdated: Date.now()
            }, { merge: true });
        } catch (err) {
            if (err.code === 'permission-denied') {
                console.info('[BunnyFirebase] Firestore write requires security rule in Firebase Console. Saved to localStorage.');
                this.hasWritePermission = false;
            } else {
                console.warn('[BunnyFirebase] pushToFirestore warning:', err);
            }
        }
    }
}

export const bunnyFirebaseSync = new BunnyFirebaseSync();
