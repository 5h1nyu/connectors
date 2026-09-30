# MTG Deck Tracker

Track which Magic cards you own and which deck each one lives in, so when you brew
something new you know what to pull from your existing decks and what to buy.

Card data, images and prices come from the free [Scryfall API](https://scryfall.com/docs/api).

## Run it on your computer

You need [Node.js](https://nodejs.org) (the LTS version) installed once.

```bash
cd mtg-tracker
npm install      # first time only: downloads the libraries the app uses
npm run dev      # starts the app
```

Then open the link it prints (usually http://localhost:5173).

## Use it online

Once GitHub Pages is switched on (Settings → Pages → Deploy from a branch → `gh-pages`),
the app lives at **https://5h1nyu.github.io/connectors/**. Every push to this branch
rebuilds it automatically (see `.github/workflows/deploy-mtg-tracker.yml`).

## How your cards are organised

- **Decks**: each card is either *in the deck* or *swapped out* (crossed off, still in that deck box).
- **Loose cards**: singles, binder, trade pile, anything not in a deck.
- **Collection**: everything combined, with tags showing where each copy is.

When you take a card out of a deck you choose: keep it crossed off with the deck, move it to loose,
or remove it (sold/traded). You can name a replacement in the same step. Adding a card to a deck
takes it from your loose cards if you have one there.

## How the code is organised

| File | What it does |
| --- | --- |
| `src/App.jsx` | Tabs, and wires every button to a change in your data |
| `src/lib/collection.js` | All the rules for moving cards between decks, loose cards and the bin |
| `src/lib/storage.js` | Saves everything in this browser (and upgrades data from older versions) |
| `src/lib/scryfall.js` | Card lookups, autocomplete, images and prices from Scryfall |
| `src/lib/mtgjson.js` | Commander precon decklists from MTGJSON |
| `src/lib/parseDecklist.js` | Understands pasted lists like `1x Sol Ring (C21) 263` |
| `src/components/DeckView.jsx` | One deck: add cards, take cards out, swapped-out section |
| `src/components/RemoveCardDialog.jsx` | The "where does this card go?" popup |
| `src/components/AddDeckForm.jsx` | Pick a precon or paste a list |
| `src/components/AddCardForm.jsx` | Add one card (with autocomplete) or paste several |
| `src/components/CollectionView.jsx` | Every card you own and where it is |
| `src/components/BrewChecker.jsx` | What you have for a new deck and what to buy |
| `src/components/Backup.jsx` | Download / restore your data as a file |
| `src/components/CardPreview.jsx` | The hover popup (tap on phones) |

## Roadmap

- [x] Step 1: add decks by pasting a list, hover any card to see it
- [x] Edit decks card by card, swapped-out cards, loose cards, full collection view
- [x] Step 2: Brew checker with buy list
- [x] Step 3: pick a Commander precon from a list (MTGJSON)
- [x] Step 4: online with GitHub Pages
- [ ] Step 5: sync between phone and PC (for now: Backup tab)
- [ ] Later: "build this brew" (move cards out of other decks automatically), shop price comparison, binders as separate locations
