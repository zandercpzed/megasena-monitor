import { NumeroEsfera } from './NumeroEsfera';

interface GridNumerosProps {
  selecionados: number[];
  onChange: (numeros: number[]) => void;
  maxSelecao?: number;
}

export function GridNumeros({ selecionados, onChange, maxSelecao = 15 }: GridNumerosProps) {
  const numeros = Array.from({ length: 60 }, (_, i) => i + 1);

  const toggleNumero = (num: number) => {
    if (selecionados.includes(num)) {
      // Desselecionar
      onChange(selecionados.filter(n => n !== num));
    } else if (selecionados.length < maxSelecao) {
      // Selecionar (ordenado)
      onChange([...selecionados, num].sort((a, b) => a - b));
    }
  };

  return (
    <div className="grid grid-cols-10 gap-2 p-4">
      {numeros.map(num => (
        <NumeroEsfera
          key={num}
          numero={num}
          selecionado={selecionados.includes(num)}
          onClick={() => toggleNumero(num)}
        />
      ))}
    </div>
  );
}
