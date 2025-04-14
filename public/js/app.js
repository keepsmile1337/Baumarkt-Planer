import { initAuth, onAuthStateChanged, login, logout, getBranchNumber } from './auth.js';
import { subscribeToThemes, subscribeToTeamLeaders, subscribeToDepartments, createTheme, saveTeamLeaders } from './firestore-service.js';
import { 
    renderCalendar, 
    goToPrevMonth, 
    goToNextMonth, 
    goToPrevYear, 
    goToNextYear, 
    openTeamLeaderSettingsModal, 
    extractTeamLeadersFromUI,
    populateFilters,
    renderCalendarPlaceholder
} from './ui.js';

// Globale Variablen für aktuelle Daten
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let themes = [];
let filteredThemes = [];
let departments = {};
let teamLeaders = [];
let showAllBranches = false;

// DOM-Elemente
const calendarContainer = document.getElementById('calendar');
const loginContainer = document.getElementById('loginContainer');
const appContainer = document.getElementById('appContainer');
const branchNumberInput = document.getElementById('branchNumber');
const branchIndicator = document.getElementById('branchIndicator');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const createThemeForm = document.getElementById('createThemeForm');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const prevYearBtn = document.getElementById('prevYear');
const nextYearBtn = document.getElementById('nextYear');
const saveTeamLeadersBtn = document.getElementById('saveTeamLeadersBtn');
const addTeamLeaderBtn = document.getElementById('addTeamLeaderBtn');
const teamLeaderSettingsBtn = document.getElementById('teamLeaderSettingsBtn');
const toggleBranchViewBtn = document.getElementById('toggleBranchViewBtn');
const departmentFilter = document.getElementById('departmentFilter');
const teamLeaderFilter = document.getElementById('teamLeaderFilter');

// Initialisierung der App
document.addEventListener('DOMContentLoaded', () => {
    // Firebase Auth initialisieren
    initAuth();
    
    // Auth State Listener
    onAuthStateChanged((isLoggedIn, user) => {
        if (isLoggedIn) {
            // UI aktualisieren
            loginContainer.style.display = 'none';
            appContainer.style.display = 'block';
            branchIndicator.textContent = `NL ${getBranchNumber()}`;
            
            // Kalender-Ladeanimation anzeigen
            calendarContainer.innerHTML = '<div class="calendar-loading"><i class="fas fa-spinner fa-spin"></i><div>Kalender wird geladen...</div></div>';
            
            // Daten abonnieren
            initSubscriptions();
        } else {
            // Zurück zum Login
            loginContainer.style.display = 'flex';
            appContainer.style.display = 'none';
            
            // Daten löschen
            themes = [];
            filteredThemes = [];
            departments = {};
            teamLeaders = [];
        }
    });
    
    // Event-Listener für UI-Elemente
    setupEventListeners();
});

// Daten-Subscriptions initialisieren
const initSubscriptions = () => {
    try {
        // Abteilungen abonnieren
        subscribeToDepartments((updatedDepartments) => {
            departments = updatedDepartments;
            populateFilters(departments, teamLeaders);
            applyFiltersAndRenderCalendar();
        }, (error) => {
            console.error('Fehler beim Abonnieren der Abteilungen:', error);
            // Auch bei einem Fehler versuchen wir, den Kalender mit vorhandenen Daten zu rendern
            renderCalendarPlaceholder();
        });
        
        // Teamleiter abonnieren
        subscribeToTeamLeaders((updatedTeamLeaders) => {
            teamLeaders = updatedTeamLeaders;
            populateFilters(departments, teamLeaders);
            applyFiltersAndRenderCalendar();
        }, (error) => {
            console.error('Fehler beim Abonnieren der Teamleiter:', error);
            // Wir setzen die Teamleiter auf ein leeres Array, um trotzdem weiterzumachen
            teamLeaders = [];
            populateFilters(departments, teamLeaders);
            applyFiltersAndRenderCalendar();
        });
        
        // Themen abonnieren
        subscribeToThemes((updatedThemes) => {
            themes = updatedThemes;
            applyFiltersAndRenderCalendar();
        }, (error) => {
            console.error('Fehler beim Abonnieren der Themen:', error);
            // Bei einem Fehler zeigen wir einen leeren Kalender an
            themes = [];
            renderCalendarPlaceholder();
        });
    } catch (error) {
        console.error('Fehler beim Initialisieren der Subscriptions:', error);
        renderCalendarPlaceholder();
    }
};

// Filter anwenden und Kalender rendern
const applyFiltersAndRenderCalendar = () => {
    try {
        // Falls noch keine Themen oder Abteilungen geladen wurden, brechen wir ab
        if (!themes || !departments) {
            renderCalendarPlaceholder();
            return;
        }
        
        // Kopie der Themen erstellen
        filteredThemes = [...themes];
        
        // Nach Niederlassung filtern
        if (!showAllBranches) {
            const userBranch = getBranchNumber();
            filteredThemes = filteredThemes.filter(theme => theme.branch === userBranch);
        }
        
        // Nach Abteilung filtern
        const selectedDepartment = departmentFilter.value;
        if (selectedDepartment) {
            filteredThemes = filteredThemes.filter(theme => theme.departmentId === selectedDepartment);
        }
        
        // Nach Teamleiter filtern
        const selectedTeamLeaderIndex = teamLeaderFilter.value;
        if (selectedTeamLeaderIndex) {
            const teamLeader = teamLeaders[parseInt(selectedTeamLeaderIndex)];
            if (teamLeader && teamLeader.assignedDepartments) {
                filteredThemes = filteredThemes.filter(theme => 
                    teamLeader.assignedDepartments.includes(theme.departmentId)
                );
            }
        }
        
        // Kalender rendern
        renderCalendar(currentMonth, currentYear, filteredThemes, departments);
        
        // Ansicht-Toggle-Button aktualisieren
        toggleBranchViewBtn.textContent = showAllBranches ? 'Meine NL' : 'Alle NL';
    } catch (error) {
        console.error('Fehler beim Anwenden der Filter:', error);
        renderCalendarPlaceholder();
    }
};

// Event-Listener für UI-Elemente
const setupEventListeners = () => {
    // Login-Button
    loginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const branchNumber = branchNumberInput.value.trim();
        
        if (!branchNumber || branchNumber.length !== 3) {
            alert('Bitte geben Sie eine gültige 3-stellige Niederlassungsnummer ein.');
            return;
        }
        
        login(branchNumber)
            .catch(error => {
                console.error('Login fehlgeschlagen:', error);
                alert('Login fehlgeschlagen: ' + error.message);
            });
    });
    
    // Logout-Button
    logoutBtn.addEventListener('click', () => {
        logout().catch(error => {
            console.error('Logout fehlgeschlagen:', error);
            alert('Logout fehlgeschlagen: ' + error.message);
        });
    });
    
    // Themen-Erstellungs-Formular
    createThemeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const title = document.getElementById('themeTitle').value.trim();
        const departmentId = document.getElementById('themeDepartment').value;
        const date = document.getElementById('themeDate').value;
        
        if (!title || !departmentId || !date) {
            alert('Bitte füllen Sie alle Felder aus.');
            return;
        }
        
        createTheme(title, departmentId, date)
            .then(() => {
                // Formular zurücksetzen und Modal schließen
                createThemeForm.reset();
                document.getElementById('createThemeModal').style.display = 'none';
            })
            .catch(error => {
                console.error('Fehler beim Erstellen des Themas:', error);
                alert('Fehler beim Erstellen des Themas: ' + error.message);
            });
    });
    
    // Monat/Jahr Navigation
    prevMonthBtn.addEventListener('click', () => {
        const { month, year } = goToPrevMonth();
        currentMonth = month;
        currentYear = year;
        applyFiltersAndRenderCalendar();
    });
    
    nextMonthBtn.addEventListener('click', () => {
        const { month, year } = goToNextMonth();
        currentMonth = month;
        currentYear = year;
        applyFiltersAndRenderCalendar();
    });
    
    prevYearBtn.addEventListener('click', () => {
        const { month, year } = goToPrevYear();
        currentMonth = month;
        currentYear = year;
        applyFiltersAndRenderCalendar();
    });
    
    nextYearBtn.addEventListener('click', () => {
        const { month, year } = goToNextYear();
        currentMonth = month;
        currentYear = year;
        applyFiltersAndRenderCalendar();
    });
    
    // Teamleiter-Einstellungen speichern
    saveTeamLeadersBtn.addEventListener('click', () => {
        try {
            const updatedTeamLeaders = extractTeamLeadersFromUI();
            
            saveTeamLeaders(updatedTeamLeaders)
                .then(() => {
                    document.getElementById('teamLeaderSettingsModal').style.display = 'none';
                    alert('Teamleiter-Einstellungen wurden gespeichert.');
                })
                .catch(error => {
                    console.error('Fehler beim Speichern der Teamleiter-Einstellungen:', error);
                    alert('Fehler beim Speichern: ' + error.message);
                });
        } catch (error) {
            alert(error.message);
        }
    });
    
    // Teamleiter hinzufügen
    addTeamLeaderBtn.addEventListener('click', () => {
        const template = document.getElementById('teamLeaderTemplate');
        const teamLeaderList = document.getElementById('teamLeaderList');
        
        const clone = template.content.cloneNode(true);
        const newEntry = clone.querySelector('.team-leader-entry');
        
        // Löschen-Button konfigurieren
        const removeBtn = newEntry.querySelector('.remove-team-leader-btn');
        removeBtn.addEventListener('click', () => {
            if (teamLeaderList.children.length > 1) {
                newEntry.remove();
            } else {
                alert('Es muss mindestens ein Teamleiter vorhanden sein.');
            }
        });
        
        // Abteilungs-Checkboxen für den neuen Teamleiter erstellen
        const checkboxesContainer = newEntry.querySelector('.department-checkboxes');
        checkboxesContainer.innerHTML = '';
        
        if (departments && Object.keys(departments).length > 0) {
            Object.entries(departments).forEach(([deptId, department]) => {
                const deptContainer = document.createElement('div');
                deptContainer.className = 'checkbox-container';
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `dept_${deptId}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
                checkbox.dataset.deptId = deptId;
                
                const label = document.createElement('label');
                label.htmlFor = checkbox.id;
                label.textContent = department.name;
                
                // Farbmarker hinzufügen
                const colorMarker = document.createElement('span');
                colorMarker.className = 'color-marker';
                colorMarker.style.backgroundColor = department.color;
                
                deptContainer.appendChild(checkbox);
                deptContainer.appendChild(colorMarker);
                deptContainer.appendChild(label);
                
                checkboxesContainer.appendChild(deptContainer);
            });
        } else {
            checkboxesContainer.innerHTML = '<p>Keine Abteilungen gefunden</p>';
        }
        
        teamLeaderList.appendChild(newEntry);
    });
    
    // Teamleiter-Einstellungen öffnen
    teamLeaderSettingsBtn.addEventListener('click', () => {
        openTeamLeaderSettingsModal(departments, teamLeaders);
    });
    
    // Zwischen "Meine NL" und "Alle NL" umschalten
    toggleBranchViewBtn.addEventListener('click', () => {
        showAllBranches = !showAllBranches;
        toggleBranchViewBtn.textContent = showAllBranches ? 'Meine NL' : 'Alle NL';
        applyFiltersAndRenderCalendar();
    });
    
    // Filter-Änderungen
    departmentFilter.addEventListener('change', applyFiltersAndRenderCalendar);
    teamLeaderFilter.addEventListener('change', applyFiltersAndRenderCalendar);
}; 