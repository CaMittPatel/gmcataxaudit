import React, { useState, useRef } from 'react';
import { Upload, Download, FileSpreadsheet, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Client } from '../types';

interface ExcelImportProps {
  onImportClients: (clients: Omit<Client, 'id' | 'lastUpdated'>[]) => void;
  existingClients: Client[];
}

interface ImportResult {
  success: number;
  errors: string[];
  duplicates: string[];
}

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Lakshadweep', 'Puducherry'
];

const ExcelImport: React.FC<ExcelImportProps> = ({ onImportClients, existingClients }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const csvContent = [
      ['Client Name', 'Registration Status', 'GSTN', 'PAN', 'State'],
      ['ABC Enterprises', 'Registered', '27ABCDE1234F1Z5', 'ABCDE1234F', 'Maharashtra'],
      ['XYZ Company', 'Unregistered', '', 'XYZAB5678C', 'Gujarat'],
      ['Sample Corp Ltd', 'Registered', '24XYZAB5678G1Z2', 'SAMPL9876D', 'Gujarat']
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'client-import-template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const validateGSTN = (gstn: string): boolean => {
    if (!gstn) return true; // Empty GSTN is valid for unregistered
    return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstn);
  };

  const parseCSV = (text: string): string[][] => {
    const lines = text.split('\n').filter(line => line.trim());
    return lines.map(line => {
      const result = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setImportResult(null);
    setShowResult(false);

    try {
      const text = await file.text();
      const rows = parseCSV(text);
      
      if (rows.length < 2) {
        throw new Error('File must contain at least a header row and one data row');
      }

      const headers = rows[0].map(h => h.toLowerCase().trim());
      const dataRows = rows.slice(1);

      // Validate headers
      const requiredHeaders = ['client name', 'registration status', 'gstn', 'pan', 'state'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      
      if (missingHeaders.length > 0) {
        throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
      }

      const result: ImportResult = {
        success: 0,
        errors: [],
        duplicates: []
      };

      const validClients: Omit<Client, 'id' | 'lastUpdated'>[] = [];

      dataRows.forEach((row, index) => {
        const rowNum = index + 2; // +2 because we start from row 2 (after header)
        
        try {
          const clientName = row[headers.indexOf('client name')]?.trim();
          const registrationStatus = row[headers.indexOf('registration status')]?.trim();
          const gstn = row[headers.indexOf('gstn')]?.trim().toUpperCase();
          const pan = row[headers.indexOf('pan')]?.trim().toUpperCase();
          const state = row[headers.indexOf('state')]?.trim();

          // Validate required fields
          if (!clientName) {
            result.errors.push(`Row ${rowNum}: Client name is required`);
            return;
          }

          if (!registrationStatus || !['Registered', 'Unregistered'].includes(registrationStatus)) {
            result.errors.push(`Row ${rowNum}: Registration status must be 'Registered' or 'Unregistered'`);
            return;
          }

          if (!state || !INDIAN_STATES.includes(state)) {
            result.errors.push(`Row ${rowNum}: Invalid state '${state}'`);
            return;
          }

          // Validate GSTN for registered clients
          if (registrationStatus === 'Registered') {
            if (!gstn) {
              result.errors.push(`Row ${rowNum}: GSTN is required for registered clients`);
              return;
            }
            if (!validateGSTN(gstn)) {
              result.errors.push(`Row ${rowNum}: Invalid GSTN format '${gstn}'`);
              return;
            }
          }

          // Validate PAN format if provided
          if (pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)) {
            result.errors.push(`Row ${rowNum}: Invalid PAN format '${pan}' (should be 10 characters: 5 letters, 4 digits, 1 letter)`);
            return;
          }

          // Check for duplicates in existing clients (by name or GSTN)
          const existingByName = existingClients.find(c => 
            c.name.toLowerCase() === clientName.toLowerCase()
          );
          const existingByGSTN = gstn ? existingClients.find(c => 
            c.gstn && c.gstn.toLowerCase() === gstn.toLowerCase()
          ) : null;
          
          if (existingByName || existingByGSTN) {
            const duplicateClient = existingByName || existingByGSTN;
            result.duplicates.push(`Row ${rowNum}: Client '${clientName}' ${existingByName ? '(by name)' : '(by GSTN)'} already exists - will be updated`);
          }

          // Check for duplicates within the import file
          const duplicateInFile = validClients.find(c => 
            c.name.toLowerCase() === clientName.toLowerCase() || 
            (gstn && c.gstn && c.gstn.toLowerCase() === gstn.toLowerCase())
          );
          
          if (duplicateInFile) {
            result.errors.push(`Row ${rowNum}: Duplicate client '${clientName}' in import file`);
            return;
          }

          validClients.push({
            name: clientName,
            registrationStatus: registrationStatus as 'Registered' | 'Unregistered',
            gstn: registrationStatus === 'Registered' ? gstn : undefined,
            pan: pan || undefined,
            state: state
          });

          result.success++;
        } catch (error) {
          result.errors.push(`Row ${rowNum}: ${(error as Error).message}`);
        }
      });

      setImportResult(result);
      setShowResult(true);

      if (validClients.length > 0) {
        onImportClients(validClients);
      }

    } catch (error) {
      setImportResult({
        success: 0,
        errors: [(error as Error).message],
        duplicates: []
      });
      setShowResult(true);
    } finally {
      setIsProcessing(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <div className="flex items-center mb-6">
        <FileSpreadsheet className="h-6 w-6 text-indigo-600 mr-3" />
        <h2 className="text-2xl font-bold text-gray-900">Excel Import Utility</h2>
      </div>

      <div className="space-y-6">
        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Import Instructions</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Download the template file and fill in your client data</li>
            <li>• Required columns: Client Name, Registration Status, GSTN, PAN, State</li>
            <li>• Registration Status must be either "Registered" or "Unregistered"</li>
            <li>• GSTN is required only for registered clients (15 characters)</li>
            <li>• PAN is optional but must be valid format if provided (10 characters)</li>
            <li>• State must be a valid Indian state or UT</li>
            <li>• Duplicate client names will be skipped</li>
          </ul>
        </div>

        {/* Template Download */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-900">Download Template</h4>
            <p className="text-sm text-gray-600">Get the CSV template with sample data</p>
          </div>
          <button
            onClick={downloadTemplate}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Template
          </button>
        </div>

        {/* File Upload */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <div className="space-y-2">
            <p className="text-lg font-medium text-gray-900">Upload Client Data</p>
            <p className="text-gray-600">Select your CSV file to import clients</p>
          </div>
          
          <div className="mt-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={isProcessing}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white transition-colors cursor-pointer ${
                isProcessing 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
              }`}
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5 mr-2" />
                  Choose CSV File
                </>
              )}
            </label>
          </div>
        </div>

        {/* Import Results */}
        {showResult && importResult && (
          <div className="space-y-4">
            {/* Success Summary */}
            {importResult.success > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <h4 className="font-medium text-green-900">
                    Successfully imported {importResult.success} client{importResult.success !== 1 ? 's' : ''}
                  </h4>
                </div>
              </div>
            )}

            {/* Duplicates */}
            {importResult.duplicates.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-900 mb-2">
                      Skipped {importResult.duplicates.length} duplicate{importResult.duplicates.length !== 1 ? 's' : ''}
                    </h4>
                    <ul className="text-sm text-yellow-800 space-y-1">
                      {importResult.duplicates.map((duplicate, index) => (
                        <li key={index}>• {duplicate}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Errors */}
            {importResult.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start">
                  <XCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-900 mb-2">
                      {importResult.errors.length} error{importResult.errors.length !== 1 ? 's' : ''} found
                    </h4>
                    <ul className="text-sm text-red-800 space-y-1 max-h-40 overflow-y-auto">
                      {importResult.errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExcelImport;