import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';
import { Download } from "lucide-react";

interface ExportButtonProps {
  data: any[];
  filename: string;
  format: 'csv' | 'json';
  className?: string;
}

export const ExportButton = ({ 
  data, 
  filename, 
  format, 
  className = "" 
}: ExportButtonProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Échapper les virgules et guillemets
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    downloadFile(csvContent, `${filename}.csv`, 'text/csv');
  };

  const exportToJSON = (data: any[], filename: string) => {
    const jsonContent = JSON.stringify(data, null, 2);
    downloadFile(jsonContent, `${filename}.json`, 'application/json');
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    if (data.length === 0) {
      toast({
        title: "Aucune donnée",
        description: "Il n'y a aucune donnée à exporter",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simule un délai
      
      if (format === 'csv') {
        exportToCSV(data, filename);
      } else {
        exportToJSON(data, filename);
      }

      toast({
        title: "Export réussi",
        description: `${data.length} enregistrement(s) exporté(s) en ${format.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter les données",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting || data.length === 0}
      variant="outline"
      size="sm"
      className={className}
    >
      <Download className="h-4 w-4 mr-2" />
      {isExporting ? 'Export...' : `Export ${format.toUpperCase()}`}
    </Button>
  );
};