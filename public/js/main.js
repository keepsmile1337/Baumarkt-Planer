import { initAuth, isLoggedIn, getBranchNumber } from './auth.js';
import { 
    getDepartments, getTeamLeaders, getThemes, 
    addTheme, initDepartments, initTeamLeaders,
    saveTeamLeaders
} from './firestore-service.js';
import { 
    renderCalendar, goToPrevMonth, goToNextMonth, 
    goToPrevYear, goToNextYear, populateFilters,
    openTeamLeaderSettingsModal, extractTeamLeadersFromUI
} from './ui.js';

// Status-Variablen
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let departments = {};
let teamLeaders = [];
let isAllBranchesView = false;

// DOM-Elemente
const departmentFilter = document.getElementById('departmentFilter');
const teamLeaderFilter = document.getElementById('teamLeaderFilter');
const viewToggle = document.getElementById('viewToggle');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const prevYearBtn = document.getElementById('prevYear');
const nextYearBtn = document.getElementById('nextYear');
const addThemeBtn = document.getElementById('addThemeBtn');
const saveThemeBtn = document.getElementById('saveThemeBtn');
const createThemeModal = document.getElementById('createThemeModal');
const teamLeaderSettingsBtn = document.getElementById('teamLeaderSettingsBtn');
const addTeamLeaderBtn = document.getElementById('addTeamLeaderBtn');
const saveTeamLeadersBtn = document.getElementById('saveTeamLeadersBtn');
const resetTeamLeadersBtn = document.getElementById('resetTeamLeadersBtn');

// Alle Themes abrufen und Kalender rendern
const loadAndRenderCalendar = async () => {
    try {
        // Filter erstellen
        const filters = { year: currentYear };
        
        // Niederlassungsfilter (nur eigene NL oder alle)
        if (!isAllBranchesView) {
            filters.branchNumber = getBranchNumber();
        }
        
        // Abteilungsfilter
        const selectedDepartment = departmentFilter.value;
        if (selectedDepartment) {
            filters.departmentId = selectedDepartment;
        }
        
        // Teamleiter-Filter (übersetzt in zugehörige Abteilungen)
        const selectedTeamLeader = teamLeaderFilter.value;
        if (selectedTeamLeader) {
            const tlIndex = parseInt(selectedTeamLeader);
            if (!isNaN(tlIndex) && tlIndex >= 0 && tlIndex < teamLeaders.length) {
                const teamLeader = teamLeaders[tlIndex];
                if (teamLeader && teamLeader.assignedDepartments.length > 0) {
                    // Wenn bereits eine Abteilung ausgewählt ist, prüfen ob sie zum TL gehört
                    if (filters.departmentId) {
                        if (!teamLeader.assignedDepartments.includes(filters.departmentId)) {
                            // Die ausgewählte Abteilung gehört nicht zum TL - keine Ergebnisse
                            renderCalendar(currentMonth, currentYear, [], departments);
                            return;
                        }
                    } else {
                        // Filter auf alle Abteilungen des TL anwenden
                        // Hinweis: Dies ist eine vereinfachte Implementierung. Für eine vollständige
                        // Implementierung müssten wir mehrere Firestore-Abfragen durchführen oder
                        // eine Compound-Query mit "in" verwenden.
                        const themes = [];
                        for (const deptId of teamLeader.assignedDepartments) {
                            const deptFilters = { ...filters, departmentId: deptId };
                            const deptThemes = await getThemes(deptFilters);
                            themes.push(...deptThemes);
                        }
                        
                        // Nach Datum sortieren
                        themes.sort((a, b) => new Date(a.date) - new Date(b.date));
                        
                        renderCalendar(currentMonth, currentYear, themes, departments);
                        return;
                    }
                }
            }
        }
        
        // Themes abrufen und Kalender rendern
        const themes = await getThemes(filters);
        renderCalendar(currentMonth, currentYear, themes, departments);
    } catch (error) {
        console.error('Fehler beim Laden und Rendern des Kalenders:', error);
        alert('Es ist ein Fehler beim Laden der Daten aufgetreten.');
    }
};

// Neues Thema speichern
const saveNewTheme = async () => {
    try {
        const titleInput = document.getElementById('themeTitle');
        const dateInput = document.getElementById('themeDate');
        const departmentSelect = document.getElementById('themeDepartment');
        
        // Prüfen, ob alle Felder ausgefüllt sind
        if (!titleInput.value || !dateInput.value || !departmentSelect.value) {
            alert('Bitte füllen Sie alle Felder aus.');
            return;
        }
        
        // Thema-Objekt erstellen
        const themeData = {
            title: titleInput.value,
            date: new Date(dateInput.value),
            departmentId: departmentSelect.value,
            departmentName: departments[departmentSelect.value]?.name || departmentSelect.value
        };
        
        // In Firestore speichern
        await addTheme(themeData);
        
        // Modal schließen und Kalender aktualisieren
        createThemeModal.style.display = 'none';
        
        // Formular zurücksetzen
        titleInput.value = '';
        
        // Kalender neu laden
        await loadAndRenderCalendar();
        
    } catch (error) {
        console.error('Fehler beim Speichern des Themas:', error);
        alert('Es ist ein Fehler beim Speichern des Themas aufgetreten.');
    }
};

// Teamleitereinstellungen initialisieren
const initTeamLeaderSettings = () => {
    // TL-Einstellungen Button Event-Listener
    teamLeaderSettingsBtn.addEventListener('click', () => {
        openTeamLeaderSettingsModal(departments, teamLeaders);
    });
    
    // Neuen Teamleiter hinzufügen
    addTeamLeaderBtn.addEventListener('click', () => {
        const teamLeaderList = document.getElementById('teamLeaderList');
        const dummyTeamLeader = { name: '', assignedDepartments: [] };
        
        // Teamleiter zur UI hinzufügen
        openTeamLeaderSettingsModal([...teamLeaders, dummyTeamLeader], departments);
    });
    
    // Teamleiter speichern
    saveTeamLeadersBtn.addEventListener('click', async () => {
        try {
            // Teamleiter aus UI extrahieren
            const updatedTeamLeaders = extractTeamLeadersFromUI();
            
            // In Firestore speichern
            await saveTeamLeaders(updatedTeamLeaders);
            
            // Lokalen teamLeaders-Status aktualisieren
            teamLeaders = updatedTeamLeaders;
            
            // Dropdown-Filter aktualisieren
            populateFilters(departments, teamLeaders);
            
            // Modal schließen
            document.getElementById('teamLeaderSettingsModal').style.display = 'none';
            
            alert('Teamleiter-Einstellungen wurden erfolgreich gespeichert!');
        } catch (error) {
            console.error('Fehler beim Speichern der Teamleiter:', error);
            alert('Fehler: ' + error.message);
        }
    });
    
    // Teamleiter zurücksetzen
    resetTeamLeadersBtn.addEventListener('click', async () => {
        if (confirm('Möchten Sie die Teamleiter-Einstellungen wirklich zurücksetzen? Dies wird alle Ihre individuellen Zuordnungen löschen.')) {
            try {
                // Leere Teamleiter speichern
                await saveTeamLeaders([]);
                
                // Standard-Teamleiter laden
                teamLeaders = await getTeamLeaders();
                
                // Dropdown-Filter aktualisieren
                populateFilters(departments, teamLeaders);
                
                // Modal schließen
                document.getElementById('teamLeaderSettingsModal').style.display = 'none';
                
                alert('Teamleiter-Einstellungen wurden zurückgesetzt.');
            } catch (error) {
                console.error('Fehler beim Zurücksetzen der Teamleiter:', error);
                alert('Fehler: ' + error.message);
            }
        }
    });
};

// Initialisierung
const init = async () => {
    // Auth initialisieren
    initAuth();
    
    // Wenn nicht angemeldet, hier abbrechen (Login-UI wird durch auth.js gesteuert)
    if (!isLoggedIn()) {
        return;
    }
    
    try {
        // Abteilungen und Teamleiter laden
        departments = await getDepartments();
        teamLeaders = await getTeamLeaders();
        
        // Wenn keine Abteilungen oder Teamleiter vorhanden, Beispieldaten erstellen
        if (Object.keys(departments).length === 0) {
            await initDepartments();
            departments = await getDepartments();
        }
        
        if (teamLeaders.length === 0) {
            await initTeamLeaders();
            teamLeaders = await getTeamLeaders();
        }
        
        // Dropdown-Menüs füllen
        populateFilters(departments, teamLeaders);
        
        // Teamleiter-Einstellungen initialisieren
        initTeamLeaderSettings();
        
        // Filter-Logik initialisieren
        setupFilters();
        
        // Event-Listener für die Navigation
        prevMonthBtn.addEventListener('click', async () => {
            const newDate = goToPrevMonth();
            currentMonth = newDate.month;
            currentYear = newDate.year;
            await loadAndRenderCalendar();
        });
        
        nextMonthBtn.addEventListener('click', async () => {
            const newDate = goToNextMonth();
            currentMonth = newDate.month;
            currentYear = newDate.year;
            await loadAndRenderCalendar();
        });
        
        prevYearBtn.addEventListener('click', async () => {
            const newDate = goToPrevYear();
            currentYear = newDate.year;
            await loadAndRenderCalendar();
        });
        
        nextYearBtn.addEventListener('click', async () => {
            const newDate = goToNextYear();
            currentYear = newDate.year;
            await loadAndRenderCalendar();
        });
        
        // Event-Listener für Filter
        departmentFilter.addEventListener('change', loadAndRenderCalendar);
        teamLeaderFilter.addEventListener('change', loadAndRenderCalendar);
        
        // Event-Listener für Ansichtsumschaltung (eigene NL vs. alle NL)
        viewToggle.addEventListener('change', () => {
            isAllBranchesView = viewToggle.checked;
            loadAndRenderCalendar();
        });
        
        // Event-Listener für Thema-Erstellung
        addThemeBtn.addEventListener('click', () => {
            document.getElementById('createThemeModal').style.display = 'flex';
        });
        
        // Event-Listener für Thema speichern
        saveThemeBtn.addEventListener('click', saveNewTheme);
        
        // Initial Kalender rendern
        await loadAndRenderCalendar();
        
    } catch (error) {
        console.error('Fehler bei der Initialisierung:', error);
        alert('Es ist ein Fehler bei der Initialisierung der Anwendung aufgetreten.');
    }
};

// Anwendung starten, wenn das DOM geladen ist
document.addEventListener('DOMContentLoaded', init); 