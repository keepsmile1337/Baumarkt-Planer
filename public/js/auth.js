// auth.js - Authentifizierungsfunktionen für die Baumarkt Saisonplaner Anwendung

// Schlüssel für localStorage
const USER_KEY = 'baumarkt_user';

// Globale Variable, um den aktuellen Benutzer zu speichern
let currentUser = null;

// Funktion zur Überprüfung, ob ein Benutzer angemeldet ist
function isLoggedIn() {
    return currentUser !== null;
}

// Funktion zur Überprüfung, ob der aktuelle Benutzer ein Admin ist
function isAdmin() {
    return currentUser && currentUser.branchId === 'admin';
}

// Funktion zum Einloggen
function login(branchId) {
    return new Promise((resolve, reject) => {
        // Überprüfen, ob die Branch-ID gültig ist
        if (!branchId) {
            reject(new Error('Niederlassungsnummer ist erforderlich'));
            return;
        }

        // Benutzer erstellen
        currentUser = {
            branchId: branchId,
            isAdmin: branchId === 'admin'
        };

        // User in localStorage speichern
        localStorage.setItem(USER_KEY, JSON.stringify(currentUser));

        console.log(`Benutzer mit NL ${branchId} eingeloggt`);
        resolve(currentUser);
    });
}

// Funktion zum Ausloggen
function logout() {
    return new Promise((resolve) => {
        currentUser = null;
        localStorage.removeItem(USER_KEY);
        console.log('Benutzer ausgeloggt');
        resolve();
    });
}

// Funktion zum Abrufen der aktuellen Niederlassungsnummer
function getCurrentBranchId() {
    return currentUser ? currentUser.branchId : null;
}

// Funktion, die beim Laden der Seite aufgerufen wird, um den Benutzer aus dem localStorage zu laden
function checkAuthState() {
    return new Promise((resolve) => {
        const userStr = localStorage.getItem(USER_KEY);
        if (userStr) {
            try {
                currentUser = JSON.parse(userStr);
                console.log(`Benutzer mit NL ${currentUser.branchId} wiederhergestellt`);
                resolve(currentUser);
            } catch (e) {
                console.error('Fehler beim Parsen des gespeicherten Benutzers:', e);
                localStorage.removeItem(USER_KEY);
                resolve(null);
            }
        } else {
            resolve(null);
        }
    });
}

// Funktion zum Aktualisieren der UI basierend auf dem angemeldeten Benutzer
function updateUIForUser() {
    const headerBranchId = document.getElementById('header-branch-id');
    const adminBanner = document.getElementById('admin-banner');
    const userBanner = document.getElementById('user-banner');
    const tlSettingsBtn = document.getElementById('tl-settings-btn');
    
    // Header aktualisieren
    if (headerBranchId) {
        headerBranchId.textContent = `NL ${getCurrentBranchId()}`;
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

// Event-Listener für Login/Logout
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM geladen, initialisiere Auth-System');
    
    const loginForm = document.getElementById('login-form');
    const logoutButton = document.getElementById('logout-btn');
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const branchId = document.getElementById('branch-id').value;
            
            console.log('Login-Versuch mit ID:', branchId);
            
            login(branchId)
                .then(() => {
                    // Login erfolgreich, UI aktualisieren
                    console.log('Login erfolgreich');
                    document.getElementById('login-container').style.display = 'none';
                    document.getElementById('app-container').style.display = 'block';
                    
                    // UI-Elemente aktualisieren
                    updateUIForUser();
                })
                .catch(error => {
                    console.error('Login fehlgeschlagen:', error);
                    alert('Login fehlgeschlagen: ' + error.message);
                });
        });
    } else {
        console.warn('Login-Formular nicht gefunden');
    }
    
    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            console.log('Logout-Versuch');
            logout()
                .then(() => {
                    // Logout erfolgreich, UI aktualisieren
                    console.log('Logout erfolgreich');
                    document.getElementById('app-container').style.display = 'none';
                    document.getElementById('login-container').style.display = 'block';
                    document.getElementById('branch-id').value = '';
                });
        });
    } else {
        console.warn('Logout-Button nicht gefunden');
    }
    
    // Überprüfen, ob ein Benutzer bereits angemeldet ist
    console.log('Prüfe bestehende Anmeldung');
    checkAuthState()
        .then(user => {
            if (user) {
                // Benutzer ist angemeldet, UI aktualisieren
                console.log('Bestehender Benutzer gefunden:', user);
                document.getElementById('login-container').style.display = 'none';
                document.getElementById('app-container').style.display = 'block';
                
                // UI-Elemente aktualisieren
                updateUIForUser();
            } else {
                // Benutzer ist nicht angemeldet, Login-Formular anzeigen
                console.log('Kein Benutzer gefunden, zeige Login');
                document.getElementById('login-container').style.display = 'block';
                document.getElementById('app-container').style.display = 'none';
            }
        });
});

// Globale Funktionen für andere Skripte verfügbar machen
window.auth = {
    login,
    logout,
    getCurrentBranchId,
    checkAuthState,
    isLoggedIn,
    isAdmin,
    updateUIForUser
}; 