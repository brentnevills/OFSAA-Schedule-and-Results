import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  ExternalLink, 
  BookOpen
} from 'lucide-react';

export const TiebreakerRulesView: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<number>(3);

  const pdfUrl = '/ofsaa-volleyball-2026-regulations.pdf';
  const iframeSrc = `${pdfUrl}#page=${currentPage}&view=FitH`;

  const sections = [
    { label: 'Page 3: Section 6 • Rules & Officials (Tiebreakers)', page: 3 },
    { label: 'Page 4: Section 6 (c & d) • 3-Way for 2nd & 4/5-Way Ties', page: 4 },
    { label: 'Page 5: Section 6 (f-l) • 12 Substitutions, Libero & Protocol', page: 5 },
    { label: 'Page 8: Section 13 • Protest Committee', page: 8 },
    { label: 'Page 13: 20-Team Tournament Draw & Schedule', page: 13 },
    { label: 'Page 17: Seeding Factors & Placement Matrix', page: 17 },
  ];

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

      {/* Actual PDF Viewer Card */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs flex flex-col">
        {/* Document Navigation Quick Jump Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center gap-2 overflow-x-auto text-xs shrink-0">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 shrink-0 mr-1">
            <BookOpen className="w-3.5 h-3.5 text-sky-600" />
            Quick Jump:
          </span>
          {sections.map((sec) => (
            <button
              key={sec.page}
              onClick={() => setCurrentPage(sec.page)}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs whitespace-nowrap transition-all ${
                currentPage === sec.page
                  ? 'bg-[#0b2341] text-white shadow-2xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200/80 border border-slate-200'
              }`}
            >
              {sec.label}
            </button>
          ))}
        </div>

        {/* Embedded Actual PDF Viewer with Robust Fallback */}
        <div className="relative bg-slate-100 h-[78vh] min-h-[640px] w-full flex flex-col">
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
                  Your browser does not support inline PDF preview. You can view or download the complete official document below:
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

          {/* Quick Bar at Bottom of Viewer */}
          <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between text-xs shrink-0">
            <span className="text-slate-300 font-medium">
              Viewing Official Document • Section 6 Tiebreaking Procedures • Page {currentPage}
            </span>
            <div className="flex items-center gap-3 font-semibold">
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-300 hover:text-sky-200 flex items-center gap-1 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Full Window</span>
              </a>
              <span className="text-slate-600">•</span>
              <a
                href={pdfUrl}
                download="OFSAA-Volleyball-2026-Playing-Regulations.pdf"
                className="text-sky-300 hover:text-sky-200 flex items-center gap-1 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
