import React, { useState } from 'react';
import { X, FileText, Download, ExternalLink, BookOpen } from 'lucide-react';

interface RegulationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPage?: number;
}

export const RegulationsModal: React.FC<RegulationsModalProps> = ({ isOpen, onClose, initialPage = 1 }) => {
  const [currentPage, setCurrentPage] = useState<number>(initialPage);

  if (!isOpen) return null;

  const pdfUrl = '/ofsaa-volleyball-2026-regulations.pdf';
  const iframeSrc = `${pdfUrl}#page=${currentPage}&view=FitH`;

  const sections = [
    { label: 'Page 1: Championship Structure', page: 1 },
    { label: 'Page 3: Section 6 • Rules & Officials (Tiebreakers)', page: 3 },
    { label: 'Page 8: Section 13 • Protest Committee', page: 8 },
    { label: 'Page 13: 20-Team Format Schedule', page: 13 },
    { label: 'Page 17: Seeding Criteria & Matrix', page: 17 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-5xl w-full shadow-2xl overflow-hidden flex flex-col h-[92vh] text-slate-800">
        {/* Header */}
        <div className="bg-[#0b2341] text-white px-4 sm:px-6 py-3.5 flex items-center justify-between border-b-2 border-sky-400 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-400/40 text-sky-300 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-sky-300" />
            </div>
            <div className="truncate">
              <h3 className="text-sm sm:text-base font-extrabold text-white truncate">
                OFSAA Volleyball Playing Regulations
              </h3>
              <p className="text-[11px] text-sky-200">
                Official Championship Document • September 2026
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-sky-100 hover:text-white bg-white/10 hover:bg-white/20 border border-white/20 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
              title="Open actual official PDF in new window"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Open New Tab</span>
            </a>

            <a
              href={pdfUrl}
              download="OFSAA-Volleyball-2026-Playing-Regulations.pdf"
              className="text-xs font-bold text-sky-950 bg-sky-400 hover:bg-sky-300 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
              title="Download official PDF document"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </a>

            <button
              onClick={onClose}
              className="text-slate-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors ml-1"
              title="Close viewer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Section Quick Jump Bar */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50 px-4 py-2 gap-1.5 overflow-x-auto shrink-0 text-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap mr-1 flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-sky-600" />
            Jump To:
          </span>
          {sections.map((sec) => (
            <button
              key={sec.page}
              onClick={() => setCurrentPage(sec.page)}
              className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-colors text-xs ${
                currentPage === sec.page
                  ? 'bg-[#0b2341] text-white shadow-2xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200/80 border border-slate-200'
              }`}
            >
              {sec.label}
            </button>
          ))}
        </div>

        {/* Actual Document Embed Container */}
        <div className="flex-1 bg-slate-100 relative overflow-hidden flex flex-col">
          <object
            key={iframeSrc}
            data={iframeSrc}
            type="application/pdf"
            className="w-full flex-1 border-0"
          >
            <iframe
              src={iframeSrc}
              className="w-full flex-1 border-0"
              title="Official OFSAA Volleyball Playing Regulations Document"
            >
              <div className="p-8 text-center flex flex-col items-center justify-center h-full bg-slate-50 space-y-4">
                <FileText className="w-12 h-12 text-sky-600" />
                <h4 className="text-base font-bold text-slate-800">OFSAA Playing Regulations PDF</h4>
                <p className="text-xs text-slate-500 max-w-md">
                  Your device or browser does not support inline PDF preview. You can view or download the complete official document below:
                </p>
                <div className="flex items-center gap-3">
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-[#0b2341] text-white text-xs font-bold rounded-lg shadow-sm hover:bg-sky-900 transition"
                  >
                    Open Official PDF in New Window
                  </a>
                  <a
                    href={pdfUrl}
                    download="OFSAA-Volleyball-2026-Playing-Regulations.pdf"
                    className="px-4 py-2 bg-sky-500 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-sky-600 transition"
                  >
                    Download PDF
                  </a>
                </div>
              </div>
            </iframe>
          </object>

          {/* Mobile Fallback Banner */}
          <div className="sm:hidden bg-slate-900/90 text-white p-2.5 flex items-center justify-between text-xs shrink-0">
            <span>Viewing page {currentPage} of official regulations</span>
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-sky-300 underline"
            >
              Full Screen PDF
            </a>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-4 sm:px-6 py-2.5 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span className="truncate">
            Official Source: OFSAA Volleyball Playing Regulations (September 2026)
          </span>
          <button
            onClick={onClose}
            className="font-bold text-white px-4 py-1.5 rounded-lg bg-[#0b2341] hover:bg-[#163a66] transition-colors shrink-0 ml-2"
          >
            Close Document
          </button>
        </div>
      </div>
    </div>
  );
};
