-- Supabase-Schema für den Baumarkt-Kalender

-- Tabelle für Abteilungen
CREATE TABLE departments (
  id VARCHAR PRIMARY KEY,
  name VARCHAR NOT NULL,
  color VARCHAR NOT NULL
);

-- Tabelle für Filialen
CREATE TABLE branches (
  id VARCHAR PRIMARY KEY,
  name VARCHAR
);

-- Tabelle für Teamleiter
CREATE TABLE team_leaders (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  assigned_departments JSONB NOT NULL,
  branch_id VARCHAR REFERENCES branches(id) ON DELETE CASCADE
);

-- Tabelle für Themen
CREATE TABLE themes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR NOT NULL,
  date DATE NOT NULL,
  department_id VARCHAR REFERENCES departments(id) ON DELETE CASCADE,
  team_leader_id INTEGER REFERENCES team_leaders(id) ON DELETE SET NULL,
  description TEXT,
  branch_id VARCHAR REFERENCES branches(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabelle für Themen-Bilder
CREATE TABLE theme_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  theme_id UUID REFERENCES themes(id) ON DELETE CASCADE,
  url VARCHAR NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Row-Level-Security-Policies

-- Abteilungen können von allen gelesen, aber nur von Admins verändert werden
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Jeder kann Abteilungen lesen"
  ON departments FOR SELECT
  USING (true);

CREATE POLICY "Nur Admins können Abteilungen erstellen"
  ON departments FOR INSERT
  USING (auth.jwt() ->> 'user_metadata'::text = 'is_admin');

CREATE POLICY "Nur Admins können Abteilungen aktualisieren"
  ON departments FOR UPDATE
  USING (auth.jwt() ->> 'user_metadata'::text = 'is_admin');

CREATE POLICY "Nur Admins können Abteilungen löschen"
  ON departments FOR DELETE
  USING (auth.jwt() ->> 'user_metadata'::text = 'is_admin');

-- Filialen können von allen gelesen, aber nur von Admins verändert werden
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Jeder kann Filialen lesen"
  ON branches FOR SELECT
  USING (true);

CREATE POLICY "Nur Admins können Filialen erstellen"
  ON branches FOR INSERT
  USING (auth.jwt() ->> 'user_metadata'::text = 'is_admin');

CREATE POLICY "Nur Admins können Filialen aktualisieren"
  ON branches FOR UPDATE
  USING (auth.jwt() ->> 'user_metadata'::text = 'is_admin');

CREATE POLICY "Nur Admins können Filialen löschen"
  ON branches FOR DELETE
  USING (auth.jwt() ->> 'user_metadata'::text = 'is_admin');

-- Teamleiter können von allen gelesen werden,
-- aber nur von Admins und Benutzern der eigenen Filiale verändert werden
ALTER TABLE team_leaders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Jeder kann Teamleiter lesen"
  ON team_leaders FOR SELECT
  USING (true);

CREATE POLICY "Nur Admins können Teamleiter erstellen"
  ON team_leaders FOR INSERT
  USING (auth.jwt() ->> 'user_metadata'::text = 'is_admin');

CREATE POLICY "Nur Admins und Benutzer der eigenen Filiale können Teamleiter aktualisieren"
  ON team_leaders FOR UPDATE
  USING (
    (auth.jwt() ->> 'user_metadata'::text = 'is_admin') 
    OR 
    (branch_id = auth.jwt() ->> 'user_metadata'::text->>'branch_id')
  );

CREATE POLICY "Nur Admins können Teamleiter löschen"
  ON team_leaders FOR DELETE
  USING (auth.jwt() ->> 'user_metadata'::text = 'is_admin');

-- Themen können von allen gelesen werden, 
-- aber nur von Admins und Benutzern der eigenen Filiale verändert werden
ALTER TABLE themes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Jeder kann Themen lesen"
  ON themes FOR SELECT
  USING (true);

CREATE POLICY "Admins und Benutzer der eigenen Filiale können Themen erstellen"
  ON themes FOR INSERT
  USING (
    (auth.jwt() ->> 'user_metadata'::text = 'is_admin') 
    OR 
    (branch_id = auth.jwt() ->> 'user_metadata'::text->>'branch_id')
  );

CREATE POLICY "Admins und Benutzer der eigenen Filiale können Themen aktualisieren"
  ON themes FOR UPDATE
  USING (
    (auth.jwt() ->> 'user_metadata'::text = 'is_admin') 
    OR 
    (branch_id = auth.jwt() ->> 'user_metadata'::text->>'branch_id')
  );

CREATE POLICY "Admins und Benutzer der eigenen Filiale können Themen löschen"
  ON themes FOR DELETE
  USING (
    (auth.jwt() ->> 'user_metadata'::text = 'is_admin') 
    OR 
    (branch_id = auth.jwt() ->> 'user_metadata'::text->>'branch_id')
  );

-- Bilder können von allen gelesen, 
-- aber nur von Admins und Benutzern der eigenen Filiale verändert werden
ALTER TABLE theme_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Jeder kann Bilder lesen"
  ON theme_images FOR SELECT
  USING (true);

CREATE POLICY "Benutzer können Bilder zu Themen ihrer Filiale hochladen"
  ON theme_images FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM themes 
      WHERE themes.id = theme_id 
      AND (
        (auth.jwt() ->> 'user_metadata'::text = 'is_admin') 
        OR 
        (themes.branch_id = auth.jwt() ->> 'user_metadata'::text->>'branch_id')
      )
    )
  );

CREATE POLICY "Benutzer können nur eigene Bilder löschen"
  ON theme_images FOR DELETE
  USING (
    uploaded_by = auth.uid() 
    OR 
    (auth.jwt() ->> 'user_metadata'::text = 'is_admin')
    OR
    EXISTS (
      SELECT 1 FROM themes 
      WHERE themes.id = theme_id 
      AND themes.branch_id = auth.jwt() ->> 'user_metadata'::text->>'branch_id'
    )
  ); 