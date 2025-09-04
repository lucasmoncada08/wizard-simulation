Smoke:
- Deck: 60 cards, no dups, deterministic shuffle by seed.
- Dealing: correct counts per round.
- Trick resolution: wizard beats all; first wizard wins; all jesters → first wins;
  trump outranks led; else highest led suit.
- Bidding/Scoring: exact=20+10*bid; miss=-10*|delta|.
- Game loop: rotates dealer, advances rounds, sums tricks==handsize*players.

Property tests:
- Sum of tricks per round equals total dealt.
- Legal plays enforce following suit unless none in hand.
- Winner leads next.