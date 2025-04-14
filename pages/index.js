import { useEffect } from 'react';
import Head from 'next/head';
import Script from 'next/script';

export default function Home() {
  useEffect(() => {
    // Hier wird der Hauptcode der Anwendung initialisiert
    if (typeof window !== 'undefined') {
      // Client-seitige Initialisierung, wenn die Seite geladen ist
      document.addEventListener('DOMContentLoaded', function() {
        if (window.initUI && typeof window.initUI === 'function') {
          window.initUI();
        }
      });
    }
  }, []);

  return (
    <>
      <Head>
        <title>Baumarkt-Kalender</title>
        <meta name="description" content="Ein Kalender-Tool für Baumarkt-Filialen" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css" />
        <link rel="stylesheet" href="/css/style.css" />
      </Head>

      <div id="app-container">
        <header className="header">
            <div className="header-left">
                <h1>Baumarkt Saisonplaner <span id="header-branch-id"></span></h1>
                <div className="filter-controls">
                    <div className="filter-toggle">
                        <input type="checkbox" id="branch-filter" checked />
                        <label htmlFor="branch-filter">Nur meine NL</label>
                    </div>
                    <div className="dropdown-filter">
                        <button className="btn filter-btn" id="depts-filter-btn">
                            <i className="fas fa-tags"></i> Abteilungen
                            <i className="fas fa-chevron-down"></i>
                        </button>
                        <div className="dropdown-content" id="depts-dropdown">
                            <div className="filter-items">
                                <div className="filter-item">
                                    <input type="checkbox" id="filter-garten" checked />
                                    <label htmlFor="filter-garten" style={{ backgroundColor: 'var(--dept-garten)' }}>Garten</label>
                                </div>
                                <div className="filter-item">
                                    <input type="checkbox" id="filter-werkzeug" checked />
                                    <label htmlFor="filter-werkzeug" style={{ backgroundColor: 'var(--dept-werkzeug)' }}>Werkzeug</label>
                                </div>
                                {/* Weitere Abteilungen */}
                            </div>
                        </div>
                    </div>
                    <div className="dropdown-filter">
                        <button className="btn filter-btn" id="tl-filter-btn">
                            <i className="fas fa-users"></i> Teamleiter
                            <i className="fas fa-chevron-down"></i>
                        </button>
                        <div className="dropdown-content" id="tl-dropdown">
                            <div className="filter-items" id="teamleader-filters">
                                {/* Teamleiter werden dynamisch befüllt */}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="header-right">
                <button id="tl-settings-btn" className="btn settings-btn">
                    <i className="fas fa-cog"></i> TL-Einstellungen
                </button>
                <button id="logout-btn" className="btn">
                    <i className="fas fa-sign-out-alt"></i> Abmelden
                </button>
            </div>
        </header>

        <div className="container">
            {/* Rollen-Banner */}
            <div id="role-banner" className="role-banner">
                <div id="admin-banner" className="admin-role" style={{ display: 'none' }}>
                    <i className="fas fa-crown"></i> 
                    <span>Administrator-Modus: Sie können Themen erstellen und verwalten</span>
                </div>
                <div id="user-banner" className="user-role" style={{ display: 'none' }}>
                    <i className="fas fa-user"></i>
                    <span>Benutzer-Modus: Sie können Bilder zu bestehenden Themen hochladen</span>
                </div>
            </div>

            {/* Kalender */}
            <div className="calendar-section">
                <div className="calendar-navigation">
                    <button id="prev-month" className="btn nav-btn"><i className="fas fa-chevron-left"></i></button>
                    <span id="month-year">Januar 2023</span>
                    <button id="current-month" className="btn nav-btn current-btn">Aktuell</button>
                    <button id="next-month" className="btn nav-btn"><i className="fas fa-chevron-right"></i></button>
                </div>
                
                <div id="calendar-container">
                    {/* Kalender wird dynamisch über JavaScript geladen */}
                    <div className="calendar-loading">
                        <div className="spinner"></div>
                        <p>Kalender wird geladen...</p>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Login-Container */}
      <div id="login-container" style={{ display: 'none' }}>
        <div className="login-box">
            <h1>Baumarkt Saisonplaner</h1>
            <form id="login-form">
                <div className="form-group">
                    <label htmlFor="branch-id">Niederlassungsnummer:</label>
                    <input type="text" id="branch-id" placeholder="z.B. 123" required />
                </div>
                <button type="submit" className="btn login-btn">
                    <i className="fas fa-sign-in-alt"></i> Anmelden
                </button>
            </form>
        </div>
      </div>

      {/* Modals und andere UI-Elemente werden hier eingefügt */}

      {/* Client-seitige Skripte */}
      <Script src="/js/auth-service.js" strategy="beforeInteractive" />
      <Script src="/js/db-service.js" strategy="beforeInteractive" />
      <Script src="/js/storage-service.js" strategy="beforeInteractive" />
      <Script src="/js/ui.js" strategy="beforeInteractive" />
      <Script src="/js/calendar.js" strategy="beforeInteractive" />
      <Script src="/js/main.js" strategy="beforeInteractive" />
    </>
  );
} 