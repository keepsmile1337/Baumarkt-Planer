import { storage } from './firebase-config.js';
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-storage.js";
import { getBranchNumber } from './auth.js';
import { addThemeImageMetadata } from './firestore-service.js';

// Bild für ein Thema hochladen
export const uploadThemeImage = async (themeId, file) => {
    try {
        const branchNumber = getBranchNumber();
        if (!branchNumber) {
            throw new Error("Benutzer ist nicht angemeldet");
        }
        
        // Eindeutigen Dateinamen mit Zeitstempel erstellen
        const timestamp = Date.now();
        const fileName = `${file.name.split('.')[0]}_${timestamp}.${file.name.split('.').pop()}`;
        
        // Storage-Referenz erstellen
        const imagePath = `themes/${branchNumber}/${themeId}/${fileName}`;
        const storageRef = ref(storage, imagePath);
        
        // Datei hochladen
        const snapshot = await uploadBytes(storageRef, file);
        console.log('Bild erfolgreich hochgeladen:', snapshot);
        
        // Download-URL abrufen
        const downloadURL = await getDownloadURL(storageRef);
        
        // Metadaten in Firestore speichern
        await addThemeImageMetadata(themeId, downloadURL);
        
        return downloadURL;
    } catch (error) {
        console.error("Fehler beim Hochladen des Bildes:", error);
        throw error;
    }
}; 