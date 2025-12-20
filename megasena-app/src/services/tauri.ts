import { invoke } from '@tauri-apps/api/core';
import { Aposta, Resultado } from '../types';

// Wrapper para comunicação com o backend Tauri (Rust)

export async function adicionarAposta(
  numeros: number[],
  concursoInicial: number,
  quantidadeConcursos: number
): Promise<Aposta> {
  return await invoke('adicionar_aposta', {
    numeros,
    concursoInicial,
    quantidadeConcursos,
  });
}

export async function listarApostas(): Promise<Aposta[]> {
  return await invoke('listar_apostas');
}

export async function excluirAposta(id: number): Promise<void> {
  await invoke('excluir_aposta', { id });
}

export async function verificarResultados(concurso: number): Promise<Resultado> {
  return await invoke('verificar_resultados', { concurso });
}
