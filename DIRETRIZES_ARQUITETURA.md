# Diretrizes de Arquitetura - Zeladoria em Tempo Real

## 🚨 REGRA DE OURO: Isolamento de Módulos

**"Cada módulo (serviço) deve ser independente. Ao trocar de serviço, os componentes filhos e estados do anterior devem ser desmontados/limpos."**

## 📋 Princípios Fundamentais

### 1. Isolamento Completo de Estado
- Cada serviço deve ter seu próprio conjunto de estados e componentes
- Ao trocar de serviço, TODO o estado relacionado ao serviço anterior deve ser resetado
- Nenhum componente ou estado deve "vazar" entre serviços

### 2. Limpesa de Componentes
- Componentes específicos de um serviço devem ser desmontados quando o serviço for desativado
- Use `key` únicos por serviço para forçar remontagem de componentes
- Implemente funções de cleanup em useEffect quando apropriado

### 3. Gestão de Estado por Serviço
- Separe estados globais de estados específicos por serviço
- Use padrões como `useServiceModule` para gerenciar estado de cada serviço
- Considere usar Zustand stores separadas por serviço

### 4. Padrão de Navegação Limpa
```typescript
// ❌ ERRADO - Estado vaza entre serviços
const handleServiceSelect = (service: string) => {
  setSelectedService(service); // Estado antigo permanece ativo
}

// ✅ CERTO - Limpa estado anterior
const handleServiceSelect = (service: string) => {
  // 1. Limpar estado do serviço anterior
  resetPreviousServiceState();
  // 2. Resetar filtros e seleções
  resetFiltersAndSelections();
  // 3. Ativar novo serviço
  setSelectedService(service);
}
```

## 🔧 Implementação Técnica

### Estrutura de Módulos Sugerida
```
src/
├── modules/
│   ├── rocagem/          // Módulo Capina e Roçagem
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── stores/
│   │   └── types/
│   ├── jardins/          // Módulo Jardins
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── stores/
│   │   └── types/
│   └── shared/           // Componentes compartilhados
```

### Hook para Gestão de Módulos
```typescript
// src/hooks/useServiceModule.ts
export function useServiceModule(serviceName: string) {
  const [moduleState, setModuleState] = useState({});
  
  const resetModule = useCallback(() => {
    setModuleState({});
    // Limpar queries do React Query
    queryClient.removeQueries({ queryKey: [serviceName] });
  }, [serviceName]);
  
  return {
    moduleState,
    setModuleState,
    resetModule
  };
}
```

### Componente Wrapper para Isolamento
```typescript
// src/components/ServiceModuleWrapper.tsx
export function ServiceModuleWrapper({ 
  service, 
  children,
  onServiceChange 
}: ServiceModuleWrapperProps) {
  useEffect(() => {
    return () => {
      // Cleanup quando serviço mudar
      onServiceChange();
    };
  }, [service]);
  
  // Key único para forçar remontagem
  return (
    <div key={`module-${service}`}>
      {children}
    </div>
  );
}
```

## 🎯 Checklist de Validação

Antes de implementar um novo serviço, verifique:

- [ ] Todos os estados do serviço anterior são limpos ao trocar?
- [ ] Componentes específicos são desmontados/remontados?
- [ ] Queries do React Query são invalidadas/removidas?
- [ ] Seleções e filtros são resetados?
- [ ] Não há vazamento de estado entre serviços?
- [ ] Performance não é impactada por estados acumulados?

## 🚫 Anti-Padrões a Evitar

1. **Estado Global Compartilhado**: Não use o mesmo estado para diferentes serviços
2. **Componentes Condicionais Sem Key**: Sempre use keys únicos
3. **Queries Persistentes**: Limpe queries do React Query ao trocar serviço
4. **Event Listeners Acumulados**: Remova listeners ao desmontar
5. **Timeouts/Intervals Ativos**: Limpe timers ao trocar serviço

## 📊 Benefícios do Isolamento

- **Performance**: Sem acúmulo de estados não utilizados
- **Manutenibilidade**: Cada módulo é independente e testável
- **Previsibilidade**: Comportamento consistente ao trocar serviços
- **Debug**: Issues isoladas por módulo
- **Escalabilidade**: Novos módulos não impactam existentes

---

**⚠️ IMPORTANTE**: Sempre consulte este documento antes de implementar novos serviços ou modificar a navegação entre módulos!