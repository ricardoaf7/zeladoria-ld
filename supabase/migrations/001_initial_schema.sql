-- Create service_areas table
CREATE TABLE IF NOT EXISTS service_areas (
  id SERIAL PRIMARY KEY,
  ordem INTEGER,
  sequencia_cadastro INTEGER,
  tipo TEXT NOT NULL,
  endereco TEXT NOT NULL,
  bairro TEXT,
  metragem_m2 DOUBLE PRECISION,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  lote INTEGER,
  status TEXT NOT NULL DEFAULT 'Pendente',
  history JSONB NOT NULL DEFAULT '[]'::jsonb,
  polygon JSONB,
  scheduled_date TEXT,
  proxima_previsao TEXT,
  ultima_rocagem TEXT,
  ultima_manutencao TEXT,
  ultima_irrigacao TEXT,
  ultima_plantio TEXT,
  observacoes TEXT,
  manual_schedule BOOLEAN DEFAULT FALSE,
  days_to_complete INTEGER,
  servico TEXT,
  registrado_por TEXT,
  data_registro TIMESTAMP,
  foto_antes TEXT,
  foto_depois TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id SERIAL PRIMARY KEY,
  service TEXT NOT NULL,
  type TEXT NOT NULL,
  lote INTEGER,
  status TEXT NOT NULL DEFAULT 'Idle',
  current_area_id INTEGER,
  location JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create app_config table
CREATE TABLE IF NOT EXISTS app_config (
  id SERIAL PRIMARY KEY,
  mowing_production_rate JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create export_history table
CREATE TABLE IF NOT EXISTS export_history (
  id SERIAL PRIMARY KEY,
  scope TEXT NOT NULL,
  export_type TEXT NOT NULL,
  record_count INTEGER NOT NULL,
  duration_ms INTEGER,
  exported_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_service_areas_servico ON service_areas(servico);
CREATE INDEX IF NOT EXISTS idx_service_areas_status ON service_areas(status);
CREATE INDEX IF NOT EXISTS idx_service_areas_lote ON service_areas(lote);
CREATE INDEX IF NOT EXISTS idx_service_areas_bairro ON service_areas(bairro);
CREATE INDEX IF NOT EXISTS idx_teams_service ON teams(service);
CREATE INDEX IF NOT EXISTS idx_teams_status ON teams(status);

-- Enable Row Level Security (RLS)
ALTER TABLE service_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_history ENABLE ROW LEVEL SECURITY;

-- Create policies for service_areas
CREATE POLICY "service_areas_read_policy" ON service_areas
  FOR SELECT USING (true);

CREATE POLICY "service_areas_insert_policy" ON service_areas
  FOR INSERT WITH CHECK (true);

CREATE POLICY "service_areas_update_policy" ON service_areas
  FOR UPDATE USING (true);

CREATE POLICY "service_areas_delete_policy" ON service_areas
  FOR DELETE USING (true);

-- Create policies for teams
CREATE POLICY "teams_read_policy" ON teams
  FOR SELECT USING (true);

CREATE POLICY "teams_insert_policy" ON teams
  FOR INSERT WITH CHECK (true);

CREATE POLICY "teams_update_policy" ON teams
  FOR UPDATE USING (true);

CREATE POLICY "teams_delete_policy" ON teams
  FOR DELETE USING (true);

-- Create policies for app_config
CREATE POLICY "app_config_read_policy" ON app_config
  FOR SELECT USING (true);

CREATE POLICY "app_config_update_policy" ON app_config
  FOR UPDATE USING (true);

-- Create policies for export_history
CREATE POLICY "export_history_read_policy" ON export_history
  FOR SELECT USING (true);

CREATE POLICY "export_history_insert_policy" ON export_history
  FOR INSERT WITH CHECK (true);

-- Grant permissions to anon and authenticated roles
GRANT SELECT ON service_areas TO anon, authenticated;
GRANT INSERT ON service_areas TO anon, authenticated;
GRANT UPDATE ON service_areas TO anon, authenticated;
GRANT DELETE ON service_areas TO anon, authenticated;

GRANT SELECT ON teams TO anon, authenticated;
GRANT INSERT ON teams TO anon, authenticated;
GRANT UPDATE ON teams TO anon, authenticated;
GRANT DELETE ON teams TO anon, authenticated;

GRANT SELECT ON app_config TO anon, authenticated;
GRANT UPDATE ON app_config TO anon, authenticated;

GRANT SELECT ON export_history TO anon, authenticated;
GRANT INSERT ON export_history TO anon, authenticated;

GRANT USAGE ON SEQUENCE service_areas_id_seq TO anon, authenticated;
GRANT USAGE ON SEQUENCE teams_id_seq TO anon, authenticated;
GRANT USAGE ON SEQUENCE app_config_id_seq TO anon, authenticated;
GRANT USAGE ON SEQUENCE export_history_id_seq TO anon, authenticated;

-- Insert default configuration
INSERT INTO app_config (mowing_production_rate) VALUES 
('{"lote1": 25000, "lote2": 20000}'::jsonb)
ON CONFLICT DO NOTHING;

-- Insert sample teams
INSERT INTO teams (service, type, lote, status, current_area_id, location) VALUES 
('rocagem', 'Giro Zero', 1, 'Working', 5, '{"lat": -23.3099, "lng": -51.1603}'::jsonb),
('rocagem', 'Acabamento', 1, 'Idle', NULL, '{"lat": -23.30, "lng": -51.15}'::jsonb),
('rocagem', 'Coleta', 1, 'Idle', NULL, '{"lat": -23.30, "lng": -51.15}'::jsonb),
('rocagem', 'Capina', 1, 'Idle', NULL, '{"lat": -23.30, "lng": -51.15}'::jsonb),
('rocagem', 'Giro Zero', 2, 'Working', 106, '{"lat": -23.2989, "lng": -51.1823}'::jsonb),
('rocagem', 'Acabamento', 2, 'Idle', NULL, '{"lat": -23.31, "lng": -51.16}'::jsonb),
('jardins', 'Manutenção', NULL, 'Idle', NULL, '{"lat": -23.32, "lng": -51.17}'::jsonb),
('jardins', 'Irrigação', NULL, 'Idle', NULL, '{"lat": -23.32, "lng": -51.17}'::jsonb)
ON CONFLICT DO NOTHING;