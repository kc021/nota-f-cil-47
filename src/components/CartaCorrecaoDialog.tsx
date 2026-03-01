import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { FileEdit, Send, Clock, CheckCircle2, AlertCircle } from "lucide-react";

interface CorrectionLetter {
  id: string;
  numero_sequencia: number;
  correcao: string;
  status: string;
  protocolo: string | null;
  data_registro: string;
}

interface CartaCorrecaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
  invoiceNumero: number;
  invoiceSerie: number;
}

export function CartaCorrecaoDialog({
  open,
  onOpenChange,
  invoiceId,
  invoiceNumero,
  invoiceSerie,
}: CartaCorrecaoDialogProps) {
  const [correcao, setCorrecao] = useState("");
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<CorrectionLetter[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (open) {
      fetchHistory();
      setCorrecao("");
    }
  }, [open, invoiceId]);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    const { data, error } = await supabase
      .from("correction_letters")
      .select("*")
      .eq("invoice_id", invoiceId)
      .order("numero_sequencia", { ascending: false });

    if (!error) {
      setHistory(data || []);
    }
    setLoadingHistory(false);
  };

  const nextSequence = history.length > 0
    ? Math.max(...history.map((h) => h.numero_sequencia)) + 1
    : 1;

  const charCount = correcao.length;
  const isValid = charCount >= 15 && charCount <= 1000;

  const handleSubmit = async () => {
    if (!isValid) return;

    setSending(true);
    const { error } = await supabase.from("correction_letters").insert({
      invoice_id: invoiceId,
      numero_sequencia: nextSequence,
      correcao: correcao.trim(),
      status: "registrada",
    });

    if (error) {
      toast.error("Erro ao registrar carta de correção");
    } else {
      toast.success(`CC-e nº ${nextSequence} registrada com sucesso`);
      setCorrecao("");
      fetchHistory();
    }
    setSending(false);
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pendente: { label: "Pendente", variant: "outline" },
      registrada: { label: "Registrada", variant: "default" },
      rejeitada: { label: "Rejeitada", variant: "destructive" },
    };
    const c = config[status] || config.pendente;
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileEdit className="w-5 h-5" />
            Carta de Correção - NF-e {invoiceNumero}/{invoiceSerie}
          </DialogTitle>
          <DialogDescription>
            A CC-e permite corrigir informações da NF-e sem alterar valores fiscais.
            Máximo de 20 correções por nota. Mín. 15, máx. 1000 caracteres.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* New correction */}
          {nextSequence <= 20 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Nova correção (Seq. {nextSequence})
                </span>
                <span
                  className={`text-xs ${
                    charCount < 15 || charCount > 1000
                      ? "text-destructive"
                      : "text-muted-foreground"
                  }`}
                >
                  {charCount}/1000
                </span>
              </div>
              <Textarea
                placeholder="Descreva a correção a ser feita na nota fiscal..."
                value={correcao}
                onChange={(e) => setCorrecao(e.target.value)}
                rows={4}
                maxLength={1000}
              />
              {charCount > 0 && charCount < 15 && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Mínimo de 15 caracteres ({15 - charCount} restantes)
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
              Limite de 20 cartas de correção atingido para esta NF-e.
            </div>
          )}

          {/* History */}
          {history.length > 0 && (
            <>
              <Separator />
              <div className="flex-1 overflow-hidden flex flex-col">
                <span className="text-sm font-medium mb-2">
                  Histórico ({history.length})
                </span>
                <ScrollArea className="flex-1 max-h-[200px]">
                  <div className="space-y-3 pr-3">
                    {history.map((letter) => (
                      <div
                        key={letter.id}
                        className="rounded-md border p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            Seq. {letter.numero_sequencia}
                          </span>
                          {getStatusBadge(letter.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {letter.correcao}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(letter.data_registro)}
                          </span>
                          {letter.protocolo && (
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              {letter.protocolo}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          {nextSequence <= 20 && (
            <Button onClick={handleSubmit} disabled={!isValid || sending}>
              <Send className="w-4 h-4 mr-2" />
              {sending ? "Registrando..." : "Registrar CC-e"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
