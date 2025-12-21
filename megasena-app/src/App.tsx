/*
 * MegaSena Monitor - Minimalist desktop application for managing bets.
 * Copyright (C) 2025 Zander Cattapreta
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
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
  const [splashShown, setSplashShown] = useState(false);

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

  const carregarResumoResultados = async () => {
    try {
      const ultimo = await obterUltimoConcurso();
      const resultados = await carregarUltimosResultados(ultimo, 5);
      setUltimosResultados(resultados);
      
      // Armazenar o último para o modal
      if (resultados.length > 0) {
        setLastResultado(resultados[0]);
      }
    } catch (error) {
      console.warn('Erro ao carregar resumo de resultados:', error);
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
          setSplashShown(true);
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
    const unlisten = listen('window-show', () => {
      console.log('Evento window-show recebido. Atualizando dados...');
      toast.loading('Atualizando resultados...', { id: 'refresh', duration: 2000 });
      // Quando abre pelo tray, NÃO mostra o splash
      inicializar(false);
    });

    return () => {
      unlisten.then(f => f());
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-500">
      <header className="p-6 pb-2 sticky top-0 bg-gray-50/80 dark:bg-slate-950/80 backdrop-blur-md z-10">
        <div className="container mx-auto max-w-lg flex justify-between items-center h-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-sphere rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3 hover:rotate-0 transition-all cursor-default overflow-hidden">
               <span className="text-xl">🍀</span>
            </div>
            <div>
              <h1 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest leading-none">MegaSena</h1>
              <p className="text-[10px] font-bold text-green-sphere tracking-[0.2em] uppercase opacity-70">Monitor</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => setShowSettings(true)}
              className="w-10 h-10 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm hover:shadow-md transition-all active:scale-95 border border-gray-100 dark:border-slate-700"
              title="Configurações"
            >
              <span className="text-xl opacity-60">⚙️</span>
            </button>
            <button 
              disabled={verificando}
              onClick={handleVerificarResultados}
              className="h-10 px-4 bg-gray-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-2xl flex items-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-50"
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
        <div className="border-t border-gray-200 dark:border-slate-800 my-8"></div>

        {/* Dash de Resultados Recentes */}
        {ultimosResultados.length > 0 && (
          <div className="mb-8 overflow-hidden">
            <h2 className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4 ml-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Últimos Resultados
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide -mx-1 px-1">
              {ultimosResultados.map((res) => (
                <div key={res.concurso} className="glass-card flex-shrink-0 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 min-w-[260px] shadow-sm hover:shadow-md transition-all duration-300 bg-white dark:bg-slate-900">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-black text-gray-800 dark:text-white">C {res.concurso}</span>
                    <span className="text-[10px] font-medium text-gray-400 dark:text-slate-400 bg-gray-50 dark:bg-slate-800 px-2 py-0.5 rounded-full">{res.dataSorteio}</span>
                  </div>
                  <div className="flex gap-1.5">
                    {res.numerosSorteados.map((num: number) => (
                      <NumeroEsfera key={num} numero={num} selecionado tamanho="small" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Seção Apostas */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              MINHAS APOSTAS ({apostas.length}/10)
            </h2>
            {apostas.length > 0 && (
              <button
                onClick={handleVerificarResultados}
                disabled={verificando}
                className={`px-4 py-2 border-2 rounded-lg font-medium transition-all ${
                  verificando
                    ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                    : 'border-green-sphere text-green-sphere hover:bg-green-sphere hover:text-white'
                }`}
              >
                {verificando ? 'Verificando...' : 'Verificar Resultados'}
              </button>
            )}
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-400">
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
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}

export default App;
