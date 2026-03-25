import { motion } from "framer-motion";
import AppLayout from "@/components/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  }),
};

const SettingsPage = () => {
  return (
    <AppLayout>
      <div className="space-y-10 max-w-2xl">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          <p className="text-editorial-sm text-muted-foreground mb-2">CONFIGURAÇÕES</p>
          <h1 className="font-display font-light text-3xl tracking-tight">Preferências</h1>
        </motion.div>

        {/* Profile */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1} className="card-editorial space-y-6">
          <p className="text-editorial-sm">PERFIL</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-body text-muted-foreground mb-1.5 block">Nome</label>
              <Input defaultValue="Personal Trainer" className="font-body font-light" />
            </div>
            <div>
              <label className="text-xs font-body text-muted-foreground mb-1.5 block">Email</label>
              <Input defaultValue="trainer@fitflow.com" className="font-body font-light" />
            </div>
            <div>
              <label className="text-xs font-body text-muted-foreground mb-1.5 block">Telefone</label>
              <Input defaultValue="+55 11 99999-9999" className="font-body font-light" />
            </div>
            <div>
              <label className="text-xs font-body text-muted-foreground mb-1.5 block">Especialidade</label>
              <Input defaultValue="Musculação e Funcional" className="font-body font-light" />
            </div>
          </div>
        </motion.div>

        {/* Schedule Settings */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2} className="card-editorial space-y-6">
          <p className="text-editorial-sm">AGENDA</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-body text-muted-foreground mb-1.5 block">Duração da sessão (min)</label>
              <Input defaultValue="60" type="number" className="font-body font-light" />
            </div>
            <div>
              <label className="text-xs font-body text-muted-foreground mb-1.5 block">Intervalo entre sessões (min)</label>
              <Input defaultValue="15" type="number" className="font-body font-light" />
            </div>
            <div>
              <label className="text-xs font-body text-muted-foreground mb-1.5 block">Limite cancelamento (horas antes)</label>
              <Input defaultValue="2" type="number" className="font-body font-light" />
            </div>
            <div>
              <label className="text-xs font-body text-muted-foreground mb-1.5 block">Máx. sessões por dia</label>
              <Input defaultValue="8" type="number" className="font-body font-light" />
            </div>
          </div>
        </motion.div>

        {/* Notifications */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3} className="card-editorial space-y-6">
          <p className="text-editorial-sm">NOTIFICAÇÕES DE RETENÇÃO</p>
          <div className="space-y-4">
            {[
              { label: "Alertar após dias sem treinar", value: "3" },
              { label: "Alerta moderado após dias", value: "5" },
              { label: "Alerta crítico após dias", value: "7" },
              { label: "Lembrete antes do treino (horas)", value: "2" },
            ].map((setting) => (
              <div key={setting.label} className="flex items-center justify-between py-3 border-b border-border">
                <span className="text-sm font-body font-light">{setting.label}</span>
                <Input defaultValue={setting.value} type="number" className="w-20 font-body font-light text-center" />
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={4}>
          <Button className="text-editorial-sm">Salvar alterações</Button>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;
