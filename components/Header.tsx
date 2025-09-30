import React from 'react';
import { MyKapLogo } from './Icons.tsx';

const Header = () => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex-shrink-0">
            <MyKapLogo className="h-10 w-auto" />
          </div>
          <h1 className="text-xl md:text-2xl font-semibold text-slate-800 tracking-tight">
            Generador de Informes
          </h1>
        </div>
      </div>
    </header>
  );
};

export default Header;