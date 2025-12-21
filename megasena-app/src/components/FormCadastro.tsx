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
import { toast } from 'react-hot-toast';
import { NumeroEsfera } from './NumeroEsfera';
import { GridNumeros } from './GridNumeros';
import { adicionarAposta, obterUltimoConcurso } from '../services/tauri';

interface FormCadastroProps {
  onApostaAdicionada: () => void;
}

export function FormCadastro({ onApostaAdicionada }: FormCadastroProps) {
  const [concurso, setConcurso] = useState('');
  const [selecionados, setSelecionados] = useState<number[]>([]);
  const [teimosinha, setTeimosinha] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const carregarUltimo = async () => {
      try {
        const ultimo = await obterUltimoConcurso();
        // Sugerir o último sorteado como padrão (ou o próximo se preferir, mas o último é melhor para conferência)
        setConcurso(ultimo.toString());
      } catch (error) {
        console.warn('Falha ao obter último concurso:', error);
      }
    };
    carregarUltimo();
  }, []);

  const isValido = selecionados.length >= 6 && selecionados.length <= 15 && concurso !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[FORM] Tentando submeter aposta:', { selecionados, concurso, teimosinha });
    
    if (!isValido) {
      console.warn('[FORM] Validação falhou:', { 
        numSelecionados: selecionados.length, 
        concursoValido: concurso !== '' 
      });
      return;
    }

    setLoading(true);
    try {
      console.log('[FORM] Chamando adicionarAposta...');
      const novaAposta = await adicionarAposta(selecionados, parseInt(concurso), teimosinha);
      console.log('[FORM] Aposta adicionada com sucesso:', novaAposta);
      // Reset form
      setSelecionados([]);
      setConcurso(concurso); // Manter o concurso para facilitar múltiplas apostas? Ou resetar? Original era resetar.
      setTeimosinha(1);
      onApostaAdicionada();
      toast.success('Aposta cadastrada!');
    } catch (error: any) {
      console.error('[FORM] Erro ao adicionar aposta:', error);
      alert(`Erro ao adicionar aposta: ${error?.message || error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-gray-50 rounded-lg">
      <h2 className="text-xl font-bold text-gray-800">CADASTRAR APOSTA</h2>

      {/* Campo Concurso */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Concurso inicial
        </label>
        <input
          type="number"
          value={concurso}
          onChange={(e) => setConcurso(e.target.value)}
          placeholder="2650"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-sphere focus:border-transparent"
          required
        />
      </div>

      {/* Preview dos Selecionados */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-gray-700">
            Selecione 6 a 15 números
          </label>
          <span className="text-sm text-gray-500">
            {selecionados.length} número{selecionados.length !== 1 ? 's' : ''}
            {selecionados.length === 15 && ' (máx)'}
          </span>
        </div>
        
        <div className="flex flex-wrap gap-2 p-3 bg-white rounded-lg min-h-[48px] border border-gray-200">
          {selecionados.length === 0 ? (
            <span className="text-gray-400 text-sm">Nenhum número selecionado</span>
          ) : (
            selecionados.map(num => (
              <NumeroEsfera key={num} numero={num} selecionado tamanho="small" />
            ))
          )}
        </div>
      </div>

      {/* Grid de Números */}
      <GridNumeros selecionados={selecionados} onChange={setSelecionados} />

      {/* Dropdown Teimosinha */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Teimosinha
        </label>
        <select
          value={teimosinha}
          onChange={(e) => setTeimosinha(parseInt(e.target.value))}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-sphere focus:border-transparent"
        >
          {[1, 2, 4, 8, 12].map(n => (
            <option key={n} value={n}>
              {n === 1 ? '1 concurso' : `${n} concursos (teimosinha)`}
            </option>
          ))}
        </select>
      </div>

      {/* Botão Adicionar */}
      <button
        type="submit"
        disabled={!isValido || loading}
        className={`w-full py-3 rounded-lg font-bold text-white transition-all shadow-md active:scale-[0.98] ${
          isValido && !loading
            ? 'bg-green-sphere hover:bg-green-dark'
            : 'bg-gray-400 opacity-60 cursor-not-allowed text-gray-100'
        }`}
      >
        {loading ? 'Adicionando...' : 'Adicionar Aposta'}
      </button>
    </form>
  );
}
