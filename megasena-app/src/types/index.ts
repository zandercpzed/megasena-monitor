// TypeScript Types for MegaSena App

export interface Aposta {
  id: number;
  numeros: number[];
  concursoInicial: number;
  quantidadeConcursos: number;
  dataCriacao: string;
  ativa: boolean;
  acertos: { [concurso: number]: number };
  resultados_concursos: { [concurso: number]: number[] };
}

export interface Resultado {
  concurso: number;
  numerosSorteados: number[];
  dataSorteio: string;
  acumulado: boolean;
}

export interface ApostaResultado {
  apostaId: number;
  concurso: number;
  acertos: number;
}

export interface ApostaComResultados extends Aposta {
  resultados?: Map<number, ApostaResultado>;
}
