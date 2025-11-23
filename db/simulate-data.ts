import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { serviceAreas } from "./schema";
import { eq } from "drizzle-orm";

neonConfig.webSocketConstructor = ws;

async function simulateData() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    throw new Error("DATABASE_URL não está definida");
  }

  const pool = new Pool({ connectionString });
  const db = drizzle(pool);

  console.log("🎭 Simulando dados de roçagem para visualização...");

  // Buscar todas as áreas de roçagem
  const areas = await db.select().from(serviceAreas).where(eq(serviceAreas.servico, 'rocagem'));
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const totalAreas = areas.length;
  const areasPerScale = Math.floor(totalAreas / 6); // 6 categorias

  console.log(`📊 Total de áreas: ${totalAreas}`);
  console.log(`📦 Áreas por escala: ~${areasPerScale}`);
  console.log("⏳ Atualizando dados em lote...");

  // Processar em batches para performance
  const batchSize = 100;
  for (let start = 0; start < areas.length; start += batchSize) {
    const batch = areas.slice(start, start + batchSize);
    
    await Promise.all(batch.map(async (area, idx) => {
      const i = start + idx;
      let history = [];
      let status = "Concluído";
      
      // Distribuir áreas nas diferentes escalas
      if (i < areasPerScale) {
        // 0-5 dias (recém roçado) - Verde muito claro
        const daysAgo = Math.floor(Math.random() * 6); // 0-5
        const date = new Date(today);
        date.setDate(date.getDate() - daysAgo);
        history = [{ date: date.toISOString(), status: "Concluído", observation: "Roçagem concluída" }];
      } else if (i < areasPerScale * 2) {
        // 5-15 dias - Verde claro  
        const daysAgo = 5 + Math.floor(Math.random() * 11); // 5-15
        const date = new Date(today);
        date.setDate(date.getDate() - daysAgo);
        history = [{ date: date.toISOString(), status: "Concluído", observation: "Roçagem concluída" }];
      } else if (i < areasPerScale * 3) {
        // 15-25 dias - Verde médio
        const daysAgo = 15 + Math.floor(Math.random() * 11); // 15-25
        const date = new Date(today);
        date.setDate(date.getDate() - daysAgo);
        history = [{ date: date.toISOString(), status: "Concluído", observation: "Roçagem concluída" }];
      } else if (i < areasPerScale * 4) {
        // 25-35 dias - Verde mais forte
        const daysAgo = 25 + Math.floor(Math.random() * 11); // 25-35
        const date = new Date(today);
        date.setDate(date.getDate() - daysAgo);
        history = [{ date: date.toISOString(), status: "Concluído", observation: "Roçagem concluída" }];
      } else if (i < areasPerScale * 5) {
        // 35-44 dias - Verde forte (próximo da execução)
        const daysAgo = 35 + Math.floor(Math.random() * 10); // 35-44
        const date = new Date(today);
        date.setDate(date.getDate() - daysAgo);
        history = [{ date: date.toISOString(), status: "Concluído", observation: "Roçagem concluída" }];
      } else {
        // >45 dias - Atrasado (amarelo)
        const daysAgo = 45 + Math.floor(Math.random() * 15); // 45-60
        const date = new Date(today);
        date.setDate(date.getDate() - daysAgo);
        history = [{ date: date.toISOString(), status: "Concluído", observation: "Roçagem concluída" }];
      }

      // Algumas áreas em execução
      if (i % 50 === 0) {
        status = "Em Execução";
        history = [{ date: today.toISOString(), status: "Iniciado", observation: "Equipe em campo" }];
      }

      await db.update(serviceAreas)
        .set({ history, status })
        .where(eq(serviceAreas.id, area.id));
    }));
    
    console.log(`   Processado: ${Math.min(start + batchSize, totalAreas)} / ${totalAreas}`);
  }

  console.log("✅ Dados simulados com sucesso!");
  console.log("📈 Distribuição:");
  console.log(`   0-5 dias (verde muito claro): ~${areasPerScale} áreas`);
  console.log(`   5-15 dias (verde claro): ~${areasPerScale} áreas`);
  console.log(`   15-25 dias (verde médio): ~${areasPerScale} áreas`);
  console.log(`   25-35 dias (verde forte): ~${areasPerScale} áreas`);
  console.log(`   35-44 dias (verde muito forte): ~${areasPerScale} áreas`);
  console.log(`   >45 dias (amarelo - atrasado): ~${totalAreas - areasPerScale * 5} áreas`);
  
  await pool.end();
}

simulateData().catch(console.error);
