import { useState, useRef, useEffect, useMemo, useDeferredValue } from "react";
import { DashboardMap } from "@/components/DashboardMap";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MapInfoCard } from "@/components/MapInfoCard";
import { QuickRegisterModal } from "@/components/QuickRegisterModal";
import { JardinsRegisterModal } from "@/components/JardinsRegisterModal";
import { ManualForecastModal } from "@/components/ManualForecastModal";
import { NewAreaModal } from "@/components/NewAreaModal";
import { EditAreaModal } from "@/components/EditAreaModal";
import { MapHeaderBar } from "@/components/MapHeaderBar";
import { ExportDialog } from "@/components/ExportDialog";
import { ServiceModuleWrapper } from "@/components/ServiceModuleWrapper";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { BottomSheet, type BottomSheetState } from "@/components/BottomSheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useQuery } from "@tanstack/react-query";
import { useServiceModule } from "@/hooks/useServiceModule";
import type { ServiceArea, AppConfig } from "@shared/schema";
import type { FilterCriteria } from "@/components/FilterPanel";
import type { TimeRangeFilter } from "@/components/MapLegend";
import { Button } from "@/components/ui/button";
import { Menu, X, Download, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import L from "leaflet";

export default function Dashboard() {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [selectedService, setSelectedService] = useState<string>('');
  const [showExportDialog, setShowExportDialog] = useState(false);
  const mapRef = useRef<L.Map | null>(null);
  
  // Hook de módulo para gerenciar estado isolado por serviço
  const serviceModule = useServiceModule(selectedService);
  const { moduleState, handleServiceChange, handleAreaSelect, handleCloseMapCard, 
          handleOpenQuickRegister, handleOpenJardinsRegister, handleOpenManualForecast, 
          handleOpenEdit, handleMapClick, handleAreaUpdate, 
          handleFilterChange, handleBottomSheetStateChange, handleModalClose } = serviceModule;
  
  // Flag para controlar limpeza de busca
  const ignoreSearchClearRef = useRef(false);

  // Limpar selectedArea quando busca é limpa MANUALMENTE (não após seleção)
  useEffect(() => {
    if (moduleState.filters.search === '') {
      // Ignorar se foi uma limpeza após seleção de área
      if (ignoreSearchClearRef.current) {
        ignoreSearchClearRef.current = false;
        return;
      }
      handleAreaSelect(null);
    }
  }, [moduleState.filters.search, handleAreaSelect]);

  const handleServiceSelect = (service: string) => {
    // 🚨 IMPLEMENTAÇÃO DA REGRA DE ISOLAMENTO DE MÓDULOS
    if (selectedService && selectedService !== service) {
      // Limpar estado do serviço anterior antes de mudar
      serviceModule.resetModule();
    }
    
    setSelectedService(service);
    // No mobile, não abrir automaticamente o BottomSheet
    // Deixar o usuário controlar via botão Menu
  };

  const handleBackupDownload = async () => {
    try {
      const response = await fetch('/api/backup');
      if (!response.ok) throw new Error('Falha ao gerar backup');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `zeladoria_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Backup Gerado!",
        description: "Arquivo de backup baixado com sucesso.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro no Backup",
        description: "Não foi possível gerar o backup. Tente novamente.",
      });
    }
  };

  // Usar endpoint otimizado com dados leves (todas as áreas, sem filtro de viewport)
  const { data: rocagemAreas = [] } = useQuery<ServiceArea[]>({
    queryKey: ["/api/areas/light", "rocagem"],
    queryFn: async () => {
      const res = await fetch(`/api/areas/light?servico=rocagem`);
      if (!res.ok) throw new Error("Failed to fetch areas");
      return res.json();
    },
    staleTime: 30000, // Cache por 30 segundos
  });

  const { data: jardinsAreas = [] } = useQuery<ServiceArea[]>({
    queryKey: ["/api/areas/light", "jardins"],
    queryFn: async () => {
      const res = await fetch(`/api/areas/light?servico=jardins`);
      if (!res.ok) throw new Error("Failed to fetch areas");
      return res.json();
    },
    staleTime: 30000, // Cache por 30 segundos
  });

  const { data: config } = useQuery<AppConfig>({
    queryKey: ["/api/config"],
  });

  // OTIMIZAÇÃO CRÍTICA: Usar useDeferredValue para separar atualização urgente (input)
  // de computação pesada (filtros). Evita lag de 3-4 segundos na digitação.
  // React prioriza atualização do input e processa filtros depois
  const deferredFilters = useDeferredValue(moduleState.filters);
  const deferredTimeRangeFilter = useDeferredValue(moduleState.timeRangeFilter);
  const deferredCustomFilterDateRange = useDeferredValue(moduleState.customFilterDateRange);

  // Função auxiliar para calcular dias DESDE última roçagem
  const getDaysSinceLastMowing = (area: ServiceArea): number => {
    if (!area.ultimaRocagem) return -1; // Sem histórico
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastDate = new Date(area.ultimaRocagem);
    lastDate.setHours(0, 0, 0, 0);
    
    return Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Filtrar áreas baseado nos critérios (incluindo filtro de tempo)
  // IMPORTANTE: Usa valores deferidos para não bloquear UI durante digitação
  const filteredRocagemAreas = useMemo(() => {
    let areas = rocagemAreas;

    // Aplicar filtro de tempo primeiro (usando valores deferidos)
    if (deferredTimeRangeFilter) {
      areas = areas.filter(area => {
        // Filtro "Executando" - apenas áreas com status "Em Execução"
        if (deferredTimeRangeFilter === 'executing') {
          return area.status === 'Em Execução';
        }

        // Filtro "Sem Registro" - áreas sem histórico de roçagem
        if (deferredTimeRangeFilter === 'no-history') {
          return !area.ultimaRocagem;
        }

        // Para outros filtros, calcular dias desde última roçagem
        const days = getDaysSinceLastMowing(area);
        
        // Se não tem histórico, não mostra em nenhum filtro de tempo
        if (days === -1) return false;

        switch (deferredTimeRangeFilter) {
          case '1-5':
            return days >= 1 && days <= 5;
          case '6-15':
            return days >= 6 && days <= 15;
          case '16-25':
            return days >= 16 && days <= 25;
          case '26-35':
            return days >= 26 && days <= 35;
          case '36-45':
            return days >= 36 && days <= 45;
          case '46+':
            return days > 45;
          case 'custom':
            // Filtro por range de datas - baseado em ÚLTIMA roçagem
            if (!deferredCustomFilterDateRange.from || !deferredCustomFilterDateRange.to || !area.ultimaRocagem) return false;
            const fromDate = new Date(deferredCustomFilterDateRange.from);
            fromDate.setHours(0, 0, 0, 0);
            const toDate = new Date(deferredCustomFilterDateRange.to);
            toDate.setHours(0, 0, 0, 0);
            const lastMowDate = new Date(area.ultimaRocagem);
            lastMowDate.setHours(0, 0, 0, 0);
            return lastMowDate >= fromDate && lastMowDate <= toDate;
          default:
            return true;
        }
      });
    }

    // Aplicar filtros tradicionais (usando valores deferidos)
    if (!deferredFilters.search && 
        (!deferredFilters.bairro || deferredFilters.bairro === "all") && 
        (!deferredFilters.lote || deferredFilters.lote === "all") && 
        (!deferredFilters.status || deferredFilters.status === "all") && 
        (!deferredFilters.tipo || deferredFilters.tipo === "all")) {
      return areas;
    }

    return areas.filter(area => {
      if (deferredFilters.search) {
        const searchLower = deferredFilters.search.toLowerCase();
        const endereco = area.endereco?.toLowerCase() || "";
        const bairro = area.bairro?.toLowerCase() || "";
        if (!endereco.includes(searchLower) && !bairro.includes(searchLower)) {
          return false;
        }
      }

      if (deferredFilters.bairro && deferredFilters.bairro !== "all" && area.bairro !== deferredFilters.bairro) return false;
      if (deferredFilters.lote && deferredFilters.lote !== "all" && area.lote?.toString() !== deferredFilters.lote) return false;
      if (deferredFilters.status && deferredFilters.status !== "all" && area.status !== deferredFilters.status) return false;
      if (deferredFilters.tipo && deferredFilters.tipo !== "all" && area.tipo !== deferredFilters.tipo) return false;

      return true;
    });
  }, [rocagemAreas, deferredFilters, deferredTimeRangeFilter, deferredCustomFilterDateRange]);

  const hasActiveFilters = moduleState.filters.search || 
    (moduleState.filters.bairro && moduleState.filters.bairro !== "all") || 
    (moduleState.filters.lote && moduleState.filters.lote !== "all") || 
    (moduleState.filters.status && moduleState.filters.status !== "all") || 
    (moduleState.filters.tipo && moduleState.filters.tipo !== "all") ||
    moduleState.timeRangeFilter !== null;

  useEffect(() => {
    if (moduleState.selectedArea && mapRef.current) {
      const lat = moduleState.selectedArea.lat;
      const lng = moduleState.selectedArea.lng;
      
      // Validar coordenadas antes de fazer zoom
      if (
        lat && 
        lng && 
        typeof lat === 'number' && 
        typeof lng === 'number' &&
        !isNaN(lat) && 
        !isNaN(lng) &&
        isFinite(lat) && 
        isFinite(lng)
      ) {
        // Sempre aproximar ao clicar em uma área (zoom 17 para boa visualização)
        mapRef.current.setView([lat, lng], 17, { animate: true });
      } else {
        console.warn('Coordenadas inválidas para área:', moduleState.selectedArea.id, { lat, lng });
      }
    }
  }, [moduleState.selectedArea]);

  // Largura responsiva: 85% em mobile, 21rem em desktop
  const style = {
    "--sidebar-width": "min(85vw, 21rem)",
    "--sidebar-width-icon": "4rem",
  } as React.CSSProperties;

  // Handlers agora usam o hook de módulo (já definidos acima)
  // Removidos pois agora são providos pelo useServiceModule

  // Handlers do módulo (já desestruturados acima)
  const handleTimeRangeFilterChange = serviceModule.handleTimeRangeFilterChange;

  const handleAreaSelectFromSearch = (area: ServiceArea) => {
    // Centralizar mapa na área
    if (mapRef.current && area.lat && area.lng) {
      mapRef.current.setView([area.lat, area.lng], 17, { animate: true });
    }
    
    // Selecionar área e abrir MapInfoCard usando hook de módulo
    serviceModule.handleAreaSelect(area);
    
    // Setar flag para ignorar próxima limpeza de search
    ignoreSearchClearRef.current = true;
    
    // No mobile, minimizar o BottomSheet para ver melhor
    if (isMobile) {
      serviceModule.handleBottomSheetStateChange("minimized");
    }
  };

  // Mobile layout com BottomSheet
  if (isMobile) {
    const toggleBottomSheet = () => {
      if (moduleState.bottomSheetState === "minimized") {
        serviceModule.handleBottomSheetStateChange("medium");
      } else {
        serviceModule.handleBottomSheetStateChange("minimized");
      }
    };

    return (
      <div className="flex flex-col h-screen w-full">
        <header className="flex items-center justify-between h-14 px-4 border-b border-sidebar-border bg-background z-30">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleBottomSheet}
            className={moduleState.bottomSheetState !== "minimized" ? "toggle-elevate toggle-elevated" : ""}
            aria-label={moduleState.bottomSheetState === "minimized" ? "Abrir menu" : "Fechar menu"}
            data-testid="button-mobile-menu"
          >
            {moduleState.bottomSheetState === "minimized" ? (
              <Menu className="h-5 w-5" />
            ) : (
              <X className="h-5 w-5" />
            )}
          </Button>
          <h1 className="text-lg font-semibold">Zeladoria Londrina</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBackupDownload}
              aria-label="Exportar backup JSON"
              data-testid="button-backup"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowExportDialog(true)}
              aria-label="Exportar CSV para Supabase"
              data-testid="button-export-csv"
            >
              <FileText className="h-4 w-4" />
            </Button>
            <ThemeToggle />
          </div>
        </header>

        {/* Barra de busca e filtros - ISOLADO POR SERVIÇO */}
        {selectedService === 'rocagem' && (
          <ServiceModuleWrapper service="rocagem" onServiceChange={() => serviceModule.resetModule()}>
            <MapHeaderBar
              searchQuery={moduleState.filters.search}
              onSearchChange={(query) => serviceModule.handleFilterChange({ ...moduleState.filters, search: query })}
              activeFilter={moduleState.timeRangeFilter}
              onFilterChange={handleTimeRangeFilterChange}
              filteredCount={filteredRocagemAreas.length}
              totalCount={rocagemAreas.length}
              areas={filteredRocagemAreas}
              onAreaSelect={handleAreaSelectFromSearch}
              selectedAreaId={moduleState.selectedArea?.id ?? null}
              onClearSelection={() => serviceModule.handleAreaSelect(null)}
            />
          </ServiceModuleWrapper>
        )}
        
        <main className="flex-1 overflow-hidden relative">
          <DashboardMap
            rocagemAreas={rocagemAreas}
            jardinsAreas={jardinsAreas}
            layerFilters={{
              rocagemLote1: selectedService === 'rocagem',
              rocagemLote2: selectedService === 'rocagem',
              jardins: selectedService === 'jardins',
            }}
            onAreaClick={serviceModule.handleAreaSelect}
            onMapClick={handleMapClick}
            filteredAreaIds={hasActiveFilters ? new Set(filteredRocagemAreas.map(a => a.id)) : undefined}
            mapRef={mapRef}
            searchQuery={moduleState.filters.search}
            activeFilter={moduleState.timeRangeFilter}
            selectedAreaId={moduleState.selectedArea?.id || null}
          />

          {/* Card flutuante no mapa - ISOLADO POR SERVIÇO */}
          {moduleState.showMapCard && moduleState.selectedArea && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] pointer-events-auto">
              <MapInfoCard
                area={moduleState.selectedArea}
                onClose={serviceModule.handleCloseMapCard}
                onRegisterMowing={serviceModule.handleOpenQuickRegister}
                onRegisterJardins={serviceModule.handleOpenJardinsRegister}
                onSetManualForecast={serviceModule.handleOpenManualForecast}
                onEdit={serviceModule.handleOpenEdit}
              />
            </div>
          )}
          
          <BottomSheet 
            state={moduleState.bottomSheetState}
            onStateChange={serviceModule.handleBottomSheetStateChange}
          >
            <AppSidebar
              standalone
              selectedService={selectedService}
              onServiceSelect={handleServiceSelect}
              selectedArea={moduleState.selectedArea}
              onAreaClose={() => serviceModule.handleAreaSelect(null)}
              onAreaUpdate={serviceModule.handleAreaUpdate}
              showQuickRegisterModal={moduleState.showQuickRegisterModal}
              showMapCard={moduleState.showMapCard}
            />
          </BottomSheet>

          {/* Modais - ISOLADOS POR SERVIÇO */}
          {moduleState.showQuickRegisterModal && (
            <QuickRegisterModal
              area={moduleState.selectedArea}
              open={moduleState.showQuickRegisterModal}
              onOpenChange={() => serviceModule.handleModalClose('showQuickRegisterModal')}
            />
          )}

          {moduleState.showJardinsRegisterModal && (
            <JardinsRegisterModal
              area={moduleState.selectedArea}
              open={moduleState.showJardinsRegisterModal}
              onOpenChange={() => serviceModule.handleModalClose('showJardinsRegisterModal')}
            />
          )}

          {moduleState.newAreaCoords && (
            <NewAreaModal
              open={moduleState.showNewAreaModal}
              onOpenChange={() => serviceModule.handleModalClose('showNewAreaModal')}
              lat={moduleState.newAreaCoords.lat}
              lng={moduleState.newAreaCoords.lng}
            />
          )}

          {moduleState.showEditModal && (
            <EditAreaModal
              area={moduleState.selectedArea}
              open={moduleState.showEditModal}
              onOpenChange={() => serviceModule.handleModalClose('showEditModal')}
            />
          )}
        </main>
      </div>
    );
  }

  // Desktop layout com Sidebar
  return (
    <SidebarProvider 
      style={style as React.CSSProperties}
      defaultOpen={typeof window !== 'undefined' && window.innerWidth > 1024}
    >
      <div className="flex h-screen w-full">
        <AppSidebar
          selectedService={selectedService}
          onServiceSelect={handleServiceSelect}
          selectedArea={moduleState.selectedArea}
          onAreaClose={() => serviceModule.handleAreaSelect(null)}
          onAreaUpdate={serviceModule.handleAreaUpdate}
          showQuickRegisterModal={moduleState.showQuickRegisterModal}
          showMapCard={moduleState.showMapCard}
        />
        
        <SidebarInset className="flex-1 overflow-hidden flex flex-col">
          <header className="flex items-center justify-between h-14 px-4 border-b border-sidebar-border">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBackupDownload}
                aria-label="Exportar backup JSON"
                data-testid="button-backup"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowExportDialog(true)}
                aria-label="Exportar CSV para Supabase"
                data-testid="button-export-csv"
              >
                <FileText className="h-4 w-4" />
              </Button>
              <ThemeToggle />
            </div>
          </header>

          {/* Barra de busca e filtros - ISOLADO POR SERVIÇO */}
          {selectedService === 'rocagem' && (
            <ServiceModuleWrapper service="rocagem" onServiceChange={() => serviceModule.resetModule()}>
              <MapHeaderBar
                searchQuery={moduleState.filters.search}
                onSearchChange={(query) => serviceModule.handleFilterChange({ ...moduleState.filters, search: query })}
                activeFilter={moduleState.timeRangeFilter}
                onFilterChange={handleTimeRangeFilterChange}
                filteredCount={filteredRocagemAreas.length}
                totalCount={rocagemAreas.length}
                areas={filteredRocagemAreas}
                onAreaSelect={handleAreaSelectFromSearch}
                selectedAreaId={moduleState.selectedArea?.id ?? null}
                onClearSelection={() => serviceModule.handleAreaSelect(null)}
              />
            </ServiceModuleWrapper>
          )}

          <main className="flex-1 overflow-hidden relative">
            <DashboardMap
              rocagemAreas={rocagemAreas}
              jardinsAreas={jardinsAreas}
              layerFilters={{
                rocagemLote1: selectedService === 'rocagem',
                rocagemLote2: selectedService === 'rocagem',
                jardins: selectedService === 'jardins',
              }}
              onAreaClick={serviceModule.handleAreaSelect}
              onMapClick={serviceModule.handleMapClick}
              filteredAreaIds={hasActiveFilters ? new Set(filteredRocagemAreas.map(a => a.id)) : undefined}
              searchQuery={moduleState.filters.search}
              activeFilter={moduleState.timeRangeFilter}
              mapRef={mapRef}
              selectedAreaId={moduleState.selectedArea?.id || null}
            />

            {/* Card flutuante no mapa - ISOLADO POR SERVIÇO */}
            {moduleState.showMapCard && moduleState.selectedArea && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] pointer-events-auto">
                <MapInfoCard
                  area={moduleState.selectedArea}
                  onClose={serviceModule.handleCloseMapCard}
                  onRegisterMowing={serviceModule.handleOpenQuickRegister}
                  onRegisterJardins={serviceModule.handleOpenJardinsRegister}
                  onSetManualForecast={serviceModule.handleOpenManualForecast}
                  onEdit={serviceModule.handleOpenEdit}
                />
              </div>
            )}
          </main>
        </SidebarInset>
      </div>

      {/* Modais - ISOLADOS POR SERVIÇO */}
      {moduleState.showQuickRegisterModal && (
        <QuickRegisterModal
          area={moduleState.selectedArea}
          open={moduleState.showQuickRegisterModal}
          onOpenChange={() => serviceModule.handleModalClose('showQuickRegisterModal')}
        />
      )}

      {moduleState.showJardinsRegisterModal && (
        <JardinsRegisterModal
          area={moduleState.selectedArea}
          open={moduleState.showJardinsRegisterModal}
          onOpenChange={() => serviceModule.handleModalClose('showJardinsRegisterModal')}
        />
      )}

      {moduleState.showManualForecastModal && (
        <ManualForecastModal
          area={moduleState.selectedArea}
          open={moduleState.showManualForecastModal}
          onOpenChange={() => serviceModule.handleModalClose('showManualForecastModal')}
        />
      )}

      {/* Modal de exportação CSV - Global */}
      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
      />

      {moduleState.newAreaCoords && (
        <NewAreaModal
          open={moduleState.showNewAreaModal}
          onOpenChange={() => serviceModule.handleModalClose('showNewAreaModal')}
          lat={moduleState.newAreaCoords.lat}
          lng={moduleState.newAreaCoords.lng}
        />
      )}

      {moduleState.showEditModal && (
        <EditAreaModal
          area={moduleState.selectedArea}
          open={moduleState.showEditModal}
          onOpenChange={() => serviceModule.handleModalClose('showEditModal')}
        />
      )}
    </SidebarProvider>
  );
}
