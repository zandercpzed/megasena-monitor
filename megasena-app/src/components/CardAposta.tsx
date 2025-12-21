import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Aposta } from '../types';
import { NumeroEsfera } from './NumeroEsfera';
import { excluirAposta } from '../services/tauri';

interface CardApostaProps {
  aposta: Aposta;
  onExcluida: () => void;
}

export function CardAposta({ aposta, onExcluida }: CardApostaProps) {
  const [expandido, setExpandido] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  const handleExcluir = async () => {
    console.log(`[UI] Executando exclusão imediata da aposta ID: ${aposta.id}`);
    setExcluindo(true);
    try {
      await excluirAposta(Number(aposta.id));
      console.log(`[SUCCESS] Aposta #${aposta.id} excluída`);
      toast.success('Aposta removida!');
      onExcluida();
    } catch (error: any) {
      console.error(`[ERROR] Falha ao excluir aposta #${aposta.id}:`, error);
      toast.error(`Falha ao excluir: ${error?.message || 'Erro desconhecido'}`);
    } finally {
      setExcluindo(false);
    }
  };

  const concursosRestantes = aposta.quantidadeConcursos > 1
    ? `${aposta.quantidadeConcursos} concursos`
    : `Concurso ${aposta.concursoInicial}`;

  return (
    <div className={`glass-card rounded-xl overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md border border-gray-100 ${expandido ? 'ring-1 ring-green-sphere/20' : ''}`}>
      {/* Header - Sempre visível */}
      <div className="flex items-start justify-between p-4 pb-0">
        <div 
          className="flex items-center gap-2 cursor-pointer flex-1"
          onClick={() => setExpandido(!expandido)}
        >
          <span className="text-xl text-gray-400">{expandido ? '▼' : '▶'}</span>
          <div>
            <span className="font-bold text-gray-800">Aposta #{aposta.id}</span>
            <span className="text-gray-500 mx-2">•</span>
            <span className="text-sm text-gray-600">{concursosRestantes}</span>
          </div>
        </div>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleExcluir();
          }}
          disabled={excluindo}
          className="px-3 py-1 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-md text-xs font-bold transition-all border border-red-100 hover:border-red-500 disabled:opacity-50"
        >
          {excluindo ? '...' : 'Remover Aposta'}
        </button>
      </div>

      {/* Números - Sempre visível - AJUSTE DE ALINHAMENTO (5px direita, 3px cima) */}
      <div 
        className="flex flex-wrap gap-2 px-4 ml-[5px] -mt-[3px] pb-4 cursor-pointer"
        onClick={() => setExpandido(!expandido)}
      >
        {aposta.numeros.map(num => (
          <NumeroEsfera key={num} numero={num} selecionado tamanho="small" />
        ))}
      </div>

      {/* Detalhes Expandidos */}
      {expandido && (
        <div className="mx-4 pb-4 pt-4 border-t border-gray-100 space-y-4">
          <div className="text-sm text-gray-600 flex justify-between items-end">
            <div>
              <p><strong>Criado em:</strong> {new Date(aposta.dataCriacao).toLocaleString('pt-BR')}</p>
              {aposta.quantidadeConcursos > 1 && (
                <p><strong>Teimosinha:</strong> {aposta.quantidadeConcursos} concursos</p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-4">Histórico de Conferência</h4>
            {Array.from({ length: aposta.quantidadeConcursos }, (_, i) => aposta.concursoInicial + i).map(concurso => {
              const acertos = aposta.acertos?.[concurso];
              const sorteados = aposta.resultadosConcursos?.[concurso];
              
              const isWinner = acertos !== undefined && acertos >= 4;
              const prizeType = acertos === 4 ? 'QUADRA' : acertos === 5 ? 'QUINA' : acertos === 6 ? 'SENA' : null;

              return (
                <div 
                  key={concurso} 
                  className={`rounded-xl p-4 transition-all duration-500 border ${
                    isWinner 
                      ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200 shadow-sm' 
                      : 'bg-gray-50/30 border-gray-100'
                  }`}
                >
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-700">Concurso {concurso}</span>
                      {prizeType && (
                        <span className="px-2 py-0.5 bg-yellow-400 text-white text-[10px] font-black rounded-full shadow-sm animate-pulse">
                          {prizeType}
                        </span>
                      )}
                    </div>
                    {acertos !== undefined ? (
                      <div className="text-right">
                        <span className={`text-sm font-black ${isWinner ? 'text-yellow-600' : 'text-gray-400'}`}>
                          {acertos} ACERTO{acertos !== 1 ? 'S' : ''}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-gray-300 italic font-medium">Aguardando sorteio...</span>
                    )}
                  </div>
                  
                  {sorteados && (
                    <div className="flex flex-wrap gap-1.5 opacity-90">
                      {sorteados.map(num => (
                        <NumeroEsfera 
                          key={num} 
                          numero={num} 
                          selecionado={aposta.numeros.includes(num)} 
                          acertou={aposta.numeros.includes(num)}
                          tamanho="small" 
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
