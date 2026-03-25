import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import AppLayout from "@/components/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  }),
};

const SettingsPage = () => {
  const { profile, user } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [settings, setSettings] = useState({
    session_duration: 60,
    break_between: 15,
    cancel_limit_hours: 2,
    max_sessions_per_day: 8,
    retention_alert_days_light: 3,
    retention_alert_days_moderate: 5,
    retention_alert_days_critical: 7,
    reminder_hours_before: 2,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.full_name || "");
      setPhone(profile.phone || "");
      setSpecialty(profile.specialty || "");
    }
  }, [profile]);

  useEffect(() => {
    if (user) {
      supabase
        .from("trainer_settings")
        .select("*")
        .eq("trainer_id", user.id)
        .single()
        .then(({ data }) => {
          if (data) setSettings({
            session_duration: data.session_duration,
            break_between: data.break_between,
            cancel_limit_hours: data.cancel_limit_hours,
            max_sessions_per_day: data.max_sessions_per_day,
            retention_alert_days_light: data.retention_alert_days_light,
            retention_alert_days_moderate: data.retention_alert_days_moderate,
            retention_alert_days_critical: data.retention_alert_days_critical,
            reminder_hours_before: data.reminder_hours_before,
          });
        });
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await supabase
        .from("profiles")
        .update({ full_name: name, phone, specialty })
        .eq("user_id", user.id);

      await supabase
        .from("trainer_settings")
        .update(settings)
        .eq("trainer_id", user.id);

      toast.success("Configurações salvas!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8 max-w-2xl">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          <p className="text-editorial-sm text-muted-foreground mb-2">CONFIGURAÇÕES</p>
          <h1 className="font-display font-light text-2xl md:text-3xl tracking-tight">Preferências</h1>
        </motion.div>

        {/* Profile */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1} className="card-editorial space-y-4">
          <p className="text-editorial-sm">PERFIL</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-body text-muted-foreground mb-1.5 block">Nome</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="font-body font-light h-10" />
            </div>
            <div>
              <label className="text-xs font-body text-muted-foreground mb-1.5 block">Email</label>
              <Input value={profile?.email || ""} disabled className="font-body font-light h-10 opacity-50" />
            </div>
            <div>
              <label className="text-xs font-body text-muted-foreground mb-1.5 block">Telefone</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="font-body font-light h-10" />
            </div>
            <div>
              <label className="text-xs font-body text-muted-foreground mb-1.5 block">Especialidade</label>
              <Input value={specialty} onChange={(e) => setSpecialty(e.target.value)} className="font-body font-light h-10" />
            </div>
          </div>
        </motion.div>

        {/* Schedule Settings */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2} className="card-editorial space-y-4">
          <p className="text-editorial-sm">AGENDA</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: "Duração da sessão (min)", key: "session_duration" },
              { label: "Intervalo entre sessões (min)", key: "break_between" },
              { label: "Limite cancelamento (horas)", key: "cancel_limit_hours" },
              { label: "Máx. sessões por dia", key: "max_sessions_per_day" },
            ].map((field) => (
              <div key={field.key}>
                <label className="text-xs font-body text-muted-foreground mb-1.5 block">{field.label}</label>
                <Input
                  type="number"
                  value={settings[field.key as keyof typeof settings]}
                  onChange={(e) => setSettings({ ...settings, [field.key]: Number(e.target.value) })}
                  className="font-body font-light h-10"
                />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Retention */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3} className="card-editorial space-y-4">
          <p className="text-editorial-sm">NOTIFICAÇÕES DE RETENÇÃO</p>
          <div className="space-y-3">
            {[
              { label: "Alertar após dias sem treinar", key: "retention_alert_days_light" },
              { label: "Alerta moderado após dias", key: "retention_alert_days_moderate" },
              { label: "Alerta crítico após dias", key: "retention_alert_days_critical" },
              { label: "Lembrete antes do treino (horas)", key: "reminder_hours_before" },
            ].map((field) => (
              <div key={field.key} className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-sm font-body font-light">{field.label}</span>
                <Input
                  type="number"
                  value={settings[field.key as keyof typeof settings]}
                  onChange={(e) => setSettings({ ...settings, [field.key]: Number(e.target.value) })}
                  className="w-20 font-body font-light text-center h-9"
                />
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={4}>
          <Button onClick={handleSave} disabled={saving} className="text-editorial-sm h-11">
            {saving ? "Salvando..." : "Salvar alterações"}
          </Button>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;
