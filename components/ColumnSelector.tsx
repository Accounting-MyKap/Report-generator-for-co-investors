import React from 'react';

interface ColumnSelectorProps {
  headers: string[];
  selectedHeaders: string[];
  onSelectionChange: (header: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

const ColumnSelector: React.FC<ColumnSelectorProps> = ({ headers, selectedHeaders, onSelectionChange, onSelectAll, onDeselectAll }) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center">
        <h2 className="text-xl font-bold text-slate-800">Selecciona las Columnas para el Informe</h2>
        <div className="flex space-x-4 mt-3 sm:mt-0">
          <button onClick={onSelectAll} className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors">Seleccionar Todo</button>
          <button onClick={onDeselectAll} className="text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors">Deseleccionar Todo</button>
        </div>
      </div>
      <div className="flex flex-wrap gap-3 p-5 border rounded-lg bg-slate-50/50">
        {headers.map(header => {
            const isSelected = selectedHeaders.includes(header);
            return (
                <button 
                    key={header} 
                    onClick={() => onSelectionChange(header)}
                    className={`px-4 py-2 text-sm font-medium rounded-full border transition-all duration-200 ${
                        isSelected 
                        ? 'bg-blue-600 border-blue-600 text-white shadow-sm' 
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400'
                    }`}
                >
                    {header}
                </button>
            )
        })}
      </div>
    </div>
  );
};

export default ColumnSelector;