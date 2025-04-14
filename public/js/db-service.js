// db-service.js - Supabase-basierte Datenbankfunktionen

import { database } from '../../supabase.js';
import { getCurrentBranchId } from './auth-service.js';

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

// Abonnieren von Themen mit Filter-Optionen
export const getThemes = async (filters = {}) => {
    try {
        const { department, teamLeader, branchFilter } = filters;
        const filterOptions = {};
        
        // Filter anwenden
        if (department) {
            filterOptions.department = department;
        }
        
        if (teamLeader) {
            filterOptions.teamLeader = teamLeader;
        }
        
        // Filial-Filter anwenden (eigene vs. alle)
        if (branchFilter === 'own') {
            const currentBranchId = getCurrentBranchId();
            if (currentBranchId) {
                filterOptions.branchId = currentBranchId;
            }
        }
        
        // Daten abrufen
        const themes = await database.getThemes(filterOptions);
        return themes;
    } catch (error) {
        console.error('Fehler beim Abrufen der Themen:', error);
        return [];
    }
};

// Thema über ID abrufen
export const getThemeById = async (themeId) => {
    try {
        const theme = await database.getThemeById(themeId);
        return theme;
    } catch (error) {
        console.error(`Fehler beim Abrufen des Themas mit ID ${themeId}:`, error);
        return null;
    }
};

// Abteilungen abrufen
export const getDepartments = async () => {
    try {
        const departments = await database.getDepartments();
        
        if (!departments || departments.length === 0) {
            // Wenn keine Abteilungen vorhanden sind, initialisieren wir sie
            await initDepartments();
            return DEFAULT_DEPARTMENTS;
        }
        
        // Umwandeln in das Format, das die Anwendung erwartet
        const departmentsMap = {};
        departments.forEach(dept => {
            departmentsMap[dept.id] = dept;
        });
        
        return departmentsMap;
    } catch (error) {
        console.error('Fehler beim Abrufen der Abteilungen:', error);
        return DEFAULT_DEPARTMENTS;
    }
};

// Teamleiter abrufen
export const getTeamLeaders = async () => {
    try {
        const teamLeaders = await database.getTeamLeaders();
        
        if (!teamLeaders || teamLeaders.length === 0) {
            // Wenn keine Teamleiter vorhanden sind, initialisieren wir sie
            await initTeamLeaders();
            return DEFAULT_TEAM_LEADERS;
        }
        
        return teamLeaders;
    } catch (error) {
        console.error('Fehler beim Abrufen der Teamleiter:', error);
        return DEFAULT_TEAM_LEADERS;
    }
};

// Bilder zu einem Thema abrufen
export const getThemeImages = async (themeId) => {
    try {
        // Bei Supabase würden wir hier eine Abfrage auf eine theme_images-Tabelle machen
        const { data, error } = await supabase
            .from('theme_images')
            .select('*')
            .eq('theme_id', themeId);
            
        if (error) throw error;
        return data;
    } catch (error) {
        console.error(`Fehler beim Abrufen der Bilder für Thema ${themeId}:`, error);
        return [];
    }
};

// Neues Thema erstellen
export const createTheme = async (themeData) => {
    try {
        // Branchennummer hinzufügen
        const branchId = getCurrentBranchId();
        if (!branchId) {
            throw new Error("Benutzer ist nicht angemeldet");
        }
        
        const theme = {
            ...themeData,
            branch_id: branchId,
            created_at: new Date().toISOString()
        };
        
        const newTheme = await database.createTheme(theme);
        return newTheme;
    } catch (error) {
        console.error('Fehler beim Erstellen des Themas:', error);
        throw error;
    }
};

// Thema aktualisieren
export const updateTheme = async (themeId, updates) => {
    try {
        const updatedTheme = await database.updateTheme(themeId, updates);
        return updatedTheme;
    } catch (error) {
        console.error(`Fehler beim Aktualisieren des Themas ${themeId}:`, error);
        throw error;
    }
};

// Thema löschen
export const deleteTheme = async (themeId) => {
    try {
        await database.deleteTheme(themeId);
    } catch (error) {
        console.error(`Fehler beim Löschen des Themas ${themeId}:`, error);
        throw error;
    }
};

// Teamleiter-Zuordnungen speichern
export const saveTeamLeaders = async (teamLeaders) => {
    try {
        // Hier würde man die Teamleiter für die aktuelle Filiale speichern
        const branchId = getCurrentBranchId();
        if (!branchId) {
            throw new Error("Benutzer ist nicht angemeldet");
        }
        
        // Bei Supabase: Bestehende Einträge löschen und neue erstellen
        const { error: deleteError } = await supabase
            .from('team_leaders')
            .delete()
            .eq('branch_id', branchId);
            
        if (deleteError) throw deleteError;
        
        // Neue Teamleiter erstellen
        const teamLeadersWithBranch = teamLeaders.map(tl => ({
            ...tl,
            branch_id: branchId
        }));
        
        const { error: insertError } = await supabase
            .from('team_leaders')
            .insert(teamLeadersWithBranch);
            
        if (insertError) throw insertError;
        
        return teamLeadersWithBranch;
    } catch (error) {
        console.error('Fehler beim Speichern der Teamleiter:', error);
        throw error;
    }
};

// Abteilungen initialisieren
export const initDepartments = async () => {
    try {
        const departmentsArray = Object.values(DEFAULT_DEPARTMENTS);
        
        const { error } = await supabase
            .from('departments')
            .insert(departmentsArray);
            
        if (error) throw error;
        
        console.log('Abteilungen erfolgreich initialisiert');
    } catch (error) {
        console.error('Fehler beim Initialisieren der Abteilungen:', error);
    }
};

// Teamleiter initialisieren
export const initTeamLeaders = async () => {
    try {
        // Admin-Filiale als Standard für die Teamleiter verwenden
        const teamLeadersWithBranch = DEFAULT_TEAM_LEADERS.map(tl => ({
            ...tl,
            branch_id: 'admin'
        }));
        
        const { error } = await supabase
            .from('team_leaders')
            .insert(teamLeadersWithBranch);
            
        if (error) throw error;
        
        console.log('Teamleiter erfolgreich initialisiert');
    } catch (error) {
        console.error('Fehler beim Initialisieren der Teamleiter:', error);
    }
}; 