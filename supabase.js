import { createClient } from '@supabase/supabase-js';

// Supabase Konfiguration
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

// Supabase-Client erstellen
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Hilfsfunktionen für Authentifizierung
export const auth = {
  signUp: async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },
  
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },
  
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },
  
  getCurrentUser: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data?.user;
  },
  
  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange(callback);
  }
};

// Hilfsfunktionen für Datenbank
export const database = {
  // Departments
  getDepartments: async () => {
    const { data, error } = await supabase
      .from('departments')
      .select('*');
    if (error) throw error;
    return data;
  },
  
  // Teamleiter
  getTeamLeaders: async () => {
    const { data, error } = await supabase
      .from('team_leaders')
      .select('*');
    if (error) throw error;
    return data;
  },
  
  // Themen
  getThemes: async (filters = {}) => {
    let query = supabase.from('themes').select('*');
    
    if (filters.department) {
      query = query.eq('department_id', filters.department);
    }
    
    if (filters.teamLeader) {
      query = query.eq('team_leader_id', filters.teamLeader);
    }
    
    if (filters.branchId) {
      query = query.eq('branch_id', filters.branchId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },
  
  getThemeById: async (id) => {
    const { data, error } = await supabase
      .from('themes')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },
  
  createTheme: async (theme) => {
    const { data, error } = await supabase
      .from('themes')
      .insert([theme])
      .select();
    if (error) throw error;
    return data[0];
  },
  
  updateTheme: async (id, updates) => {
    const { data, error } = await supabase
      .from('themes')
      .update(updates)
      .eq('id', id)
      .select();
    if (error) throw error;
    return data[0];
  },
  
  deleteTheme: async (id) => {
    const { error } = await supabase
      .from('themes')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};

// Hilfsfunktionen für Storage
export const storage = {
  uploadFile: async (bucket, path, file) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file);
    if (error) throw error;
    return data;
  },
  
  getPublicUrl: (bucket, path) => {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    return data.publicUrl;
  },
  
  deleteFile: async (bucket, path) => {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);
    if (error) throw error;
  }
}; 