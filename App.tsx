import React, { useState, useCallback, useRef } from 'react';
import Header from './components/Header.tsx';
import FileUpload from './components/FileUpload.tsx';
import ColumnSelector from './components/ColumnSelector.tsx';
import ReportPreview from './components/ReportPreview.tsx';
import { parseExcelFile } from './services/excelParser.ts';
import { generatePdf } from './services/pdfGenerator.ts';
import { TableRow } from './types.ts';
import { FileIcon, ResetIcon } from './components/Icons.tsx';
import Spinner from './components/Spinner.tsx';
// Fix: Import 'html2canvas' to resolve 'Cannot find name' error.
import html2canvas from 'html2canvas';

const DEFAULT_SELECTED_HEADERS = [
  'Loan Account', 'Borrower Name', 'Interest Rate', 'Maturity Date', 'Term Left', 'Regular Payment', 'Loan Balance'
];

const App = () => {
  const [file, setFile] = useState<File | null>(null);
  const [allHeaders, setAllHeaders] = useState<string[]>([]);
  const [data, setData] = useState<TableRow[]>([]);
  const [selectedHeaders, setSelectedHeaders] = useState<string[]>([]);
  
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [reportTitle, setReportTitle] = useState('');
  
  const tableRef = useRef<HTMLTableElement>(null);

  const handleFileSelect = useCallback(async (selectedFile: File | null) => {
    if (!selectedFile) {
      handleReset();
      return;
    }

    setIsLoadingFile(true);
    setError(null);
    setFile(selectedFile);
    setReportTitle('Account Portfolio (Lender)');

    try {
      const { headers, data: parsedData } = await parseExcelFile(selectedFile);
      setAllHeaders(headers);
      setData(parsedData);
      
      // Pre-select default headers if they exist in the file
      const defaultSelection = DEFAULT_SELECTED_HEADERS.filter(h => headers.includes(h));
      setSelectedHeaders(defaultSelection.length > 0 ? defaultSelection : []);

    } catch (err) {
      console.error(err);
      setError('Error al procesar el archivo. Asegúrate de que es un archivo XLSX o XLS válido.');
      handleReset();
    } finally {
      setIsLoadingFile(false);
    }
  }, []);

  const handleHeaderSelectionChange = (header: string) => {
    setSelectedHeaders(prev => 
      prev.includes(header) ? prev.filter(h => h !== header) : [...prev, header]
    );
  };

  const handleSelectAll = () => setSelectedHeaders(allHeaders);
  const handleDeselectAll = () => setSelectedHeaders([]);

  const handleGeneratePdf = async () => {
    if (selectedHeaders.length === 0 || data.length === 0) return;
    setIsGeneratingPdf(true);
    setError(null);
    try {
      await generatePdf(reportTitle || "Informe", selectedHeaders, data);
    } catch (e) {
      console.error("PDF generation failed:", e);
      setError("No se pudo generar el PDF. Inténtalo de nuevo.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };
  
  const handleGenerateImage = async () => {
    if (selectedHeaders.length === 0 || data.length === 0 || !tableRef.current) return;
    
    setIsGeneratingImage(true);
    setError(null);
    
    const tableElement = tableRef.current;
    // The scrollable container is the direct parent of the table
    const container = tableElement.parentElement;
    const tfootElement = tableElement.querySelector('tfoot');

    if (!container) {
        setError("No se pudo encontrar el contenedor de la tabla.");
        setIsGeneratingImage(false);
        return;
    }

    // Temporarily modify styles to capture the full table
    const originalMaxHeight = container.style.maxHeight;
    const originalOverflow = container.style.overflow;
    container.style.maxHeight = 'none';
    container.style.overflow = 'visible';

    // Temporarily remove sticky positioning from the footer to fix capture issue
    const wasSticky = tfootElement?.classList.contains('sticky');
    if (tfootElement && wasSticky) {
        tfootElement.classList.remove('sticky');
    }

    try {
        await new Promise(resolve => setTimeout(resolve, 100)); // Short delay for re-render
        
        const canvas = await html2canvas(tableElement, {
            scale: 2, // Higher resolution
            backgroundColor: '#ffffff', // Explicit white background
            logging: false,
            useCORS: true,
        });

        const image = canvas.toDataURL('image/png', 1.0);
        const link = document.createElement('a');
        link.href = image;
        link.download = `${reportTitle.replace(/\s/g, '_') || 'Informe'}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (e) {
        console.error("Image generation failed:", e);
        setError("No se pudo generar la imagen. Inténtalo de nuevo.");
    } finally {
        // Restore original styles
        container.style.maxHeight = originalMaxHeight;
        container.style.overflow = originalOverflow;
        // Restore sticky footer if it was originally sticky
        if (tfootElement && wasSticky) {
            tfootElement.classList.add('sticky');
        }
        setIsGeneratingImage(false);
    }
};


  const handleReset = () => {
    setFile(null);
    setAllHeaders([]);
    setData([]);
    setSelectedHeaders([]);
    setError(null);
    setIsLoadingFile(false);
    setIsGeneratingPdf(false);
    setIsGeneratingImage(false);
    setReportTitle('');
    
    // Reset file input if needed
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if(fileInput) fileInput.value = '';
  };
  
  const isProcessing = isLoadingFile || isGeneratingPdf || isGeneratingImage;
  
  return (
    <div className="bg-slate-50 min-h-screen font-sans">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {!file ? (
            <FileUpload onFileSelect={handleFileSelect} isLoading={isLoadingFile} />
          ) : (
            <div className="space-y-8">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-4">
                      <FileIcon className="w-8 h-8 text-blue-600" />
                      <div>
                          <p className="font-semibold text-slate-800">{file.name}</p>
                          <p className="text-sm text-slate-500">{data.length} filas cargadas</p>
                      </div>
                  </div>
                  <button onClick={handleReset} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                      <ResetIcon className="w-4 h-4" />
                      Cambiar Archivo
                  </button>
              </div>

              <div className="bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm space-y-8">
                <ColumnSelector 
                  headers={allHeaders}
                  selectedHeaders={selectedHeaders}
                  onSelectionChange={handleHeaderSelectionChange}
                  onSelectAll={handleSelectAll}
                  onDeselectAll={handleDeselectAll}
                />
                
                <hr className="border-slate-200" />

                <div className="space-y-4">
                  <label htmlFor="reportTitle" className="block text-xl font-bold text-slate-800">
                    Título del Informe
                  </label>
                  <input
                    id="reportTitle"
                    type="text"
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    placeholder="E.g., Informe de Préstamos Q3"
                    className="w-full max-w-lg block text-base text-slate-900 placeholder:text-slate-400 bg-white border border-slate-300 rounded-lg shadow-sm px-4 py-3 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-600"
                  />
                </div>
                
                <hr className="border-slate-200" />

                <ReportPreview ref={tableRef} headers={selectedHeaders} data={data} />
              </div>

              <div className="flex flex-col sm:flex-row justify-end items-center gap-4 sticky bottom-4 z-20">
                <button
                  onClick={handleGenerateImage}
                  disabled={selectedHeaders.length === 0 || isProcessing}
                  className="flex items-center justify-center w-full sm:w-auto px-6 py-3 text-base font-bold text-blue-600 bg-white border-2 border-blue-600 rounded-xl hover:bg-blue-50 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:bg-slate-300 disabled:text-slate-500 disabled:border-slate-300 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  {isGeneratingImage ? <><Spinner /> <span className="ml-2">Generando Imagen...</span></> : 'Descargar como Imagen (PNG)'}
                </button>
                <button
                  onClick={handleGeneratePdf}
                  disabled={selectedHeaders.length === 0 || isProcessing}
                  className="flex items-center justify-center w-full sm:w-auto px-8 py-4 text-lg font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  {isGeneratingPdf ? <><Spinner /> <span className="ml-2">Generando PDF...</span></> : 'Generar PDF'}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;