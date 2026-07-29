"use strict";
/**
 * Cloud Functions pour Startup Ludo
 *
 * Export principal de toutes les fonctions.
 * Note: Ces fonctions sont prêtes mais non déployées.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetMonthlyStats = exports.resetWeeklyStats = exports.updateLeaderboard = exports.onUserCreate = exports.onGameInvitationCreated = void 0;
const admin = __importStar(require("firebase-admin"));
// Initialize Firebase Admin SDK
admin.initializeApp();
// Callables legacy (createRoom, joinRoom, processGameAction, updateStats) :
// jamais déployés ni appelés par l'app (rooms gérées côté client via Realtime DB).
// Ils ne compilent pas (style v2 sur API v1) → exclus du build (cf. tsconfig.json).
// Export Notification Functions (FCM direct, hors Customer.io)
var onGameInvitationCreated_1 = require("./notifications/onGameInvitationCreated");
Object.defineProperty(exports, "onGameInvitationCreated", { enumerable: true, get: function () { return onGameInvitationCreated_1.onGameInvitationCreated; } });
// Export User Functions
var onUserCreate_1 = require("./user/onUserCreate");
Object.defineProperty(exports, "onUserCreate", { enumerable: true, get: function () { return onUserCreate_1.onUserCreate; } });
var updateLeaderboard_1 = require("./user/updateLeaderboard");
Object.defineProperty(exports, "updateLeaderboard", { enumerable: true, get: function () { return updateLeaderboard_1.updateLeaderboard; } });
Object.defineProperty(exports, "resetWeeklyStats", { enumerable: true, get: function () { return updateLeaderboard_1.resetWeeklyStats; } });
Object.defineProperty(exports, "resetMonthlyStats", { enumerable: true, get: function () { return updateLeaderboard_1.resetMonthlyStats; } });
//# sourceMappingURL=index.js.map