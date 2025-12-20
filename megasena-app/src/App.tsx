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
import { listarApostas, verificarResultados, carregarUltimosResultados, obterUltimoConcurso } from './services/tauri';
import { Aposta } from './types';
import './App.css';

function App() {
  const [apostas, setApostas] = useState<Aposta[]>([]);
  const [loading, setLoading] = useState(true);
  const [verificando, setVerificando] = useState(false);

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
      const concursosUnicos = new Set<number>();
      apostas.forEach(aposta => {
        for (let i = 0; i < aposta.quantidadeConcursos; i++) {
          concursosUnicos.add(aposta.concursoInicial + i);
        }
      });

      toast.loading(`Conferindo ${concursosUnicos.size} concurso(s)...`, { id: 'verificando' });

      for (const concurso of concursosUnicos) {
        try {
          await verificarResultados(concurso);
          verificadas++;
        } catch (error) {
          console.error(`Erro ao verificar concurso ${concurso}:`, error);
          erros++;
        }
      }

      toast.dismiss('verificando');

      if (verificadas > 0) {
        toast.success(`${verificadas} concurso(s) conferido(s)!`, {
          duration: 4000,
          icon: '🎉',
        });
        if (erros > 0) {
          toast.error(`${erros} concurso(s) indisponíveis ou falharam.`, { duration: 5000 });
        }
        await carregarApostas();
      } else {
        toast.error('Não foi possível obter novos resultados. Tente mais tarde.', { icon: '❌' });
      }
    } catch (error) {
      console.error('Erro ao verificar resultados:', error);
      toast.error('Ocorreu um erro inesperado na conferência.');
    } finally {
      setVerificando(false);
    }
  };

  useEffect(() => {
    const inicializar = async () => {
      // 1. Carregar lista de apostas local
      await carregarApostas();

      // 2. Carregar últimos resultados reais da Caixa
      try {
        console.log('Buscando número do último concurso...');
        const ultimoConcurso = await obterUltimoConcurso();
        
        console.log(`Último concurso: ${ultimoConcurso}. Pré-carregando 15 últimos...`);
        await carregarUltimosResultados(ultimoConcurso, 15);
        
        // Atualizar lista para mostrar acertos carregados
        await carregarApostas();
      } catch (error) {
        console.warn('Falha na inicialização dinâmica dos resultados:', error);
      }
    };

    inicializar();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto py-8 px-4">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            🍀 MegaSena Monitor
          </h1>
        </header>

        {/* Seção Cadastro */}
        <section className="mb-8">
          <FormCadastro onApostaAdicionada={carregarApostas} />
        </section>

        {/* Separador */}
        <div className="border-t border-gray-200 my-8"></div>

        {/* Seção Apostas */}
        <section>
          <div className="flex justify-between items-center mb-4">
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
            <ListaApostas apostas={apostas} onApostaExcluida={carregarApostas} />
          )}
        </section>
      </div>
      <Toaster position="bottom-right" />
    </div>
  );
}

export default App;
