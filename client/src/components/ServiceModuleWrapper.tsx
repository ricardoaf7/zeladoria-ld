import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface ServiceModuleWrapperProps {
  service: string;
  children: React.ReactNode;
  onServiceChange?: () => void;
  className?: string;
}

/**
 * Wrapper que força isolamento de módulos ao trocar de serviço
 * Usa key único para forçar remontagem completa do componente
 * Implementa cleanup automático ao mudar de serviço
 */
export function ServiceModuleWrapper({ 
  service, 
  children, 
  onServiceChange,
  className = ""
}: ServiceModuleWrapperProps) {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Cleanup quando o serviço mudar ou componente for desmontado
    return () => {
      if (onServiceChange) {
        onServiceChange();
      }
      
      // Limpar queries em cache específicas do serviço
      if (service) {
        queryClient.removeQueries({ queryKey: ['/api/areas/search', service] });
        queryClient.removeQueries({ queryKey: ['/api/areas/light', service] });
      }
    };
  }, [service, onServiceChange, queryClient]);

  // Key único para forçar remontagem completa quando serviço mudar
  // Isso garante que todos os estados filhos sejam resetados
  const uniqueKey = `service-module-${service || 'none'}`;

  return (
    <div key={uniqueKey} className={className}>
      {children}
    </div>
  );
}