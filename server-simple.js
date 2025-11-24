import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Carregar variáveis de ambiente manualmente se não estiverem disponíveis
if (!process.env.SUPABASE_URL) {
  try {
    const envPath = join(process.cwd(), '.env');
    const envContent = readFileSync(envPath, 'utf-8');
    const envVars = {};
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        envVars[key.trim()] = value.trim();
      }
    });
    
    // Aplicar as variáveis ao process.env
    Object.keys(envVars).forEach(key => {
      if (!process.env[key]) {
        process.env[key] = envVars[key];
      }
    });
    
    console.log('✅ Variáveis de ambiente carregadas manualmente do .env');
  } catch (error) {
    console.log('⚠️  Não foi possível carregar variáveis do .env:', error.message);
  }
}

const app = express();

// Configurar Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;
if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
  console.log('✅ Supabase conectado com sucesso!');
} else {
  console.log('⚠️  Variáveis de ambiente do Supabase não configuradas');
}

// Middleware CORS - importante para o frontend funcionar
app.use(cors({
  origin: ['https://zeladoria-ld.vercel.app', 'http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Middleware de log para debug
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Origin: ${req.headers.origin || 'no-origin'}`);
  next();
});

// Middleware básico
app.use(express.json());

// ===== ROTAS SIMPLIFICADAS PARA VERCEL =====

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'alive', timestamp: new Date().toISOString() });
});

// Configuração básica
app.get('/api/config', (req, res) => {
  res.json({
    productionRate: {
      lote1: 25000,
      lote2: 20000
    },
    timestamp: new Date().toISOString()
  });
});

// Função auxiliar para buscar todos os registros com paginação
async function fetchAllRecords(servico) {
  const allRecords = [];
  const pageSize = 1000; // Limite máximo por página
  let page = 0;
  let hasMore = true;
  
  console.log(`📄 Iniciando busca paginada para ${servico}...`);
  
  while (hasMore) {
    let query = supabase.from('service_areas').select('*');
    
    if (servico === 'rocagem') {
      query = query.eq('servico', 'rocagem');
    } else if (servico === 'jardins') {
      query = query.eq('servico', 'jardins');
    } else {
      query = query.in('servico', ['rocagem', 'capina']);
    }
    
    // Adicionar paginação
    const { data, error } = await query
      .order('id', { ascending: true })
      .range(page * pageSize, (page + 1) * pageSize - 1);
    
    if (error) {
      console.error(`❌ Erro na página ${page}:`, error);
      throw error;
    }
    
    if (data && data.length > 0) {
      allRecords.push(...data);
      console.log(`📄 Página ${page + 1}: ${data.length} registros`);
      
      // Se recebeu menos que o pageSize, é a última página
      if (data.length < pageSize) {
        hasMore = false;
      } else {
        page++;
      }
    } else {
      hasMore = false;
    }
  }
  
  console.log(`✅ Busca paginada concluída: ${allRecords.length} registros totais`);
  return allRecords;
}

// Áreas de rocagem - buscar todos os dados reais do Supabase com paginação
app.get('/api/areas/light', async (req, res) => {
  const { servico } = req.query;
  
  if (!supabase) {
    console.log('❌ Supabase não conectado, retornando dados mockados');
    return res.json([]);
  }
  
  try {
    console.log(`🔍 Buscando áreas de ${servico} no Supabase...`);
    
    // Buscar todos os registros com paginação
    const data = await fetchAllRecords(servico || 'rocagem');
    
    console.log(`✅ Encontrados ${data.length} registros de ${servico}`);
    
    // Transformar os dados para o formato esperado pelo frontend
    const areas = data.map(area => ({
      id: area.id,
      ordem: area.ordem || area.id,
      tipo: area.tipo || 'area publica',
      endereco: area.endereco || area.address || 'Endereço não informado',
      bairro: area.bairro || area.neighborhood || 'Bairro não informado',
      metragem_m2: area.metragem_m2 || area.metragem || 0,
      lat: area.lat || -23.3044, // Coordenada padrão de Londrina
      lng: area.lng || -51.1694,
      lote: area.lote || 1,
      status: area.status || 'Pendente',
      history: area.history || [],
      polygon: area.polygon || null,
      scheduledDate: area.scheduled_date || null,
      proximaPrevisao: area.proxima_previsao || null,
      ultimaRocagem: area.ultima_rocagem || null,
      manualSchedule: area.manual_schedule || false,
      daysToComplete: area.days_to_complete || null,
      servico: area.servico || 'rocagem',
      registradoPor: area.registrado_por || null,
      dataRegistro: area.data_registro || null
    }));
    
    res.json(areas);
    
  } catch (error) {
    console.error('❌ Erro catastrófico ao buscar dados:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// Busca de áreas - buscar dados reais do Supabase com paginação
app.get('/api/areas/search', async (req, res) => {
  const { q, servico } = req.query;
  
  if (!q || !servico) {
    return res.json([]);
  }
  
  if (!supabase) {
    console.log('❌ Supabase não conectado, retornando busca vazia');
    return res.json([]);
  }
  
  try {
    console.log(`🔍 Buscando áreas de ${servico} com termo: ${q}`);
    
    // Buscar todos os registros com paginação
    const data = await fetchAllRecords(servico || 'rocagem');
    
    // Filtrar por termo de busca
    const searchTerm = q.toLowerCase();
    const filteredAreas = data.filter(area => {
      const endereco = (area.endereco || area.address || '').toLowerCase();
      const bairro = (area.bairro || area.neighborhood || '').toLowerCase();
      return endereco.includes(searchTerm) || bairro.includes(searchTerm);
    });
    
    console.log(`✅ Encontrados ${filteredAreas.length} resultados para "${q}"`);
    
    // Transformar os dados para o formato esperado pelo frontend
    const areas = filteredAreas.map(area => ({
      id: area.id,
      ordem: area.ordem || area.id,
      tipo: area.tipo || 'area publica',
      endereco: area.endereco || area.address || 'Endereço não informado',
      bairro: area.bairro || area.neighborhood || 'Bairro não informado',
      metragem_m2: area.metragem_m2 || area.metragem || 0,
      lat: area.lat || -23.3044,
      lng: area.lng || -51.1694,
      lote: area.lote || 1,
      status: area.status || 'Pendente',
      history: area.history || [],
      polygon: area.polygon || null,
      scheduledDate: area.scheduled_date || null,
      proximaPrevisao: area.proxima_previsao || null,
      ultimaRocagem: area.ultima_rocagem || null,
      manualSchedule: area.manual_schedule || false,
      daysToComplete: area.days_to_complete || null,
      servico: area.servico || 'rocagem',
      registradoPor: area.registrado_por || null,
      dataRegistro: area.data_registro || null
    }));
    
    res.json(areas);
    
  } catch (error) {
    console.error('❌ Erro catastrófico ao buscar dados:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// Debug de ambiente
app.get('/api/debug/simple', async (req, res) => {
  const debug = {
    nodeEnv: process.env.NODE_ENV || 'undefined',
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    hasViteSupabaseUrl: !!process.env.VITE_SUPABASE_URL,
    hasViteAnonKey: !!process.env.VITE_SUPABASE_ANON_KEY,
    supabaseConnected: !!supabase,
    port: process.env.PORT || 'undefined',
    pwd: process.cwd(),
    nodeVersion: process.version,
    timestamp: new Date().toISOString(),
    supabaseUrlSample: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.substring(0, 30) + '...' : null,
    serviceRoleKeySample: process.env.SUPABASE_SERVICE_ROLE_KEY ? process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 10) + '...' : null
  };
  
  // Se conectado, buscar contagem de registros
  if (supabase) {
    try {
      const { count: rocagemCount } = await supabase
        .from('service_areas')
        .select('*', { count: 'exact', head: true })
        .eq('servico', 'rocagem');
        
      const { count: capinaCount } = await supabase
        .from('service_areas')
        .select('*', { count: 'exact', head: true })
        .eq('servico', 'capina');
        
      const { count: jardinsCount } = await supabase
        .from('service_areas')
        .select('*', { count: 'exact', head: true })
        .eq('servico', 'jardins');
      
      debug.databaseStats = {
        rocagem: rocagemCount || 0,
        capina: capinaCount || 0,
        jardins: jardinsCount || 0,
        total: (rocagemCount || 0) + (capinaCount || 0) + (jardinsCount || 0)
      };
    } catch (error) {
      debug.databaseError = error.message;
    }
  }
  
  res.json(debug);
});

// Debug de variáveis de ambiente
app.get('/api/debug/env', (req, res) => {
  const testVar = req.query.var || 'SUPABASE_URL';
  const value = process.env[testVar];
  
  res.json({
    variable: testVar,
    exists: !!value,
    length: value?.length || 0,
    sample: value ? value.substring(0, 20) + '...' : null,
    timestamp: new Date().toISOString()
  });
});

// Debug do Supabase
app.get('/api/debug/supabase', (req, res) => {
  const debug = {
    supabaseUrl: process.env.SUPABASE_URL,
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    hasViteSupabaseUrl: !!process.env.VITE_SUPABASE_URL,
    hasViteAnonKey: !!process.env.VITE_SUPABASE_ANON_KEY,
    timestamp: new Date().toISOString()
  };
  
  res.json(debug);
});

// Rota catch-all para evitar erros 404
app.get('*', (req, res) => {
  res.status(404).json({ error: 'Rota não encontrada', path: req.path });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Erro:', err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`🚀 Servidor simplificado rodando na porta ${port}`);
});

export default app;