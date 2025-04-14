import { db, storage, isOfflineMode } from './firebase-config.js';
import { 
    collection, doc, addDoc, getDoc, getDocs, query, where, orderBy, 
    serverTimestamp, setDoc, updateDoc, arrayUnion, arrayRemove
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { getBranchNumber } from './auth.js';

// Abteilungs-Standarddaten
const DEFAULT_DEPARTMENTS = {
    'stadtgarten': {
        id: 'stadtgarten',
        name: 'Stadtgarten',
        color: '#4CAF50' // Grün
    },
    'farben': {
        id: 'farben',
        name: 'Farben',
        color: '#FF9800' // Orange
    },
    'werkzeuge': {
        id: 'werkzeuge',
        name: 'Werkzeuge/EW/MA',
        color: '#F44336' // Rot
    },
    'elektro': {
        id: 'elektro',
        name: 'Elektro',
        color: '#FFEB3B' // Gelb
    },
    'sanitaer': {
        id: 'sanitaer',
        name: 'Sanitär',
        color: '#2196F3' // Blau
    },
    'fliesen': {
        id: 'fliesen',
        name: 'Fliesen',
        color: '#9C27B0' // Lila
    },
    'holz': {
        id: 'holz',
        name: 'Holz/BE',
        color: '#795548' // Braun
    },
    'baustoffe': {
        id: 'baustoffe',
        name: 'Drive/Baustoffe',
        color: '#607D8B' // Blaugrau
    }
};

// Teamleiter-Standarddaten
const DEFAULT_TEAM_LEADERS = [
    {
        name: 'Teamleiter 1',
        assignedDepartments: ['stadtgarten', 'farben']
    },
    {
        name: 'Teamleiter 2',
        assignedDepartments: ['werkzeuge', 'elektro']
    },
    {
        name: 'Teamleiter 3',
        assignedDepartments: ['sanitaer', 'fliesen']
    },
    {
        name: 'Teamleiter 4',
        assignedDepartments: ['holz', 'baustoffe']
    }
];

// Sammlungsnamen als Konstanten
const DEPARTMENTS_COLLECTION = "departments";
const TEAM_LEADERS_COLLECTION = "team_leaders";
const THEMES_COLLECTION = "themes";
const THEME_IMAGES_COLLECTION = "theme_images";
const BRANCHES_COLLECTION = "branches";

// Mock-Daten für den Offline-Modus
const MOCK_DEPARTMENTS = [
    { id: "bau", name: "Baustoffe", color: "#e30613" },
    { id: "gar", name: "Garten", color: "#009640" },
    { id: "san", name: "Sanitär", color: "#005ca9" },
    { id: "hol", name: "Holz", color: "#954e00" },
    { id: "far", name: "Farbe", color: "#e6007e" },
    { id: "wer", name: "Werkzeug", color: "#ff6600" },
    { id: "ele", name: "Elektro", color: "#ffed00" },
    { id: "fen", name: "Fenster", color: "#00aeef" }
];

// Team-Leiter für verschiedene Filialen im Offline-Modus
const BRANCH_TEAM_LEADERS = {
    "537": [
        { id: "1", name: "Schmidt", departments: ["bau", "hol"] },
        { id: "2", name: "Müller", departments: ["gar", "far"] },
        { id: "3", name: "Weber", departments: ["san", "ele"] },
        { id: "4", name: "Fischer", departments: ["wer", "fen"] }
    ],
    "123": [
        { id: "1", name: "Meyer", departments: ["bau", "wer"] },
        { id: "2", name: "Schulz", departments: ["gar", "fen"] },
        { id: "3", name: "Hoffmann", departments: ["san", "hol"] },
        { id: "4", name: "Wagner", departments: ["ele", "far"] }
    ],
    "456": [
        { id: "1", name: "Becker", departments: ["bau", "ele"] },
        { id: "2", name: "Schäfer", departments: ["gar", "fen"] },
        { id: "3", name: "Koch", departments: ["san", "far"] },
        { id: "4", name: "Bauer", departments: ["wer", "hol"] }
    ]
};

// Mock-Themen für den Offline-Modus
const MOCK_THEMES = [
    { 
        id: "theme1", 
        title: "Frühjahrsputz", 
        date: new Date(2023, 2, 15), 
        department: "gar", 
        teamLeader: "2", 
        description: "Präsentation aller Frühjahrsputz-Produkte",
        branchId: "537"
    },
    { 
        id: "theme2", 
        title: "Grill-Saison", 
        date: new Date(2023, 4, 1), 
        department: "gar", 
        teamLeader: "2", 
        description: "Grills und Zubehör ausstellen",
        branchId: "537"
    },
    { 
        id: "theme3", 
        title: "Gartenzeit", 
        date: new Date(2023, 3, 10), 
        department: "gar", 
        teamLeader: "2", 
        description: "Gartengeräte und Pflanzen im Fokus",
        branchId: "123"
    }
];

// Initialisiere Mock-Daten, wenn Firebase nicht verfügbar ist
let currentBranchId = null;
let currentBranchTeamLeaders = [];

// Prüft, ob Firebase initialisiert ist und richtet ggf. Mock-Daten ein
const checkFirebaseInitialized = () => {
    if (isOfflineMode()) {
        console.log("Verwende Mock-Daten im Offline-Modus");
        return false;
    }
    return true;
};

// Authentifizierung mit Filialnummer
export const authenticateWithBranchId = (branchId) => {
    currentBranchId = branchId;
    
    // Im Offline-Modus: Prüfen, ob die Filiale vorhanden ist
    if (isOfflineMode()) {
        if (BRANCH_TEAM_LEADERS[branchId]) {
            currentBranchTeamLeaders = BRANCH_TEAM_LEADERS[branchId];
            return Promise.resolve({ branchId });
        } else {
            // Wenn die Filiale nicht existiert, Standardfiliale verwenden
            currentBranchTeamLeaders = BRANCH_TEAM_LEADERS["537"];
            return Promise.resolve({ branchId: "537" });
        }
    }
    
    // In Firebase prüfen
    return db.collection(BRANCHES_COLLECTION)
        .doc(branchId)
        .get()
        .then(doc => {
            if (doc.exists) {
                return { branchId };
            } else {
                throw new Error("Filiale nicht gefunden");
            }
        });
};

// Aktuelle Filialnummer abrufen
export const getCurrentBranchId = () => {
    return currentBranchId;
};

// Abonnieren von Themen mit Filter-Optionen
export const subscribeToThemes = (callback, filters = {}) => {
    const { department, teamLeader, branchFilter } = filters;
    
    if (isOfflineMode()) {
        // Filtern nach den Kriterien
        let filteredThemes = [...MOCK_THEMES];
        
        // Filial-Filter anwenden (eigene vs. alle)
        if (branchFilter === 'own' && currentBranchId) {
            filteredThemes = filteredThemes.filter(theme => theme.branchId === currentBranchId);
        }
        
        // Abteilungs-Filter anwenden
        if (department) {
            filteredThemes = filteredThemes.filter(theme => theme.department === department);
        }
        
        // Team-Leiter-Filter anwenden
        if (teamLeader) {
            filteredThemes = filteredThemes.filter(theme => theme.teamLeader === teamLeader);
        }
        
        // Callback mit gefilterten Themen aufrufen
        setTimeout(() => callback(filteredThemes), 100);
        return () => {}; // Leere Unsubscribe-Funktion
    }
    
    // Mit Firebase
    let query = db.collection(THEMES_COLLECTION);
    
    // Filial-Filter anwenden
    if (branchFilter === 'own' && currentBranchId) {
        query = query.where('branchId', '==', currentBranchId);
    }
    
    // Abteilungs-Filter anwenden
    if (department) {
        query = query.where('department', '==', department);
    }
    
    // Team-Leiter-Filter anwenden
    if (teamLeader) {
        query = query.where('teamLeader', '==', teamLeader);
    }
    
    return query.onSnapshot(snapshot => {
        const themes = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            themes.push({
                id: doc.id,
                ...data,
                date: data.date.toDate()
            });
        });
        callback(themes);
    });
};

// Thema nach ID abrufen
export const getThemeById = (themeId) => {
    if (isOfflineMode()) {
        const theme = MOCK_THEMES.find(t => t.id === themeId);
        return Promise.resolve(theme || null);
    }
    
    return db.collection(THEMES_COLLECTION)
        .doc(themeId)
        .get()
        .then(doc => {
            if (doc.exists) {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    date: data.date.toDate()
                };
            }
            return null;
        });
};

// Abteilungen abonnieren
export const subscribeToDepartments = (callback) => {
    if (isOfflineMode()) {
        setTimeout(() => callback(MOCK_DEPARTMENTS), 100);
        return () => {}; // Leere Unsubscribe-Funktion
    }
    
    return db.collection(DEPARTMENTS_COLLECTION)
        .onSnapshot(snapshot => {
            const departments = [];
            snapshot.forEach(doc => {
                departments.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            callback(departments);
        });
};

// Team-Leiter für die aktuelle Filiale abonnieren
export const subscribeToTeamLeaders = (callback) => {
    if (isOfflineMode()) {
        setTimeout(() => callback(currentBranchTeamLeaders || BRANCH_TEAM_LEADERS["537"]), 100);
        return () => {}; // Leere Unsubscribe-Funktion
    }
    
    if (!currentBranchId) {
        console.error("Keine Filiale ausgewählt!");
        return () => {};
    }
    
    return db.collection(BRANCHES_COLLECTION)
        .doc(currentBranchId)
        .collection(TEAM_LEADERS_COLLECTION)
        .onSnapshot(snapshot => {
            const teamLeaders = [];
            snapshot.forEach(doc => {
                teamLeaders.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            callback(teamLeaders);
        });
};

// Thema erstellen
export const createTheme = (themeData) => {
    // Aktuelle Filiale dem Thema zuordnen
    const themeWithBranch = {
        ...themeData,
        branchId: currentBranchId || "537",
        date: isOfflineMode() ? themeData.date : new Date(themeData.date)
    };
    
    if (isOfflineMode()) {
        const newTheme = {
            id: `theme${MOCK_THEMES.length + 1}`,
            ...themeWithBranch
        };
        MOCK_THEMES.push(newTheme);
        return Promise.resolve(newTheme);
    }
    
    return db.collection(THEMES_COLLECTION)
        .add(themeWithBranch)
        .then(docRef => {
            return {
                id: docRef.id,
                ...themeWithBranch
            };
        });
};

// Themen-Bilder abrufen
export const getThemeImages = (themeId) => {
    if (isOfflineMode()) {
        return Promise.resolve([]);
    }
    
    return db.collection(THEMES_COLLECTION)
        .doc(themeId)
        .collection(THEME_IMAGES_COLLECTION)
        .get()
        .then(snapshot => {
            const images = [];
            snapshot.forEach(doc => {
                images.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            return images;
        });
};

// Bild für ein Thema hochladen
export const uploadThemeImage = (themeId, file) => {
    if (isOfflineMode()) {
        return Promise.resolve({
            id: `img${Date.now()}`,
            url: URL.createObjectURL(file),
            name: file.name
        });
    }
    
    const storageRef = storage.ref(`themes/${themeId}/${file.name}`);
    
    return storageRef.put(file)
        .then(() => storageRef.getDownloadURL())
        .then(url => {
            const imageData = {
                url,
                name: file.name,
                uploadedAt: new Date()
            };
            
            return db.collection(THEMES_COLLECTION)
                .doc(themeId)
                .collection(THEME_IMAGES_COLLECTION)
                .add(imageData)
                .then(docRef => {
                    return {
                        id: docRef.id,
                        ...imageData
                    };
                });
        });
};

// Team-Leiter für die aktuelle Filiale speichern
export const saveTeamLeaders = (teamLeaders) => {
    if (isOfflineMode()) {
        currentBranchTeamLeaders = teamLeaders;
        BRANCH_TEAM_LEADERS[currentBranchId || "537"] = teamLeaders;
        return Promise.resolve(teamLeaders);
    }
    
    if (!currentBranchId) {
        return Promise.reject(new Error("Keine Filiale ausgewählt!"));
    }
    
    // Batch für Transaktionen vorbereiten
    const batch = db.batch();
    const branchRef = db.collection(BRANCHES_COLLECTION).doc(currentBranchId);
    
    // Vorhandene Team-Leiter löschen
    return branchRef.collection(TEAM_LEADERS_COLLECTION)
        .get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                batch.delete(doc.ref);
            });
            
            // Neue Team-Leiter hinzufügen
            teamLeaders.forEach(leader => {
                const newLeaderRef = branchRef.collection(TEAM_LEADERS_COLLECTION).doc();
                batch.set(newLeaderRef, leader);
            });
            
            // Batch ausführen
            return batch.commit();
        })
        .then(() => teamLeaders);
};

// Abteilungen abrufen
export const getDepartments = async () => {
    try {
        if (isOfflineMode()) {
            return MOCK_DEPARTMENTS;
        }
        
        const departmentsSnapshot = await db.collection(DEPARTMENTS_COLLECTION).get();
        const departments = [];
        
        departmentsSnapshot.forEach(doc => {
            departments.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        return departments;
    } catch (error) {
        console.error("Fehler beim Abrufen der Abteilungen:", error);
        return MOCK_DEPARTMENTS;
    }
};

// Teamleiter für eine bestimmte Niederlassung abrufen
export const getTeamLeaders = async () => {
    try {
        if (isOfflineMode()) {
            // Prüfe, ob wir Teamleiter für diese Niederlassung haben
            if (BRANCH_TEAM_LEADERS[currentBranchId]) {
                return BRANCH_TEAM_LEADERS[currentBranchId];
            }
            
            // Ansonsten Standardwerte verwenden
            return BRANCH_TEAM_LEADERS["537"];
        }
        
        if (!currentBranchId) {
            throw new Error("Keine Filiale ausgewählt!");
        }
        
        // Teamleiter für die aktuelle Niederlassung abrufen
        const teamLeadersSnapshot = await db.collection(BRANCHES_COLLECTION)
            .doc(currentBranchId)
            .collection(TEAM_LEADERS_COLLECTION)
            .get();
        
        // Wenn keine spezifischen Teamleiter vorhanden sind, verwende Standard-Teamleiter
        if (teamLeadersSnapshot.empty) {
            // Standard-Teamleiter anlegen
            await initTeamLeaders();
            
            return BRANCH_TEAM_LEADERS["537"];
        }
        
        // Vorhandene Teamleiter zurückgeben
        const teamLeaders = [];
        teamLeadersSnapshot.forEach(doc => {
            teamLeaders.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        return teamLeaders;
    } catch (error) {
        console.error("Fehler beim Abrufen der Teamleiter:", error);
        return BRANCH_TEAM_LEADERS["537"];
    }
};

// Themen abrufen
export const getThemes = async (filters = {}) => {
    try {
        // Für Mock-Modus
        if (!window.firebase || !window.firebase.firestore) {
            return MOCK_THEMES;
        }
        
        const db = firebase.firestore();
        const themesCollection = collection(db, THEMES_COLLECTION);
        let themesQuery = themesCollection;
        
        // Filter anwenden
        if (filters.year) {
            themesQuery = query(themesQuery, where('year', '==', filters.year));
        }
        
        if (filters.branchNumber) {
            themesQuery = query(themesQuery, where('branchNumber', '==', filters.branchNumber));
        }
        
        if (filters.departmentId) {
            themesQuery = query(themesQuery, where('departmentId', '==', filters.departmentId));
        }
        
        // Nach Datum sortieren
        themesQuery = query(themesQuery, orderBy('date', 'asc'));
        
        const themesSnapshot = await getDocs(themesQuery);
        const themes = [];
        
        themesSnapshot.forEach(doc => {
            const themeData = doc.data();
            // Date-Objekt in ISO-String konvertieren für einfachere Handhabung in JS
            const date = themeData.date?.toDate?.() || new Date(themeData.date);
            
            themes.push({
                id: doc.id,
                ...themeData,
                date: date.toISOString()
            });
        });
        
        return themes;
    } catch (error) {
        console.error("Fehler beim Abrufen der Themen:", error);
        return MOCK_THEMES;
    }
};

// Bild-Metadaten zu einem Thema hinzufügen
export const addThemeImageMetadata = async (themeId, imageUrl) => {
    try {
        // Für Mock-Modus
        if (!window.firebase || !window.firebase.firestore) {
            return 'mock_image_' + Date.now();
        }
        
        const branchNumber = getBranchNumber();
        if (!branchNumber) {
            throw new Error("Benutzer ist nicht angemeldet");
        }
        
        const db = firebase.firestore();
        const imageData = {
            themeId,
            imageUrl,
            uploadedByBranch: branchNumber,
            uploadTimestamp: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        const docRef = await db.collection('themes').doc(themeId).collection('images').add(imageData);
        return docRef.id;
    } catch (error) {
        console.error("Fehler beim Hinzufügen der Bild-Metadaten:", error);
        throw error;
    }
};

// Neues Thema hinzufügen
export const addTheme = async (themeData) => {
    try {
        const branchNumber = getBranchNumber();
        if (!branchNumber) {
            throw new Error("Benutzer ist nicht angemeldet");
        }
        
        // Für Mock-Modus
        if (!window.firebase || !window.firebase.firestore) {
            const newTheme = {
                ...themeData,
                id: 'theme_' + Date.now(),
                branchNumber,
                createdAt: new Date().toISOString()
            };
            MOCK_THEMES.push(newTheme);
            return newTheme.id;
        }
        
        const db = firebase.firestore();
        const themeWithMetadata = {
            ...themeData,
            branchNumber,
            year: new Date(themeData.date).getFullYear(),
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        const docRef = await db.collection(THEMES_COLLECTION).add(themeWithMetadata);
        return docRef.id;
    } catch (error) {
        console.error("Fehler beim Hinzufügen des Themas:", error);
        throw error;
    }
};

// Beispielabteilungen anlegen (nur für Ersteinrichtung)
export const initDepartments = async () => {
    try {
        if (isOfflineMode()) {
            return;
        }
        
        const batch = db.batch();
        
        for (const department of MOCK_DEPARTMENTS) {
            const { id, ...data } = department;
            const docRef = db.collection(DEPARTMENTS_COLLECTION).doc(id);
            batch.set(docRef, data);
        }
        
        return batch.commit();
    } catch (error) {
        console.error("Fehler beim Anlegen der Beispielabteilungen:", error);
    }
};

// Beispiel-Teamleiter anlegen (nur für Ersteinrichtung)
export const initTeamLeaders = async () => {
    try {
        if (isOfflineMode() || !currentBranchId) {
            return;
        }
        
        const batch = db.batch();
        const teamLeadersCollection = db.collection(BRANCHES_COLLECTION)
            .doc(currentBranchId)
            .collection(TEAM_LEADERS_COLLECTION);
        
        // Standard-Teamleiter für die ausgewählte Filiale
        const defaultTeamLeaders = BRANCH_TEAM_LEADERS["537"];
        
        for (const teamLeader of defaultTeamLeaders) {
            const newRef = teamLeadersCollection.doc();
            batch.set(newRef, teamLeader);
        }
        
        return batch.commit();
    } catch (error) {
        console.error("Fehler beim Anlegen der Beispiel-Teamleiter:", error);
    }
}; 