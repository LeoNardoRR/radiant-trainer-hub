import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Copy, Loader2, Ticket, Link2 } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useInviteCodes, useCreateInviteCode, useRedeemInviteCode } from "@/hooks/useInviteCodes";
import { toast } from "sonner";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  }),
};

const SettingsPage = () => {
  const { profile, user, role } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [settings, setSettings] = useState({
    session_duration: 60, break_between: 15, cancel_limit_hours: 2,
    max_sessions_per_day: 8, retention_alert_days_light: 3,
    retention_alert_days_moderate: 5, retention_alert_days_critical: 7,
    reminder_hours_before: 2,
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

  return (
    <AppLayout>
      <div className="space-y-6 md:space-y-8 max-w-2xl">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          <p className="text-editorial-sm text-muted-foreground mb-1">CONFIGURAÇÕES</p>
          <h1 className="font-display font-semibold text-2xl md:text-3xl tracking-tight">Preferências</h1>
        </motion.div>

        {/* Profile */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1} className="card-editorial space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <p className="text-editorial-sm text-xs">PERFIL</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-body font-medium text-muted-foreground mb-1.5 block">Nome</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="font-body h-12 rounded-lg" />
            </div>
            <div>
              <label className="text-xs font-body font-medium text-muted-foreground mb-1.5 block">Email</label>
              <Input value={profile?.email || ""} disabled className="font-body h-12 rounded-lg opacity-50" />
            </div>
            <div>
              <label className="text-xs font-body font-medium text-muted-foreground mb-1.5 block">Telefone</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="font-body h-12 rounded-lg" />
            </div>
            {role === "trainer" && (
              <div>
                <label className="text-xs font-body font-medium text-muted-foreground mb-1.5 block">Especialidade</label>
                <Input value={specialty} onChange={(e) => setSpecialty(e.target.value)} className="font-body h-12 rounded-lg" />
              </div>
            )}
          </div>
        </motion.div>

        {/* Invite System - Trainer */}
        {role === "trainer" && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1.5} className="card-editorial space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-success" />
                <p className="text-editorial-sm text-xs">CONVITES</p>
              </div>
              <Button onClick={() => createInviteCode.mutate()} disabled={createInviteCode.isPending}
                variant="outline" className="h-10 text-xs font-display font-medium">
                {createInviteCode.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> :
                  <><Ticket className="h-4 w-4 mr-1.5" /> Gerar código</>}
              </Button>
            </div>
            <p className="text-xs font-body text-muted-foreground">
              Gere um código e compartilhe com seu aluno para que ele se vincule a você.
            </p>
            {inviteCodes && inviteCodes.length > 0 && (
              <div className="space-y-2">
                {inviteCodes.slice(0, 5).map((ic) => (
                  <div key={ic.id} className="flex items-center justify-between py-2.5 px-4 border border-border rounded-lg min-h-[48px] bg-muted/30">
                    <div className="flex items-center gap-3">
                      <span className="font-display text-sm tracking-widest font-bold">{ic.code}</span>
                      {ic.is_used ? (
                        <span className="text-[9px] text-muted-foreground font-display uppercase bg-muted px-2 py-0.5 rounded-full">Usado</span>
                      ) : (
                        <span className="text-[9px] text-success font-display uppercase bg-success/10 px-2 py-0.5 rounded-full font-medium">Ativo</span>
                      )}
                    </div>
                    {!ic.is_used && (
                      <button onClick={() => copyCode(ic.code)} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-accent rounded-lg transition-colors">
                        <Copy className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Invite System - Student */}
        {role === "student" && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1.5} className="card-editorial space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <p className="text-editorial-sm text-xs">VINCULAR A UM PERSONAL</p>
            </div>
            {profile?.trainer_id ? (
              <div className="flex items-center gap-2 bg-success/10 border border-success/20 rounded-lg p-3">
                <Link2 className="h-4 w-4 text-success" />
                <p className="text-sm font-body text-success font-medium">Você já está vinculado a um personal trainer.</p>
              </div>
            ) : (
              <>
                <p className="text-xs font-body text-muted-foreground">
                  Insira o código de convite que seu personal compartilhou com você.
                </p>
                <div className="flex gap-2">
                  <Input value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="Ex: ABC123" maxLength={6} className="font-display tracking-widest h-12 uppercase rounded-lg font-bold" />
                  <Button onClick={() => redeemCode.mutate(inviteCode)} disabled={redeemCode.isPending || inviteCode.length < 4}
                    className="h-12 px-6">
                    {redeemCode.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Vincular"}
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* Schedule Settings - Trainer only */}
        {role === "trainer" && (
          <>
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2} className="card-editorial space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-warning" />
                <p className="text-editorial-sm text-xs">AGENDA</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: "Duração da sessão (min)", key: "session_duration" },
                  { label: "Intervalo entre sessões (min)", key: "break_between" },
                  { label: "Limite cancelamento (horas)", key: "cancel_limit_hours" },
                  { label: "Máx. sessões por dia", key: "max_sessions_per_day" },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="text-xs font-body font-medium text-muted-foreground mb-1.5 block">{field.label}</label>
                    <Input type="number" value={settings[field.key as keyof typeof settings]}
                      onChange={(e) => setSettings({ ...settings, [field.key]: Number(e.target.value) })}
                      className="font-body h-12 rounded-lg" />
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3} className="card-editorial space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-risk" />
                <p className="text-editorial-sm text-xs">NOTIFICAÇÕES DE RETENÇÃO</p>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Alerta leve após (dias)", key: "retention_alert_days_light" },
                  { label: "Alerta moderado após (dias)", key: "retention_alert_days_moderate" },
                  { label: "Alerta crítico após (dias)", key: "retention_alert_days_critical" },
                  { label: "Lembrete antes do treino (horas)", key: "reminder_hours_before" },
                ].map((field) => (
                  <div key={field.key} className="flex items-center justify-between py-2 border-b border-border min-h-[48px]">
                    <span className="text-sm font-body">{field.label}</span>
                    <Input type="number" value={settings[field.key as keyof typeof settings]}
                      onChange={(e) => setSettings({ ...settings, [field.key]: Number(e.target.value) })}
                      className="w-20 font-body text-center h-10 rounded-lg" />
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}

        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={4}>
          <Button onClick={handleSave} disabled={saving} className="h-12 w-full sm:w-auto px-8 text-base">
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
