"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Layers,
} from "lucide-react";

export default function LeadImportPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  // Load sample dataset
  const handleLoadSample = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/sample_data/dubai_leads.csv");
      const text = await res.text();

      // Convert CSV text to rows
      const lines = text.split("\n").filter((l) => l.trim().length > 0);
      const headers = lines[0].split(",").map((h) => h.trim());
      const rows = lines.slice(1).map((line) => {
        const values = line.split(",").map((v) => v.trim());
        const rowObj: any = {};
        headers.forEach((h, idx) => {
          rowObj[h] = values[idx] || "";
        });
        return rowObj;
      });

      const previewRes = await fetch("/api/leads/import/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });

      const json = await previewRes.json();
      if (json.success) {
        setPreviewData(json.data);
      } else {
        setError(json.error || "Failed to generate preview");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load sample dataset");
    } finally {
      setLoading(false);
    }
  };

  // Upload custom file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", uploadedFile);

      const res = await fetch("/api/leads/import/preview", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (json.success) {
        setPreviewData(json.data);
      } else {
        setError(json.error || "Failed to parse file preview");
      }
    } catch (err: any) {
      setError(err.message || "Failed to upload file");
    } finally {
      setLoading(false);
    }
  };

  // Commit Import
  const handleCommitImport = async () => {
    if (!previewData || !previewData.items) return;

    try {
      setImporting(true);
      setError(null);

      const validLeads = previewData.items
        .filter((item: any) => item.isValid && !item.isDuplicate)
        .map((item: any) => item.input);

      const res = await fetch("/api/leads/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leads: validLeads,
          skipDuplicates: true,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setImportResult(json.data);
        setTimeout(() => {
          router.push("/leads");
        }, 1500);
      } else {
        setError(json.error || "Failed to commit import");
      }
    } catch (err: any) {
      setError(err.message || "Failed to save leads to database");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-blue-950/80 border border-blue-800/60 text-blue-400">
            IMPORT PIPELINE
          </span>
          <span className="text-xs text-slate-400">CSV / XLSX Ingestion</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
          Lead Import & Deduplication Engine
        </h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Upload spreadsheets, normalize domains/phones, preview duplicate collisions, and ingest into PostgreSQL.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs flex items-center space-x-2">
          <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Step 1: Upload / Sample Box */}
      {!previewData && (
        <div className="space-y-6">
          <div className="border-2 border-dashed border-border hover:border-slate-600 rounded-2xl p-10 text-center space-y-4 bg-card/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center mx-auto">
              <Upload className="w-6 h-6" />
            </div>

            <div>
              <p className="text-sm font-semibold text-white">
                Drag and drop your lead spreadsheet here
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Supports .CSV and .XLSX format with columns for Company Name, Website, Phone, Email, Location.
              </p>
            </div>

            <div className="flex items-center justify-center space-x-3 pt-2">
              <label className="cursor-pointer px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors">
                <span>Select File</span>
                <input
                  type="file"
                  accept=".csv, .xlsx, .xls"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={loading}
                />
              </label>
            </div>
          </div>

          {/* Preset Sample Option */}
          <div className="p-5 rounded-xl bg-card border border-border flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileSpreadsheet className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-xs font-semibold text-white">
                  Load Pre-Configured Dubai Business Sample
                </h3>
                <p className="text-[11px] text-slate-400">
                  8 verified high-intent Dubai & UAE companies across Interior Architecture, Clinics, Carpentry & Law.
                </p>
              </div>
            </div>

            <button
              onClick={handleLoadSample}
              disabled={loading}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-colors flex items-center space-x-2"
            >
              {loading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span>Load Dubai Dataset</span>
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Deduplication & Validation Preview */}
      {previewData && (
        <div className="space-y-6">
          {/* Summary Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-card border border-border">
              <span className="text-[11px] text-slate-400">Total Rows</span>
              <div className="text-xl font-bold font-mono text-white mt-0.5">
                {previewData.totalRows}
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40">
              <span className="text-[11px] text-emerald-400">New Qualified Leads</span>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">
                {previewData.newLeadsCount}
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/40">
              <span className="text-[11px] text-amber-400">Duplicate Collisions</span>
              <div className="text-xl font-bold font-mono text-amber-400 mt-0.5">
                {previewData.duplicateLeadsCount}
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-800/40">
              <span className="text-[11px] text-rose-400">Invalid Rows</span>
              <div className="text-xl font-bold font-mono text-rose-400 mt-0.5">
                {previewData.invalidRows}
              </div>
            </div>
          </div>

          {/* Preview Table */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-[#0c0e14] flex items-center justify-between text-xs font-semibold text-slate-300">
              <span>Parsed Lead Breakdown</span>
              <span className="font-mono text-[11px] text-slate-400">
                Multi-Key Deduplication Active
              </span>
            </div>

            <div className="divide-y divide-border/60 max-h-96 overflow-y-auto">
              {previewData.items.map((item: any) => (
                <div
                  key={item.rowNumber}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-white">
                        {item.input.companyName}
                      </span>
                      {item.input.industry && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                          {item.input.industry}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                      {item.input.contactName && (
                        <span>Contact: {item.input.contactName}</span>
                      )}
                      {item.input.website && (
                        <span>Web: {item.input.website}</span>
                      )}
                      {item.input.phone && (
                        <span>Phone: {item.input.phone}</span>
                      )}
                      {item.input.city && (
                        <span>City: {item.input.city}</span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0">
                    {item.isDuplicate ? (
                      <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-950/80 border border-amber-800/60 text-amber-300">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Duplicate ({item.duplicateReason})</span>
                      </span>
                    ) : item.isValid ? (
                      <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-950/80 border border-emerald-800/60 text-emerald-300">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Ready to Ingest</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-rose-950/80 border border-rose-800/60 text-rose-300">
                        <XCircle className="w-3 h-3" />
                        <span>Invalid</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => {
                setPreviewData(null);
                setFile(null);
              }}
              className="px-4 py-2 rounded-lg border border-border text-slate-400 hover:text-white text-xs font-medium"
            >
              Cancel & Upload Another
            </button>

            <button
              onClick={handleCommitImport}
              disabled={importing || previewData.newLeadsCount === 0}
              className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center space-x-2 transition-colors shadow-lg shadow-blue-900/30"
            >
              {importing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              <span>
                Commit {previewData.newLeadsCount} Leads to Database
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
