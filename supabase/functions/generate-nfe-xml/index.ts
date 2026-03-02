import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Utility helpers ──────────────────────────────────────────────

function pad(n: number, len = 2) {
  return String(n).padStart(len, "0");
}

function fmtDate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}${getTimezoneOffset(d)}`;
}

function getTimezoneOffset(d: Date) {
  const offset = -d.getTimezoneOffset();
  const sign = offset >= 0 ? "+" : "-";
  const h = pad(Math.floor(Math.abs(offset) / 60));
  const m = pad(Math.abs(offset) % 60);
  return `${sign}${h}:${m}`;
}

function fmtNum(v: number, dec = 2) {
  return v.toFixed(dec);
}

function escXml(s: string | null | undefined): string {
  if (!s) return "";
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function onlyDigits(s: string): string {
  return s.replace(/\D/g, "");
}

// ── Access key generation (44 digits) ──

function generateAccessKey(params: {
  cUF: string;
  aamm: string;
  cnpj: string;
  mod: string;
  serie: number;
  nNF: number;
  tpEmis: string;
  cNF: string;
}) {
  const key =
    params.cUF +
    params.aamm +
    onlyDigits(params.cnpj) +
    params.mod +
    String(params.serie).padStart(3, "0") +
    String(params.nNF).padStart(9, "0") +
    params.tpEmis +
    params.cNF;
  const dv = calcMod11(key);
  return key + dv;
}

function calcMod11(key: string): string {
  let weight = 2;
  let sum = 0;
  for (let i = key.length - 1; i >= 0; i--) {
    sum += parseInt(key[i]) * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }
  const remainder = sum % 11;
  const dv = remainder < 2 ? 0 : 11 - remainder;
  return String(dv);
}

// ── UF code map ──

const UF_CODES: Record<string, string> = {
  AC: "12", AL: "27", AP: "16", AM: "13", BA: "29", CE: "23", DF: "53",
  ES: "32", GO: "52", MA: "21", MT: "51", MS: "50", MG: "31", PA: "15",
  PB: "25", PR: "41", PE: "26", PI: "22", RJ: "33", RN: "24", RS: "43",
  RO: "11", RR: "14", SC: "42", SP: "35", SE: "28", TO: "17",
};

// ── XML generation ──

function buildNFeXml(invoice: any, company: any, client: any, items: any[]): { xml: string; chaveAcesso: string } {
  const dataEmissao = new Date(invoice.data_emissao);
  const cUF = UF_CODES[company.uf] || "35";
  const aamm = `${String(dataEmissao.getFullYear()).slice(2)}${pad(dataEmissao.getMonth() + 1)}`;
  const cNF = String(invoice.numero).padStart(8, "0");
  const tpAmb = company.ambiente === "producao" ? "1" : "2";

  const chaveAcesso = generateAccessKey({
    cUF,
    aamm,
    cnpj: onlyDigits(company.cnpj),
    mod: "55",
    serie: invoice.serie,
    nNF: invoice.numero,
    tpEmis: "1",
    cNF,
  });

  const regimeTrib =
    company.regime_tributario === "simples_nacional" ? "1" :
    company.regime_tributario === "lucro_presumido" ? "2" : "3";

  const tipoDoc = client.tipo_documento === "cpf" ? "1" : "2";

  // Build items XML
  const itensXml = items.map((item: any, idx: number) => {
    const cst = item.cst || "00";
    const csosn = item.csosn || "102";
    const useCSOSN = company.regime_tributario === "simples_nacional";

    return `<det nItem="${idx + 1}">
      <prod>
        <cProd>${escXml(item.codigo)}</cProd>
        <cEAN>SEM GTIN</cEAN>
        <xProd>${escXml(item.descricao)}</xProd>
        <NCM>${escXml(item.ncm)}</NCM>
        <CFOP>${escXml(item.cfop)}</CFOP>
        <uCom>${escXml(item.unidade)}</uCom>
        <qCom>${fmtNum(item.quantidade, 4)}</qCom>
        <vUnCom>${fmtNum(item.valor_unitario, 10)}</vUnCom>
        <vProd>${fmtNum(item.valor_total)}</vProd>
        <cEANTrib>SEM GTIN</cEANTrib>
        <uTrib>${escXml(item.unidade)}</uTrib>
        <qTrib>${fmtNum(item.quantidade, 4)}</qTrib>
        <vUnTrib>${fmtNum(item.valor_unitario, 10)}</vUnTrib>
        <indTot>1</indTot>
      </prod>
      <imposto>
        <ICMS>${useCSOSN
          ? `<ICMSSN${csosn === "102" ? "102" : "900"}>
              <orig>${escXml(item.origem)}</orig>
              <CSOSN>${escXml(csosn)}</CSOSN>
            </ICMSSN${csosn === "102" ? "102" : "900"}>`
          : `<ICMS${cst}>
              <orig>${escXml(item.origem)}</orig>
              <CST>${escXml(cst)}</CST>
              <modBC>0</modBC>
              <vBC>${fmtNum(item.icms_base)}</vBC>
              <pICMS>${fmtNum(item.icms_aliquota)}</pICMS>
              <vICMS>${fmtNum(item.icms_valor)}</vICMS>
            </ICMS${cst}>`
        }</ICMS>
        <IPI>
          <cEnq>999</cEnq>
          <IPITrib>
            <CST>50</CST>
            <vBC>${fmtNum(item.ipi_base)}</vBC>
            <pIPI>${fmtNum(item.ipi_aliquota)}</pIPI>
            <vIPI>${fmtNum(item.ipi_valor)}</vIPI>
          </IPITrib>
        </IPI>
        <PIS>
          <PISAliq>
            <CST>01</CST>
            <vBC>${fmtNum(item.pis_base)}</vBC>
            <pPIS>${fmtNum(item.pis_aliquota, 4)}</pPIS>
            <vPIS>${fmtNum(item.pis_valor)}</vPIS>
          </PISAliq>
        </PIS>
        <COFINS>
          <COFINSAliq>
            <CST>01</CST>
            <vBC>${fmtNum(item.cofins_base)}</vBC>
            <pCOFINS>${fmtNum(item.cofins_aliquota, 4)}</pCOFINS>
            <vCOFINS>${fmtNum(item.cofins_valor)}</vCOFINS>
          </COFINSAliq>
        </COFINS>
      </imposto>
    </det>`;
  }).join("\n    ");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<NFe xmlns="http://www.portalfiscal.inf.br/nfe">
  <infNFe versao="4.00" Id="NFe${chaveAcesso}">
    <ide>
      <cUF>${cUF}</cUF>
      <cNF>${cNF}</cNF>
      <natOp>${escXml(invoice.natureza_operacao)}</natOp>
      <mod>55</mod>
      <serie>${invoice.serie}</serie>
      <nNF>${invoice.numero}</nNF>
      <dhEmi>${fmtDate(dataEmissao)}</dhEmi>
      <dhSaiEnt>${fmtDate(dataEmissao)}</dhSaiEnt>
      <tpNF>1</tpNF>
      <idDest>1</idDest>
      <cMunFG>${escXml(company.codigo_municipio)}</cMunFG>
      <tpImp>1</tpImp>
      <tpEmis>1</tpEmis>
      <cDV>${chaveAcesso[43]}</cDV>
      <tpAmb>${tpAmb}</tpAmb>
      <finNFe>1</finNFe>
      <indFinal>1</indFinal>
      <indPres>1</indPres>
      <procEmi>0</procEmi>
      <verProc>1.0.0</verProc>
    </ide>
    <emit>
      <CNPJ>${onlyDigits(company.cnpj)}</CNPJ>
      <xNome>${escXml(company.razao_social)}</xNome>
      ${company.nome_fantasia ? `<xFant>${escXml(company.nome_fantasia)}</xFant>` : ""}
      <enderEmit>
        <xLgr>${escXml(company.logradouro)}</xLgr>
        <nro>${escXml(company.numero)}</nro>
        ${company.complemento ? `<xCpl>${escXml(company.complemento)}</xCpl>` : ""}
        <xBairro>${escXml(company.bairro)}</xBairro>
        <cMun>${escXml(company.codigo_municipio)}</cMun>
        <xMun>${escXml(company.cidade)}</xMun>
        <UF>${escXml(company.uf)}</UF>
        <CEP>${onlyDigits(company.cep)}</CEP>
        <cPais>1058</cPais>
        <xPais>Brasil</xPais>
      </enderEmit>
      ${company.inscricao_estadual ? `<IE>${onlyDigits(company.inscricao_estadual)}</IE>` : "<IE/>"}
      <CRT>${regimeTrib}</CRT>
    </emit>
    <dest>
      <${tipoDoc === "1" ? "CPF" : "CNPJ"}>${onlyDigits(client.documento)}</${tipoDoc === "1" ? "CPF" : "CNPJ"}>
      <xNome>${escXml(client.nome)}</xNome>
      <enderDest>
        <xLgr>${escXml(client.logradouro || "")}</xLgr>
        <nro>${escXml(client.numero || "S/N")}</nro>
        ${client.complemento ? `<xCpl>${escXml(client.complemento)}</xCpl>` : ""}
        <xBairro>${escXml(client.bairro || "")}</xBairro>
        <cMun>${escXml(client.codigo_municipio || company.codigo_municipio)}</cMun>
        <xMun>${escXml(client.cidade || "")}</xMun>
        <UF>${escXml(client.uf || company.uf)}</UF>
        <CEP>${onlyDigits(client.cep || "00000000")}</CEP>
        <cPais>1058</cPais>
        <xPais>Brasil</xPais>
      </enderDest>
      <indIEDest>9</indIEDest>
      ${client.email ? `<email>${escXml(client.email)}</email>` : ""}
    </dest>
    ${itensXml}
    <total>
      <ICMSTot>
        <vBC>${fmtNum(invoice.valor_icms > 0 ? invoice.valor_produtos : 0)}</vBC>
        <vICMS>${fmtNum(invoice.valor_icms)}</vICMS>
        <vICMSDeson>0.00</vICMSDeson>
        <vFCPUFDest>0.00</vFCPUFDest>
        <vICMSUFDest>0.00</vICMSUFDest>
        <vICMSUFRemet>0.00</vICMSUFRemet>
        <vFCP>0.00</vFCP>
        <vBCST>0.00</vBCST>
        <vST>0.00</vST>
        <vFCPST>0.00</vFCPST>
        <vFCPSTRet>0.00</vFCPSTRet>
        <vProd>${fmtNum(invoice.valor_produtos)}</vProd>
        <vFrete>${fmtNum(invoice.valor_frete)}</vFrete>
        <vSeg>${fmtNum(invoice.valor_seguro)}</vSeg>
        <vDesc>${fmtNum(invoice.valor_desconto)}</vDesc>
        <vII>0.00</vII>
        <vIPI>${fmtNum(invoice.valor_ipi)}</vIPI>
        <vIPIDevol>0.00</vIPIDevol>
        <vPIS>${fmtNum(invoice.valor_pis)}</vPIS>
        <vCOFINS>${fmtNum(invoice.valor_cofins)}</vCOFINS>
        <vOutro>${fmtNum(invoice.valor_outras_despesas)}</vOutro>
        <vNF>${fmtNum(invoice.valor_total)}</vNF>
      </ICMSTot>
    </total>
    <transp>
      <modFrete>9</modFrete>
    </transp>
    <pag>
      <detPag>
        <tPag>99</tPag>
        <vPag>${fmtNum(invoice.valor_total)}</vPag>
      </detPag>
    </pag>
    ${invoice.informacoes_complementares ? `<infAdic><infCpl>${escXml(invoice.informacoes_complementares)}</infCpl></infAdic>` : ""}
  </infNFe>
</NFe>`;

  return { xml, chaveAcesso };
}

// ── Digital Signature (XMLDSig with RSA-SHA1) ──

async function signXml(xml: string, certBytes: Uint8Array, certPassword: string): Promise<string> {
  // Import node-forge for PKCS#12 parsing
  const forge = await import("https://esm.sh/node-forge@1.3.1");

  // Parse PKCS#12
  const p12Der = forge.util.decode64(btoa(String.fromCharCode(...certBytes)));
  const p12Asn1 = forge.asn1.fromDer(p12Der);
  const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, certPassword);

  // Extract private key and certificate
  let privateKey: any = null;
  let cert: any = null;

  for (const safeContent of p12.safeContents) {
    for (const safeBag of safeContent.safeBags) {
      if (safeBag.type === forge.pki.oids.pkcs8ShroudedKeyBag) {
        privateKey = safeBag.key;
      } else if (safeBag.type === forge.pki.oids.certBag) {
        cert = safeBag.cert;
      }
    }
  }

  if (!privateKey || !cert) {
    throw new Error("Certificado inválido: não foi possível extrair chave privada e certificado");
  }

  // Get X509 certificate in DER then base64
  const certDer = forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes();
  const certB64 = forge.util.encode64(certDer);

  // Extract the infNFe for signing
  const infNFeMatch = xml.match(/<infNFe[^>]*>[\s\S]*?<\/infNFe>/);
  if (!infNFeMatch) throw new Error("infNFe não encontrado no XML");

  // Canonical form (simplified C14N - remove extra whitespace between tags)
  const infNFeCanonical = infNFeMatch[0]
    .replace(/>\s+</g, "><")
    .replace(/\s+/g, " ")
    .trim();

  // SHA-1 digest of infNFe
  const md = forge.md.sha1.create();
  md.update(infNFeCanonical, "utf8");
  const digestValue = forge.util.encode64(md.digest().getBytes());

  // Build SignedInfo
  const infNFeId = xml.match(/Id="(NFe\d+)"/)?.[1] || "";
  const signedInfo = `<SignedInfo xmlns="http://www.w3.org/2000/09/xmldsig#"><CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/><SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"/><Reference URI="#${infNFeId}"><Transforms><Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/><Transform Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/></Transforms><DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/><DigestValue>${digestValue}</DigestValue></Reference></SignedInfo>`;

  // Sign the SignedInfo
  const sigMd = forge.md.sha1.create();
  sigMd.update(signedInfo, "utf8");
  const signature = privateKey.sign(sigMd);
  const signatureValue = forge.util.encode64(signature);

  // Build Signature block
  const signatureBlock = `<Signature xmlns="http://www.w3.org/2000/09/xmldsig#">${signedInfo}<SignatureValue>${signatureValue}</SignatureValue><KeyInfo><X509Data><X509Certificate>${certB64}</X509Certificate></X509Data></KeyInfo></Signature>`;

  // Insert signature before </NFe>
  const signedXml = xml.replace("</NFe>", `${signatureBlock}</NFe>`);

  return signedXml;
}

// ── Main handler ──

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invoice_id } = await req.json();
    if (!invoice_id) {
      return new Response(JSON.stringify({ error: "invoice_id é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization")!;

    // User client for RLS-protected queries
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    // Admin client for storage access
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Fetch invoice with company and client
    const { data: invoice, error: invError } = await userClient
      .from("invoices")
      .select("*, companies(*), clients(*)")
      .eq("id", invoice_id)
      .single();

    if (invError || !invoice) {
      return new Response(JSON.stringify({ error: "Nota fiscal não encontrada" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch items
    const { data: items, error: itemsError } = await userClient
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", invoice_id)
      .order("numero_item");

    if (itemsError || !items?.length) {
      return new Response(JSON.stringify({ error: "Nenhum item encontrado na nota fiscal" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const company = invoice.companies;
    const client = invoice.clients;

    // Generate XML
    const { xml, chaveAcesso } = buildNFeXml(invoice, company, client, items);

    let finalXml = xml;

    // Try to sign if certificate is available
    if (company.certificate_file_path && company.certificate_password_hash) {
      try {
        // Download certificate from storage
        const { data: certData, error: certError } = await adminClient.storage
          .from("certificates")
          .download(company.certificate_file_path);

        if (certError) throw new Error("Erro ao baixar certificado: " + certError.message);

        const certBytes = new Uint8Array(await certData.arrayBuffer());
        finalXml = await signXml(xml, certBytes, company.certificate_password_hash);
      } catch (signError: any) {
        console.error("Erro na assinatura digital:", signError);
        // Return unsigned XML with warning
        const xmlPath = `${company.id}/${invoice_id}.xml`;
        await adminClient.storage.from("certificates").upload(
          xmlPath,
          new Blob([xml], { type: "application/xml" }),
          { upsert: true }
        );

        await userClient.from("invoices").update({
          chave_acesso: chaveAcesso,
          xml_path: xmlPath,
        }).eq("id", invoice_id);

        return new Response(JSON.stringify({
          success: true,
          warning: "XML gerado sem assinatura digital: " + signError.message,
          chave_acesso: chaveAcesso,
          xml_path: xmlPath,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Store XML in storage
    const xmlPath = `${company.id}/${invoice_id}.xml`;
    const { error: uploadError } = await adminClient.storage
      .from("certificates")
      .upload(xmlPath, new Blob([finalXml], { type: "application/xml" }), { upsert: true });

    if (uploadError) {
      return new Response(JSON.stringify({ error: "Erro ao salvar XML: " + uploadError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update invoice with access key and xml path
    await userClient.from("invoices").update({
      chave_acesso: chaveAcesso,
      xml_path: xmlPath,
      status: company.certificate_file_path ? "pendente" : "rascunho",
    }).eq("id", invoice_id);

    return new Response(JSON.stringify({
      success: true,
      chave_acesso: chaveAcesso,
      xml_path: xmlPath,
      signed: !!company.certificate_file_path,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("Erro:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
