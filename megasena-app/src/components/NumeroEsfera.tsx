interface NumeroEsferaProps {
  numero: number;
  selecionado?: boolean;
  acertou?: boolean;
  tamanho?: 'small' | 'medium' | 'large';
  onClick?: () => void;
}

export function NumeroEsfera({ 
  numero, 
  selecionado = false, 
  acertou = false,
  tamanho = 'medium',
  onClick 
}: NumeroEsferaProps) {
  const sizeClasses = {
    small: 'w-6 h-6 text-xs',
    medium: 'w-10 h-10 text-lg',
    large: 'w-12 h-12 text-xl'
  };

  const baseClasses = 'rounded-full font-bold flex items-center justify-center transition-all duration-200';
  
  const stateClasses = selecionado || acertou
    ? 'bg-green-sphere text-white shadow-lg hover:bg-green-dark'
    : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-green-dark';
  
  const glowClasses = acertou ? 'ring-4 ring-green-300 shadow-green-sphere/50' : '';
  
  const cursorClass = onClick ? 'cursor-pointer hover:scale-110' : '';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`${baseClasses} ${sizeClasses[tamanho]} ${stateClasses} ${glowClasses} ${cursorClass}`}
    >
      {numero.toString().padStart(2, '0')}
    </button>
  );
}
