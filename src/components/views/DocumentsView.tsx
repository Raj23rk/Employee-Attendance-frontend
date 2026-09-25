import React, { useState, useEffect, useCallback } from "react";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AppShell } from "@/components/layout/AppShell";
import { FileText, Download, Upload, Shield, Laptop, Monitor, CreditCard, RefreshCw, X, Wrench } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { documentsService } from "@/services/documents.service";
import { assetsService } from "@/services/assets.service";

function DocumentsContent() {
  const [tab, setTab] = useState<"docs" | "assets">("docs");
  const [documents, setDocuments] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal States
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forms
  const [uploadForm, setUploadForm] = useState({
    title: "",
    category: "Identity",
    fileUrl: "https://example.com/document.pdf",
  });

  const [serviceIssue, setServiceIssue] = useState("");

  const fetchDocsAndAssets = useCallback(async () => {
    setIsLoading(true);
    try {
      const [docsRes, assetsRes] = await Promise.allSettled([
        documentsService.getDocuments(),
        assetsService.getMyAssets(),
      ]);

      if (docsRes.status === "fulfilled" && docsRes.value) {
        const data = docsRes.value.data || docsRes.value;
        setDocuments(Array.isArray(data) ? data : []);
      }
      if (assetsRes.status === "fulfilled" && assetsRes.value) {
        const data = assetsRes.value.data || assetsRes.value;
        setAssets(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to load documents/assets:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocsAndAssets();
  }, [fetchDocsAndAssets]);

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await documentsService.uploadDocument(uploadForm);
      alert("Document metadata uploaded successfully!");
      setShowUploadModal(false);
      setUploadForm({ title: "", category: "Identity", fileUrl: "https://example.com/document.pdf" });
      await fetchDocsAndAssets();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to upload document.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleServiceRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await assetsService.requestService(selectedAssetId, { issue: serviceIssue });
      alert("Hardware service request submitted!");
      setShowServiceModal(false);
      setServiceIssue("");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to submit service request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[#12173A]">
            Documents Vault &amp; Assigned Assets
          </h1>
          <p className="text-xs sm:text-sm text-[#5B6180]">
            Institutional credentials, official compliance files, tax certificates, and issued hardware.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchDocsAndAssets}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          <Button variant="primary" size="sm" onClick={() => setShowUploadModal(true)} className="gap-2">
            <Upload className="h-4 w-4" />
            <span>Upload Document</span>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E2E4EF] pb-2 text-xs font-semibold">
        <button
          onClick={() => setTab("docs")}
          className={`rounded-xl px-4 py-2 transition-all ${
            tab === "docs" ? "bg-[#EA6118] text-white shadow-sm" : "bg-white text-[#5B6180] hover:bg-[#F4F5F9] border border-slate-200"
          }`}
        >
          Official Documents Vault
        </button>
        <button
          onClick={() => setTab("assets")}
          className={`rounded-xl px-4 py-2 transition-all ${
            tab === "assets" ? "bg-[#EA6118] text-white shadow-sm" : "bg-white text-[#5B6180] hover:bg-[#F4F5F9] border border-slate-200"
          }`}
        >
          Assigned Hardware &amp; Assets
        </button>
      </div>

      {/* Tab 1: Documents */}
      {tab === "docs" && (
        <div className="rounded-3xl border border-[#E2E4EF] bg-white p-6 shadow-sm overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
            </div>
          ) : documents.length > 0 ? (
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#E2E4EF] bg-[#F4F5F9] text-[#5B6180]">
                <tr>
                  <th className="py-3 px-4 uppercase">Document Name</th>
                  <th className="py-3 px-4 uppercase">Category</th>
                  <th className="py-3 px-4 uppercase">Uploaded Date</th>
                  <th className="py-3 px-4 uppercase text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E4EF]">
                {documents.map((doc: any, i) => (
                  <tr key={doc._id || doc.id || i} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold flex items-center gap-2">
                      <FileText className="h-4 w-4 text-orange-500" />
                      <span>{doc.title || doc.name}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="rounded bg-blue-100 text-blue-700 px-2 py-0.5 text-[10px] font-bold">
                        {doc.category || "General"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : (doc.date || "Verified")}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <a
                        href={doc.fileUrl || "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="text-orange-600 font-bold hover:underline inline-flex items-center gap-1"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>View / Download</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-xs text-slate-400 text-center py-12">No documents uploaded yet.</p>
          )}
        </div>
      )}

      {/* Tab 2: Assets */}
      {tab === "assets" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {assets.length > 0 ? (
            assets.map((ast: any, idx) => (
              <div key={ast._id || ast.id || idx} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="rounded bg-slate-100 text-slate-700 px-2 py-0.5 text-[10px] font-bold">
                    {ast.category || "Hardware"}
                  </span>
                  <Badge variant="success">Active</Badge>
                </div>
                <h3 className="font-bold text-sm text-slate-900">{ast.name || ast.title || "Issued Asset"}</h3>
                <p className="text-xs text-slate-500">Asset ID: <strong className="text-slate-700">{ast.assetId || `AST-${idx + 101}`}</strong></p>
                <p className="text-[11px] text-slate-400">Issued: {ast.issuedDate || "Campus Procurement"}</p>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                  <button
                    onClick={() => {
                      setSelectedAssetId(ast._id || ast.id || `AST-${idx + 101}`);
                      setShowServiceModal(true);
                    }}
                    className="text-xs text-orange-600 font-bold hover:underline flex items-center gap-1"
                  >
                    <Wrench className="h-3.5 w-3.5" />
                    <span>Request Service</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 text-center py-12 col-span-full">No hardware assets assigned to your profile.</p>
          )}
        </div>
      )}

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-heading text-lg font-bold text-[#12173A]">
                Upload Official Document
              </h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUploadDocument} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Document Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aadhaar Card Copy"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Category</label>
                <select
                  value={uploadForm.category}
                  onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none bg-white"
                >
                  <option value="Identity">Identity (Aadhaar / Passport)</option>
                  <option value="Educational">Degree / Educational Certificate</option>
                  <option value="Tax">Tax Certificate / Form 16</option>
                  <option value="Employment">Employment Contract</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">File URL / Cloud Link</label>
                <input
                  type="text"
                  required
                  placeholder="https://example.com/doc.pdf"
                  value={uploadForm.fileUrl}
                  onChange={(e) => setUploadForm({ ...uploadForm, fileUrl: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowUploadModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                  Upload Metadata
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Service Request Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-heading text-lg font-bold text-[#12173A]">
                Asset Maintenance &amp; Service Request
              </h3>
              <button onClick={() => setShowServiceModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleServiceRequest} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Asset Identifier</label>
                <input
                  type="text"
                  disabled
                  value={selectedAssetId}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Issue Description</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Battery draining quickly / needs replacement"
                  value={serviceIssue}
                  onChange={(e) => setServiceIssue(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowServiceModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                  Submit Service Ticket
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export function DocumentsView() {
  return (
    <AuthProvider>
      <AppShell>
        <DocumentsContent />
      </AppShell>
    </AuthProvider>
  );
}
export default DocumentsView;
