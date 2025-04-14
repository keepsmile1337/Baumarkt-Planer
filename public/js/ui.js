import { getThemeById, getThemeImages } from './firestore-service.js';
import { uploadThemeImage } from './storage-service.js';
import { getBranchNumber } from './auth.js';

// Aktuelles Datum
let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();

// UI-Selektoren
const calendarContainer = document.getElementById('calendar');
const currentMonthYearElement = document.getElementById('currentMonthYear');
const currentYearElement = document.getElementById('currentYear');
const themeModal = document.getElementById('themeModal');
const createThemeModal = document.getElementById('createThemeModal');
const teamLeaderSettingsModal = document.getElementById('teamLeaderSettingsModal');

// Monats- und Wochentagsnamen
const monthNames = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
];
const weekDayNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

// Kalender rendern
export const renderCalendar = (month, year, themes, departments) => {
    // Prüfen, ob die benötigten Daten vorhanden sind
    if (!month && month !== 0 || !year) {
        console.error('Fehlende Daten für Kalenderdarstellung');
        renderCalendarPlaceholder();
        return;
    }
    
    // Aktuellen Monat und Jahr aktualisieren
    currentMonth = month;
    currentYear = year;
    
    // UI-Elemente aktualisieren
    currentMonthYearElement.textContent = `${monthNames[month]} ${year}`;
    currentYearElement.textContent = year;
    
    // Kalender-Container leeren
    calendarContainer.innerHTML = '';
    
    // Wochentage erstellen
    const calendarHeader = document.createElement('div');
    calendarHeader.className = 'calendar-header';
    
    weekDayNames.forEach(weekDay => {
        const weekDayElement = document.createElement('div');
        weekDayElement.className = 'weekday';
        weekDayElement.textContent = weekDay;
        calendarHeader.appendChild(weekDayElement);
    });
    
    calendarContainer.appendChild(calendarHeader);
    
    try {
        // Erstes Datum des Monats bestimmen
        const firstDayOfMonth = new Date(year, month, 1);
        const startingDayOfWeek = firstDayOfMonth.getDay();
        
        // Letztes Datum des Monats bestimmen
        const lastDay = new Date(year, month + 1, 0).getDate();
        
        // Anzahl der Tage vom vorherigen Monat
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        const prevMonthDays = startingDayOfWeek;
        
        // Anzahl der Tage insgesamt (aktueller Monat + Tage vom vorherigen/nächsten Monat)
        const totalDays = 42; // 6 Wochen * 7 Tage
        
        // Tage erstellen
        for (let i = 1; i <= totalDays; i++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            
            // Voriger Monat
            if (i <= prevMonthDays) {
                const prevMonthDay = prevMonthLastDay - prevMonthDays + i;
                dayElement.innerHTML = `<div class="day-number">${prevMonthDay}</div>`;
                dayElement.classList.add('other-month');
                
                // Datum für diesen Tag
                const dayDate = new Date(year, month - 1, prevMonthDay);
                dayElement.dataset.date = dayDate.toISOString();
            } 
            // Aktueller Monat
            else if (i <= prevMonthDays + lastDay) {
                const currentMonthDay = i - prevMonthDays;
                dayElement.innerHTML = `<div class="day-number">${currentMonthDay}</div>`;
                
                // Datum für diesen Tag
                const dayDate = new Date(year, month, currentMonthDay);
                dayElement.dataset.date = dayDate.toISOString();
                
                // Hervorhebung des heutigen Tages
                if (currentMonthDay === new Date().getDate() && 
                    month === new Date().getMonth() && 
                    year === new Date().getFullYear()) {
                    dayElement.classList.add('today');
                }
            } 
            // Nächster Monat
            else {
                const nextMonthDay = i - prevMonthDays - lastDay;
                dayElement.innerHTML = `<div class="day-number">${nextMonthDay}</div>`;
                dayElement.classList.add('other-month');
                
                // Datum für diesen Tag
                const dayDate = new Date(year, month + 1, nextMonthDay);
                dayElement.dataset.date = dayDate.toISOString();
            }
            
            // Themen für diesen Tag hinzufügen
            if (themes && themes.length > 0) {
                const dayDate = new Date(dayElement.dataset.date);
                const dayDateString = dayDate.toISOString().split('T')[0]; // YYYY-MM-DD
                
                themes.forEach(theme => {
                    try {
                        const themeDate = new Date(theme.date);
                        const themeDateString = themeDate.toISOString().split('T')[0]; // YYYY-MM-DD
                        
                        if (themeDateString === dayDateString) {
                            const themeElement = document.createElement('div');
                            themeElement.className = `theme-item dept-${theme.departmentId}`;
                            if (departments && departments[theme.departmentId]) {
                                // Stelle sicher, dass das Theme die Hintergrundfarbe der Abteilung hat
                                themeElement.style.backgroundColor = departments[theme.departmentId].color;
                            } else {
                                // Fallback-Farbe
                                themeElement.style.backgroundColor = '#777777';
                            }
                            
                            themeElement.textContent = theme.title;
                            themeElement.dataset.themeId = theme.id;
                            
                            // Event-Listener zum Öffnen des Themen-Modals
                            themeElement.addEventListener('click', (e) => {
                                e.stopPropagation(); // Verhindern, dass das Event zum Tag propagiert
                                openThemeModal(theme.id);
                            });
                            
                            dayElement.appendChild(themeElement);
                        }
                    } catch (err) {
                        console.error('Fehler beim Verarbeiten eines Themas:', err);
                    }
                });
            }
            
            // Event-Listener zum Erstellen eines neuen Themas
            dayElement.addEventListener('click', () => {
                openCreateThemeModal(dayElement.dataset.date);
            });
            
            calendarContainer.appendChild(dayElement);
        }
    } catch (error) {
        console.error('Fehler beim Rendern des Kalenders:', error);
        renderCalendarPlaceholder();
    }
};

// Kalender-Platzhalter rendern, wenn keine Daten vorhanden sind
export const renderCalendarPlaceholder = () => {
    try {
        const templateContent = document.getElementById('calendarPlaceholderTemplate').content.cloneNode(true);
        calendarContainer.innerHTML = '';
        calendarContainer.appendChild(templateContent);
    } catch (error) {
        console.error('Fehler beim Rendern des Kalender-Platzhalters:', error);
        calendarContainer.innerHTML = '<div class="calendar-error">Fehler beim Laden des Kalenders</div>';
    }
};

// Zum vorherigen Monat wechseln
export const goToPrevMonth = () => {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    return { month: currentMonth, year: currentYear };
};

// Zum nächsten Monat wechseln
export const goToNextMonth = () => {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    return { month: currentMonth, year: currentYear };
};

// Zum vorherigen Jahr wechseln
export const goToPrevYear = () => {
    currentYear--;
    return { month: currentMonth, year: currentYear };
};

// Zum nächsten Jahr wechseln
export const goToNextYear = () => {
    currentYear++;
    return { month: currentMonth, year: currentYear };
};

// Themen-Modal öffnen
export const openThemeModal = async (themeId) => {
    try {
        // Theme-Daten abrufen
        const theme = await getThemeById(themeId);
        
        // Modal-Elemente aktualisieren
        document.getElementById('modalTitle').textContent = theme.title;
        
        // Abteilungs-Tag formatieren
        const modalDepartment = document.getElementById('modalDepartment');
        modalDepartment.textContent = theme.departmentName || theme.departmentId;
        modalDepartment.className = `tag dept-${theme.departmentId}`;
        
        // Datum formatieren
        const themeDate = new Date(theme.date);
        document.getElementById('modalDate').textContent = themeDate.toLocaleDateString('de-DE', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // Bild-Gallery leeren
        const imageGallery = document.getElementById('imageGallery');
        imageGallery.innerHTML = '<div class="loading-images"><i class="fas fa-spinner fa-spin"></i> Bilder werden geladen...</div>';
        
        // Bilder abrufen und anzeigen
        const images = await getThemeImages(themeId);
        
        imageGallery.innerHTML = '';
        if (images.length === 0) {
            imageGallery.innerHTML = '<p>Keine Bilder vorhanden.</p>';
        } else {
            images.forEach(image => {
                const imgContainer = document.createElement('div');
                imgContainer.className = 'image-container';
                
                const img = document.createElement('img');
                img.className = 'gallery-image';
                img.src = image.imageUrl;
                img.alt = 'Themenbild';
                img.loading = 'lazy'; // Lazy loading für bessere Performance
                
                // Niederlassung des Uploaders anzeigen
                const uploadInfo = document.createElement('span');
                uploadInfo.className = 'upload-info';
                uploadInfo.textContent = `NL ${image.uploadedByBranch}`;
                
                imgContainer.appendChild(img);
                imgContainer.appendChild(uploadInfo);
                imageGallery.appendChild(imgContainer);
                
                // Großes Bild bei Klick anzeigen
                img.addEventListener('click', () => {
                    window.open(image.imageUrl, '_blank');
                });
            });
        }
        
        // Upload-Button Event-Listener
        const uploadBtn = document.getElementById('uploadBtn');
        const imageUpload = document.getElementById('imageUpload');
        
        // Alten Listener entfernen und neuen hinzufügen
        uploadBtn.onclick = null;
        uploadBtn.addEventListener('click', async () => {
            if (imageUpload.files.length > 0) {
                try {
                    uploadBtn.disabled = true;
                    uploadBtn.textContent = 'Wird hochgeladen...';
                    uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Wird hochgeladen...';
                    
                    await uploadThemeImage(themeId, imageUpload.files[0]);
                    
                    // Modal aktualisieren, um das neue Bild anzuzeigen
                    openThemeModal(themeId);
                } catch (error) {
                    alert('Fehler beim Hochladen: ' + error.message);
                    uploadBtn.disabled = false;
                    uploadBtn.innerHTML = 'Hochladen';
                }
            } else {
                alert('Bitte wählen Sie ein Bild aus.');
            }
        });
        
        // Modal anzeigen
        themeModal.style.display = 'flex';
        
        // Schließen-Button Event-Listener
        const closeBtn = themeModal.querySelector('.close-btn');
        closeBtn.onclick = () => {
            themeModal.style.display = 'none';
        };
    } catch (error) {
        console.error('Fehler beim Öffnen des Themen-Modals:', error);
        alert('Fehler beim Laden der Themen-Details. Bitte versuchen Sie es später erneut.');
    }
};

// Themen-Erstellungs-Modal öffnen
export const openCreateThemeModal = (dateString) => {
    try {
        // Datum im Formular setzen
        const themeDate = document.getElementById('themeDate');
        themeDate.value = dateString.split('T')[0]; // YYYY-MM-DD
        
        // Modal anzeigen
        createThemeModal.style.display = 'flex';
        
        // Schließen-Button Event-Listener
        const closeBtn = createThemeModal.querySelector('.close-btn');
        closeBtn.onclick = () => {
            createThemeModal.style.display = 'none';
        };
    } catch (error) {
        console.error('Fehler beim Öffnen des Erstellungs-Modals:', error);
        alert('Fehler beim Öffnen des Themen-Erstellungsdialogs.');
    }
};

// Teamleiter-Einstellungen-Modal öffnen
export const openTeamLeaderSettingsModal = (departments, teamLeaders) => {
    try {
        // Teamleiter-Liste leeren
        const teamLeaderList = document.getElementById('teamLeaderList');
        teamLeaderList.innerHTML = '';
        
        // Vorhandene Teamleiter anzeigen
        if (teamLeaders && teamLeaders.length > 0) {
            teamLeaders.forEach(teamLeader => {
                addTeamLeaderToUI(teamLeader, departments);
            });
        } else {
            // Dummy-Teamleiter hinzufügen, wenn keine vorhanden sind
            addTeamLeaderToUI({ name: '', assignedDepartments: [] }, departments);
        }
        
        // Modal anzeigen
        teamLeaderSettingsModal.style.display = 'flex';
        
        // Schließen-Button Event-Listener
        const closeBtn = teamLeaderSettingsModal.querySelector('.close-btn');
        closeBtn.onclick = () => {
            teamLeaderSettingsModal.style.display = 'none';
        };
    } catch (error) {
        console.error('Fehler beim Öffnen der Teamleiter-Einstellungen:', error);
        alert('Fehler beim Laden der Teamleiter-Einstellungen.');
    }
};

// Teamleiter zur UI hinzufügen
const addTeamLeaderToUI = (teamLeader, departments) => {
    try {
        const teamLeaderList = document.getElementById('teamLeaderList');
        const templateContent = document.getElementById('teamLeaderTemplate').content.cloneNode(true);
        const teamLeaderEntry = templateContent.querySelector('.team-leader-entry');
        
        // Teamleiter-Name setzen
        const nameInput = teamLeaderEntry.querySelector('.team-leader-name');
        nameInput.value = teamLeader.name || '';
        
        // Abteilungs-Checkboxen erstellen
        const checkboxesContainer = teamLeaderEntry.querySelector('.department-checkboxes');
        
        if (departments && Object.keys(departments).length > 0) {
            Object.entries(departments).forEach(([deptId, department]) => {
                const deptContainer = document.createElement('div');
                deptContainer.className = 'checkbox-container';
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `dept_${deptId}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
                checkbox.dataset.deptId = deptId;
                checkbox.checked = teamLeader.assignedDepartments?.includes(deptId) || false;
                
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
        
        // Löschen-Button Event-Listener
        const removeBtn = teamLeaderEntry.querySelector('.remove-team-leader-btn');
        removeBtn.addEventListener('click', () => {
            if (teamLeaderList.children.length > 1) {
                teamLeaderEntry.remove();
            } else {
                alert('Es muss mindestens ein Teamleiter vorhanden sein.');
            }
        });
        
        teamLeaderList.appendChild(teamLeaderEntry);
    } catch (error) {
        console.error('Fehler beim Hinzufügen des Teamleiters zur UI:', error);
    }
};

// Teamleiter aus UI extrahieren
export const extractTeamLeadersFromUI = () => {
    try {
        const teamLeaderEntries = document.querySelectorAll('.team-leader-entry');
        const teamLeaders = [];
        
        teamLeaderEntries.forEach(entry => {
            const name = entry.querySelector('.team-leader-name').value.trim();
            
            // Prüfen, ob der Name nicht leer ist
            if (!name) {
                throw new Error("Teamleiter-Name darf nicht leer sein");
            }
            
            // Zugeordnete Abteilungen abrufen
            const assignedDepartments = [];
            const checkboxes = entry.querySelectorAll('input[type="checkbox"]:checked');
            
            checkboxes.forEach(checkbox => {
                assignedDepartments.push(checkbox.dataset.deptId);
            });
            
            // Prüfen, ob mindestens eine Abteilung zugeordnet ist
            if (assignedDepartments.length === 0) {
                throw new Error(`Teamleiter "${name}" muss mindestens eine Abteilung zugeordnet haben`);
            }
            
            teamLeaders.push({
                name,
                assignedDepartments
            });
        });
        
        return teamLeaders;
    } catch (error) {
        throw error;
    }
};

// Modal beim Klick außerhalb schließen
window.addEventListener('click', (event) => {
    if (event.target === themeModal) {
        themeModal.style.display = 'none';
    }
    if (event.target === createThemeModal) {
        createThemeModal.style.display = 'none';
    }
    if (event.target === teamLeaderSettingsModal) {
        teamLeaderSettingsModal.style.display = 'none';
    }
});

// Dropdown-Filter mit Daten füllen
export const populateFilters = (departments, teamLeaders) => {
    try {
        // Abteilungs-Filter
        const departmentFilter = document.getElementById('departmentFilter');
        departmentFilter.innerHTML = '<option value="">Alle Abteilungen</option>';
        
        // Abteilungen für Erstellung
        const themeDepartment = document.getElementById('themeDepartment');
        themeDepartment.innerHTML = '';
        
        if (departments && Object.keys(departments).length > 0) {
            Object.entries(departments).forEach(([id, department]) => {
                // Für Filter
                const option = document.createElement('option');
                option.value = id;
                option.textContent = department.name;
                departmentFilter.appendChild(option);
                
                // Für Themen-Erstellung
                const themeOption = document.createElement('option');
                themeOption.value = id;
                themeOption.textContent = department.name;
                themeDepartment.appendChild(themeOption);
            });
        }
        
        // Teamleiter-Filter
        const teamLeaderFilter = document.getElementById('teamLeaderFilter');
        teamLeaderFilter.innerHTML = '<option value="">Alle Teamleiter</option>';
        
        if (teamLeaders && teamLeaders.length > 0) {
            teamLeaders.forEach((teamLeader, index) => {
                const option = document.createElement('option');
                option.value = index.toString(); // Wir verwenden Index als ID für NL-spezifische Teamleiter
                option.textContent = teamLeader.name;
                teamLeaderFilter.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Fehler beim Befüllen der Filter:', error);
    }
};

document.addEventListener('DOMContentLoaded', function() {
    initUI();
});

function initUI() {
    // Event-Listener für die Filter
    setupFilters();
    
    // Event-Listener für Teamleiter-Einstellungen
    setupTeamLeaderSettings();
    
    // Branch-Filter-Toggle initialisieren
    const branchFilter = document.getElementById('branch-filter');
    if (branchFilter) {
        branchFilter.addEventListener('change', function() {
            // Kalender mit aktuellen Filtern neu laden
            if (typeof renderCalendar === 'function') {
                renderCalendar();
            }
        });
    }
    
    // Auf Authentifizierungsänderungen reagieren
    checkAuthState();
}

// Authentifizierungsstatus prüfen und UI anpassen
function checkAuthState() {
    if (window.auth && typeof window.auth.checkAuthState === 'function') {
        window.auth.checkAuthState().then(user => {
            if (user) {
                updateUIForUser(user);
            }
        });
    }
}

// UI basierend auf dem angemeldeten Benutzer aktualisieren
function updateUIForUser(user) {
    const adminBanner = document.getElementById('admin-banner');
    const userBanner = document.getElementById('user-banner');
    const headerBranchId = document.getElementById('header-branch-id');
    
    // Header aktualisieren
    if (headerBranchId) {
        headerBranchId.textContent = `NL ${user.branchId}`;
    }
    
    // Banner basierend auf Benutzerrolle anzeigen
    if (window.auth && window.auth.isAdmin()) {
        if (adminBanner) adminBanner.style.display = 'flex';
        if (userBanner) userBanner.style.display = 'none';
    } else {
        if (adminBanner) adminBanner.style.display = 'none';
        if (userBanner) userBanner.style.display = 'flex';
    }
}

// Filter initialisieren
function setupFilters() {
    // Abteilungs-Filter
    const departmentFilters = document.querySelectorAll('[id^="filter-"][id$="-garten"], [id$="-werkzeug"], [id$="-sanitaer"], [id$="-baustoffe"], [id$="-holz"], [id$="-farben"], [id$="-elektro"], [id$="-dekoration"]');
    
    departmentFilters.forEach(filter => {
        filter.addEventListener('change', function() {
            // Kalender mit aktuellen Filtern neu laden
            if (typeof renderCalendar === 'function') {
                renderCalendar();
            }
        });
    });
    
    // Teamleiter-Filter
    const teamleaderFilters = document.querySelectorAll('[id^="filter-tl"]');
    
    teamleaderFilters.forEach(filter => {
        filter.addEventListener('change', function() {
            // Kalender mit aktuellen Filtern neu laden
            if (typeof renderCalendar === 'function') {
                renderCalendar();
            }
        });
    });

    // Dropdown-Toggle für Filter-Buttons
    const dropdownButtons = document.querySelectorAll('.filter-btn');
    dropdownButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            // ID des zu öffnenden Dropdown-Elements
            const dropdownId = this.getAttribute('id').replace('-filter-btn', '-dropdown');
            const dropdown = document.getElementById(dropdownId);
            
            if (!dropdown) {
                console.error(`Dropdown-Element mit ID ${dropdownId} nicht gefunden.`);
                return;
            }
            
            // Alle anderen Dropdowns schließen
            document.querySelectorAll('.dropdown-content').forEach(el => {
                if (el.id !== dropdownId) {
                    el.classList.remove('active');
                }
            });
            
            // Aktuelles Dropdown umschalten
            dropdown.classList.toggle('active');
        });
    });
    
    // Bei Klick außerhalb schließen
    document.addEventListener('click', function(e) {
        // Prüfen, ob das geklickte Element nicht Teil eines Dropdown-Buttons oder -Inhalts ist
        if (!e.target.closest('.dropdown-filter')) {
            document.querySelectorAll('.dropdown-content').forEach(dropdown => {
                dropdown.classList.remove('active');
            });
        }
    });
}

// Teamleiter-Einstellungen initialisieren
function setupTeamLeaderSettings() {
    const tlSettingsBtn = document.getElementById('tl-settings-btn');
    const teamleaderModal = document.getElementById('teamleader-modal');
    const closeButtons = document.querySelectorAll('.close-modal');
    
    // Teamleiter-Einstellungen-Button-Klick
    if (tlSettingsBtn) {
        tlSettingsBtn.addEventListener('click', function() {
            // Modal öffnen
            if (teamleaderModal) {
                teamleaderModal.classList.add('active');
                
                // Überprüfen, ob der Benutzer Admin ist
                if (window.auth && !window.auth.isAdmin()) {
                    alert('Sie haben keine Berechtigung, die Teamleiter-Einstellungen zu ändern.');
                    teamleaderModal.classList.remove('active');
                    return;
                }
            }
        });
    }
    
    // Modal-Schließen-Buttons
    closeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.classList.remove('active');
            }
        });
    });
    
    // Klick außerhalb des Modals schließt es
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.classList.remove('active');
        }
    });
    
    // Teamleiter-Formular-Absenden
    const teamleaderForm = document.getElementById('teamleader-form');
    if (teamleaderForm) {
        teamleaderForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Abteilungszuordnungen sammeln
            const teamLeaderAssignments = {
                'Teamleiter 1': getCheckedDepartments('tl1'),
                'Teamleiter 2': getCheckedDepartments('tl2'),
                'Teamleiter 3': getCheckedDepartments('tl3'),
                'Teamleiter 4': getCheckedDepartments('tl4')
            };
            
            // In einer realen Anwendung würden die Daten in Firebase gespeichert
            console.log('Teamleiter-Zuordnungen gespeichert:', teamLeaderAssignments);
            
            // Modal schließen
            teamleaderModal.classList.remove('active');
            
            // Feedback anzeigen
            alert('Teamleiter-Zuordnungen wurden gespeichert.');
        });
    }
}

// Hilfsfunktion zum Sammeln der zugeordneten Abteilungen für einen Teamleiter
function getCheckedDepartments(teamLeaderPrefix) {
    const departments = ['garten', 'werkzeug', 'sanitaer', 'baustoffe', 'holz', 'farben', 'elektro', 'dekoration'];
    const checkedDepartments = [];
    
    departments.forEach(dept => {
        const checkbox = document.getElementById(`${teamLeaderPrefix}-${dept}`);
        if (checkbox && checkbox.checked) {
            checkedDepartments.push(dept);
        }
    });
    
    return checkedDepartments;
} 