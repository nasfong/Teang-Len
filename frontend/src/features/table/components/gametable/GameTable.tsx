import { useState } from 'react';
import { useGameStore } from '../../../../store/gameStore';
import { useLobbyStore } from '../../../../store/lobbyStore';
import { useSeatMapping } from '../../hooks/useSeatMapping';
import { useTurnTimer } from '../../hooks/useTurnTimer';
import { validatePlay } from '../../../../game/engine/validation';
import type { PlayerId } from '../../../../game/types';
import { C, FONT, stroke } from './tokens';
import { RefreshIcon } from './icons';
import { TopHUD } from './TopHUD';
import { OpponentSeat } from './OpponentSeat';
import { FeltTable } from './FeltTable';
import { ActionButtons } from './ActionButtons';
import { PlayerHand } from './PlayerHand';

// Visual-only coin balances per seat (no backend balances yet).
const COINS: Record<number, string> = { 0: '25.0M', 1: '20.1M', 2: '15.0M', 3: '18.4M' };

interface GameTableProps {
  onLeave: () => void;
}

/**
 * The in-game play view. Reads game + identity from the stores via selectors and
 * dispatches only through existing store actions. No engine or networking logic
 * lives here — `onLeave` is provided by the routed page.
 */
export function GameTable({ onLeave }: GameTableProps) {
  const game = useGameStore(s => s.game);
  const selectedCardIds = useGameStore(s => s.selectedCardIds);
  const selectCard = useGameStore(s => s.selectCard);
  const playSelectedCards = useGameStore(s => s.playSelectedCards);
  const skipCurrentTurn = useGameStore(s => s.skipCurrentTurn);

  const localSeatIndex = useLobbyStore(s => s.localSeatIndex);

  const numPlayers = game?.players.length ?? 4;
  const { seatBottom, seatRight, seatTop, seatLeft } = useSeatMapping(localSeatIndex, numPlayers);
  const { secondsLeft, isUrgent } = useTurnTimer(game, localSeatIndex);

  const [sortPressed, setSortPressed] = useState(false);

  if (!game) return null;

  const isEndgame = game.phase === 'game_over';
  const me = game.players[seatBottom];
  const isPlayerTurn = !isEndgame && game.currentPlayer === seatBottom;
  const canPass = isPlayerTurn && game.currentTrick.currentHand !== null;
  const currentPlayerName = game.players[game.currentPlayer].name;
  const playerNames = game.players.map(p => p.name);

  const selectedCards = me.hand.filter(c => selectedCardIds.includes(c.id));
  const validation = isPlayerTurn
    ? validatePlay(selectedCards, game.currentTrick.currentHand)
    : { canPlay: false, reason: '' };

  const hint = validation.reason
    ? validation.reason
    : selectedCardIds.length > 0
      ? `${selectedCardIds.length} selected`
      : canPass
        ? null
        : 'Pick cards to open the trick';

  // Sort/refresh: clear the current selection (hand is engine-sorted already).
  function handleSort(): void {
    selectedCardIds.forEach(id => selectCard(id));
  }

  function seatOf(seat: PlayerId | null) {
    return seat === null ? null : game!.players[seat];
  }
  function isTurnOf(seat: PlayerId | null) {
    return seat !== null && !isEndgame && game!.currentPlayer === seat;
  }

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        backgroundImage: "url('/table-bg.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <TopHUD turnPlayerName={currentPlayerName} onLeave={onLeave} />

      {/* Top opponent */}
      <div style={{ position: 'absolute', top: 66, left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
        <OpponentSeat
          player={seatOf(seatTop)}
          position="top"
          isCurrentTurn={isTurnOf(seatTop)}
          secondsLeft={isTurnOf(seatTop) ? secondsLeft : null}
          isUrgent={isUrgent}
          coins={seatTop !== null ? COINS[seatTop] : undefined}
        />
      </div>

      {/* Left opponent */}
      {numPlayers > 2 && (
        <div style={{ position: 'absolute', top: '42%', left: 18, transform: 'translateY(-50%)', zIndex: 10 }}>
          <OpponentSeat
            player={seatOf(seatLeft)}
            position="left"
            isCurrentTurn={isTurnOf(seatLeft)}
            secondsLeft={isTurnOf(seatLeft) ? secondsLeft : null}
            isUrgent={isUrgent}
            coins={seatLeft !== null ? COINS[seatLeft] : undefined}
          />
        </div>
      )}

      {/* Right opponent */}
      {numPlayers > 2 && (
        <div style={{ position: 'absolute', top: '42%', right: 18, transform: 'translateY(-50%)', zIndex: 10 }}>
          <OpponentSeat
            player={seatOf(seatRight)}
            position="right"
            isCurrentTurn={isTurnOf(seatRight)}
            secondsLeft={isTurnOf(seatRight) ? secondsLeft : null}
            isUrgent={isUrgent}
            coins={seatRight !== null ? COINS[seatRight] : undefined}
          />
        </div>
      )}

      {/* Centre felt table */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -52%)',
          zIndex: 5,
        }}
      >
        <FeltTable trick={game.currentTrick} playerNames={playerNames}>
          {!isEndgame && (
            <ActionButtons
              isPlayerTurn={isPlayerTurn}
              canPass={canPass}
              canBeat={validation.canPlay}
              selectedCount={selectedCardIds.length}
              hint={hint ?? undefined}
              currentPlayerName={currentPlayerName}
              onPass={skipCurrentTurn}
              onBeat={playSelectedCards}
            />
          )}
        </FeltTable>
      </div>

      {/* Endgame overlay */}
      {isEndgame && <RankingsOverlay rankedNames={game.rankedOrder.map(id => game.players[id].name)} />}

      {/* Bottom — local hand */}
      <div style={{ position: 'absolute', bottom: 6, left: 0, right: 0, zIndex: 15 }}>
        <PlayerHand
          cards={me.hand}
          selectedCardIds={isEndgame ? [] : selectedCardIds}
          onCardClick={isEndgame ? undefined : selectCard}
        />
      </div>

      {/* Sort / refresh button */}
      <button
        onClick={handleSort}
        onMouseDown={() => setSortPressed(true)}
        onMouseUp={() => setSortPressed(false)}
        onMouseLeave={() => setSortPressed(false)}
        title="Clear selection"
        style={{
          position: 'absolute',
          right: 18,
          bottom: 22,
          width: 50,
          height: 50,
          borderRadius: '50%',
          border: '3px solid #1E5FA0',
          background: 'linear-gradient(180deg, #6CC3FF 0%, #2B7FC9 100%)',
          boxShadow: sortPressed ? 'inset 0 2px 4px rgba(0,0,0,0.3)' : '0 4px 0 #1E5FA0, 0 6px 10px rgba(0,0,0,0.35)',
          transform: `translateY(${sortPressed ? 3 : 0}px)`,
          transition: 'transform 100ms, box-shadow 100ms',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 18,
          outline: 'none',
        }}
      >
        <RefreshIcon />
      </button>
    </div>
  );
}

function RankingsOverlay({ rankedNames }: { rankedNames: string[] }) {
  const medals = ['🥇', '🥈', '🥉', '🏅'];
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 30,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(8,16,22,0.6)',
      }}
    >
      <div
        style={{
          padding: '28px 40px',
          borderRadius: 24,
          background: C.panelDark,
          border: `3px solid ${C.gold}`,
          boxShadow: '0 16px 36px rgba(0,0,0,0.5)',
          textAlign: 'center',
        }}
      >
        <div style={{ fontFamily: FONT, fontSize: 30, color: C.gold, textShadow: stroke(C.textStroke, 2), marginBottom: 16 }}>
          RESULTS
        </div>
        {rankedNames.map((name, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              fontFamily: FONT,
              fontSize: 20,
              color: '#fff',
              padding: '6px 0',
            }}
          >
            <span style={{ fontSize: 24 }}>{medals[i] ?? '•'}</span>
            <span>{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
