document.addEventListener('DOMContentLoaded', function() {
    initCalendar();
});

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let currentQuarter = Math.floor(currentMonth / 3) + 1;
const months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const calendarContainer = document.getElementById('calendar-container');

function initCalendar() {
    // Event-Listener für Quartals-Wechsel
    document.getElementById('prev-month').addEventListener('click', function() {
        currentQuarter--;
        if (currentQuarter < 1) {
            currentQuarter = 4;
            currentYear--;
        }
        renderCalendar();
    });

    document.getElementById('next-month').addEventListener('click', function() {
        currentQuarter++;
        if (currentQuarter > 4) {
            currentQuarter = 1;
            currentYear++;
        }
        renderCalendar();
    });

    // Direkter Wechsel zu aktuellem Quartal
    document.getElementById('current-month').addEventListener('click', function() {
        currentMonth = new Date().getMonth();
        currentYear = new Date().getFullYear();
        currentQuarter = Math.floor(currentMonth / 3) + 1;
        renderCalendar();
    });
    
    // Themes-Dropdown für Nicht-Admins initialisieren
    initThemesDropdown();

    // Initialen Kalender rendern
    renderCalendar();
}

// Kalender rendern
function renderCalendar() {
    showLoading();
    
    // Wir verzögern das Rendern künstlich um 0.5 Sekunden, 
    // um die Ladeanimation zu demonstrieren
    setTimeout(() => {
        // Quartal und Jahr aktualisieren
        const quarterStart = (currentQuarter - 1) * 3;
        const quarterMonths = months.slice(quarterStart, quarterStart + 3);
        document.getElementById('month-year').textContent = `${quarterMonths.join('/')} ${currentYear} (Q${currentQuarter})`;
        
        let calendarHTML = '';
        
        // Kalender für alle drei Monate des Quartals erstellen
        for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
            const monthIndex = quarterStart + monthOffset;
            calendarHTML += createMonthCalendar(monthIndex, currentYear);
        }
        
        // Kalender anzeigen
        calendarContainer.innerHTML = calendarHTML;
        
        // Klick-Handler für Kalendertage
        setupCalendarDayClickHandlers();
        
        // Themes für das aktuelle Quartal laden
        loadThemesForQuarter();
    }, 500); // 0.5 Sekunden Verzögerung zur Simulation der Ladezeit
}

// Funktion zum Erstellen eines Monatskalenders
function createMonthCalendar(monthIndex, year) {
    // Monatstitel
    let monthHTML = `
        <div class="month-container">
            <h3 class="month-title">${months[monthIndex]} ${year}</h3>
            <div class="calendar-header-grid">
    `;
    
    // Wochentage
    const weekdays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
    weekdays.forEach(day => {
        monthHTML += `<div class="weekday">${day}</div>`;
    });
    
    monthHTML += '</div><div class="calendar-grid">';
    
    // Ersten Tag des Monats ermitteln
    const firstDay = new Date(year, monthIndex, 1);
    // Letzten Tag des Monats ermitteln
    const lastDay = new Date(year, monthIndex + 1, 0);
    
    // Ermitteln des Wochentags vom ersten Tag des Monats (0 = Sonntag, 1 = Montag, ...)
    let firstDayOfWeek = firstDay.getDay();
    // In Deutschland beginnt die Woche mit Montag, daher verschieben wir Sonntag auf 7
    if (firstDayOfWeek === 0) firstDayOfWeek = 7;
    
    // Leere Zellen für Tage vor dem ersten Tag des Monats
    for (let i = 1; i < firstDayOfWeek; i++) {
        monthHTML += '<div class="calendar-day empty"></div>';
    }
    
    // Zellen für alle Tage des Monats
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const isToday = day === new Date().getDate() && 
                       monthIndex === new Date().getMonth() && 
                       year === new Date().getFullYear();
        
        monthHTML += `
            <div class="calendar-day ${isToday ? 'today' : ''}" data-day="${day}" data-month="${monthIndex}">
                <div class="day-number">${day}</div>
                <div class="theme-items-container"></div>
            </div>
        `;
    }
    
    // Leere Zellen für Tage nach dem letzten Tag des Monats
    // Berechnung, wie viele leere Zellen benötigt werden, um das Raster zu vervollständigen
    const lastDayOfWeek = lastDay.getDay() === 0 ? 7 : lastDay.getDay();
    const remainingCells = 7 - lastDayOfWeek;
    
    if (remainingCells < 7) {
        for (let i = 0; i < remainingCells; i++) {
            monthHTML += '<div class="calendar-day empty"></div>';
        }
    }
    
    monthHTML += '</div></div>';
    
    return monthHTML;
}

// Ladeanimation anzeigen
function showLoading() {
    calendarContainer.innerHTML = `
        <div class="calendar-loading">
            <div class="spinner"></div>
            <p>Kalender wird geladen...</p>
        </div>
    `;
}

// Klick-Handler für Kalendertage
function setupCalendarDayClickHandlers() {
    document.querySelectorAll('.calendar-day:not(.empty)').forEach(day => {
        day.addEventListener('click', () => {
            const dayNumber = day.getAttribute('data-day');
            const monthIndex = parseInt(day.getAttribute('data-month'));
            
            // Nur Admins dürfen Themen hinzufügen
            if (window.auth && typeof window.auth.isAdmin === 'function' && window.auth.isAdmin()) {
                openAddThemeModal(dayNumber, monthIndex);
            } else {
                // Nicht-Admins können ein bestehendes Thema aus einem Dropdown wählen
                openSelectThemeModal(dayNumber, monthIndex);
            }
        });
    });
}

// Dropdown mit vorhandenen Themen für Nicht-Admins initialisieren
function initThemesDropdown() {
    // Erstellen des Dropdown-Containers, falls er noch nicht existiert
    if (!document.getElementById('themes-dropdown-container')) {
        const appContainer = document.getElementById('app-container');
        if (appContainer) {
            const dropdownContainer = document.createElement('div');
            dropdownContainer.id = 'themes-dropdown-container';
            dropdownContainer.className = 'themes-dropdown-container';
            dropdownContainer.style.display = 'none';
            
            // HTML für das Dropdown generieren
            dropdownContainer.innerHTML = `
                <div class="dropdown-header">
                    <h3>Thema für Foto auswählen</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="dropdown-content">
                    <select id="themes-dropdown"></select>
                    <div class="image-upload-container">
                        <label for="image-upload">Foto hochladen:</label>
                        <input type="file" id="image-upload" accept="image/*">
                    </div>
                    <button id="upload-image-btn" class="btn">Foto hochladen</button>
                </div>
            `;
            
            appContainer.appendChild(dropdownContainer);
            
            // Event-Handler für das Schließen des Dropdowns
            const closeBtn = dropdownContainer.querySelector('.close-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    dropdownContainer.style.display = 'none';
                });
            }
            
            // Event-Handler für den Upload-Button
            const uploadBtn = dropdownContainer.querySelector('#upload-image-btn');
            if (uploadBtn) {
                uploadBtn.addEventListener('click', uploadImageForTheme);
            }
        }
    }
}

// Funktion zum Öffnen des Themen-Auswahl-Modals für Nicht-Admins
function openSelectThemeModal(day, monthIndex) {
    const formattedDate = `${day}. ${months[monthIndex]} ${currentYear}`;
    
    // Dropdown-Container anzeigen
    const dropdownContainer = document.getElementById('themes-dropdown-container');
    if (!dropdownContainer) return;
    
    // Titel mit Datum setzen
    const dropdownHeader = dropdownContainer.querySelector('.dropdown-header h3');
    if (dropdownHeader) {
        dropdownHeader.textContent = `Thema für ${formattedDate} auswählen`;
    }
    
    // Themen für diesen Tag abrufen
    const quarterStart = (currentQuarter - 1) * 3;
    
    // In einer realen Anwendung würden die Themen aus Firebase geladen
    const testThemes = [
        {
            id: 'theme1',
            day: 5,
            month: quarterStart,
            title: 'Gartenmöbel-Aufbau',
            department: 'Garten',
            color: 'var(--dept-garten)',
            teamLeader: 'Teamleiter 1',
            branchId: '537'
        },
        {
            id: 'theme2',
            day: 8,
            month: quarterStart,
            title: 'Werkzeug-Sonderaktion',
            department: 'Werkzeug',
            color: 'var(--dept-werkzeug)',
            teamLeader: 'Teamleiter 2',
            branchId: '537'
        },
        {
            id: 'theme3',
            day: 12,
            month: quarterStart + 1,
            title: 'Badmöbel im Angebot',
            department: 'Sanitär',
            color: 'var(--dept-sanitaer)',
            teamLeader: 'Teamleiter 3',
            branchId: '537'
        },
        // ... weitere Themes
    ];
    
    // Dropdown mit Themen füllen
    const themesDropdown = document.getElementById('themes-dropdown');
    if (themesDropdown) {
        themesDropdown.innerHTML = '';
        
        // Option zum Auswählen einfügen
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = '-- Thema auswählen --';
        themesDropdown.appendChild(defaultOption);
        
        // Themen-Optionen einfügen
        testThemes.filter(theme => theme.day === parseInt(day) && theme.month === monthIndex)
            .forEach(theme => {
                const option = document.createElement('option');
                option.value = theme.id;
                option.textContent = `${theme.title} (${theme.department})`;
                themesDropdown.appendChild(option);
            });
        
        // Wenn keine Themen vorhanden sind, eine Info-Option einfügen
        if (themesDropdown.options.length === 1) {
            const noThemesOption = document.createElement('option');
            noThemesOption.value = '';
            noThemesOption.textContent = 'Keine Themen für diesen Tag vorhanden';
            noThemesOption.disabled = true;
            themesDropdown.appendChild(noThemesOption);
        }
    }
    
    // Datum im Hidden-Field speichern
    const dateInput = document.createElement('input');
    dateInput.type = 'hidden';
    dateInput.id = 'selected-date';
    dateInput.value = `${currentYear}-${(monthIndex + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    
    // Altes Hidden-Field entfernen, falls vorhanden
    const oldDateInput = document.getElementById('selected-date');
    if (oldDateInput) {
        oldDateInput.remove();
    }
    
    dropdownContainer.querySelector('.dropdown-content').appendChild(dateInput);
    
    // Dropdown anzeigen
    dropdownContainer.style.display = 'block';
}

// Funktion zum Hochladen eines Bildes für ein ausgewähltes Thema
function uploadImageForTheme() {
    const themeId = document.getElementById('themes-dropdown').value;
    const imageInput = document.getElementById('image-upload');
    const selectedDate = document.getElementById('selected-date').value;
    
    if (!themeId) {
        alert('Bitte wählen Sie ein Thema aus');
        return;
    }
    
    if (!imageInput.files || imageInput.files.length === 0) {
        alert('Bitte wählen Sie ein Bild zum Hochladen aus');
        return;
    }
    
    const file = imageInput.files[0];
    
    // In einer realen Anwendung würde hier der Upload zu Firebase Storage erfolgen
    console.log('Bild wird hochgeladen:', {
        themeId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        date: selectedDate,
        branchId: window.auth ? window.auth.getCurrentBranchId() : 'unknown'
    });
    
    // Mock des erfolgreichen Uploads
    setTimeout(() => {
        alert('Bild erfolgreich hochgeladen!');
        document.getElementById('themes-dropdown-container').style.display = 'none';
    }, 1000);
}

// Funktion zum Laden der Themes für das aktuelle Quartal
function loadThemesForQuarter() {
    // Diese Funktion würde normalerweise Daten aus Firebase laden
    // Für Testzwecke verwenden wir hier Beispieldaten
    const quarterStart = (currentQuarter - 1) * 3;
    
    const testThemes = [
        {
            id: 'theme1',
            day: 5,
            month: quarterStart,
            title: 'Gartenmöbel-Aufbau',
            department: 'Garten',
            color: 'var(--dept-garten)',
            teamLeader: 'Teamleiter 1',
            branchId: '537'
        },
        {
            id: 'theme2',
            day: 8,
            month: quarterStart,
            title: 'Werkzeug-Sonderaktion',
            department: 'Werkzeug',
            color: 'var(--dept-werkzeug)',
            teamLeader: 'Teamleiter 2',
            branchId: '537'
        },
        {
            id: 'theme3',
            day: 12,
            month: quarterStart + 1,
            title: 'Badmöbel im Angebot',
            department: 'Sanitär',
            color: 'var(--dept-sanitaer)',
            teamLeader: 'Teamleiter 3',
            branchId: '537'
        },
        {
            id: 'theme4',
            day: 15,
            month: quarterStart + 1,
            title: 'Garten-Deko Saison',
            department: 'Garten',
            color: 'var(--dept-garten)',
            teamLeader: 'Teamleiter 1',
            branchId: '123'
        },
        {
            id: 'theme5',
            day: 15,
            month: quarterStart + 2,
            title: 'Elektro-Neuheiten',
            department: 'Elektro',
            color: 'var(--dept-elektro)',
            teamLeader: 'Teamleiter 4',
            branchId: '537'
        },
        {
            id: 'theme6',
            day: 20,
            month: quarterStart + 2,
            title: 'Farbmischservice',
            department: 'Farben',
            color: 'var(--dept-farben)',
            teamLeader: 'Teamleiter 3',
            branchId: '123'
        }
    ];
    
    // Filterung nach aktueller Niederlassung
    const branchFilter = document.getElementById('branch-filter') ? 
                         document.getElementById('branch-filter').checked : false;
    
    // Prüfen, ob auth.getCurrentBranchId verfügbar ist
    const currentBranchId = (window.auth && typeof window.auth.getCurrentBranchId === 'function') 
                            ? window.auth.getCurrentBranchId() 
                            : '537';
    
    console.log('Aktuelle Niederlassung:', currentBranchId);
    console.log('Branch-Filter aktiv:', branchFilter);
    
    let filteredThemes = testThemes;
    if (branchFilter) {
        // Nur Themen der eigenen Niederlassung anzeigen
        filteredThemes = testThemes.filter(theme => theme.branchId === currentBranchId);
        console.log('Gefilterte Themen:', filteredThemes.length);
    }
    
    // Themes im Kalender anzeigen
    renderThemes(filteredThemes);
    
    // Event-Listener für Klicks auf Kalendertage setuppen
    setupCalendarDayClickHandlers();
}

// Themes im Kalender anzeigen
function renderThemes(themes) {
    // Zuerst alle Theme-Container leeren, um doppelte Einträge zu vermeiden
    document.querySelectorAll('.theme-items-container').forEach(container => {
        container.innerHTML = '';
    });
    
    themes.forEach(theme => {
        const dayElement = document.querySelector(`.calendar-day[data-day="${theme.day}"][data-month="${theme.month}"]`);
        if (dayElement) {
            const themesContainer = dayElement.querySelector('.theme-items-container');
            const themeElement = document.createElement('div');
            themeElement.className = 'theme-item';
            themeElement.innerHTML = `
                <div class="theme-title">${theme.title}</div>
                <div class="theme-department" style="background-color: ${theme.color}">
                    ${theme.department} (${theme.teamLeader})
                </div>
            `;
            
            // Klick-Event für das Bearbeiten eines Themes
            themeElement.addEventListener('click', (e) => {
                e.stopPropagation(); // Verhindern, dass der Klick auf den Tag weitergeleitet wird
                openEditThemeModal(theme, theme.day, theme.month);
            });
            
            themesContainer.appendChild(themeElement);
        }
    });
    
    // Wenn keine Themes vorhanden sind, Platzhalter anzeigen
    if (themes.length === 0) {
        showPlaceholder();
    }
}

// Placeholder anzeigen, wenn keine Themes geladen wurden
function showPlaceholder() {
    const placeholder = document.createElement('div');
    placeholder.className = 'calendar-placeholder';
    placeholder.innerHTML = `
        <div class="placeholder-content">
            <i class="fas fa-calendar-alt"></i>
            <p>Keine Themen für diesen Monat</p>
            <p class="placeholder-info">Klicken Sie auf einen Tag, um ein Thema hinzuzufügen</p>
        </div>
    `;
    
    // Nur einfügen, wenn keine Themes vorhanden sind
    if (document.querySelectorAll('.theme-item').length === 0) {
        const firstDay = document.querySelector('.calendar-day:not(.empty)');
        if (firstDay) {
            const container = firstDay.querySelector('.theme-items-container');
            container.appendChild(placeholder);
        }
    }
}

// Modal zum Hinzufügen eines Themes öffnen
function openAddThemeModal(day, monthIndex) {
    // Prüfen, ob der Benutzer ein Admin ist
    if (window.auth && typeof window.auth.isAdmin === 'function' && !window.auth.isAdmin()) {
        alert('Nur Administratoren können neue Themen erstellen.');
        return;
    }
    
    console.log('Öffne Theme-Modal für Tag:', day, 'Monat:', monthIndex);
    
    const date = new Date(currentYear, monthIndex, day);
    const formattedDate = `${day}. ${months[monthIndex]} ${currentYear}`;
    
    const modal = document.getElementById('theme-modal');
    const modalTitle = document.getElementById('theme-modal-title');
    const modalForm = document.getElementById('theme-form');
    
    if (!modal) {
        console.error('Theme-Modal nicht gefunden!');
        return;
    }
    
    if (!modalTitle) {
        console.error('Modal-Titel nicht gefunden!');
        return;
    }
    
    if (!modalForm) {
        console.error('Theme-Formular nicht gefunden!');
        return;
    }
    
    modalTitle.textContent = `Thema hinzufügen für ${formattedDate}`;
    modalForm.reset(); // Formular zurücksetzen
    
    // Datum im Hidden-Field speichern
    const dateInput = document.getElementById('theme-date');
    if (dateInput) {
        dateInput.value = `${currentYear}-${(monthIndex + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    } else {
        console.error('Datums-Input nicht gefunden!');
    }
    
    // Theme-ID zurücksetzen (es ist ein neues Theme)
    const themeIdInput = document.getElementById('theme-id');
    if (themeIdInput) {
        themeIdInput.value = '';
    } else {
        console.error('Theme-ID-Input nicht gefunden!');
    }
    
    // Monat speichern
    const monthInput = document.getElementById('theme-month');
    if (monthInput) {
        monthInput.value = monthIndex;
    }
    
    // "Löschen"-Button ausblenden, da es ein neues Theme ist
    const deleteButton = document.getElementById('delete-theme-btn');
    if (deleteButton) {
        deleteButton.style.display = 'none';
    }
    
    // Teamleiter-Dropdown füllen
    populateTeamLeaderDropdown();
    
    modal.classList.add('active');
}

// Funktion zum Öffnen des Modal mit Themen-Details
function openEditThemeModal(theme, day, monthIndex) {
    const formattedDate = `${day}. ${months[monthIndex]} ${currentYear}`;
    
    const modal = document.getElementById('theme-modal');
    const modalTitle = document.getElementById('theme-modal-title');
    
    modalTitle.textContent = `Thema bearbeiten für ${formattedDate}`;
    
    // Formular mit Themendaten füllen
    document.getElementById('theme-title').value = theme.title;
    document.getElementById('theme-department').value = theme.department;
    document.getElementById('theme-team-leader').value = theme.teamLeader;
    
    // Datum im Hidden-Field speichern
    const dateInput = document.getElementById('theme-date');
    dateInput.value = `${currentYear}-${(monthIndex + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    
    // Monat speichern
    const monthInput = document.getElementById('theme-month');
    if (monthInput) {
        monthInput.value = monthIndex;
    }
    
    // "Löschen"-Button einblenden
    const deleteButton = document.getElementById('delete-theme-btn');
    if (deleteButton) {
        deleteButton.style.display = 'block';
    }
    
    // Teamleiter-Dropdown füllen
    populateTeamLeaderDropdown();
    
    // Modal öffnen
    modal.classList.add('active');
}

// Teamleiter-Dropdown füllen
function populateTeamLeaderDropdown() {
    const teamLeaderSelect = document.getElementById('theme-team-leader');
    if (!teamLeaderSelect) return;
    
    // Bestehende Optionen löschen
    teamLeaderSelect.innerHTML = '';
    
    // Standard-Teamleiter hinzufügen
    const teamLeaders = [
        'Teamleiter 1',
        'Teamleiter 2',
        'Teamleiter 3',
        'Teamleiter 4'
    ];
    
    teamLeaders.forEach(tl => {
        const option = document.createElement('option');
        option.value = tl;
        option.textContent = tl;
        teamLeaderSelect.appendChild(option);
    });
}

// Hilfsfunktion zum Bestimmen der Abteilungsfarbe
function getDepartmentColor(department) {
    const departmentColors = {
        'Garten': 'var(--dept-garten)',
        'Werkzeug': 'var(--dept-werkzeug)',
        'Sanitär': 'var(--dept-sanitaer)',
        'Baustoffe': 'var(--dept-baustoffe)',
        'Holz': 'var(--dept-holz)',
        'Farben': 'var(--dept-farben)',
        'Elektro': 'var(--dept-elektro)',
        'Dekoration': 'var(--dept-dekoration)'
    };
    
    return departmentColors[department] || 'var(--primary-color)';
}

// Event-Listener für Schließen der Modals
document.querySelectorAll('.close-modal').forEach(closeBtn => {
    closeBtn.addEventListener('click', function() {
        this.closest('.modal').classList.remove('active');
    });
});

// Klick außerhalb des Modals schließt es
window.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('active');
    }
});

// Event-Listener für Themenformular
document.getElementById('theme-form').addEventListener('submit', function(event) {
    event.preventDefault();
    
    // Formulardaten sammeln
    const themeData = {
        id: document.getElementById('theme-id').value || Math.random().toString(36).substr(2, 9),
        title: document.getElementById('theme-title').value,
        date: document.getElementById('theme-date').value,
        department: document.getElementById('theme-department').value,
        description: document.getElementById('theme-description').value || '',
        teamLeader: document.getElementById('theme-team-leader').value
    };
    
    // Hier später Firebase-Integration für das Speichern des Themas
    console.log('Thema gespeichert:', themeData);
    
    // Modal schließen
    document.getElementById('theme-modal').classList.remove('active');
    
    // Kalender aktualisieren
    renderCalendar();
});

// Event-Listener für Löschen-Button
document.getElementById('delete-theme-btn').addEventListener('click', function() {
    if (confirm('Sind Sie sicher, dass Sie dieses Thema löschen möchten?')) {
        // Hier später Firebase-Integration für das Löschen des Themas
        console.log('Thema gelöscht');
        
        // Modal schließen
        document.getElementById('theme-modal').classList.remove('active');
        
        // Kalender aktualisieren
        renderCalendar();
    }
}); 