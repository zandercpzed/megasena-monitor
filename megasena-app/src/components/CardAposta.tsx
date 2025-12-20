import { useState } from 'react';
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
    if (!confirm('Tem certeza que deseja excluir esta aposta?')) return;

    setExcluindo(true);
    try {
      await excluirAposta(aposta.id);
      onExcluida();
    } catch (error) {
      console.error('Erro ao excluir aposta:', error);
      alert('Erro ao excluir aposta. Tente novamente.');
    } finally {
      setExcluindo(false);
    }
  };

  const concursosRestantes = aposta.quantidadeConcursos > 1
    ? `${aposta.quantidadeConcursos} concursos`
    : `Concurso ${aposta.concursoInicial}`;

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
      {/* Header - Sempre visível */}
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpandido(!expandido)}
      >
        <div className="flex items-center gap-2 flex-1">
          <span className="text-xl">{expandido ? '▼' : '▶'}</span>
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
          className="text-red-500 hover:text-red-700 font-bold text-xl px-2"
        >
          ×
        </button>
      </div>

      {/* Números - Sempre visível */}
      <div className="flex flex-wrap gap-2 mt-3">
        {aposta.numeros.map(num => (
          <NumeroEsfera key={num} numero={num} selecionado tamanho="small" />
        ))}
      </div>

      {/* Detalhes Expandidos */}
      {expandido && (
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
          <div className="text-sm text-gray-600">
            <p><strong>Criado em:</strong> {new Date(aposta.dataCriacao).toLocaleString('pt-BR')}</p>
            {aposta.quantidadeConcursos > 1 && (
              <p><strong>Teimosinha:</strong> {aposta.quantidadeConcursos} concursos</p>
            )}
          </div>

          {/* TODO: Exibir resultados quando implementarmos verificação */}
          <div className="text-sm text-gray-500 italic">
            Clique em "Verificar Resultados" para ver os acertos
          </div>
        </div>
      )}
    </div>
  );
}
