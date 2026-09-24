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
  FileText,
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
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="border-b border-border/60 pb-6">
        <div className="flex items-center space-x-2 mb-1.5">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Upload className="w-3 h-3" />
            Ingestion Pipeline
          </span>
          <span className="text-xs text-slate-500">•</span>
          <span className="text-xs text-slate-400">CSV & XLSX Supported</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
          Lead Import & Deduplication
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
          Upload spreadsheets, normalize domains and phones, preview collisions in real-time, and batch-ingest cleanly into PostgreSQL.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center space-x-3">
          <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Step 1: Upload / Sample Box */}
      {!previewData && (
        <div className="space-y-5">
          <div className="border-2 border-dashed border-white/[0.08] hover:border-indigo-500/40 rounded-2xl p-10 text-center space-y-4 glass-card transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
              <Upload className="w-6 h-6" />
            </div>

            <div>
              <p className="text-sm font-semibold text-white">
                Drag and drop your spreadsheet here, or browse
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Supports .CSV and .XLSX files. Required headers: Company Name, Website, Phone, Email, Location.
              </p>
            </div>

            <div className="pt-2">
              <label className="cursor-pointer inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all shadow-md shadow-indigo-600/20 active:scale-95">
                <FileText className="w-3.5 h-3.5" />
                <span>Select File from Disk</span>
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
          <div className="glass-panel p-5 rounded-2xl border border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-white">
                  Load Pre-Configured Dubai Business Dataset
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  8 verified high-intent UAE companies across Interior Architecture, Clinics, Carpentry & Law.
                </p>
              </div>
            </div>

            <button
              onClick={handleLoadSample}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-slate-200 text-xs font-medium transition-all flex items-center space-x-2 self-start sm:self-auto shrink-0"
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
            <div className="glass-card p-4 rounded-xl border border-white/[0.06]">
              <span className="text-[11px] text-slate-400 font-medium">Total Rows</span>
              <div className="text-2xl font-bold tracking-tight text-white mt-1">
                {previewData.totalRows}
              </div>
            </div>
            <div className="glass-card p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03]">
              <span className="text-[11px] text-emerald-400 font-medium">Qualified Leads</span>
              <div className="text-2xl font-bold tracking-tight text-emerald-400 mt-1">
                {previewData.newLeadsCount}
              </div>
            </div>
            <div className="glass-card p-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.03]">
              <span className="text-[11px] text-amber-400 font-medium">Duplicate Collisions</span>
              <div className="text-2xl font-bold tracking-tight text-amber-400 mt-1">
                {previewData.duplicateLeadsCount}
              </div>
            </div>
            <div className="glass-card p-4 rounded-xl border border-rose-500/20 bg-rose-500/[0.03]">
              <span className="text-[11px] text-rose-400 font-medium">Invalid Rows</span>
              <div className="text-2xl font-bold tracking-tight text-rose-400 mt-1">
                {previewData.invalidRows}
              </div>
            </div>
          </div>

          {/* Preview Table */}
          <div className="glass-panel rounded-2xl border border-white/[0.06] overflow-hidden">
            <div className="px-5 py-3 border-b border-white/[0.04] bg-white/[0.01] flex items-center justify-between text-xs font-medium text-slate-300">
              <span>Parsed Lead Breakdown</span>
              <span className="text-[11px] text-slate-500">
                Multi-Key Normalization Active
              </span>
            </div>

            <div className="divide-y divide-white/[0.04] max-h-96 overflow-y-auto">
              {previewData.items.map((item: any) => (
                <div
                  key={item.rowNumber}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-white">
                        {item.input.companyName}
                      </span>
                      {item.input.industry && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/[0.04] text-slate-400 border border-white/[0.06]">
                          {item.input.industry}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      {item.input.contactName && (
                        <span>Contact: {item.input.contactName}</span>
                      )}
                      {item.input.website && (
                        <span className="font-mono text-[11px] text-slate-400">Web: {item.input.website}</span>
                      )}
                      {item.input.phone && (
                        <span className="font-mono text-[11px] text-slate-400">Phone: {item.input.phone}</span>
                      )}
                      {item.input.city && (
                        <span>City: {item.input.city}</span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 self-end sm:self-center">
                    {item.isDuplicate ? (
                      <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 border border-amber-500/20 text-amber-400">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Duplicate ({item.duplicateReason})</span>
                      </span>
                    ) : item.isValid ? (
                      <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Ready to Ingest</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium bg-rose-500/10 border border-rose-500/20 text-rose-400">
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
              className="px-4 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] text-slate-400 hover:text-white text-xs font-medium transition-all"
            >
              Cancel & Upload Another
            </button>

            <button
              onClick={handleCommitImport}
              disabled={importing || previewData.newLeadsCount === 0}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium flex items-center space-x-2 transition-all shadow-md shadow-indigo-600/20 active:scale-95"
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
