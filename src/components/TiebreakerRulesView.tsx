import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  ExternalLink, 
  AlertCircle, 
  BookOpen, 
  ChevronDown, 
  ChevronUp,
  FileCheck
} from 'lucide-react';

export const TiebreakerRulesView: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<number>(3);
  const [showVerbatimText, setShowVerbatimText] = useState<boolean>(true);

  const pdfUrl = '/ofsaa-volleyball-2026-regulations.pdf';
  const iframeSrc = `${pdfUrl}#page=${currentPage}&view=FitH`;

  const sections = [
    { label: 'Page 3: Section 6 • Rules & Officials (Tiebreakers)', page: 3 },
    { label: 'Page 4: Section 6 (c & d) • 3-Way for 2nd & 4/5-Way Ties', page: 4 },
    { label: 'Page 5: Section 6 (f-l) • 12 Substitutions, Libero & Ceiling', page: 5 },
    { label: 'Page 8: Section 13 • Protest Committee', page: 8 },
    { label: 'Page 13: 20-Team Tournament Draw & Schedule', page: 13 },
    { label: 'Page 17: Seeding Factors & Placement Matrix', page: 17 },
  ];

  return (
    <div className="space-y-6">
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
                Section 6: Rules and Officials
              </h2>
              <p className="text-xs text-sky-100/90 mt-1 max-w-2xl leading-relaxed">
                Direct view of the official OFSAA Boys' & Girls' Volleyball Championship Playing Regulations document governing tiebreaking procedures, match formats, and competition protocol.
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

      {/* Official Notice: Calculation Review & Right to Contest (Without Rule 13 fee clause) */}
      <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-amber-200 border border-amber-300 text-amber-900 flex items-center justify-center shrink-0 mt-0.5">
            <AlertCircle className="w-5 h-5 text-amber-800" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-200 text-amber-900 border border-amber-300">
                Official Notice
              </span>
              <span className="text-xs text-amber-800 font-semibold">OFSAA Section 6 Playing Regulations</span>
            </div>
            <h3 className="text-sm font-bold text-amber-950">
              Coaches' Right to Review Calculations & Contest a Tiebreaker
            </h3>
            <p className="text-xs text-amber-900 leading-relaxed">
              Website standings, ratio mathematics, and advancement indicators are published for the active reference of convenors, coaches, players, and spectators. <strong>Inadvertent display or input errors may occur.</strong> All coaches retain the right under OFSAA regulations to inspect the official handwritten match scoresheets, verify sequential mathematical ratios, and contest any tiebreak with the Championship Convenor prior to the staging of any tiebreaker set or playoff match.
            </p>
          </div>
        </div>
      </div>

      {/* Actual Document Viewer Card */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs flex flex-col">
        {/* Document Navigation Controls */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 text-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 shrink-0">
              <BookOpen className="w-3.5 h-3.5 text-sky-600" />
              Document Sections:
            </span>
            {sections.map((sec) => (
              <button
                key={sec.page}
                onClick={() => setCurrentPage(sec.page)}
                className={`px-2.5 py-1 rounded-lg font-bold text-xs whitespace-nowrap transition-colors ${
                  currentPage === sec.page
                    ? 'bg-[#0b2341] text-white shadow-2xs'
                    : 'bg-white text-slate-700 hover:bg-slate-200/80 border border-slate-200'
                }`}
              >
                {sec.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowVerbatimText(!showVerbatimText)}
            className="text-xs font-bold text-[#0b2341] hover:text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-3 py-1 rounded-lg flex items-center gap-1.5 self-start sm:self-auto shrink-0 transition-colors"
          >
            <FileCheck className="w-3.5 h-3.5 text-sky-600" />
            <span>{showVerbatimText ? 'Hide Verbatim Text' : 'Show Verbatim Text'}</span>
            {showVerbatimText ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Embedded Actual PDF Viewer */}
        <div className="relative bg-slate-100 h-[650px] sm:h-[750px] w-full flex flex-col">
          <iframe
            key={iframeSrc}
            src={iframeSrc}
            className="w-full flex-1 border-0"
            title="Actual OFSAA Volleyball Playing Regulations Document"
          />

          {/* Quick Bar at Bottom of Viewer */}
          <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between text-xs shrink-0">
            <span className="text-slate-300">
              Viewing Official PDF • Page {currentPage} of 19 (September 2026)
            </span>
            <div className="flex items-center gap-3">
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-sky-300 hover:text-sky-200 flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Full Window</span>
              </a>
              <span className="text-slate-600">•</span>
              <a
                href={pdfUrl}
                download="OFSAA-Volleyball-2026-Playing-Regulations.pdf"
                className="font-bold text-sky-300 hover:text-sky-200 flex items-center gap-1"
              >
                <Download className="w-3 h-3" />
                <span>Download</span>
              </a>
            </div>
          </div>
        </div>

        {/* Verbatim Section 6 Document Excerpt (Word-for-Word from Pages 3-5) */}
        {showVerbatimText && (
          <div className="border-t border-slate-200 bg-slate-50/70 p-5 sm:p-6 space-y-4 text-xs text-slate-800 leading-relaxed">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <FileCheck className="w-4 h-4 text-sky-600" />
              <h3 className="font-black text-sm text-[#0b2341] uppercase tracking-wide">
                Verbatim Section 6 Text from Official Document (Pages 3, 4, 5)
              </h3>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2 font-serif text-[13px] text-slate-900">
              <p className="font-bold">6. Rules and Officials:</p>
              <p>
                The rules of the Volleyball Canada (VC), as of September 1st of the current school year, shall govern play at the OFSAA Championship with the following exceptions:
              </p>
              <p className="font-semibold underline mt-2">Tie breaking rules:</p>
              <p>
                <strong>a.</strong> If two (2) teams are tied at the end of the pool play, the team winning the match between the two tied teams shall receive the higher ranking.
              </p>
              <p>
                <strong>b.</strong> If three (3) teams are tied for 1st place or 3rd place at the end of the preliminary round, the following criteria (in sequence) shall be applied to determine the highest ranked team and the remaining two (2) teams will play a set to 15 (2 point margin of victory) to complete final pool rankings.
              </p>
              <p className="italic pl-4 text-slate-700">
                Note: When applying the criteria, if two (2) teams have the same ratio that is higher than the third team, all three teams progress to the next step in the sequence.
              </p>
              <ul className="list-none pl-6 space-y-1">
                <li><strong>i.</strong> The team having the highest ratio of won/lost matches, considering matches played in pool play among the tied teams only, will be ranked higher.</li>
                <li><strong>ii.</strong> The team having the highest ratio of won/lost sets (games), considering matches played in pool play among the tied teams only, will be ranked higher.</li>
                <li><strong>iii.</strong> The team having the highest ratio of won/lost sets (games), considering all matches in pool play will be ranked higher.</li>
                <li><strong>iv.</strong> The team having the highest ratio of points for/against, considering games played in pool play among the tied teams only, will be ranked higher.</li>
                <li><strong>v.</strong> The team having the highest ratio of points for/against, considering all games played in pool play, will be ranked higher.</li>
              </ul>
              <p className="mt-3">
                <strong>c.</strong> If three (3) teams are tied for 2nd place at the end of the pool play, the following criteria shall be applied (in sequence) to determine the lowest ranked team and the remaining two (2) teams will play a set to 15 (2-point margin of victory) to complete final pool rankings.
              </p>
              <ul className="list-none pl-6 space-y-1 text-slate-800">
                <li><strong>i.</strong> The team having the lowest ratio of won/lost matches, considering matches played in pool play among the tied teams only, will be ranked lower.</li>
                <li><strong>ii.</strong> The team having the lowest ratio of won/lost sets (games), considering matches played in pool play among the tied teams only, will be ranked lower.</li>
                <li><strong>iii.</strong> The team having the lowest ratio of won/lost sets (games), considering all matches in pool play will be ranked lower.</li>
                <li><strong>iv.</strong> The team having the lowest ratio of points for/against, considering games played in pool play among the tied teams only, will be ranked lower.</li>
                <li><strong>v.</strong> The team having the lowest ratio of points for/against, considering all games played in pool play, will be ranked lower.</li>
              </ul>
              <p className="italic pl-4 text-slate-700">
                Note: When applying the criteria, if two (2) teams have the same ratio that is lower than the third team, all three teams progress to the next step in the sequence.
              </p>
              <p className="mt-3">
                <strong>d.</strong> If four (4) or more teams are tied at the end of the pool play, the following criteria shall be applied (one after another until the tie has been broken) to determine the overall ranking of teams within the pool. After ranking has been completed, 2nd place and 4th place will be determined by an additional set to 15 with a 2-point margin of victory.
              </p>
              <p className="italic pl-4 text-slate-700">
                Note: No team in a 4 way or 5-way tie shall be eliminated from championship playoffs or from continuation in consolation playoffs by virtue of tie breaker rules. An additional set must be played up to 15 with a 2-point margin of victory.
              </p>
              <p className="mt-3">
                <strong>e.</strong> All matches in pool play (round robin) shall be best two (2) out of three (3) sets, and all matches of the playoffs (consolation and championship quarter finals, consolation and championship semi-finals, consolation finals, bronze medal match, and gold medal match) shall be best three (3) out of five (5) sets.
              </p>
              <p className="mt-2">
                <strong>i.</strong> 12 Substitution Rule - For OFSAA competition teams are allowed a maximum of 12 substitutions in any one set.
              </p>
              <p className="mt-2">
                <strong>j.</strong> Libero Player: Each Team has the right to designate up to two (2) specialist defensive players.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
