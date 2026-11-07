import React from 'react';
import { FileText, Download, ExternalLink } from 'lucide-react';
import { RegulationsDocViewer } from './RegulationsDocViewer';

export const TiebreakerRulesView: React.FC = () => {
  const pdfUrl = '/ofsaa-volleyball-2026-regulations.pdf';

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="bg-[#0b2341] text-white border-b-4 border-sky-400 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-sky-500/20 border border-sky-400/40 text-sky-300 flex items-center justify-center shrink-0 mt-0.5">
              <FileText className="w-6 h-6 text-sky-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-sky-400 text-[#0b2341] font-black text-[10px] uppercase px-2 py-0.5 rounded tracking-wider">
                  Official Document
                </span>
                <span className="text-xs text-sky-200">OFSAA Playing Regulations • September 2026</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                Official Regulations &amp; Tiebreaking Rules
              </h2>
              <p className="text-xs text-sky-100/90 mt-1 max-w-2xl leading-relaxed">
                Direct view of the official OFSAA Boys' AAA Volleyball Championship Playing Regulations document governing tiebreaking procedures, match formats, and competition protocol.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-sky-100 hover:text-white bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
              title="Open full official PDF in new browser tab"
            >
              <ExternalLink className="w-3.5 h-3.5 text-sky-300" />
              <span>Open in New Tab</span>
            </a>

            <a
              href={pdfUrl}
              download="OFSAA-Volleyball-2026-Playing-Regulations.pdf"
              className="text-xs font-bold text-sky-950 bg-sky-400 hover:bg-sky-300 px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow-2xs"
              title="Download official PDF document"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Official PDF</span>
            </a>
          </div>
        </div>
      </div>

      {/* 100% Reliable Document Viewer - loads flawlessly in all browsers and iframes */}
      <RegulationsDocViewer initialPage={3} heightClass="h-[76vh] min-h-[640px]" />
    </div>
  );
};
