import React, { useCallback, useState } from 'react';
import { UploadIcon } from './Icons.tsx';
import Spinner from './Spinner.tsx';

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  isLoading: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, isLoading }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  }, [onFileSelect]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        onFileSelect(e.target.files[0]);
    }
  };


  return (
    <div
      className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-colors duration-300 ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-slate-50 hover:border-slate-300'}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <input
        type="file"
        id="file-upload"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        accept=".xlsx, .xls"
        onChange={handleFileChange}
        disabled={isLoading}
      />
      <label htmlFor="file-upload" className="flex flex-col items-center justify-center space-y-4 cursor-pointer">
        {isLoading ? (
          <>
            <Spinner />
            <p className="text-lg font-semibold text-slate-700">Procesando archivo...</p>
            <p className="text-sm text-slate-500">Esto puede tardar unos segundos.</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-slate-200/50 rounded-full flex items-center justify-center">
                <UploadIcon className="w-8 h-8 text-slate-600" />
            </div>
            <p className="text-xl font-semibold text-slate-700">Arrastra y suelta tu archivo aquí</p>
            <p className="text-slate-500">o <span className="font-semibold text-blue-600">haz clic para seleccionar un archivo</span></p>
            <p className="text-xs text-slate-400 mt-2 pt-2">Formatos soportados: XLSX, XLS</p>
          </>
        )}
      </label>
    </div>
  );
};

export default FileUpload;