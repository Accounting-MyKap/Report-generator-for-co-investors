import React from 'react';

const Spinner = () => {
  return (
    // A smaller, more modern spinner that inherits its color from the parent text color.
    <div 
        className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" 
        role="status"
        aria-live="polite"
    >
      <span className="sr-only">Cargando...</span>
    </div>
  );
};

export default Spinner;