import { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { FormCadastro } from './components/FormCadastro';
import { ListaApostas } from './components/ListaApostas';
import { listarApostas, verificarResultados } from './services/tauri';
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
      // Se backend não estiver pronto, usar array vazio
      setApostas([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVerificarResultados = async () => {
    if (apostas.length === 0) return;

    setVerificando(true);
    let verificadas = 0;
    let erros = 0;

    try {
      // Pegar todos os concursos únicos das apostas
      const concursosUnicos = new Set<number>();
      apostas.forEach(aposta => {
        for (let i = 0; i < aposta.quantidadeConcursos; i++) {
          concursosUnicos.add(aposta.concursoInicial + i);
        }
      });

      // Verificar cada concurso
      for (const concurso of concursosUnicos) {
        try {
          await verificarResultados(concurso);
          verificadas++;
        } catch (error) {
          console.error(`Erro ao verificar concurso ${concurso}:`, error);
          erros++;
        }
      }

      if (verificadas > 0) {
        toast.success(`${verificadas} concurso(s) verificado(s)!`, {
          duration: 4000,
          icon: '🎉',
        });
        if (erros > 0) {
          toast.error(`${erros} concurso(s) falharam na conexão.`, { duration: 5000 });
        }
        // Recarregar apostas para mostrar resultados atualizados
        await carregarApostas();
      } else {
        toast.error('Não foi possível verificar os resultados.', { icon: '❌' });
      }
    } catch (error) {
      console.error('Erro ao verificar resultados:', error);
      toast.error('Erro na verificação. Verifique sua conexão.');
    } finally {
      setVerificando(false);
    }
  };

  useEffect(() => {
    carregarApostas();
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
