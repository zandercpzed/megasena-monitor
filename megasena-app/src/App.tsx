import { useState, useEffect } from 'react';
import { FormCadastro } from './components/FormCadastro';
import { ListaApostas } from './components/ListaApostas';
import { listarApostas } from './services/tauri';
import { Aposta } from './types';
import './App.css';

function App() {
  const [apostas, setApostas] = useState<Aposta[]>([]);
  const [loading, setLoading] = useState(true);

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
                onClick={() => alert('Verificação de resultados será implementada em breve!')}
                className="px-4 py-2 border-2 border-green-sphere text-green-sphere rounded-lg font-medium hover:bg-green-sphere hover:text-white transition-all"
              >
                Verificar Resultados
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
    </div>
  );
}

export default App;
