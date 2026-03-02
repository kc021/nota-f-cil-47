import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Simulate SEFAZ processing delay (1-3 seconds)
function randomDelay(): Promise<void> {
  const ms = 1000 + Math.random() * 2000;
  return new Promise((r) => setTimeout(r, ms));
}

// Generate realistic protocol number (15 digits: date prefix + sequence)
function generateProtocol(): string {
  const now = new Date();
  const prefix =
    String(now.getFullYear()).slice(2) +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0") +
    String(now.getHours()).padStart(2, "0") +
    String(now.getMinutes()).padStart(2, "0");
  const seq = String(Math.floor(Math.random() * 999999999)).padStart(9, "0");
  return prefix + seq;
}

// Simulate SEFAZ validation rules
function validateInvoice(invoice: any, items: any[]): { valid: boolean; rejeicao?: string; cStat?: string } {
  // Check for required fields
  if (!invoice.chave_acesso) {
    return { valid: false, rejeicao: "Rejeição 225: Falha no schema XML - Chave de acesso não informada", cStat: "225" };
  }

  if (!items || items.length === 0) {
    return { valid: false, rejeicao: "Rejeição 478: NF-e não possui itens", cStat: "478" };
  }

  if (invoice.valor_total <= 0) {
    return { valid: false, rejeicao: "Rejeição 529: Valor total da NF-e igual a zero", cStat: "529" };
  }

  // Simulate ~5% rejection rate in homologation for realism
  if (Math.random() < 0.05) {
    const rejeicoes = [
      { msg: "Rejeição 539: Duplicidade de NF-e com diferença de Chave de Acesso", cStat: "539" },
      { msg: "Rejeição 602: CNPJ do emitente com situação irregular perante o cadastro", cStat: "602" },
      { msg: "Rejeição 243: XML mal formado", cStat: "243" },
    ];
    const rej = rejeicoes[Math.floor(Math.random() * rejeicoes.length)];
    return { valid: false, rejeicao: rej.msg, cStat: rej.cStat };
  }

  return { valid: true };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invoice_id, action } = await req.json();

    if (!invoice_id) {
      return new Response(
        JSON.stringify({ error: "invoice_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const authHeader = req.headers.get("Authorization")!;

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    // Fetch invoice
    const { data: invoice, error: invErr } = await userClient
      .from("invoices")
      .select("*, companies(*)")
      .eq("id", invoice_id)
      .single();

    if (invErr || !invoice) {
      return new Response(
        JSON.stringify({ error: "Nota fiscal não encontrada" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── ACTION: transmit ──
    if (action === "transmit") {
      if (invoice.status !== "pendente" && invoice.status !== "rascunho") {
        return new Response(
          JSON.stringify({ error: `Nota fiscal com status '${invoice.status}' não pode ser transmitida` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Fetch items for validation
      const { data: items } = await userClient
        .from("invoice_items")
        .select("*")
        .eq("invoice_id", invoice_id);

      // Simulate SEFAZ processing
      await randomDelay();

      const validation = validateInvoice(invoice, items || []);

      if (!validation.valid) {
        // Rejected
        await userClient.from("invoices").update({
          status: "rejeitada" as const,
        }).eq("id", invoice_id);

        return new Response(
          JSON.stringify({
            success: false,
            cStat: validation.cStat,
            xMotivo: validation.rejeicao,
            ambiente: invoice.companies?.ambiente || "homologacao",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Authorized
      const protocolo = generateProtocol();
      const now = new Date().toISOString();

      await userClient.from("invoices").update({
        status: "autorizada" as const,
        protocolo_autorizacao: protocolo,
        data_autorizacao: now,
      }).eq("id", invoice_id);

      return new Response(
        JSON.stringify({
          success: true,
          cStat: "100",
          xMotivo: "Autorizado o uso da NF-e",
          protocolo,
          data_autorizacao: now,
          ambiente: invoice.companies?.ambiente || "homologacao",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── ACTION: consult ──
    if (action === "consult") {
      await randomDelay();

      const statusMap: Record<string, { cStat: string; xMotivo: string }> = {
        autorizada: { cStat: "100", xMotivo: "Autorizado o uso da NF-e" },
        cancelada: { cStat: "101", xMotivo: "Cancelamento de NF-e homologado" },
        rejeitada: { cStat: "999", xMotivo: "Rejeição não especificada" },
        rascunho: { cStat: "999", xMotivo: "NF-e não encontrada na base da SEFAZ" },
        pendente: { cStat: "105", xMotivo: "Lote em processamento" },
      };

      const info = statusMap[invoice.status] || statusMap.rascunho;

      return new Response(
        JSON.stringify({
          success: true,
          cStat: info.cStat,
          xMotivo: info.xMotivo,
          chave_acesso: invoice.chave_acesso,
          protocolo: invoice.protocolo_autorizacao,
          status: invoice.status,
          ambiente: invoice.companies?.ambiente || "homologacao",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── ACTION: cancel ──
    if (action === "cancel") {
      if (invoice.status !== "autorizada") {
        return new Response(
          JSON.stringify({ error: "Apenas notas autorizadas podem ser canceladas via SEFAZ" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { motivo } = await req.json().catch(() => ({ motivo: "" }));

      await randomDelay();

      const protocolo = generateProtocol();
      const now = new Date().toISOString();

      await userClient.from("invoices").update({
        status: "cancelada" as const,
        data_cancelamento: now,
        motivo_cancelamento: motivo || "Cancelamento solicitado pelo emitente",
      }).eq("id", invoice_id);

      return new Response(
        JSON.stringify({
          success: true,
          cStat: "135",
          xMotivo: "Evento registrado e vinculado a NF-e",
          protocolo,
          data_cancelamento: now,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Ação inválida. Use: transmit, consult, cancel" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Erro:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
