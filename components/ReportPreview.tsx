import React, { useMemo, forwardRef } from 'react';
import { TableRow } from '../types.ts';

interface ReportPreviewProps {
  headers: string[];
  data: TableRow[];
}

/**
 * Converts a string to Title Case.
 * @param str The string to convert.
 * @returns The Title Cased string.
 */
const toTitleCase = (str: string): string => {
  if (!str) return '';
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};


/**
 * Parses a string or number into a number, handling currency symbols,
 * commas, and accounting-style negative numbers in parentheses.
 * @param value The value to parse.
 * @returns A number, or null if parsing is not possible.
 */
const parseCurrency = (value: any): number | null => {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value !== 'string' || value.trim() === '') {
    return null;
  }

  // Handle accounting format for negative numbers, e.g., (1,234.56)
  const isNegative = value.includes('(') && value.includes(')');
  
  // Remove all non-numeric characters except for the decimal point and the minus sign
  const cleanedString = value.replace(/[^0-9.-]+/g, '');
  
  if (cleanedString === '' || cleanedString === '.' || cleanedString === '-') {
    return null;
  }
  
  const num = Number(cleanedString);

  if (isNaN(num)) {
    return null;
  }
  
  // If the original string used parentheses and the parsed number is positive, make it negative.
  if (isNegative && num > 0) {
    return -num;
  }

  return num;
};

/**
 * Formats a value as a USD currency string. If the value cannot be parsed
 * as a number, the original value is returned as a string.
 * @param value The value to format.
 * @returns A formatted currency string or the original value.
 */
const formatCurrency = (value: any): string => {
  const number = parseCurrency(value);
  
  if (number === null) {
    return String(value ?? ''); // Return original value if it couldn't be parsed
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(number);
};

/**
 * Parses a string or number representing a percentage into a number.
 * @param value The value to parse (e.g., '9.20%', 8.5).
 * @returns A number, or null if parsing fails.
 */
const parsePercent = (value: any): number | null => {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value !== 'string' || value.trim() === '') {
    return null;
  }
  const cleanedString = value.replace(/[%]/g, '').trim();
  const num = parseFloat(cleanedString);
  return isNaN(num) ? null : num;
};


const ReportPreview = forwardRef<HTMLTableElement, ReportPreviewProps>(({ headers, data }, ref) => {
  const totals = useMemo(() => {
    const findHeader = (targetHeader: string) => headers.find(h => h.toLowerCase() === targetHeader.toLowerCase());
    
    const regularPaymentHeader = findHeader('Regular Payment');
    const loanBalanceHeader = findHeader('Loan Balance');
    const interestRateHeader = findHeader('Interest Rate');

    const regularPaymentTotal = regularPaymentHeader 
      ? data.reduce((acc, row) => acc + (parseCurrency(row[regularPaymentHeader]) || 0), 0) 
      : 0;
    const loanBalanceTotal = loanBalanceHeader 
      ? data.reduce((acc, row) => acc + (parseCurrency(row[loanBalanceHeader]) || 0), 0)
      : 0;
    const loanCount = data.length;

    let portfolioYield = 0;
    if (interestRateHeader && loanCount > 0) {
      const totalInterestRate = data.reduce((acc, row) => acc + (parsePercent(row[interestRateHeader]) || 0), 0);
      portfolioYield = totalInterestRate / loanCount;
    }
    
    return { regularPaymentTotal, loanBalanceTotal, portfolioYield, loanCount };
  }, [data, headers]);

  if (headers.length === 0) {
    return (
        <div>
            <h2 className="text-xl font-bold text-slate-800 mb-4">Previsualización del Informe</h2>
            <div className="p-12 text-center border-2 border-dashed rounded-lg bg-slate-50">
                <p className="text-slate-500">Selecciona al menos una columna para ver la previsualización.</p>
            </div>
        </div>
    );
  }

  const columnsToAlignRight = ['Interest Rate', 'Maturity Date', 'Term Left', 'Regular Payment', 'Loan Balance', 'Percent Owned'].map(h => h.toLowerCase());

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-slate-800">Previsualización del Informe</h2>
      <div className="max-h-[450px] overflow-auto border rounded-lg shadow-inner bg-slate-50/30">
        <table ref={ref} className="min-w-full divide-y divide-slate-200 bg-white">
          <thead className="bg-slate-100 sticky top-0 z-10">
            <tr>
              {headers.map(header => (
                <th 
                  key={header} 
                  scope="col" 
                  className={`px-5 py-3 text-xs font-semibold text-slate-600 tracking-wider ${columnsToAlignRight.includes(header.toLowerCase()) ? 'text-right' : 'text-left'}`}
                >
                  {toTitleCase(header)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {data.slice(0, 50).map((row, rowIndex) => (
              <tr key={rowIndex} className={rowIndex % 2 === 0 ? undefined : 'bg-slate-50/70'}>
                {headers.map(header => {
                  const lowerCaseHeader = header.toLowerCase();
                  const isRightAligned = columnsToAlignRight.includes(lowerCaseHeader);
                  const isCurrency = lowerCaseHeader === 'regular payment' || lowerCaseHeader === 'loan balance';
                  return (
                    <td key={`${rowIndex}-${header}`} className={`px-5 py-4 whitespace-nowrap text-sm text-slate-700 ${isRightAligned ? 'text-right' : 'text-left'}`}>
                      {isCurrency ? formatCurrency(row[header]) : String(row[header] ?? '')}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-200 sticky bottom-0 font-bold text-slate-800">
            <tr>
              {headers.map((header, index) => {
                const findHeaderIndex = (targetHeader: string) => headers.findIndex(h => h.toLowerCase() === targetHeader.toLowerCase());
                const regularPaymentIndex = findHeaderIndex('Regular Payment');
                const loanBalanceIndex = findHeaderIndex('Loan Balance');
                const hasInterestRate = headers.some(h => h.toLowerCase() === 'interest rate');

                if (index === 0) {
                  return <td key="total-label" className="px-5 py-3 text-left text-sm">Totals</td>;
                }
                if (index === 1 && hasInterestRate) {
                   const yieldText = `Portfolio Yield: ${totals.portfolioYield.toFixed(4)}% (${totals.loanCount} loans)`;
                   return <td key="yield" className="px-5 py-3 text-left text-sm whitespace-nowrap">{yieldText}</td>;
                }
                if (index === regularPaymentIndex) {
                    return <td key="total-rp" className="px-5 py-3 text-right text-sm">{formatCurrency(totals.regularPaymentTotal)}</td>;
                }
                if (index === loanBalanceIndex) {
                    return <td key="total-lb" className="px-5 py-3 text-right text-sm">{formatCurrency(totals.loanBalanceTotal)}</td>;
                }
                return <td key={`empty-${header}`}></td>;
              })}
            </tr>
          </tfoot>
        </table>
      </div>
       {data.length > 50 && <p className="text-sm text-center text-slate-500 mt-3">Mostrando las primeras 50 filas de {data.length} totales.</p>}
    </div>
  );
});

export default ReportPreview;