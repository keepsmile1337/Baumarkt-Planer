// auth-service.js - Supabase-basierte Authentifizierungsfunktionen

import { auth } from '../../supabase.js';

// Schlüssel für localStorage
const USER_KEY = 'baumarkt_user';

// Globale Variable, um den aktuellen Benutzer zu speichern
let currentUser = null;

// Funktion zur Überprüfung, ob ein Benutzer angemeldet ist
export function isLoggedIn() {
    return currentUser !== null;
}

// Funktion zur Überprüfung, ob der aktuelle Benutzer ein Admin ist
export function isAdmin() {
    return currentUser && currentUser.user_metadata && currentUser.user_metadata.is_admin;
}

// Funktion zum Einloggen mit E-Mail und Passwort
export async function login(email, password) {
    try {
        const { user, session } = await auth.signIn(email, password);
        currentUser = user;
        localStorage.setItem(USER_KEY, JSON.stringify({
            branchId: user.user_metadata.branch_id || 'unknown',
            isAdmin: user.user_metadata.is_admin || false
        }));
        console.log(`Benutzer ${email} eingeloggt`);
        return user;
    } catch (error) {
        console.error('Login fehlgeschlagen:', error);
        throw error;
    }
}

// Funktion zum Einloggen mit Niederlassungsnummer (für Legacy-Kompatibilität)
export async function loginWithBranchId(branchId) {
    // Für die Vereinfachung der Migration verwenden wir eine simulierte E-Mail
    const email = `nl${branchId}@baumarkt.example.com`;
    const password = `branch${branchId}`;
    
    try {
        return await login(email, password);
    } catch (error) {
        // Wenn der Benutzer nicht existiert, erstellen wir ihn (für die Migration)
        if (error.message.includes('Invalid login')) {
            await auth.signUp(email, password, {
                user_metadata: {
                    branch_id: branchId,
                    is_admin: branchId === 'admin'
                }
            });
            return await login(email, password);
        }
        throw error;
    }
}

// Funktion zum Ausloggen
export async function logout() {
    try {
        await auth.signOut();
        currentUser = null;
        localStorage.removeItem(USER_KEY);
        console.log('Benutzer ausgeloggt');
    } catch (error) {
        console.error('Logout fehlgeschlagen:', error);
        throw error;
    }
}

// Funktion zum Abrufen der aktuellen Niederlassungsnummer
export function getCurrentBranchId() {
    return currentUser && currentUser.user_metadata 
        ? currentUser.user_metadata.branch_id 
        : null;
}

// Funktion, die beim Laden der Seite aufgerufen wird, um den Benutzer-Status zu prüfen
export async function checkAuthState() {
    try {
        const user = await auth.getCurrentUser();
        if (user) {
            currentUser = user;
            console.log(`Benutzer ${user.email} wiederhergestellt`);
            return user;
        }
        
        // Fallback für die Migration: Prüfen, ob Benutzer im localStorage gespeichert ist
        const userStr = localStorage.getItem(USER_KEY);
        if (userStr) {
            try {
                const legacyUser = JSON.parse(userStr);
                // Für Legacy-Benutzer: Automatisch mit der Niederlassungsnummer einloggen
                if (legacyUser.branchId) {
                    return await loginWithBranchId(legacyUser.branchId);
                }
            } catch (e) {
                console.error('Fehler beim Parsen des gespeicherten Benutzers:', e);
                localStorage.removeItem(USER_KEY);
            }
        }
        
        return null;
    } catch (error) {
        console.error('Fehler beim Überprüfen des Authentifizierungsstatus:', error);
        return null;
    }
}

// Funktion zum Aktualisieren der UI basierend auf dem angemeldeten Benutzer
export function updateUIForUser() {
    const headerBranchId = document.getElementById('header-branch-id');
    const adminBanner = document.getElementById('admin-banner');
    const userBanner = document.getElementById('user-banner');
    const tlSettingsBtn = document.getElementById('tl-settings-btn');
    
    // Header aktualisieren
    if (headerBranchId && currentUser) {
        headerBranchId.textContent = `NL ${getCurrentBranchId() || 'unknown'}`;
    }
    
    // Rollen-Banner aktualisieren
    if (isAdmin()) {
        if (adminBanner) adminBanner.style.display = 'flex';
        if (userBanner) userBanner.style.display = 'none';
    } else {
        if (adminBanner) adminBanner.style.display = 'none';
        if (userBanner) userBanner.style.display = 'flex';
    }
    
    // TL-Einstellungen-Button nur für Admins anzeigen
    if (tlSettingsBtn) {
        tlSettingsBtn.style.display = isAdmin() ? 'inline-block' : 'none';
    }
}

// Globale Funktionen für andere Skripte verfügbar machen
window.auth = {
    login,
    loginWithBranchId,
    logout,
    getCurrentBranchId,
    checkAuthState,
    isLoggedIn,
    isAdmin,
    updateUIForUser
}; 