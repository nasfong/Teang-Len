# GAME_RULES.md — Teang Len

Cambodian card game for 4 players.

Rules marked **[UNCERTAIN]** have not been verified through gameplay testing.

---

## Deck

- Standard 52-card deck, no jokers
- 4 players, 13 cards each

---

## Card Ranking

Rank (weakest to strongest):

```
3  4  5  6  7  8  9  10  J  Q  K  A  2
```

Suit (weakest to strongest):

```
spades  <  clubs  <  diamonds  <  hearts
```

Same rank: higher suit wins. Example: A-hearts beats A-diamonds.

---

## Starting the Game

1. Deal 13 cards to each player.
2. Discard all 3-rank cards before play (3-spades, 3-clubs, 3-diamonds, 3-hearts).
3. Player who held 3-spades goes first and opens the first trick.

---

## Hand Types

### SINGLE
One card.

### PAIR
Two cards of the same rank.

### TRIPLE
Three cards of the same rank.

### STRAIGHT
Three or more consecutive ranks, any suits. 2 is forbidden in straights.

### FLUSH_STRAIGHT
Three or more consecutive ranks, all same suit. Beats a normal STRAIGHT of equal length. 2 is forbidden.

### DOUBLE_SEQUENCE
Two or more consecutive pairs (minimum 4 cards, always even count). 2 is forbidden. Comparison: highest pair's top card.

### QUAD
Four cards of the same rank. Also acts as a bomb.

---

## Trick Play

- Opening player plays any valid hand.
- Each subsequent player must beat it with the same type and same card count, or skip.
- A player who skips is locked out until the next trick.
- Trick ends when all active players except one have skipped.
- Trick winner opens the next trick. All skip flags reset.

---

## Bombs (Cuts)

Bombs override type matching.

| Bomb | Cuts | Condition |
|---|---|---|
| QUAD | SINGLE | Only if the single card is a 2 |
| DOUBLE_SEQUENCE (4+ pairs, 8+ cards) | PAIR | Only if both cards are 2s |

Triple 2 is completely unbeatable — no bomb cuts it.

### Terminology

- **beat** — tops the current hand within same type and size
- **cut** — bomb play that kills a 2-hand regardless of type
- **bomb** — QUAD or a 4-pair DOUBLE_SEQUENCE used as a cut

---

## Special Rules for 2

- Strongest single card (beats A).
- Cannot appear in STRAIGHT or DOUBLE_SEQUENCE.
- Triple 2 is unbeatable.
- Pair of 2s can be cut by a 4-pair double sequence.
- Single 2 can be cut by a quad.

---

## Win Condition

Game continues until all players are ranked. Players finish in order of emptying their hand (1st through 4th). After ranking, a player no longer participates in tricks.

---

## Turn Advancement

1. Current player plays or skips.
2. Turn advances clockwise to the next active, non-skipped player.
3. When all active players except one have skipped, trick resolves.
4. Trick winner opens the next trick. If the winner is already ranked, turn passes to next active player.

---

## Comparison

Same type and size: top card (highest rank, suit as tiebreaker) wins.
FLUSH_STRAIGHT beats STRAIGHT of the same length unconditionally.

---

## Implementation Notes

- `rules.ts` is the single source of truth. Never duplicate rule logic outside it.
- `classifyHand(cards)` returns Hand or null (null = invalid selection).
- `canBeat(challenger, current)` handles normal comparison and bomb overrides.
- Engine never mutates rules at runtime.

---

## [UNCERTAIN] Rules

- Whether FLUSH_STRAIGHT of a different length beats STRAIGHT of any length, or only same length.
- Whether a ranked player's trick win auto-passes to the next active player — currently implemented: yes.
- Exact card count for the 4-pair bomb — currently 8 cards minimum.
