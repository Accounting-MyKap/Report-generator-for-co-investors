import { TableRow } from '../types.ts';

interface ParsedExcelData {
  headers: string[];
  data: TableRow[];
}

export const parseExcelFile = (file: File): Promise<ParsedExcelData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event: ProgressEvent<FileReader>) => {
      if (!event.target || !event.target.result) {
        return reject(new Error("Failed to read file."));
      }

      try {
        const data = event.target.result;
        const workbook = (window as any).XLSX.read(data, {
          type: 'binary',
          cellDates: true,
        });

        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Use sheet_to_json to get an array of objects
        const jsonData: TableRow[] = (window as any).XLSX.utils.sheet_to_json(worksheet, {
          raw: false, // Use formatted strings for dates
          dateNF: 'mm/dd/yyyy' // format for dates
        });
        
        if (jsonData.length === 0) {
          resolve({ headers: [], data: [] });
          return;
        }

        // Get headers from the keys of the first object
        const headers = Object.keys(jsonData[0]);

        resolve({ headers, data: jsonData });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsBinaryString(file);
  });
};