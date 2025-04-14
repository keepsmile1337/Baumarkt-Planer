// storage-service.js - Supabase-basierte Speicherfunktionen

import { storage } from '../../supabase.js';
import { getCurrentBranchId } from './auth-service.js';
import { addThemeImageMetadata } from './db-service.js';

// Bild für ein Thema hochladen
export const uploadThemeImage = async (themeId, file) => {
    try {
        const branchId = getCurrentBranchId();
        if (!branchId) {
            throw new Error("Benutzer ist nicht angemeldet");
        }
        
        // Eindeutigen Dateinamen mit Zeitstempel erstellen
        const timestamp = Date.now();
        const fileName = `${file.name.split('.')[0]}_${timestamp}.${file.name.split('.').pop()}`;
        
        // Storage-Pfad erstellen
        const filePath = `themes/${branchId}/${themeId}/${fileName}`;
        
        // Datei hochladen
        await storage.uploadFile('theme-images', filePath, file);
        
        // Öffentliche URL generieren
        const publicUrl = storage.getPublicUrl('theme-images', filePath);
        
        // Metadaten in Datenbank speichern
        await addThemeImageMetadata(themeId, publicUrl);
        
        return publicUrl;
    } catch (error) {
        console.error("Fehler beim Hochladen des Bildes:", error);
        throw error;
    }
};

// Bild löschen
export const deleteThemeImage = async (imagePath) => {
    try {
        // Bucket und Pfad aus kompletter URL extrahieren
        // Annahme: Format ist https://yourproject.supabase.co/storage/v1/object/public/bucket/path
        const url = new URL(imagePath);
        const pathSegments = url.pathname.split('/');
        
        // Bucket und Pfad bestimmen
        const bucket = pathSegments[pathSegments.length - 2];
        const path = pathSegments[pathSegments.length - 1];
        
        await storage.deleteFile(bucket, path);
        console.log('Bild erfolgreich gelöscht:', imagePath);
    } catch (error) {
        console.error("Fehler beim Löschen des Bildes:", error);
        throw error;
    }
}; 