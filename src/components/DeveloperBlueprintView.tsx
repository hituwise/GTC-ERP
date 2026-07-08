import React, { useState } from "react";
import { GOOGLE_SHEETS_SCHEMA, APPS_SCRIPT_CODE } from "../gasBlueprint";
import { Database, FileCode, CheckCircle, Copy, Check, ShieldAlert, Award } from "lucide-react";

export default function DeveloperBlueprintView() {
  const [selectedSheet, setSelectedSheet] = useState(GOOGLE_SHEETS_SCHEMA[0].sheetName);
  const [copiedCode, setCopiedCode] = useState(false);

  const activeSheetObj = GOOGLE_SHEETS_SCHEMA.find(s => s.sheetName === selectedSheet) || GOOGLE_SHEETS_SCHEMA[0];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-8" id="dev-blueprint-view">
      {/* SaaS Architecture Summary */}
      <div className="bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-black text-indigo-900 font-display">SaaS Architecture & Multi-Tenant Blueprint</h2>
            <p className="text-sm text-slate-500 mt-1">
              Complete reference design using Google Sheets as a relational database & Google Apps Script as a secure backend API.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-indigo-50 border-2 border-indigo-100 px-3.5 py-1.5 rounded-xl text-indigo-700 text-xs font-black">
            <Award className="w-4 h-4" />
            Certified Abacus ERP Framework
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm mb-2">
              <Database className="w-4 h-4" />
              1. Relational Sheets Schema
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Maintains 9 cross-referenced data structures. Center ID acts as the global Partition Key for SaaS multi-tenant separation.
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm mb-2">
              <FileCode className="w-4 h-4" />
              2. Apps Script Backend API
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Serves JSON endpoints via Web Apps. Validates incoming user emails, asserts roles, and ensures rigorous data isolation.
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <div className="flex items-center gap-2 text-rose-600 font-semibold text-sm mb-2">
              <ShieldAlert className="w-4 h-4" />
              3. Strict Security Rules
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              No user can write or query rows belonging to another Center ID. System checks subscriptions and roles before every write.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Schema Viewer (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-sm flex flex-col h-full">
          <h3 className="text-base font-black text-indigo-900 font-display mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-600" />
            Google Sheets Database Schema
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Click on a sheet to review its column layout, relationships, and validation constraints:
          </p>

          <div className="flex flex-wrap gap-2 mb-6">
            {GOOGLE_SHEETS_SCHEMA.map(sheet => (
              <button
                key={sheet.sheetName}
                onClick={() => setSelectedSheet(sheet.sheetName)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedSheet === sheet.sheetName
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-100"
                }`}
                id={`sheet-btn-${sheet.sheetName}`}
              >
                {sheet.sheetName}
              </button>
            ))}
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-4 flex-1">
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sheet Description</div>
              <div className="text-sm font-medium text-gray-800 mt-1">{activeSheetObj.description}</div>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Primary & Foreign Keys</div>
              <div className="flex flex-wrap gap-1.5">
                {activeSheetObj.columns.map((col, idx) => {
                  const isKey = col.includes("(PK)") || col.includes("(FK)");
                  return (
                    <span
                      key={idx}
                      className={`px-2 py-1 rounded text-xs ${
                        col.includes("(PK)")
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-100 font-mono"
                          : col.includes("(FK)")
                          ? "bg-amber-50 text-amber-700 border border-amber-100 font-mono"
                          : "bg-white text-gray-600 border border-gray-200"
                      }`}
                    >
                      {col}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tenant Integrity & Validation Rules</div>
              <ul className="mt-2 space-y-1 text-xs text-gray-600">
                <li className="flex items-start gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                  <span>{activeSheetObj.validation}</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                  <span>Multi-tenant Isolation: Filtered on query via <code>centerId</code> column.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Code Exporter (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-sm flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-black text-indigo-900 font-display flex items-center gap-2">
              <FileCode className="w-5 h-5 text-indigo-600" />
              Production Google Apps Script (code.gs)
            </h3>
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 text-xs font-semibold bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-xl transition-all active:scale-95"
              id="copy-code-btn"
            >
              {copiedCode ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-gray-500 mb-4">
            Paste this code into Extensions &gt; Apps Script in your spreadsheet to establish a highly secure multi-tenant SaaS REST API.
          </p>

          <div className="flex-1 min-h-[350px] relative rounded-xl overflow-hidden border border-slate-200">
            <pre className="absolute inset-0 p-4 overflow-auto bg-slate-900 text-slate-300 font-mono text-[11px] leading-relaxed">
              <code>{APPS_SCRIPT_CODE}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
