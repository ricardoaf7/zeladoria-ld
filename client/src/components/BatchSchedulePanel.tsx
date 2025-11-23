import { useState } from "react";
import { Calendar, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface BatchSchedulePanelProps {
  selectedCount: number;
  selectedAreaIds: Set<number>;
  onToggleSelectionMode: () => void;
  onClearSelection: () => void;
}

export function BatchSchedulePanel({
  selectedCount,
  selectedAreaIds,
  onToggleSelectionMode,
  onClearSelection,
}: BatchSchedulePanelProps) {
  const { toast } = useToast();
  const [scheduledDate, setScheduledDate] = useState("");
  const [daysToComplete, setDaysToComplete] = useState("");

  const batchScheduleMutation = useMutation({
    mutationFn: async (data: {
      areaIds: number[];
      scheduledDate: string;
      daysToComplete?: number;
    }) => {
      return await apiRequest("PATCH", "/api/areas/batch-schedule", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/areas/light", "rocagem"] });
      toast({
        title: "Agendamento Realizado",
        description: `${selectedCount} áreas foram agendadas com sucesso.`,
      });
      onClearSelection();
      setScheduledDate("");
      setDaysToComplete("");
      onToggleSelectionMode();
    },
    onError: () => {
      toast({
        title: "Erro no Agendamento",
        description: "Não foi possível agendar as áreas. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleSchedule = () => {
    if (!scheduledDate) {
      toast({
        title: "Data Obrigatória",
        description: "Por favor, informe a data de início.",
        variant: "destructive",
      });
      return;
    }

    if (selectedAreaIds.size === 0) {
      toast({
        title: "Nenhuma Área Selecionada",
        description: "Selecione pelo menos uma área no mapa.",
        variant: "destructive",
      });
      return;
    }

    const data = {
      areaIds: Array.from(selectedAreaIds),
      scheduledDate,
      daysToComplete: daysToComplete ? parseInt(daysToComplete) : undefined,
    };

    batchScheduleMutation.mutate(data);
  };

  return (
    <Card className="mb-4" data-testid="card-batch-schedule">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Agendamento em Lote
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSelectionMode}
            data-testid="button-close-selection"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between px-3 py-2 bg-purple-600/20 rounded-md border border-purple-600/40">
          <span className="text-sm font-medium">Áreas Selecionadas:</span>
          <span className="text-lg font-bold text-purple-400" data-testid="text-selected-count">
            {selectedCount}
          </span>
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="scheduled-date" className="text-sm">
              Data de Início
            </Label>
            <Input
              id="scheduled-date"
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              data-testid="input-scheduled-date"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="days-to-complete" className="text-sm">
              Dias para Execução (opcional)
            </Label>
            <Input
              id="days-to-complete"
              type="number"
              min="1"
              placeholder="Ex: 3"
              value={daysToComplete}
              onChange={(e) => setDaysToComplete(e.target.value)}
              data-testid="input-days-to-complete"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClearSelection}
            className="flex-1"
            data-testid="button-clear-selection"
          >
            Limpar
          </Button>
          <Button
            size="sm"
            onClick={handleSchedule}
            disabled={batchScheduleMutation.isPending || selectedCount === 0}
            className="flex-1"
            data-testid="button-schedule-batch"
          >
            {batchScheduleMutation.isPending ? (
              "Agendando..."
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Agendar Lote
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
