import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import '../public/css/style.css';

function MyApp({ Component, pageProps }) {
  const [supabaseSession, setSupabaseSession] = useState(null);

  useEffect(() => {
    // Benutzer-Session beim Laden der App prüfen
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSupabaseSession(session);
    });

    // Auf Änderungen der Authentifizierung hören
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSupabaseSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <Component {...pageProps} supabaseSession={supabaseSession} />
  );
}

export default MyApp; 