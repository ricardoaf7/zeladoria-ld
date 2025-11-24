import type { ServiceArea, Team, AppConfig, ExportHistory, InsertExportHistory } from "@shared/schema";
import { supabaseAdmin } from "./supabase-admin";
import type { IStorage } from "./storage";

/**
 * Supabase Storage Implementation
 * Replaces DbStorage with direct Supabase client calls
 */
export class SupabaseStorage implements IStorage {
  
  async getAllAreas(serviceType: string): Promise<ServiceArea[]> {
    const { data, error } = await supabaseAdmin
      .from('service_areas')
      .select('*')
      .eq('servico', serviceType)
      .order('ordem', { ascending: true });
    
    if (error) {
      console.error('Error fetching areas:', error);
      return [];
    }
    
    return (data || []).map(this.mapSupabaseAreaToServiceArea);
  }
  
  async getAreaById(id: number): Promise<ServiceArea | undefined> {
    const { data, error } = await supabaseAdmin
      .from('service_areas')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) {
      console.error('Error fetching area by id:', error);
      return undefined;
    }
    
    return this.mapSupabaseAreaToServiceArea(data);
  }
  
  async createArea(data: Omit<ServiceArea, 'id'>): Promise<ServiceArea> {
    const insertData = {
      ordem: data.ordem ?? null,
      sequencia_cadastro: data.sequenciaCadastro ?? null,
      tipo: data.tipo,
      endereco: data.endereco,
      bairro: data.bairro ?? null,
      metragem_m2: data.metragem_m2 ?? null,
      lat: data.lat,
      lng: data.lng,
      lote: data.lote ?? null,
      status: data.status,
      history: data.history ?? [],
      polygon: data.polygon,
      scheduled_date: data.scheduledDate,
      proxima_previsao: data.proximaPrevisao,
      ultima_rocagem: data.ultimaRocagem,
      ultima_manutencao: data.ultimaManutencao,
      ultima_irrigacao: data.ultimaIrrigacao,
      ultima_plantio: data.ultimaPlantio,
      observacoes: data.observacoes,
      manual_schedule: data.manualSchedule ?? false,
      days_to_complete: data.daysToComplete,
      servico: data.servico,
      registrado_por: data.registradoPor,
      data_registro: data.dataRegistro,
      foto_antes: data.fotoAntes,
      foto_depois: data.fotoDepois,
    };
    
    const { data: result, error } = await supabaseAdmin
      .from('service_areas')
      .insert(insertData)
      .select()
      .single();
    
    if (error || !result) {
      throw new Error(`Failed to create area: ${error?.message}`);
    }
    
    return this.mapSupabaseAreaToServiceArea(result);
  }
  
  async searchAreas(query: string, serviceType: string, limit: number = 50): Promise<ServiceArea[]> {
    const searchLower = query.toLowerCase();
    
    const { data, error } = await supabaseAdmin
      .from('service_areas')
      .select('*')
      .eq('servico', serviceType)
      .or(`endereco.ilike.%${searchLower}%,bairro.ilike.%${searchLower}%`)
      .limit(limit)
      .order('ordem', { ascending: true });
    
    if (error) {
      console.error('Error searching areas:', error);
      return [];
    }
    
    return (data || []).map(this.mapSupabaseAreaToServiceArea);
  }
  
  async updateAreaStatus(id: number, status: string): Promise<ServiceArea | undefined> {
    const area = await this.getAreaById(id);
    if (!area) return undefined;
    
    const newHistory = [...area.history, {
      date: new Date().toISOString(),
      status: status,
    }];
    
    const { data, error } = await supabaseAdmin
      .from('service_areas')
      .update({
        status,
        history: newHistory,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error || !data) {
      console.error('Error updating area status:', error);
      return undefined;
    }
    
    return this.mapSupabaseAreaToServiceArea(data);
  }
  
  async updateAreaSchedule(id: number, scheduledDate: string): Promise<ServiceArea | undefined> {
    const { data, error } = await supabaseAdmin
      .from('service_areas')
      .update({
        scheduled_date: scheduledDate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error || !data) {
      console.error('Error updating area schedule:', error);
      return undefined;
    }
    
    return this.mapSupabaseAreaToServiceArea(data);
  }
  
  async updateAreaPolygon(id: number, polygon: Array<{ lat: number; lng: number }>): Promise<ServiceArea | undefined> {
    const { data, error } = await supabaseAdmin
      .from('service_areas')
      .update({
        polygon,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error || !data) {
      console.error('Error updating area polygon:', error);
      return undefined;
    }
    
    return this.mapSupabaseAreaToServiceArea(data);
  }
  
  async updateAreaPosition(id: number, lat: number, lng: number): Promise<ServiceArea | undefined> {
    const { data, error } = await supabaseAdmin
      .from('service_areas')
      .update({
        lat,
        lng,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error || !data) {
      console.error('Error updating area position:', error);
      return undefined;
    }
    
    return this.mapSupabaseAreaToServiceArea(data);
  }
  
  async updateArea(id: number, data: Partial<ServiceArea>): Promise<ServiceArea | undefined> {
    const updateData: any = {};
    
    // Mapear campos do ServiceArea para campos do Supabase
    if (data.ordem !== undefined) updateData.ordem = data.ordem;
    if (data.sequenciaCadastro !== undefined) updateData.sequencia_cadastro = data.sequenciaCadastro;
    if (data.tipo !== undefined) updateData.tipo = data.tipo;
    if (data.endereco !== undefined) updateData.endereco = data.endereco;
    if (data.bairro !== undefined) updateData.bairro = data.bairro;
    if (data.metragem_m2 !== undefined) updateData.metragem_m2 = data.metragem_m2;
    if (data.lat !== undefined) updateData.lat = data.lat;
    if (data.lng !== undefined) updateData.lng = data.lng;
    if (data.lote !== undefined) updateData.lote = data.lote;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.history !== undefined) updateData.history = data.history;
    if (data.polygon !== undefined) updateData.polygon = data.polygon;
    if (data.scheduledDate !== undefined) updateData.scheduled_date = data.scheduledDate;
    if (data.proximaPrevisao !== undefined) updateData.proxima_previsao = data.proximaPrevisao;
    if (data.ultimaRocagem !== undefined) updateData.ultima_rocagem = data.ultimaRocagem;
    if (data.ultimaManutencao !== undefined) updateData.ultima_manutencao = data.ultimaManutencao;
    if (data.ultimaIrrigacao !== undefined) updateData.ultima_irrigacao = data.ultimaIrrigacao;
    if (data.ultimaPlantio !== undefined) updateData.ultima_plantio = data.ultimaPlantio;
    if (data.observacoes !== undefined) updateData.observacoes = data.observacoes;
    if (data.manualSchedule !== undefined) updateData.manual_schedule = data.manualSchedule;
    if (data.daysToComplete !== undefined) updateData.days_to_complete = data.daysToComplete;
    if (data.servico !== undefined) updateData.servico = data.servico;
    if (data.registradoPor !== undefined) updateData.registrado_por = data.registradoPor;
    if (data.dataRegistro !== undefined) updateData.data_registro = data.dataRegistro;
    if (data.fotoAntes !== undefined) updateData.foto_antes = data.fotoAntes;
    if (data.fotoDepois !== undefined) updateData.foto_depois = data.fotoDepois;
    
    updateData.updated_at = new Date().toISOString();
    
    const { data: result, error } = await supabaseAdmin
      .from('service_areas')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error || !result) {
      console.error('Error updating area:', error);
      return undefined;
    }
    
    return this.mapSupabaseAreaToServiceArea(result);
  }
  
  async deleteArea(id: number): Promise<boolean> {
    const { error } = await supabaseAdmin
      .from('service_areas')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting area:', error);
      return false;
    }
    
    return true;
  }
  
  async addHistoryEntry(areaId: number, entry: { date: string; status: string; type?: 'completed' | 'forecast'; observation?: string }): Promise<ServiceArea | undefined> {
    const area = await this.getAreaById(areaId);
    if (!area) return undefined;
    
    const newHistory = [...area.history, entry];
    
    const { data, error } = await supabaseAdmin
      .from('service_areas')
      .update({
        history: newHistory,
        updated_at: new Date().toISOString(),
      })
      .eq('id', areaId)
      .select()
      .single();
    
    if (error || !data) {
      console.error('Error adding history entry:', error);
      return undefined;
    }
    
    return this.mapSupabaseAreaToServiceArea(data);
  }
  
  async getAllTeams(): Promise<Team[]> {
    const { data, error } = await supabaseAdmin
      .from('teams')
      .select('*')
      .order('id', { ascending: true });
    
    if (error) {
      console.error('Error fetching teams:', error);
      return [];
    }
    
    return (data || []).map(this.mapSupabaseTeamToTeam);
  }
  
  async getTeamById(id: number): Promise<Team | undefined> {
    const { data, error } = await supabaseAdmin
      .from('teams')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) {
      console.error('Error fetching team by id:', error);
      return undefined;
    }
    
    return this.mapSupabaseTeamToTeam(data);
  }
  
  async assignTeamToArea(teamId: number, areaId: number): Promise<Team | undefined> {
    const { data, error } = await supabaseAdmin
      .from('teams')
      .update({
        current_area_id: areaId,
        status: 'Assigned',
        updated_at: new Date().toISOString(),
      })
      .eq('id', teamId)
      .select()
      .single();
    
    if (error || !data) {
      console.error('Error assigning team to area:', error);
      return undefined;
    }
    
    return this.mapSupabaseTeamToTeam(data);
  }
  
  async getConfig(): Promise<AppConfig> {
    const { data, error } = await supabaseAdmin
      .from('app_config')
      .select('*')
      .order('id', { ascending: true })
      .limit(1)
      .single();
    
    if (error || !data) {
      // Retornar config padrão se não existir
      return {
        mowingProductionRate: {
          lote1: 25000,
          lote2: 20000,
        },
      };
    }
    
    return data.mowing_production_rate as AppConfig;
  }
  
  async updateConfig(config: Partial<AppConfig>): Promise<AppConfig> {
    const currentConfig = await this.getConfig();
    const newConfig = { ...currentConfig, ...config };
    
    const { data, error } = await supabaseAdmin
      .from('app_config')
      .update({
        mowing_production_rate: newConfig,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1) // Assumindo que sempre existe apenas uma config
      .select()
      .single();
    
    if (error || !data) {
      console.error('Error updating config:', error);
      return currentConfig;
    }
    
    return data.mowing_production_rate as AppConfig;
  }
  
  async getLastExport(scope: string, type: 'full' | 'incremental'): Promise<ExportHistory | null> {
    const { data, error } = await supabaseAdmin
      .from('export_history')
      .select('*')
      .eq('scope', scope)
      .eq('export_type', type)
      .order('exported_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    return this.mapSupabaseExportToExportHistory(data);
  }
  
  async recordExport(data: InsertExportHistory): Promise<ExportHistory> {
    const { data: result, error } = await supabaseAdmin
      .from('export_history')
      .insert({
        scope: data.scope,
        export_type: data.exportType,
        record_count: data.recordCount,
        duration_ms: data.durationMs,
        exported_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error || !result) {
      throw new Error(`Failed to record export: ${error?.message}`);
    }
    
    return this.mapSupabaseExportToExportHistory(result);
  }
  
  async getAreasModifiedSince(timestamp: Date): Promise<ServiceArea[]> {
    const { data, error } = await supabaseAdmin
      .from('service_areas')
      .select('*')
      .gt('updated_at', timestamp.toISOString())
      .order('updated_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching modified areas:', error);
      return [];
    }
    
    return (data || []).map(this.mapSupabaseAreaToServiceArea);
  }
  
  async registerDailyMowing(areaIds: number[], date: string, type: 'completed' | 'forecast' = 'completed'): Promise<void> {
    // Importar algoritmo de agendamento
    const { recalculateAfterCompletion } = await import('@shared/schedulingAlgorithm');
    
    // 1. Atualizar cada área baseado no tipo de registro
    for (const areaId of areaIds) {
      const area = await this.getAreaById(areaId);
      if (!area) continue;
      
      if (type === 'completed') {
        // Registro de conclusão: atualizar ultima_rocagem e status
        const newHistory = [...area.history, {
          date: date,
          status: "Concluído",
          type: 'completed' as const,
          observation: "Roçagem concluída",
        }];
        
        await supabaseAdmin
          .from('service_areas')
          .update({
            ultima_rocagem: date,
            status: "Concluído",
            history: newHistory,
            updated_at: new Date().toISOString(),
          })
          .eq('id', areaId);
      } else {
        // Registro de previsão: apenas adicionar no histórico
        const newHistory = [...area.history, {
          date: date,
          status: "Previsto",
          type: 'forecast' as const,
          observation: "Previsão de roçagem",
        }];
        
        await supabaseAdmin
          .from('service_areas')
          .update({
            history: newHistory,
            updated_at: new Date().toISOString(),
          })
          .eq('id', areaId);
      }
    }
    
    // 2. Se foi registro de conclusão, recalcular previsões para lotes afetados
    if (type === 'completed') {
      const allAreas = await this.getAllAreas('rocagem');
      const predictions = recalculateAfterCompletion(allAreas, areaIds, await this.getConfig());
      
      // 3. Atualizar previsões no banco
      for (const prediction of predictions) {
        await supabaseAdmin
          .from('service_areas')
          .update({
            proxima_previsao: prediction.proximaPrevisao,
            days_to_complete: prediction.daysToComplete,
            updated_at: new Date().toISOString(),
          })
          .eq('id', prediction.areaId);
      }
    }
  }
  
  async clearSimulationData(serviceType: string): Promise<number> {
    const { data, error } = await supabaseAdmin
      .from('service_areas')
      .update({
        history: [],
        status: 'Pendente',
        ultima_rocagem: null,
        proxima_previsao: null,
        updated_at: new Date().toISOString(),
      })
      .eq('servico', serviceType)
      .select('id');
    
    if (error) {
      console.error('Error clearing simulation data:', error);
      return 0;
    }
    
    return data?.length ?? 0;
  }
  
  // Mapeamento de tipos
  private mapSupabaseAreaToServiceArea(data: any): ServiceArea {
    return {
      id: data.id,
      ordem: data.ordem,
      sequenciaCadastro: data.sequencia_cadastro,
      tipo: data.tipo,
      endereco: data.endereco,
      bairro: data.bairro,
      metragem_m2: data.metragem_m2,
      lat: data.lat,
      lng: data.lng,
      lote: data.lote,
      status: data.status,
      history: data.history ?? [],
      polygon: data.polygon,
      scheduledDate: data.scheduled_date,
      proximaPrevisao: data.proxima_previsao,
      ultimaRocagem: data.ultima_rocagem,
      ultimaManutencao: data.ultima_manutencao,
      ultimaIrrigacao: data.ultima_irrigacao,
      ultimaPlantio: data.ultima_plantio,
      observacoes: data.observacoes,
      manualSchedule: data.manual_schedule ?? false,
      daysToComplete: data.days_to_complete,
      servico: data.servico,
      registradoPor: data.registrado_por,
      dataRegistro: data.data_registro,
      fotoAntes: data.foto_antes,
      fotoDepois: data.foto_depois,
    };
  }
  
  private mapSupabaseTeamToTeam(data: any): Team {
    return {
      id: data.id,
      service: data.service,
      type: data.type,
      lote: data.lote,
      status: data.status,
      currentAreaId: data.current_area_id,
      location: data.location,
    };
  }
  
  private mapSupabaseExportToExportHistory(data: any): ExportHistory {
    return {
      id: data.id,
      scope: data.scope,
      exportType: data.export_type,
      recordCount: data.record_count,
      durationMs: data.duration_ms,
      exportedAt: data.exported_at,
    };
  }
}