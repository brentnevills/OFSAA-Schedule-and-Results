import React from 'react';
import { X, FileText, Download, ExternalLink } from 'lucide-react';
import { RegulationsDocViewer } from './RegulationsDocViewer';

interface RegulationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPage?: number;
}

export const RegulationsModal: React.FC<RegulationsModalProps> = ({ isOpen, onClose, initialPage = 1 }) => {
  if (!isOpen) return null;

  const pdfUrl = `${import.meta.env.BASE_URL}ofsaa-volleyball-2026-regulations.pdf`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-5xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-800">
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
              title="Open raw PDF document in new window"
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

        {/* 100% Reliable Document Viewer Body */}
        <div className="flex-1 overflow-hidden flex flex-col p-2 sm:p-4 bg-slate-100">
          <RegulationsDocViewer initialPage={initialPage} heightClass="h-[62vh] min-h-[480px]" onClose={onClose} />
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
