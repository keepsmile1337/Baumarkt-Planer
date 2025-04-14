// Firebase-Konfiguration - Offline-Modus

// Firebase-Mock für den Offline-Modus
console.log("Firebase-Konfiguration wird im Offline-Modus initialisiert");

// Globale Verfügbarkeit der Firebase-Instanzen sicherstellen
window.db = null;
window.storage = null;
window.firebaseInitialized = false;

// Flag für Offline-Modus
window.isOfflineMode = true;

// Wir verwenden Mocks für die Firebase-Services im Offline-Modus
console.log("Firebase-Offline-Modus aktiv - Alle Daten werden lokal gespeichert");

// Einfaches Logging für Firebase-Anfragen im Offline-Modus
function logOperation(operation, collection, data) {
    console.log(`Firebase Operation (Offline): ${operation}`, {
        collection: collection,
        data: data,
        timestamp: new Date().toISOString()
    });
}

// Helper-Funktionen für die Firebase-Integration
window.firebaseHelpers = {
    // Diese Funktionen können später implementiert werden, wenn Firebase verfügbar ist
    saveTheme: function(theme) {
        logOperation('saveTheme', 'themes', theme);
        return Promise.resolve({ id: 'local-' + Date.now() });
    },
    
    uploadImage: function(file, path) {
        logOperation('uploadImage', path, { fileName: file.name, size: file.size });
        return Promise.resolve('mock-image-url-' + Date.now());
    },
    
    getThemes: function() {
        logOperation('getThemes', 'themes', null);
        return Promise.resolve([]);
    }
}; 