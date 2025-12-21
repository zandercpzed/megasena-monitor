import { useState, useEffect } from 'react';
import { SettingsService, Theme } from '../services/settings';

interface SettingsModalProps {
  onClose: () => void;
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const [theme, setTheme] = useState<Theme>(SettingsService.getTheme());
  const [autostart, setAutostart] = useState(false);

  useEffect(() => {
    SettingsService.isAutostartEnabled().then(setAutostart);
  }, []);

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    SettingsService.setTheme(newTheme);
  };

  const handleAutostartChange = async (enabled: boolean) => {
    setAutostart(enabled);
    await SettingsService.setAutostart(enabled);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-card rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden transform animate-in slide-in-from-bottom-8 duration-500 border border-border">
        <div className="p-6 border-b border-border flex justify-between items-center">
          <h2 className="text-lg font-black text-foreground uppercase tracking-wider">Configurações</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground">
            ✕
          </button>
        </div>
        
        <div className="p-6 space-y-8">
          {/* Theme Selection */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Tema Visual</h3>
            <div className="grid grid-cols-3 gap-2">
              {(['light', 'dark', 'system'] as Theme[]).map((t) => (
                <button
                  key={t}
                  onClick={() => handleThemeChange(t)}
                  className={`py-3 rounded-2xl text-xs font-bold uppercase transition-all ${
                    theme === t 
                    ? 'bg-green-sphere text-white shadow-lg' 
                    : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  {t === 'light' ? '☀️ Claro' : t === 'dark' ? '🌙 Escuro' : '⚙️ Auto'}
                </button>
              ))}
            </div>
          </div>

          {/* Autostart */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-2xl">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Inicializar com sistema</h3>
              <p className="text-[10px] text-muted-foreground">Abrir o app automaticamente ao ligar</p>
            </div>
            <button 
              onClick={() => handleAutostartChange(!autostart)}
              className={`w-12 h-6 rounded-full transition-all relative ${autostart ? 'bg-green-sphere' : 'bg-accent'}`}
            >
              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all ${autostart ? 'translate-x-6' : ''}`} />
            </button>
          </div>
        </div>

        <div className="p-6 bg-muted/30 text-center">
          <p className="text-[10px] text-muted-foreground">Versão 0.1.0 • MegaSena Monitor</p>
        </div>
      </div>
    </div>
  );
}
