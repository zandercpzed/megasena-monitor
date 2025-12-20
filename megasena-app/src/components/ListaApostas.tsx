import { Aposta } from '../types';
import { CardAposta } from './CardAposta';

interface ListaApostasProps {
  apostas: Aposta[];
  onApostaExcluida: () => void;
}

export function ListaApostas({ apostas, onApostaExcluida }: ListaApostasProps) {
  if (apostas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <div className="text-6xl mb-4">🎱</div>
        <p className="text-lg font-medium">Nenhuma aposta cadastrada</p>
        <p className="text-sm">Comece adicionando números acima</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {apostas.map(aposta => (
        <CardAposta
          key={aposta.id}
          aposta={aposta}
          onExcluida={onApostaExcluida}
        />
      ))}
    </div>
  );
}
