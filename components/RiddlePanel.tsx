import React, { useState, useEffect, useRef, memo } from 'react';
import { Riddle, GameState } from '../types';

interface RiddlePanelProps {
  riddles: Riddle[];
  gameState: GameState;
  onNext: () => void;
  starsFoundCount: number;
  onSignalAdmin: () => void;
  isSectionOne?: boolean;
  onSolveSubmit?: (index: number, answer: string) => void;
  solvedIndices?: number[];
  attempts?: Record<string, number>;
  currentSection?: number;
}

export const RiddlePanel: React.FC<RiddlePanelProps> = memo(({
  riddles,
  onSolveSubmit,
  solvedIndices = [],
  attempts = {},
  currentSection = 1,
  isSectionOne = false
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const touchStart = useRef<number | null>(null);

  const len = riddles.length;

  useEffect(() => {
    if (currentSection === 3) {
      const firstUnsolved = riddles.findIndex((_, i) => !solvedIndices.includes(i));
      if (firstUnsolved !== -1) {
        setActiveIndex(firstUnsolved);
      } else if (len > 0) {
        setActiveIndex(len - 1);
      }
    }
  }, [solvedIndices, currentSection, len, riddles]);

  useEffect(() => {
    setAnswer('');
  }, [activeIndex]);

  const handleSwipe = (direction: 'left' | 'right') => {
    if (currentSection === 3) return; // Disable manual navigation in S3

    if (direction === 'left') {
      setActiveIndex(prev => (prev + 1) % len);
    } else if (direction === 'right') {
      setActiveIndex(prev => (prev - 1 + len) % len);
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (currentSection === 3) return; // Disable touch in S3
    touchStart.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (currentSection === 3 || touchStart.current === null) return;
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) handleSwipe(diff > 0 ? 'left' : 'right');
    touchStart.current = null;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none carousel-container"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className={`relative w-full max-w-screen-xl ${currentSection === 3 ? 'min-h-[70vh] h-auto' : 'h-[80vh]'} flex items-center justify-center`}>
        {riddles.map((riddle, idx) => {
          const attemptKey = `${currentSection}-${idx}`;
          const currentAttempts = attempts[attemptKey] || 0;
          const isSolved = solvedIndices.includes(idx);
          const hasFailed = currentAttempts >= 2 && !isSolved;

          const prevIdx = (activeIndex - 1 + len) % len;
          const nextIdx = (activeIndex + 1) % len;

          let positionClass = 'inactive';
          if (idx === activeIndex) positionClass = 'active';
          else if (idx === prevIdx) positionClass = 'prev';
          else if (idx === nextIdx) positionClass = 'next';

          const isVisible = idx === activeIndex || (currentSection !== 3 && (idx === prevIdx || idx === nextIdx));
          if (!isVisible) return null;

          const showInputUI = currentSection === 3 ? !isSolved : (currentAttempts < 2 && !isSolved);
          const showSuccessUI = isSolved;

          return (
            <div
              key={idx}
              onClick={() => {
                if (currentSection === 3) return;
                if (idx === prevIdx) handleSwipe('right');
                if (idx === nextIdx) handleSwipe('left');
              }}
              className={`${currentSection === 3 ? 'relative w-[92%] max-w-4xl' : 'absolute w-[88%] max-w-lg md:max-w-xl lg:max-w-2xl'} p-8 md:p-14 glass-panel rounded-[3.5rem] carousel-card pointer-events-auto cursor-default ${positionClass} ${idx !== activeIndex ? 'cursor-pointer hover:brightness-125' : ''}`}
            >
              <div className="text-center space-y-5">
                <div className="absolute top-8 right-10 text-3xl font-cinzel text-indigo-300/40 font-bold select-none pointer-events-none">
                  {idx + 1}. {currentSection === 1 && [0, 2, 4].includes(idx) ? '🔭' : ''}
                </div>
                {riddle.imageUrls && riddle.imageUrls.length > 0 && !riddle.text?.includes('[[IMAGE_') && (
                  <div className="space-y-4">
                    {riddle.imageUrls.map((url, i) => (
                      <div key={i} className="space-y-3">
                        <div
                          className="w-full h-44 sm:h-52 md:h-72 lg:h-80 rounded-3xl overflow-hidden border border-white/10 shadow-inner bg-black/40 pointer-events-none select-none"
                        >
                          <img src={url} alt={`Celestial Puzzle ${i}`} className="w-full h-full object-contain pointer-events-none select-none" />
                        </div>
                        <div className="flex justify-center">
                          <button
                            onClick={(e) => { e.stopPropagation(); setZoomedImage(url); }}
                            className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[9px] font-cinzel tracking-[0.3em] text-indigo-200 uppercase transition-all shadow-lg active:scale-95 font-bold pointer-events-auto"
                          >
                            Magnify
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {riddle.text && (
                  <div className={`max-h-[45vh] overflow-y-auto px-4 py-6 visible-scrollbar`}>
                    <p className={`text-base md:text-xl font-garamond leading-relaxed text-indigo-50 select-none drop-shadow-md font-bold ${currentSection === 3 ? 'text-center' : ''}`}>
                      {riddle.text.includes('[[IMAGE_') ? (
                        riddle.text.split(/(\[\[IMAGE_\d+\]\])/g).map((part, i) => {
                          const match = part.match(/\[\[IMAGE_(\d+)\]\]/);
                          if (match) {
                            const imgIdx = parseInt(match[1]);
                            const url = riddle.imageUrls?.[imgIdx];
                            if (url) {
                              return (
                                <span key={i} className="block my-8 space-y-3">
                                  <span className="block w-full h-44 sm:h-52 md:h-72 lg:h-80 rounded-3xl overflow-hidden border border-white/10 shadow-inner bg-black/40 pointer-events-none select-none">
                                    <img src={url} alt={`Visual Clue ${imgIdx}`} className="w-full h-full object-contain pointer-events-none select-none" />
                                  </span>
                                  <span className="block text-center">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setZoomedImage(url); }}
                                      className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[9px] font-cinzel tracking-[0.3em] text-indigo-200 uppercase transition-all shadow-lg active:scale-95 font-bold pointer-events-auto"
                                    >
                                      Magnify
                                    </button>
                                  </span>
                                </span>
                              );
                            }
                          }
                          return <span key={i} className="whitespace-pre-wrap">"{part}"</span>;
                        })
                      ) : (
                        <span className="whitespace-pre-wrap">"{riddle.text}"</span>
                      )}
                    </p>
                  </div>
                )}

                {idx === activeIndex && (
                  <div className="space-y-4 animate-in fade-in duration-500">
                    {showInputUI ? (
                      <div className="space-y-3 max-w-xs mx-auto">
                        <input
                          type="text"
                          value={answer}
                          autoFocus
                          onChange={(e) => setAnswer(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && answer.trim() && onSolveSubmit?.(idx, answer)}
                          placeholder="IDENTIFY..."
                          className="w-full bg-black/30 border border-white/5 rounded-2xl px-6 py-4 text-center text-slate-100 focus:outline-none focus:border-indigo-500/50 transition-all font-cinzel tracking-[0.25em] text-[11px] placeholder:text-slate-600 uppercase font-bold"
                        />
                        <button
                          disabled={!answer.trim()}
                          onClick={() => { onSolveSubmit?.(idx, answer); setAnswer(''); }}
                          className="w-full py-4 bg-indigo-600/40 hover:bg-indigo-500/60 disabled:opacity-20 text-white rounded-2xl font-cinzel font-bold tracking-[0.3em] transition-all shadow-2xl text-xs active:scale-95 border border-white/5 uppercase"
                        >
                          SOLVE
                        </button>
                        {currentSection !== 3 && (
                          <div className="flex flex-col gap-1">
                            <p className="text-[12px] font-cinzel text-amber-400/90 tracking-widest uppercase font-bold">
                              {currentAttempts === 0 ? "Two attempts left" : "One attempt left"}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : showSuccessUI ? (
                      <div className="py-2 flex flex-col items-center animate-in zoom-in duration-500">
                        <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                          <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M5 13l4 4L19 7" strokeWidth={3} /></svg>
                        </div>
                        <p className="mt-2 text-[8px] font-cinzel text-emerald-400 tracking-widest uppercase font-bold">Verified Alignment</p>
                      </div>
                    ) : hasFailed ? (
                      <div className="py-3 animate-in fade-in slide-in-from-top duration-500">
                        <p className="text-[11px] font-cinzel text-rose-400 tracking-[0.2em] uppercase drop-shadow-lg font-bold">Alignment Unsuccessful</p>
                        <p className="text-[7px] font-cinzel text-slate-600 tracking-widest mt-1 uppercase font-bold">Limit Reached</p>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="fixed bottom-12 flex gap-2 pointer-events-auto">
        {riddles.map((_, i) => {
          const attKey = `${currentSection}-${i}`;
          const curAtt = attempts[attKey] || 0;
          const isSld = solvedIndices.includes(i);
          const isFld = curAtt >= 2 && !isSld;

          return (
            <button
              key={i}
              onClick={() => {
                if (currentSection === 3) return; // Disable dot clicking in S3
                setActiveIndex(i);
              }}
              className={`h-1.5 transition-all duration-700 rounded-full ${i === activeIndex ? 'w-10 bg-white' :
                (isSld && !isSectionOne) ? 'w-3 bg-emerald-500/50' :
                  isFld ? 'w-3 bg-rose-500/50' : 'w-2 bg-white/10'
                }`}
            />
          );
        })}
      </div>

      {zoomedImage && (
        <div
          className="fixed inset-0 z-[200] bg-black/98 backdrop-blur-3xl flex items-center justify-center p-4 md:p-12 animate-in fade-in zoom-in duration-300 pointer-events-auto cursor-zoom-out"
          onClick={() => setZoomedImage(null)}
        >
          <img src={zoomedImage} alt="Magnified View" className="max-w-full max-h-full rounded-2xl object-contain shadow-[0_0_100px_rgba(255,255,255,0.05)] border border-white/5" />
          <button
            className="absolute top-6 right-6 md:top-10 md:right-10 w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all border border-white/10"
            onClick={() => setZoomedImage(null)}
          >
            <svg className="w-6 h-6 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" strokeWidth={2} /></svg>
          </button>
        </div>
      )}
    </div>
  );
});

RiddlePanel.displayName = 'RiddlePanel';