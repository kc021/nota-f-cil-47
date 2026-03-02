import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SefazResponse {
  success: boolean;
  cStat: string;
  xMotivo: string;
  protocolo?: string;
  data_autorizacao?: string;
  ambiente?: string;
}

export async function transmitNFe(invoiceId: string): Promise<SefazResponse | null> {
  const toastId = toast.loading("Transmitindo NF-e para a SEFAZ...");

  try {
    const { data, error } = await supabase.functions.invoke("sefaz-simulator", {
      body: { invoice_id: invoiceId, action: "transmit" },
    });

    if (error) throw error;
    if (data.error) throw new Error(data.error);

    if (data.success) {
      toast.success(
        `NF-e autorizada! Protocolo: ${data.protocolo}`,
        { id: toastId, duration: 5000 }
      );
    } else {
      toast.error(
        `Rejeitada (${data.cStat}): ${data.xMotivo}`,
        { id: toastId, duration: 8000 }
      );
    }

    return data as SefazResponse;
  } catch (err: any) {
    toast.error(`Erro na transmissão: ${err.message}`, { id: toastId });
    return null;
  }
}

export async function consultNFe(invoiceId: string): Promise<SefazResponse | null> {
  const toastId = toast.loading("Consultando status na SEFAZ...");

  try {
    const { data, error } = await supabase.functions.invoke("sefaz-simulator", {
      body: { invoice_id: invoiceId, action: "consult" },
    });

    if (error) throw error;
    if (data.error) throw new Error(data.error);

    const ambLabel = data.ambiente === "producao" ? "Produção" : "Homologação";
    toast.info(
      `[${ambLabel}] Status ${data.cStat}: ${data.xMotivo}`,
      { id: toastId, duration: 5000 }
    );

    return data as SefazResponse;
  } catch (err: any) {
    toast.error(`Erro na consulta: ${err.message}`, { id: toastId });
    return null;
  }
}
