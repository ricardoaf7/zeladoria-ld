import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Camera, X } from "lucide-react";
import { format, parse } from "date-fns";
import type { ServiceArea } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface JardinsRegisterModalProps {
  area: ServiceArea | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JardinsRegisterModal({ area, open, onOpenChange }: JardinsRegisterModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("manutencao");
  const [date, setDate] = useState<Date>(new Date());
  const [inputValue, setInputValue] = useState<string>("");
  const [observacoes, setObservacoes] = useState<string>("");
  const [fotoAntes, setFotoAntes] = useState<string | null>(null);
  const [fotoDepois, setFotoDepois] = useState<string | null>(null);
  const [uploadingAntes, setUploadingAntes] = useState(false);
  const [uploadingDepois, setUploadingDepois] = useState(false);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setDate(new Date());
      setInputValue("");
      setObservacoes("");
      setFotoAntes(null);
      setFotoDepois(null);
      setActiveTab("manutencao");
    }
    onOpenChange(newOpen);
  };

  const handlePhotoCapture = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setPhoto: (url: string) => void,
    setUploading: (val: boolean) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/photo/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Falha ao fazer upload");
      const data = await res.json() as { url: string };
      setPhoto(data.url);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro no Upload",
        description: "Não foi possível fazer upload da foto.",
      });
    } finally {
      setUploading(false);
    }
  };

  const formatDateInput = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    const limited = numbers.slice(0, 8);
    let formatted = '';
    for (let i = 0; i < limited.length; i++) {
      if (i === 2 || i === 4) {
        formatted += '/';
      }
      formatted += limited[i];
    }
    return formatted;
  };

  const handleInputChange = (value: string) => {
    const formatted = formatDateInput(value);
    setInputValue(formatted);
    if (formatted.length >= 8) {
      try {
        let dateStr = formatted;
        if (formatted.length === 8) {
          const parts = formatted.split('/');
          if (parts.length === 3 && parts[2].length === 2) {
            const year = parseInt(parts[2]);
            const fullYear = year < 50 ? 2000 + year : 1900 + year;
            dateStr = `${parts[0]}/${parts[1]}/${fullYear}`;
          }
        }
        const parsedDate = parse(dateStr, "dd/MM/yyyy", new Date());
        if (!isNaN(parsedDate.getTime())) {
          setDate(parsedDate);
        }
      } catch (e) {
        // Ignora erro
      }
    }
  };

  const handleInputBlur = () => {
    if (!inputValue) {
      setInputValue(format(date, "dd/MM/yyyy"));
      return;
    }
    try {
      let dateStr = inputValue;
      if (inputValue.length === 8) {
        const parts = inputValue.split('/');
        if (parts.length === 3 && parts[2].length === 2) {
          const year = parseInt(parts[2]);
          const fullYear = year < 50 ? 2000 + year : 1900 + year;
          dateStr = `${parts[0]}/${parts[1]}/${fullYear}`;
        }
      }
      const parsedDate = parse(dateStr, "dd/MM/yyyy", new Date());
      if (!isNaN(parsedDate.getTime())) {
        setDate(parsedDate);
        setInputValue(format(parsedDate, "dd/MM/yyyy"));
      } else {
        const today = new Date();
        setDate(today);
        setInputValue(format(today, "dd/MM/yyyy"));
      }
    } catch (e) {
      const today = new Date();
      setDate(today);
      setInputValue(format(today, "dd/MM/yyyy"));
    }
  };

  const registerJardinsMutation = useMutation({
    mutationFn: async (data: { type: string; date: string }): Promise<ServiceArea> => {
      if (!area) throw new Error("Área não selecionada");

      const updateData: any = {
        status: "Pendente",
        observacoes: observacoes || null,
        fotoAntes: fotoAntes || null,
        fotoDepois: fotoDepois || null,
      };

      if (data.type === "manutencao") {
        updateData.ultimaManutencao = data.date;
      } else if (data.type === "irrigacao") {
        updateData.ultimaIrrigacao = data.date;
      } else if (data.type === "plantio") {
        updateData.ultimaPlantio = data.date;
      }

      const res = await apiRequest("PATCH", `/api/areas/${area.id}`, updateData);
      return await res.json() as ServiceArea;
    },
    onSuccess: (updatedArea) => {
      if (!area) return;

      queryClient.setQueryData(["/api/areas/light", "jardins"], (old: ServiceArea[] | undefined) => {
        if (!old) return old;
        return old.map(a => a.id === updatedArea.id ? updatedArea : a);
      });

      queryClient.invalidateQueries({ queryKey: ["/api/areas", area.id] });

      const tabLabels = {
        manutencao: "Manutenção",
        irrigacao: "Irrigação",
        plantio: "Plantio",
      };

      toast({
        title: `${tabLabels[activeTab as keyof typeof tabLabels]} Registrada!`,
        description: `Registro de ${area.endereco} foi salvo com sucesso.`,
      });
      handleOpenChange(false);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro ao Registrar",
        description: "Não foi possível registrar. Tente novamente.",
      });
    },
  });

  const handleConfirm = () => {
    const dateStr = format(date, "yyyy-MM-dd");
    registerJardinsMutation.mutate({ type: activeTab, date: dateStr });
  };

  if (!area) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="modal-jardins-register">
        <DialogHeader>
          <DialogTitle>Registrar - Jardins</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="manutencao" data-testid="tab-manutencao">
              Manutenção
            </TabsTrigger>
            <TabsTrigger value="irrigacao" data-testid="tab-irrigacao">
              Irrigação
            </TabsTrigger>
            <TabsTrigger value="plantio" data-testid="tab-plantio">
              Plantio
            </TabsTrigger>
          </TabsList>

          {["manutencao", "irrigacao", "plantio"].map((tab) => (
            <TabsContent key={tab} value={tab} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="data">Data do Registro</Label>
                <div className="flex gap-2">
                  <Input
                    id="data"
                    type="text"
                    placeholder="DD/MM/AAAA"
                    value={inputValue || format(date, "dd/MM/yyyy")}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onBlur={handleInputBlur}
                    data-testid={`input-date-${tab}`}
                  />
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="icon">
                        <CalendarIcon className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(newDate) => {
                          if (newDate) {
                            setDate(newDate);
                            setInputValue(format(newDate, "dd/MM/yyyy"));
                          }
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  placeholder="Adicione observações sobre o trabalho realizado..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  className="min-h-24"
                  data-testid={`textarea-obs-${tab}`}
                />
              </div>

              <div className="space-y-3">
                <Label>Fotos</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="border-2 border-dashed rounded-lg p-3">
                    {fotoAntes ? (
                      <div className="relative">
                        <img src={fotoAntes} alt="Antes" className="w-full h-24 object-cover rounded" />
                        <button
                          onClick={() => setFotoAntes(null)}
                          className="absolute top-1 right-1 bg-destructive text-white p-1 rounded"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center cursor-pointer h-24">
                        <Camera className="h-5 w-5 mb-1 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Antes</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handlePhotoCapture(e, setFotoAntes, setUploadingAntes)}
                          disabled={uploadingAntes}
                        />
                      </label>
                    )}
                  </div>
                  <div className="border-2 border-dashed rounded-lg p-3">
                    {fotoDepois ? (
                      <div className="relative">
                        <img src={fotoDepois} alt="Depois" className="w-full h-24 object-cover rounded" />
                        <button
                          onClick={() => setFotoDepois(null)}
                          className="absolute top-1 right-1 bg-destructive text-white p-1 rounded"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center cursor-pointer h-24">
                        <Camera className="h-5 w-5 mb-1 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Depois</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handlePhotoCapture(e, setFotoDepois, setUploadingDepois)}
                          disabled={uploadingDepois}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={registerJardinsMutation.isPending}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  data-testid={`button-confirm-${tab}`}
                >
                  {registerJardinsMutation.isPending ? "Salvando..." : "Confirmar"}
                </Button>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
