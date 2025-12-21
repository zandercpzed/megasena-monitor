import { Resultado } from '../types';
import { NumeroEsfera } from './NumeroEsfera';

interface ModalResultadoProps {
  resultado: Resultado;
  onClose: () => void;
}

export function ModalResultado({ resultado, onClose }: ModalResultadoProps) {
  const formatCurreny = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden transform animate-in slide-in-from-bottom-8 duration-500 border border-gray-100 dark:border-slate-800">
        <div className="bg-green-sphere p-6 text-white text-center">
          <h2 className="text-sm font-black uppercase tracking-[0.3em] opacity-80 mb-1">Último Concurso</h2>
          <div className="text-4xl font-black">#{resultado.concurso}</div>
        </div>
        
        <div className="p-8">
          <div className="flex justify-center gap-2 mb-8">
            {resultado.numerosSorteados.map(num => (
              <NumeroEsfera key={num} numero={num} selecionado />
            ))}
          </div>
          
          <div className="space-y-6 text-center">
            <div>
              <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Status do Prêmio</div>
              {resultado.acumulado ? (
                <div className="text-3xl font-black text-orange-500 tracking-tight">ACUMULOU!</div>
              ) : (
                <div className="text-3xl font-black text-green-600 tracking-tight">SAIU O PRÊMIO!</div>
              )}
            </div>
            
            {resultado.valorPremio && (
              <div>
                <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Valor Estimado</div>
                <div className="text-2xl font-bold text-gray-800 dark:text-white">{formatCurreny(resultado.valorPremio)}</div>
              </div>
            )}

            <div className="pt-4">
              <button
                onClick={onClose}
                className="w-full py-4 bg-gray-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black dark:hover:bg-white transition-all active:scale-95 shadow-lg"
              >
                Entrar no Monitor
              </button>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-slate-950/50 p-4 text-center">
          <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500">Sorteio realizado em {resultado.dataSorteio}</span>
        </div>
      </div>
    </div>
  );
}
