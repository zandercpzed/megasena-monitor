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
    <div className={`glass-card rounded-xl overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md border border-gray-100 ${expandido ? 'ring-1 ring-green-sphere/20' : ''}`}>
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
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
          <div className="text-sm text-gray-600">
            <p><strong>Criado em:</strong> {new Date(aposta.dataCriacao).toLocaleString('pt-BR')}</p>
            {aposta.quantidadeConcursos > 1 && (
              <p><strong>Teimosinha:</strong> {aposta.quantidadeConcursos} concursos</p>
            )}
          </div>

          {/* Resultados por Concurso */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Resultados</h4>
            {Array.from({ length: aposta.quantidadeConcursos }, (_, i) => aposta.concursoInicial + i).map(concurso => {
              const acertos = aposta.acertos?.[concurso];
              const sorteados = aposta.resultadosConcursos?.[concurso];
              
              return (
                <div key={concurso} className="bg-gray-50 rounded p-3 border border-gray-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Concurso {concurso}</span>
                    {acertos !== undefined ? (
                      <span className={`text-sm font-bold ${acertos >= 4 ? 'text-green-600' : 'text-gray-500'}`}>
                        {acertos} acerto{acertos !== 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Pendente</span>
                    )}
                  </div>
                  
                  {sorteados && (
                    <div className="flex flex-wrap gap-1">
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
