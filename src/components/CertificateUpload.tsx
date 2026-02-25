import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Shield, Upload, CheckCircle, Trash2, Loader2, Eye, EyeOff } from "lucide-react";

interface CertificateUploadProps {
  companyId: string;
  currentCertificatePath: string | null;
  onUploaded: () => void;
}

export function CertificateUpload({ companyId, currentCertificatePath, onUploaded }: CertificateUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.name.toLowerCase().endsWith(".pfx") && !selected.name.toLowerCase().endsWith(".p12")) {
      toast.error("Selecione um arquivo de certificado A1 (.pfx ou .p12)");
      return;
    }

    if (selected.size > 10 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo: 10MB");
      return;
    }

    setFile(selected);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Selecione um arquivo de certificado");
      return;
    }

    if (!password.trim()) {
      toast.error("Informe a senha do certificado");
      return;
    }

    setUploading(true);

    try {
      const filePath = `${companyId}/certificate.pfx`;

      // Remove old certificate if exists
      if (currentCertificatePath) {
        await supabase.storage.from("certificates").remove([currentCertificatePath]);
      }

      // Upload new certificate
      const { error: uploadError } = await supabase.storage
        .from("certificates")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      // Update company with certificate path and password hash
      const { error: updateError } = await supabase
        .from("companies")
        .update({
          certificate_file_path: filePath,
          certificate_password_hash: password, // In production, hash this server-side
        })
        .eq("id", companyId);

      if (updateError) {
        // Rollback: remove uploaded file
        await supabase.storage.from("certificates").remove([filePath]);
        throw updateError;
      }

      toast.success("Certificado digital instalado com sucesso!");
      setFile(null);
      setPassword("");
      onUploaded();
    } catch (error: any) {
      console.error("Erro ao enviar certificado:", error);
      toast.error("Erro ao enviar certificado: " + (error.message || "Erro desconhecido"));
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm("Tem certeza que deseja remover o certificado digital?")) return;

    setRemoving(true);

    try {
      if (currentCertificatePath) {
        await supabase.storage.from("certificates").remove([currentCertificatePath]);
      }

      const { error } = await supabase
        .from("companies")
        .update({
          certificate_file_path: null,
          certificate_password_hash: null,
        })
        .eq("id", companyId);

      if (error) throw error;

      toast.success("Certificado removido com sucesso");
      onUploaded();
    } catch (error: any) {
      toast.error("Erro ao remover certificado: " + error.message);
    } finally {
      setRemoving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="w-5 h-5 mr-2" />
          Certificado Digital A1
        </CardTitle>
        <CardDescription>
          Faça upload do certificado digital A1 (.pfx) para assinar as NF-e eletronicamente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentCertificatePath ? (
          <div className="flex items-center justify-between p-4 rounded-lg border border-success/30 bg-success/5">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-success" />
              <div>
                <p className="font-medium text-sm">Certificado instalado</p>
                <p className="text-xs text-muted-foreground">
                  Pronto para assinar NF-e
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={removing}
              className="text-destructive hover:text-destructive"
            >
              {removing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </Button>
          </div>
        ) : (
          <div className="p-4 rounded-lg border border-warning/30 bg-warning/5">
            <p className="text-sm text-warning font-medium">Nenhum certificado instalado</p>
            <p className="text-xs text-muted-foreground mt-1">
              É necessário instalar um certificado digital A1 para emitir NF-e
            </p>
          </div>
        )}

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="certificate-file">
              {currentCertificatePath ? "Substituir certificado" : "Arquivo do certificado"} (.pfx / .p12)
            </Label>
            <Input
              id="certificate-file"
              type="file"
              accept=".pfx,.p12"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
          </div>

          {file && (
            <>
              <div className="space-y-2">
                <Label htmlFor="certificate-password">Senha do certificado</Label>
                <div className="relative">
                  <Input
                    id="certificate-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Senha do certificado digital"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <Button onClick={handleUpload} disabled={uploading} className="w-full">
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Instalar certificado
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
