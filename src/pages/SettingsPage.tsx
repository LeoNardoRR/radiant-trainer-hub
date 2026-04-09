import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Copy, Loader2, Ticket, Link2, Moon, Sun, Share2, ExternalLink } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/integrations/supabase/client";
import { useInviteCodes, useCreateInviteCode, useRedeemInviteCode } from "@/hooks/useInviteCodes";
import { toast } from "sonner";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  }),
};

const SettingsPage = () => {
  const { profile, user, role } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [settings, setSettings] = useState({
    session_duration: 60, break_between: 15, cancel_limit_hours: 2,
    max_sessions_per_day: 8, retention_alert_days_light: 3,
    retention_alert_days_moderate: 5, retention_alert_days_critical: 7,
    reminder_hours_before: 2, makeup_days_limit: 7,
  });
  const [saving, setSaving] = useState(false);

  const { data: inviteCodes } = useInviteCodes();
  const createInviteCode = useCreateInviteCode();
  const redeemCode = useRedeemInviteCode();

  useEffect(() => {
    if (profile) {
      setName(profile.full_name || "");
      setPhone(profile.phone || "");
      setSpecialty(profile.specialty || "");
    }
  }, [profile]);

  useEffect(() => {
    if (user && role === "trainer") {
      supabase.from("trainer_settings").select("*").eq("trainer_id", user.id).single()
        .then(({ data }) => {
          if (data) setSettings({
            session_duration: data.session_duration, break_between: data.break_between,
            cancel_limit_hours: data.cancel_limit_hours, max_sessions_per_day: data.max_sessions_per_day,
            retention_alert_days_light: data.retention_alert_days_light,
            retention_alert_days_moderate: data.retention_alert_days_moderate,
            retention_alert_days_critical: data.retention_alert_days_critical,
            reminder_hours_before: data.reminder_hours_before,
            makeup_days_limit: data.makeup_days_limit,
          });
        });
    }
  }, [user, role]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await supabase.from("profiles").update({ full_name: name, phone, specialty }).eq("user_id", user.id);
      if (role === "trainer") {
        await supabase.from("trainer_settings").update(settings).eq("trainer_id", user.id);
      }
      toast.success("Configurações salvas!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Código copiado!");
  };

  const shareInviteLink = async (code: string) => {
    const url = `${window.location.origin}/signup?role=student&invite=${code}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "FitApp — Convite", text: `Use o código ${code} para se vincular a mim no FitApp!`, url });
      } catch {
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Link de convite copiado!");
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-2xl">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">CONFIGURAÇÕES</p>
          <h1 className="font-bold text-2xl md:text-3xl tracking-tight">Preferências</h1>
        </motion.div>

        {/* Profile */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1} className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">PERFIL</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Nome</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="h-12 rounded-xl" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email</label>
              <Input value={profile?.email || ""} disabled className="h-12 rounded-xl opacity-50" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Telefone</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-12 rounded-xl" />
            </div>
            {role === "trainer" && (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Especialidade</label>
                <Input value={specialty} onChange={(e) => setSpecialty(e.target.value)} className="h-12 rounded-xl" />
              </div>
            )}
          </div>
        </motion.div>

        {/* Invite System - Trainer */}
        {role === "trainer" && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1.5} className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-success" />
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">CONVITES</p>
              </div>
              <Button onClick={() => createInviteCode.mutate()} disabled={createInviteCode.isPending}
                variant="outline" className="h-10 text-xs font-medium">
                {createInviteCode.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> :
                  <><Ticket className="h-4 w-4 mr-1.5" /> Gerar código</>}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Gere um código e compartilhe com seu aluno. Ele pode usar o código ou o link direto.
            </p>
            {inviteCodes && inviteCodes.length > 0 && (
              <div className="space-y-2">
                {inviteCodes.slice(0, 5).map((ic) => (
                  <div key={ic.id} className="flex items-center justify-between py-2.5 px-4 border border-border rounded-xl min-h-[48px] bg-secondary/30">
                    <div className="flex items-center gap-3">
                      <span className="text-sm tracking-widest font-bold font-mono">{ic.code}</span>
                      {ic.is_used ? (
                        <span className="text-[9px] text-muted-foreground uppercase bg-muted px-2 py-0.5 rounded-full font-semibold">Usado</span>
                      ) : (
                        <span className="text-[9px] text-success uppercase bg-success/10 px-2 py-0.5 rounded-full font-semibold">Ativo</span>
                      )}
                    </div>
                    {!ic.is_used && (
                      <div className="flex items-center gap-1">
                        <button onClick={() => copyCode(ic.code)} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-secondary rounded-xl transition-colors" title="Copiar código">
                          <Copy className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                        </button>
                        <button onClick={() => shareInviteLink(ic.code)} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-secondary rounded-xl transition-colors" title="Compartilhar link">
                          <Share2 className="h-4 w-4 text-primary" strokeWidth={1.5} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Invite System - Student */}
        {role === "student" && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1.5} className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">VINCULAR A UM PERSONAL</p>
            </div>
            {profile?.trainer_id ? (
              <div className="flex items-center gap-2 bg-success/10 border border-success/20 rounded-xl p-3">
                <Link2 className="h-4 w-4 text-success" />
                <p className="text-sm text-success font-medium">Você já está vinculado a um personal trainer.</p>
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">
                  Insira o código de convite que seu personal compartilhou com você.
                </p>
                <div className="flex gap-2">
                  <Input value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="Ex: ABC123" maxLength={6} className="tracking-widest h-12 uppercase rounded-xl font-bold font-mono" />
                  <Button onClick={() => redeemCode.mutate(inviteCode)} disabled={redeemCode.isPending || inviteCode.length < 4}
                    className="h-12 px-6 rounded-xl">
                    {redeemCode.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Vincular"}
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* Schedule Settings */}
        {role === "trainer" && (
          <>
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2} className="bg-card border border-border rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-warning" />
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">AGENDA</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: "Duração da sessão (min)", key: "session_duration" },
                  { label: "Intervalo entre sessões (min)", key: "break_between" },
                  { label: "Limite cancelamento (horas)", key: "cancel_limit_hours" },
                  { label: "Máx. sessões por dia", key: "max_sessions_per_day" },
                  { label: "Prazo reposição de falta (dias)", key: "makeup_days_limit" },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{field.label}</label>
                    <Input type="number" value={settings[field.key as keyof typeof settings]}
                      onChange={(e) => setSettings({ ...settings, [field.key]: Number(e.target.value) })}
                      className="h-12 rounded-xl" />
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3} className="bg-card border border-border rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-risk" />
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">RETENÇÃO</p>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Alerta leve (dias)", key: "retention_alert_days_light" },
                  { label: "Alerta moderado (dias)", key: "retention_alert_days_moderate" },
                  { label: "Alerta crítico (dias)", key: "retention_alert_days_critical" },
                  { label: "Lembrete antes do treino (h)", key: "reminder_hours_before" },
                ].map((field) => (
                  <div key={field.key} className="flex items-center justify-between py-2 border-b border-border last:border-b-0 min-h-[48px]">
                    <span className="text-sm">{field.label}</span>
                    <Input type="number" value={settings[field.key as keyof typeof settings]}
                      onChange={(e) => setSettings({ ...settings, [field.key]: Number(e.target.value) })}
                      className="w-20 text-center h-10 rounded-xl" />
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}

        {/* Appearance */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3.5} className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">APARÊNCIA</p>
          </div>
          <div className="flex items-center justify-between py-2 min-h-[48px]">
            <div>
              <span className="text-sm font-medium">Modo escuro</span>
              <p className="text-xs text-muted-foreground">Alterne entre tema claro e escuro</p>
            </div>
            <button onClick={toggleTheme}
              className="w-14 h-8 rounded-full relative transition-colors duration-300 flex items-center px-1"
              style={{ background: theme === "dark" ? "hsl(var(--primary))" : "hsl(var(--muted))" }}>
              <div className={`w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center transition-transform duration-300 ${theme === "dark" ? "translate-x-6" : "translate-x-0"}`}>
                {theme === "dark" ? <Moon className="h-3.5 w-3.5 text-primary" /> : <Sun className="h-3.5 w-3.5 text-warning" />}
              </div>
            </button>
          </div>
        </motion.div>

        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={4}>
          <Button onClick={handleSave} disabled={saving} className="h-12 w-full sm:w-auto px-8 text-base rounded-xl">
            {saving ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" />Salvando...</>
            ) : (
              "Salvar alterações"
            )}
          </Button>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;
