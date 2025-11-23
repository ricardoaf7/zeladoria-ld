import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

async function setup() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    throw new Error("DATABASE_URL não está definida");
  }

  const pool = new Pool({ connectionString });

  console.log("🔧 Criando tabelas no Supabase...");

  try {
    // Criar tabela de áreas de serviço
    await pool.query(`
      CREATE TABLE IF NOT EXISTS service_areas (
        id SERIAL PRIMARY KEY,
        ordem INTEGER,
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
        manual_schedule BOOLEAN DEFAULT false,
        days_to_complete INTEGER,
        servico TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("✅ Tabela service_areas criada");

    // Criar tabela de equipes
    await pool.query(`
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
    `);
    console.log("✅ Tabela teams criada");

    // Criar tabela de configuração
    await pool.query(`
      CREATE TABLE IF NOT EXISTS app_config (
        id SERIAL PRIMARY KEY,
        mowing_production_rate JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("✅ Tabela app_config criada");

    await pool.end();
    console.log("✨ Setup concluído com sucesso!");
  } catch (error) {
    console.error("❌ Erro durante setup:", error);
    await pool.end();
    throw error;
  }
}

setup().catch((error) => {
  console.error("❌ Erro:", error);
  process.exit(1);
});
