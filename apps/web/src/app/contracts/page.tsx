'use client';

import { useEffect, useState, useRef } from "react";
import Link from "next/link";

interface Contract {
  id: string;
  name: string;
  type: string;
  party_a: string;
  party_b: string;
  start_date: string;
  end_date: string;
  renewal_type: string;
  notice_days: number;
  risk_score: number;
  status: string;
  file_url: string | null;
  ai_summary: string | null;
  created_at: string;
}

function getRiskColors(score: number) {
  if (score <= 3) return { text: "text-emerald-700", bg: "bg-emerald-100", bar: "bg-emerald-500" };
  if (score <= 6) return { text: "text-amber-700", bg: "bg-amber-100", bar: "bg-amber-500" };
  return { text: "text-red-700", bg: "bg-red-100", bar: "bg-red-500" };
}

function getStatusColors(status: string) {
  switch (status.toLowerCase()) {
    case "active": return "bg-emerald-100 text-emerald-700";
    case "expired": return "bg-gray-100 text-gray-600";
    case "expiring": return "bg-amber-100 text-amber-700";
    case "draft": return "bg-blue-100 text-blue-700";
    default: return "bg-gray-100 text-gray-600";
  }
}

function getDaysLeft(endDate: string) {
  return Math.ceil((new Date(endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
}

const TABS = ["All", "Active", "Expiring", "High Risk", "Expired"] as const;
type Tab = typeof TABS[number];

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {[...Array(8)].map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className="h-4 bg-gray-100 rounded w-full" />
        </td>
      ))}
    </tr>
  );
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("All");
  const [showModal, setShowModal] = useState(false);
  const [modalTab, setModalTab] = useState<"text" | "file">("text");

  // Upload form state
  const [contractName, setContractName] = useState("");
  const [contractText, setContractText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<Contract | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchContracts = () => {
    setLoading(true);
    fetch("/api/contracts")
      .then((r) => r.json())
      .then((data) => setContracts(Array.isArray(data) ? data : data.contracts ?? []))
      .catch(() => setError("Failed to load contracts"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  const filtered = contracts.filter((c) => {
    const matchesSearch =
      search === "" ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.party_a.toLowerCase().includes(search.toLowerCase()) ||
      c.party_b.toLowerCase().includes(search.toLowerCase()) ||
      c.type.toLowerCase().includes(search.toLowerCase());

    const daysLeft = getDaysLeft(c.end_date);
    const matchesTab =
      activeTab === "All" ||
      (activeTab === "Active" && c.status.toLowerCase() === "active") ||
      (activeTab === "Expiring" && daysLeft >= 0 && daysLeft <= 30) ||
      (activeTab === "High Risk" && c.risk_score >= 7) ||
      (activeTab === "Expired" && (c.status.toLowerCase() === "expired" || daysLeft < 0));

    return matchesSearch && matchesTab;
  });

  const closeModal = () => {
    setShowModal(false);
    setContractName("");
    setContractText("");
    setSelectedFile(null);
    setUploadError(null);
    setUploadSuccess(null);
    setModalTab("text");
    setUploading(false);
  };

  const handleUpload = async () => {
    if (!contractName.trim()) {
      setUploadError("Please enter a contract name.");
      return;
    }
    if (modalTab === "text" && !contractText.trim()) {
      setUploadError("Please paste contract text.");
      return;
    }
    if (modalTab === "file" && !selectedFile) {
      setUploadError("Please select a file.");
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      let body: FormData | string;
      const headers: Record<string, string> = {};

      if (modalTab === "file" && selectedFile) {
        const fd = new FormData();
        fd.append("name", contractName);
        fd.append("file", selectedFile);
        body = fd;
      } else {
        headers["Content-Type"] = "application/json";
        body = JSON.stringify({ name: contractName, text: contractText });
      }

      const res = await fetch("/api/contracts/upload", {
        method: "POST",
        headers,
        body,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `Upload failed (${res.status})`);
      }

      const data = await res.json();
      setUploadSuccess(data.contract ?? data);
      fetchContracts();
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) setSelectedFile(file);
  };

  return (
    <div className="p-8 max-w-screen-xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Contracts</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and analyze your contracts</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Upload Contract
        </button>
      </div>

      {/* Search + Tabs */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search contracts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === tab
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {["Name", "Type", "Party A", "Party B", "Duration", "Risk Score", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  [...Array(6)].map((_, i) => <SkeletonRow key={i} />)
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-400">
                      {search ? "No contracts match your search" : "No contracts yet — upload one to get started"}
                    </td>
                  </tr>
                ) : (
                  filtered.map((c) => {
                    const risk = getRiskColors(c.risk_score);
                    return (
                      <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3.5">
                          <span className="font-medium text-gray-900">{c.name}</span>
                        </td>
                        <td className="px-4 py-3.5 text-gray-500">{c.type}</td>
                        <td className="px-4 py-3.5 text-gray-500 max-w-[120px]">
                          <span className="truncate block">{c.party_a}</span>
                        </td>
                        <td className="px-4 py-3.5 text-gray-500 max-w-[120px]">
                          <span className="truncate block">{c.party_b}</span>
                        </td>
                        <td className="px-4 py-3.5 text-gray-500 text-xs whitespace-nowrap">
                          {new Date(c.start_date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                          {" "}&rarr;{" "}
                          {new Date(c.end_date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${risk.bar} rounded-full`}
                                style={{ width: `${c.risk_score * 10}%` }}
                              />
                            </div>
                            <span className={`text-xs font-semibold ${risk.text}`}>{c.risk_score}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColors(c.status)}`}>
                            {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <Link
                            href={`/contracts/${c.id}`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 px-3 py-1.5 rounded-lg border border-indigo-200 hover:bg-indigo-50 transition-colors"
                          >
                            View
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {!loading && filtered.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-400">
              Showing {filtered.length} of {contracts.length} contracts
            </div>
          )}
        </div>
      )}

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Upload Contract</h2>
              <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Contract Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Contract Name</label>
                <input
                  type="text"
                  value={contractName}
                  onChange={(e) => setContractName(e.target.value)}
                  placeholder="e.g. Vendor Agreement 2025"
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-400"
                />
              </div>

              {/* Tabs */}
              <div className="flex border border-gray-200 rounded-lg p-1 bg-gray-50 gap-1">
                {(["text", "file"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setModalTab(t)}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                      modalTab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {t === "text" ? "Paste Text" : "Upload File"}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              {uploadSuccess ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-semibold text-emerald-800">Contract Analyzed Successfully</span>
                  </div>
                  <div className="space-y-2 text-xs text-emerald-700">
                    <div className="flex justify-between"><span className="font-medium">Name:</span><span>{uploadSuccess.name}</span></div>
                    <div className="flex justify-between"><span className="font-medium">Type:</span><span>{uploadSuccess.type}</span></div>
                    <div className="flex justify-between"><span className="font-medium">Parties:</span><span>{uploadSuccess.party_a} &amp; {uploadSuccess.party_b}</span></div>
                    <div className="flex justify-between"><span className="font-medium">Risk Score:</span>
                      <span className={uploadSuccess.risk_score >= 7 ? "text-red-600 font-semibold" : uploadSuccess.risk_score >= 4 ? "text-amber-600 font-semibold" : "text-emerald-600 font-semibold"}>
                        {uploadSuccess.risk_score}/10
                      </span>
                    </div>
                    {uploadSuccess.ai_summary && (
                      <div className="pt-1">
                        <span className="font-medium block mb-1">AI Summary:</span>
                        <p className="text-emerald-700 italic leading-relaxed">{uploadSuccess.ai_summary}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Link
                      href={`/contracts/${uploadSuccess.id}`}
                      className="flex-1 text-center text-xs font-medium py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                    >
                      View Contract
                    </Link>
                    <button
                      onClick={closeModal}
                      className="flex-1 text-center text-xs font-medium py-2 rounded-lg border border-emerald-300 text-emerald-700 hover:bg-emerald-100 transition-colors"
                    >
                      Upload Another
                    </button>
                  </div>
                </div>
              ) : modalTab === "text" ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Contract Text</label>
                  <textarea
                    value={contractText}
                    onChange={(e) => setContractText(e.target.value)}
                    placeholder="Paste the full contract text here..."
                    rows={10}
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-400 resize-none font-mono"
                  />
                </div>
              ) : (
                <div>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                      dragOver ? "border-indigo-400 bg-indigo-50" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      className="hidden"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                    />
                    {selectedFile ? (
                      <div className="space-y-2">
                        <svg className="w-8 h-8 text-indigo-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-sm font-medium text-gray-800">{selectedFile.name}</p>
                        <p className="text-xs text-gray-400">{(selectedFile.size / 1024).toFixed(0)} KB</p>
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <svg className="w-10 h-10 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-sm text-gray-500">Drop a file here, or <span className="text-indigo-600 font-medium">browse</span></p>
                        <p className="text-xs text-gray-400">PDF, DOC, DOCX, TXT</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {uploadError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5">
                  {uploadError}
                </div>
              )}

              {!uploadSuccess && (
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="w-full py-2.5 text-sm font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Claude is analyzing...
                    </>
                  ) : (
                    "Analyze with Claude AI"
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
