import { useEffect, useRef } from 'react';

interface GameLogProps {
  entries: string[];
}

export function GameLog({ entries }: GameLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries.length]);

  return (
    <div className="game-log">
      <div className="game-log__header">
        <span className="game-log__title">Game Log</span>
        <span className="game-log__count">{entries.length}</span>
      </div>
      <div className="game-log__scroll">
        {entries.map((entry, i) => {
          const isRecent = i === entries.length - 1;
          const isBomb   = entry.includes('QUAD') || entry.includes('bomb');
          const isFinish = entry.includes('position #');
          return (
            <div
              key={i}
              className={[
                'log-entry',
                isRecent ? 'log-entry--recent' : '',
                isBomb   ? 'log-entry--bomb'   : '',
                isFinish ? 'log-entry--finish' : '',
              ].filter(Boolean).join(' ')}
            >
              <span className="log-entry__num">{i + 1}</span>
              <span className="log-entry__text">{entry}</span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
