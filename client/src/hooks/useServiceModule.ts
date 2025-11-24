import { useState, useCallback, useEffect } from 'react';
import type { BottomSheetState } from '@/components/BottomSheet';
import { useQueryClient } from '@tanstack/react-query';
import type { ServiceArea } from '@shared/schema';
import type { FilterCriteria } from '@/components/FilterPanel';
import type { TimeRangeFilter } from '@/components/MapLegend';

export interface ServiceModuleState {
  // Estado de UI
  selectedArea: ServiceArea | null;
  showMapCard: boolean;
  
  // Modais
  showQuickRegisterModal: boolean;
  showJardinsRegisterModal: boolean;
  showManualForecastModal: boolean;
  showNewAreaModal: boolean;
  showEditModal: boolean;
  
  // Dados para novas áreas
  newAreaCoords: { lat: number; lng: number } | null;
  
  // Filtros
  filters: FilterCriteria;
  timeRangeFilter: TimeRangeFilter;
  customFilterDateRange: { from: Date | undefined; to: Date | undefined };
  
  // Controle de UI
  bottomSheetState: BottomSheetState;
}

const INITIAL_STATE: ServiceModuleState = {
  selectedArea: null,
  showMapCard: false,
  showQuickRegisterModal: false,
  showJardinsRegisterModal: false,
  showManualForecastModal: false,
  showNewAreaModal: false,
  showEditModal: false,
  newAreaCoords: null,
  filters: {
    search: "",
    bairro: "all",
    lote: "all", 
    status: "all",
    tipo: "all",
  },
  timeRangeFilter: null,
  customFilterDateRange: { from: undefined, to: undefined },
  bottomSheetState: 'minimized' as const,
};

/**
 * Hook para gerenciar estado isolado por serviço/módulo
 * Implementa o padrão de isolamento de módulos da aplicação
 */
export function useServiceModule(serviceName: string) {
  const queryClient = useQueryClient();
  const [moduleState, setModuleState] = useState<ServiceModuleState>(INITIAL_STATE);

  /**
   * Reseta TODO o estado do módulo para valores iniciais
   * Remove queries do React Query específicas do serviço
   */
  const resetModule = useCallback(() => {
    setModuleState(INITIAL_STATE);
    
    // Limpar queries específicas do serviço
    queryClient.removeQueries({ queryKey: ['/api/areas/search', serviceName] });
    queryClient.removeQueries({ queryKey: ['/api/areas/light', serviceName] });
    
    // Invalidar queries relacionadas para garantir limpeza
    queryClient.invalidateQueries({ queryKey: ['/api/areas'] });
  }, [queryClient, serviceName]);

  /**
   * Atualiza apenas campos específicos do estado
   */
  const updateModuleState = useCallback(
    (updates: Partial<ServiceModuleState>) => {
      setModuleState(prev => ({ ...prev, ...updates }));
    },
    []
  );

  /**
   * Handlers específicos para ações comuns
   */
  const handleAreaSelect = useCallback((area: ServiceArea | null) => {
    updateModuleState({ 
      selectedArea: area,
      showMapCard: !!area 
    });
  }, [updateModuleState]);

  const handleCloseMapCard = useCallback(() => {
    updateModuleState({ 
      selectedArea: null, 
      showMapCard: false 
    });
  }, [updateModuleState]);

  const handleOpenQuickRegister = useCallback(() => {
    updateModuleState({ 
      showMapCard: false,
      showQuickRegisterModal: true 
    });
  }, [updateModuleState]);

  const handleOpenJardinsRegister = useCallback(() => {
    updateModuleState({ 
      showMapCard: false,
      showJardinsRegisterModal: true 
    });
  }, [updateModuleState]);

  const handleOpenManualForecast = useCallback(() => {
    updateModuleState({ 
      showMapCard: false,
      showManualForecastModal: true 
    });
  }, [updateModuleState]);

  const handleOpenEdit = useCallback(() => {
    updateModuleState({ 
      showMapCard: false,
      showEditModal: true 
    });
  }, [updateModuleState]);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    updateModuleState({ 
      newAreaCoords: { lat, lng },
      showNewAreaModal: true 
    });
  }, [updateModuleState]);

  const handleAreaUpdate = useCallback((updatedArea: ServiceArea) => {
    updateModuleState({ selectedArea: updatedArea });
  }, [updateModuleState]);

  const handleTimeRangeFilterChange = useCallback((filter: TimeRangeFilter, customDateRange?: { from: Date | undefined; to: Date | undefined }) => {
    updateModuleState({ 
      timeRangeFilter: filter,
      customFilterDateRange: customDateRange || { from: undefined, to: undefined }
    });
  }, [updateModuleState]);

  const handleFilterChange = useCallback((filters: FilterCriteria) => {
    updateModuleState({ filters });
  }, [updateModuleState]);

  const handleBottomSheetStateChange = useCallback((state: BottomSheetState) => {
    updateModuleState({ bottomSheetState: state });
  }, [updateModuleState]);

  const handleModalClose = useCallback((modalName: keyof Pick<ServiceModuleState, 
    'showQuickRegisterModal' | 'showJardinsRegisterModal' | 'showManualForecastModal' | 
    'showNewAreaModal' | 'showEditModal'>) => {
    updateModuleState({ [modalName]: false });
  }, [updateModuleState]);

  return {
    // Estado
    moduleState,
    
    // Actions
    resetModule,
    updateModuleState,
    
    // Handlers
    handleAreaSelect,
    handleCloseMapCard,
    handleOpenQuickRegister,
    handleOpenJardinsRegister,
    handleOpenManualForecast,
    handleOpenEdit,
    handleMapClick,
    handleAreaUpdate,
    handleTimeRangeFilterChange,
    handleFilterChange,
    handleBottomSheetStateChange,
    handleModalClose,
    // Alias para compatibilidade
    handleServiceChange: resetModule,
  };
}