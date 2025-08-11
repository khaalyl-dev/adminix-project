// import-csv-workers.tsx
// This file provides the component for importing CSV workers into the workspace.
import { useState } from "react";
import { Upload, FileText, AlertCircle, CheckCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { importCSVWorkersMutationFn } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import useWorkspaceId from "@/hooks/use-workspace-id";

const ImportCSVWorkers = () => {
  const [csvData, setCsvData] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string>("");
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: importCSVWorkersMutationFn,
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `Imported ${data.totalImported} workers successfully`,
        variant: "success",
      });
      
      // Invalidate queries to refresh the members list
      queryClient.invalidateQueries({ queryKey: ["members", workspaceId] });
      queryClient.invalidateQueries({ queryKey: ["csv-workers", workspaceId] });
      
      // Reset form
      setCsvData("");
      setFileName("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to import CSV workers",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Error",
        description: "Please upload a CSV file",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCsvData(content);
      setFileName(file.name);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleImport = () => {
    if (!csvData.trim()) {
      toast({
        title: "Error",
        description: "Please upload a CSV file first",
        variant: "destructive",
      });
      return;
    }

    mutate({
      workspaceId,
      csvData,
    });
  };

  const handleClear = () => {
    setCsvData("");
    setFileName("");
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Import CSV Workers
        </CardTitle>
        <CardDescription>
          Upload a CSV file with worker data to add them as workspace members. 
          The CSV should have columns: Name, Role, Technologies, Experience
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer ${
            isDragging
              ? "border-primary bg-primary/10 scale-105"
              : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30"
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !csvData && document.getElementById('csv-file-input')?.click()}
        >
          {!csvData ? (
            <div className="space-y-4">
              <div className="relative">
                <Upload className="w-12 h-12 mx-auto text-muted-foreground transition-colors group-hover:text-primary" />
                <div className="absolute inset-0 bg-primary/10 rounded-full scale-0 group-hover:scale-100 transition-transform duration-200" />
              </div>
              <div className="space-y-2">
                <p className="text-base font-medium">
                  Drop your CSV file here, or{" "}
                  <span className="text-primary font-semibold hover:underline">
                    click to browse
                  </span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Supports CSV files with Name, Role, Technologies, Experience columns
                </p>
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <FileText className="w-3 h-3" />
                  <span>CSV files only</span>
                </div>
              </div>
              <input
                id="csv-file-input"
                type="file"
                accept=".csv"
                onChange={handleFileInput}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <CheckCircle className="w-12 h-12 mx-auto text-green-600" />
                <div className="absolute inset-0 bg-green-100 rounded-full scale-100 animate-pulse" />
              </div>
              <div className="space-y-2">
                <p className="text-base font-medium text-green-600">
                  File uploaded successfully
                </p>
                <p className="text-sm text-muted-foreground">
                  {fileName}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClear();
                  }}
                  disabled={isPending}
                >
                  <X className="w-4 h-4 mr-1" />
                  Remove File
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* CSV Preview */}
        {csvData && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">CSV Preview</h4>
            <div className="bg-muted rounded-md p-3 max-h-32 overflow-y-auto">
              <pre className="text-xs font-mono whitespace-pre-wrap">
                {csvData.split('\n').slice(0, 5).join('\n')}
                {csvData.split('\n').length > 5 && '\n...'}
              </pre>
            </div>
          </div>
        )}

        {/* Import Button */}
        {csvData && (
          <Button
            onClick={handleImport}
            disabled={isPending}
            className="w-full"
          >
            {isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Importing...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Import Workers
              </>
            )}
          </Button>
        )}

        {/* Instructions */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>CSV Format:</strong> Name, Role, Technologies, Experience<br />
            <strong>Example:</strong> Bob, Frontend Developer, React:Vue:HTML:CSS:JavaScript, 5:2:6:6:5
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default ImportCSVWorkers; 