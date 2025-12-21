/*
 * MegaSena Monitor - Minimalist desktop application for managing bets.
 * Copyright (C) 2025 Zander Cattapreta
 *
 * This program is licensed under the MIT License.
 * See the LICENSE file in the project root for more information.
 */

import { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { FormCadastro } from './components/FormCadastro';
import { ListaApostas } from './components/ListaApostas';
import { NumeroEsfera } from './components/NumeroEsfera';
import { ModalResultado } from './components/ModalResultado';
import { SettingsModal } from './components/SettingsModal';
import { listen } from '@tauri-apps/api/event';
import { SettingsService } from './services/settings';
import appIcon from './assets/app-icon.png';
import { listarApostas, verificarResultados, carregarUltimosResultados, obterUltimoConcurso } from './services/tauri';
import { Aposta, Resultado } from './types';
import './App.css';

function App() {
  const [apostas, setApostas] = useState<Aposta[]>([]);
  const [ultimosResultados, setUltimosResultados] = useState<Resultado[]>([]);
  const [lastResultado, setLastResultado] = useState<Resultado | null>(null);
  const [loading, setLoading] = useState(true);
  const [verificando, setVerificando] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsView, setSettingsView] = useState<'settings' | 'about' | 'help'>('settings');

  const carregarApostas = async () => {
    setLoading(true);
    try {
      const data = await listarApostas();
      setApostas(data);
    } catch (error) {
      console.error('Erro ao carregar apostas:', error);
      setApostas([]);
    } finally {
      setLoading(false);
    }
  };


  const handleVerificarResultados = async () => {
    if (apostas.length === 0) {
      toast.error('Nenhuma aposta cadastrada para verificar.', { icon: '⚠️' });
      return;
    }

    setVerificando(true);
    let verificadas = 0;
    let erros = 0;

    try {
      const concursosUnicos = Array.from(new Set<number>(
        apostas.flatMap(aposta => 
          Array.from({ length: aposta.quantidadeConcursos }, (_, i) => aposta.concursoInicial + i)
        )
      ));

      if (concursosUnicos.length === 0) return;

      toast.loading(`Conferindo ${concursosUnicos.length} concurso(s)...`, { id: 'verificando' });

      // Processar em paralelo com um limite de concorrência ou todos de uma vez se for razoável
      const results = await Promise.allSettled(
        concursosUnicos.map(concurso => verificarResultados(concurso))
      );

      results.forEach((res, index) => {
        if (res.status === 'fulfilled') {
          verificadas++;
        } else {
          console.error(`Erro ao verificar concurso ${concursosUnicos[index]}:`, res.reason);
          erros++;
        }
      });

      toast.dismiss('verificando');

      if (verificadas > 0) {
        toast.success(`${verificadas} concurso(s) conferido(s)!`, {
          duration: 4000,
          icon: '🎉',
        });
      }
      
      if (erros > 0) {
        toast.error(`${erros} concurso(s) não puderam ser acessados agora.`, { duration: 5000 });
      }

      await carregarApostas();
      
      if (verificadas === 0 && erros === 0) {
        toast.error('Nenhum resultado novo encontrado.');
      }
    } catch (error) {
      console.error('Erro ao verificar resultados:', error);
      toast.error('Ocorreu um erro na conferência.');
      await carregarApostas();
    } finally {
      setVerificando(false);
    }
  };

  useEffect(() => {
    // Aplicar tema salvo ao carregar
    SettingsService.applyTheme(SettingsService.getTheme());

    const inicializar = async (showSplash: boolean = false) => {
      // 1. Carregar lista de apostas local
      await carregarApostas();
      
      // 2. Carregar últimos 15 concursos e exibir modal do último
      try {
        const ultimoConcurso = await obterUltimoConcurso();
        console.log(`Inicializando: último concurso #${ultimoConcurso}. Carregando últimos 15...`);
        
        const resultados = await carregarUltimosResultados(ultimoConcurso, 15);
        setUltimosResultados(resultados.slice(0, 5)); // Dashboard mostra os 5 mais recentes
        
        if (resultados.length > 0 && showSplash) {
          setLastResultado(resultados[0]);
        }

        // 3. Recarregar apostas para refletir se houve acertos nos 15 carregados
        await carregarApostas();
      } catch (error) {
        console.warn('Falha na inicialização dinâmica:', error);
      }
    };

    // Primeira inicialização da sessão
    inicializar(true);

    // Listen for window-show event from System Tray
    const unlistenShow = listen('window-show', () => {
      console.log('Evento window-show recebido. Atualizando dados...');
      toast.loading('Atualizando resultados...', { id: 'refresh', duration: 2000 });
      inicializar(false);
    });

    // Listen for open-view from native menu
    const unlistenView = listen('open-view', (event: { payload: string }) => {
      console.log('Evento open-view recebido:', event.payload);
      setSettingsView(event.payload as any);
      setShowSettings(true);
    });

    return () => {
      unlistenShow.then(f => f());
      unlistenView.then(f => f());
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-500">
      <header className="p-6 pb-2 sticky top-0 bg-background/80 backdrop-blur-md z-10 border-b border-border">
        <div className="container mx-auto max-w-lg flex justify-between items-center h-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-sphere rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3 hover:rotate-0 transition-all cursor-default overflow-hidden">
               <img src={appIcon} className="w-full h-full object-contain p-1" alt="MegaSena Monitor" />
            </div>
            <div>
              <h1 className="text-sm font-black text-foreground uppercase tracking-widest leading-none">MegaSena</h1>
              <p className="text-[10px] font-bold text-green-sphere tracking-[0.2em] uppercase opacity-70">Monitor</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => setShowSettings(true)}
              className="w-10 h-10 bg-card rounded-2xl flex items-center justify-center shadow-sm hover:shadow-md transition-all active:scale-95 border border-border"
              title="Configurações"
            >
              <span className="text-xl opacity-60">⚙️</span>
            </button>
            <button 
              disabled={verificando}
              onClick={handleVerificarResultados}
              className="h-10 px-4 bg-primary text-primary-foreground rounded-2xl flex items-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-50"
            >
              <span className="text-xs font-black uppercase tracking-widest">
                {verificando ? 'Conferindo...' : 'Verificar'}
              </span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto py-8 px-4">
        {/* Seção Cadastro */}
        <section className="mb-8">
          <FormCadastro onApostaAdicionada={carregarApostas} />
        </section>

        {/* Separador */}
        <div className="border-t border-border my-8"></div>

        {/* Dash de Resultados Recentes */}
        {ultimosResultados.length > 0 && (
          <section className="mb-10 overflow-hidden">
            <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4 ml-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Últimos Resultados
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide -mx-1 px-1">
              {ultimosResultados.map((res) => (
                <div key={res.concurso} className="glass-card flex-shrink-0 p-5 rounded-2xl border border-border min-w-[260px] shadow-sm hover:shadow-md transition-all duration-300 bg-card">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-black text-foreground">C {res.concurso}</span>
                    <span className="text-[10px] font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{res.dataSorteio}</span>
                  </div>
                  <div className="flex gap-1.5">
                    {res.numerosSorteados.map((num: number) => (
                      <NumeroEsfera key={num} numero={num} selecionado tamanho="small" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Seção Apostas */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xs font-black text-muted-foreground uppercase tracking-[0.3em]">
              MINHAS APOSTAS ({apostas.length}/10)
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              Carregando apostas...
            </div>
          ) : (
            <ListaApostas 
              apostas={apostas} 
              onApostaExcluida={carregarApostas} 
            />
          )}
        </section>
      </div>
      <Toaster position="bottom-right" />
      
      {lastResultado && (
        <ModalResultado 
          resultado={lastResultado} 
          onClose={() => setLastResultado(null)} 
        />
      )}

      {showSettings && (
        <SettingsModal 
          initialView={settingsView}
          onClose={() => {
            setShowSettings(false);
            setSettingsView('settings'); // Reset for next time gear is clicked
          }} 
        />
      )}
    </div>
  );
}

export default App;
