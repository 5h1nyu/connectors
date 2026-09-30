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

## How the code is organised

| File | What it does |
| --- | --- |
| `src/App.jsx` | The main screen: deck list on the left, deck or "add deck" form on the right |
| `src/components/AddDeckForm.jsx` | Paste a decklist, look the cards up on Scryfall, save the deck |
| `src/components/DeckView.jsx` | Shows one deck grouped by card type |
| `src/components/CardPreview.jsx` | The hover popup (tap on phones) with card image, text, price and buy link |
| `src/lib/parseDecklist.js` | Understands pasted lists like `1x Sol Ring (C21) 263` |
| `src/lib/scryfall.js` | Talks to the Scryfall API |
| `src/lib/storage.js` | Saves your decks in this browser |

## Roadmap

- [x] Step 1: add decks by pasting a list, hover any card to see it
- [ ] Step 2: "Brew checker": paste a new list, see which cards you own (and which deck they're in) and what to buy
- [ ] Step 3: pick a Commander precon from a list instead of pasting (via MTGJSON)
- [ ] Step 4: put it online (GitHub Pages) so it works on your phone
- [ ] Step 5: sync decks between phone and PC (e.g. Supabase)
- [ ] Later: shop prices and links, binders/boxes, import from Archidekt/Moxfield
