import React from 'react';
import { MyKapLogo } from './Icons.tsx';

const Header = () => {
  return (
    <header className="bg-white sticky top-0 z-30 border-b border-slate-200 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <MyKapLogo className="h-9 w-auto" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;