/**
 * 🐰 ThreeRoamingRabbit (Backwards Compatibility Delegator)
 *
 * The bunny companion engine has been modularized and upgraded into a standalone
 * package located in `/rabbit-logic/`.
 *
 * For new integrations or modifications, please see:
 * - `rabbit-logic/bunny.js` (Standalone companion engine)
 * - `rabbit-logic/bunny-state.js` (Global state & persistence)
 * - `rabbit-logic/bunny-firebase.js` (Realtime Firebase Firestore sync)
 * - `rabbit-logic/bunny.css` (Styles for HUD, modal & admin bar)
 * - `rabbit-logic/README.md` (Integration & Firebase setup guide)
 */

export { BunnyCompanion, BunnyCompanion as ThreeRoamingRabbit } from '../rabbit-logic/bunny.js';
export { bunnyGlobalState } from '../rabbit-logic/bunny-state.js';
export { bunnyFirebaseSync } from '../rabbit-logic/bunny-firebase.js';
