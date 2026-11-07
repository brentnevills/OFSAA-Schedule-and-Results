import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  ExternalLink, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  BookOpen, 
  Maximize2 
} from 'lucide-react';

interface RegulationsDocViewerProps {
  initialPage?: number;
  heightClass?: string;
  onClose?: () => void;
}

export const RegulationsDocViewer: React.FC<RegulationsDocViewerProps> = ({
  initialPage = 3,
  heightClass = 'h-[75vh] min-h-[600px]',
  onClose
}) => {
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const totalPages = 19;

  useEffect(() => {
    setCurrentPage(initialPage);
  }, [initialPage]);

  const pdfUrl = '/ofsaa-volleyball-2026-regulations.pdf';

  const sections = [
    { label: 'Page 1: Championship Overview', page: 1 },
    { label: 'Page 3: Section 6 • Rules & Tiebreakers', page: 3 },
    { label: 'Page 4: Section 6 (c & d) • 3-Way & 4/5-Way Ties', page: 4 },
    { label: 'Page 5: Section 6 (f-l) • 12 Subs & Libero', page: 5 },
    { label: 'Page 8: Section 13 • Protests', page: 8 },
    { label: 'Page 13: 20-Team Draw Schedule', page: 13 },
    { label: 'Page 17: Seeding Matrix', page: 17 },
  ];

  const handlePrev = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(180, prev + 20));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(70, prev - 20));
  };

  const handleResetZoom = () => {
    setZoomLevel(100);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs flex flex-col">
      {/* Document Section Quick Jump Bar */}
      <div className="bg-slate-50 border-b border-slate-200 px-3 sm:px-4 py-2.5 flex items-center gap-1.5 overflow-x-auto text-xs shrink-0">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 shrink-0 mr-1">
          <BookOpen className="w-3.5 h-3.5 text-sky-600" />
          Sections:
        </span>
        {sections.map((sec) => (
          <button
            key={sec.page}
            onClick={() => setCurrentPage(sec.page)}
            className={`px-2.5 py-1 rounded-lg font-bold text-xs whitespace-nowrap transition-all ${
              currentPage === sec.page
                ? 'bg-[#0b2341] text-white shadow-2xs'
                : 'bg-white text-slate-700 hover:bg-slate-200/80 border border-slate-200'
            }`}
          >
            {sec.label}
          </button>
        ))}
      </div>

      {/* Reader Controls Toolbar */}
      <div className="bg-[#0b2341] text-white px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
        {/* Page navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            disabled={currentPage <= 1}
            className="p-1 rounded bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none transition"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1 font-semibold text-xs">
            <span>Page</span>
            <select
              value={currentPage}
              onChange={(e) => setCurrentPage(Number(e.target.value))}
              className="bg-white/20 text-white font-bold rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-sky-400 cursor-pointer"
            >
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <option key={p} value={p} className="text-slate-900 bg-white">
                  {p}
                </option>
              ))}
            </select>
            <span className="text-sky-200">of {totalPages}</span>
          </div>

          <button
            onClick={handleNext}
            disabled={currentPage >= totalPages}
            className="p-1 rounded bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none transition"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleZoomOut}
            className="p-1 rounded bg-white/10 hover:bg-white/20 transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleResetZoom}
            className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[11px] font-mono transition"
            title="Reset Zoom to 100%"
          >
            {zoomLevel}%
          </button>
          <button
            onClick={handleZoomIn}
            className="p-1 rounded bg-white/10 hover:bg-white/20 transition"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* External / Download Links */}
        <div className="flex items-center gap-2">
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded font-bold text-sky-200 hover:text-white flex items-center gap-1 transition"
            title="Open raw PDF document in new browser tab"
          >
            <ExternalLink className="w-3 h-3" />
            <span className="hidden sm:inline">Raw PDF</span>
          </a>
          <a
            href={pdfUrl}
            download="OFSAA-Volleyball-2026-Playing-Regulations.pdf"
            className="px-2.5 py-1 bg-sky-400 hover:bg-sky-300 text-[#0b2341] font-black rounded flex items-center gap-1 shadow-2xs transition"
            title="Download PDF to your device"
          >
            <Download className="w-3 h-3" />
            <span className="hidden sm:inline">Download</span>
          </a>
        </div>
      </div>

      {/* Document Page Display Area */}
      <div className={`relative bg-slate-200/90 ${heightClass} overflow-auto flex items-start justify-center p-3 sm:p-6`}>
        <div
          style={{ width: `${zoomLevel}%`, maxWidth: zoomLevel > 100 ? `${zoomLevel * 10}px` : '850px' }}
          className="transition-all duration-150 mx-auto bg-white shadow-2xl rounded-sm overflow-hidden border border-slate-300"
        >
          <img
            src={`/regulations-pages/page-${currentPage}.png`}
            alt={`OFSAA Playing Regulations Page ${currentPage}`}
            className="w-full h-auto object-contain block select-none pointer-events-auto"
            loading="eager"
          />
        </div>
      </div>

      {/* Thumbnail Navigation Bar */}
      <div className="bg-slate-100 border-t border-slate-200 p-2 overflow-x-auto flex items-center gap-2 shrink-0">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1 shrink-0">
          Pages:
        </span>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => setCurrentPage(p)}
            className={`w-7 h-8 rounded text-[11px] font-bold flex items-center justify-center shrink-0 transition-all ${
              currentPage === p
                ? 'bg-[#0b2341] text-white shadow-2xs scale-105'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
            }`}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
};
