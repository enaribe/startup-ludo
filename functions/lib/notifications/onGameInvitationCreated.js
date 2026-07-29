"use strict";
/**
 * onGameInvitationCreated — Notification push DIRECTE (FCM pur, sans Customer.io)
 * envoyée au destinataire quand une invitation de partie est créée.
 *
 * L'app affiche déjà un popup in-app quand elle est ouverte (listener Firestore) :
 * cette notification couvre le cas app fermée / en arrière-plan. Le tap ouvre
 * l'app, et le popup d'invitation existant prend le relais automatiquement.
 *
 * Tokens : lus dans `pushTokens/{userId}` (écrits par l'app mobile).
 * Les tokens invalides (app désinstallée) sont nettoyés après envoi.
 *
 * API v2 (2nd Gen) : la création de fonctions 1st Gen est bloquée par Google
 * pour les projets qui n'en ont jamais déployé.
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
exports.onGameInvitationCreated = void 0;
const admin = __importStar(require("firebase-admin"));
const logger = __importStar(require("firebase-functions/logger"));
const firestore_1 = require("firebase-functions/v2/firestore");
exports.onGameInvitationCreated = (0, firestore_1.onDocumentCreated)('gameInvitations/{invitationId}', async (event) => {
    var _a, _b, _c, _d, _e;
    const snapshot = event.data;
    if (!snapshot)
        return;
    const invitation = snapshot.data();
    if (invitation.status !== 'pending')
        return;
    // Invitation déjà expirée (écriture tardive) → inutile de notifier
    if (invitation.expiresAt && invitation.expiresAt < Date.now())
        return;
    // Tokens du destinataire
    const tokensSnap = await admin
        .firestore()
        .doc(`pushTokens/${invitation.toUserId}`)
        .get();
    const tokensMap = (_b = (_a = tokensSnap.data()) === null || _a === void 0 ? void 0 : _a.tokens) !== null && _b !== void 0 ? _b : {};
    const tokens = Object.keys(tokensMap);
    if (tokens.length === 0) {
        logger.info('Aucun token push pour le destinataire', {
            toUserId: invitation.toUserId,
        });
        return;
    }
    const fromName = invitation.fromUserName || 'Un joueur';
    const response = await admin.messaging().sendEachForMulticast({
        tokens,
        notification: {
            title: '⚔️ On te cherche !',
            body: `${fromName} t'invite à rejoindre sa partie. Tu réponds ou tu déclares forfait ?`,
        },
        data: {
            type: 'game_invitation',
            invitationId: (_c = invitation.id) !== null && _c !== void 0 ? _c : snapshot.id,
            roomCode: (_d = invitation.roomCode) !== null && _d !== void 0 ? _d : '',
        },
        android: {
            priority: 'high',
            // TTL aligné sur l'expiration de l'invitation (10 min) : inutile de
            // livrer une invitation périmée si le téléphone était hors ligne.
            ttl: Math.max(0, ((_e = invitation.expiresAt) !== null && _e !== void 0 ? _e : Date.now()) - Date.now()),
        },
        apns: {
            payload: { aps: { sound: 'default' } },
        },
    });
    logger.info('Invitation push envoyée', {
        toUserId: invitation.toUserId,
        successCount: response.successCount,
        failureCount: response.failureCount,
    });
    // Nettoyage des tokens invalides (app désinstallée, token expiré)
    const invalidTokens = [];
    response.responses.forEach((result, index) => {
        var _a;
        const code = (_a = result.error) === null || _a === void 0 ? void 0 : _a.code;
        if (code === 'messaging/registration-token-not-registered' ||
            code === 'messaging/invalid-registration-token') {
            const token = tokens[index];
            if (token)
                invalidTokens.push(token);
        }
    });
    if (invalidTokens.length > 0) {
        const updates = {};
        for (const token of invalidTokens) {
            updates[`tokens.${token}`] = admin.firestore.FieldValue.delete();
        }
        await tokensSnap.ref.update(updates).catch(() => undefined);
        logger.info('Tokens invalides nettoyés', { count: invalidTokens.length });
    }
});
//# sourceMappingURL=onGameInvitationCreated.js.map