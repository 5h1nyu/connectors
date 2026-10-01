# Shinyu's Vault

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

## Building a new deck

**Decks → Build a new deck**: give it a name (and a commander if you like), then add cards by searching
or pasting a list. While it's a *brew*, nothing counts as owned yet; every card shows where you could get
it: **Loose**, **Spare in…** (swapped out), **In …** (another deck) or **Buy · $price**, with a total
cost and a copyable buy list. **Finish building** gathers your copies into the deck (loose first, then
spares, then the decks you tick) and leaves "to buy" markers for the rest. Precons and pasted lists of
decks you already own live under **Add a precon / paste a list**.

## Doing things to many cards at once

Tick the box on any card (hover a picture to see it) in your collection or a deck. A bar appears at the
top: **Move to…**, **Swap out**, **Put back in**, **Mark as bought** or **Remove**, all with Undo.

## How your cards are organised

- **Decks**: each card is *in the deck*, *swapped out* (still in that deck box), or *to buy* (on the list, not owned yet).
- **Loose cards**: singles, binder, trade pile, anything not in a deck.
- **Collection**: everything combined, with tags showing where each copy is.

**Click any card** (in a deck, your collection or the brew checker) to open its card page: big image,
rules text, prices, buy links, and every copy you own. Each copy has **Move** (to another deck, swapped out,
loose, or removed from your collection), **Printing** (pick the exact version) and **★ Cover** (show it on
top of the deck's stack).

Every card is stored under its official Oracle name, even special printings with an alternate name, so
**Export** gives lists that Tabletop Simulator, Moxfield and Archidekt can import. The picture you see is
still the printing you chose.

When you take a card out of a deck you choose: keep it crossed off with the deck, move it to loose,
or remove it (sold/traded). You can name a replacement in the same step. Adding a card to a deck
takes it from your loose cards if you have one there.

## How it works (plain English)

**Frontend = the app you see.** Everything in `src/` is React code that runs inside your browser.
GitHub turns it into a plain website (HTML + JavaScript) every time code is pushed, and GitHub Pages
hosts it for free. There's no server of our own.

**Where card info comes from:**
- **Scryfall** answers "what is this card?": image, rules text, price, buy link. It's updated daily with
  new sets, so new cards work as soon as Scryfall has them.
- **MTGJSON** answers "what's in this precon?". The precon list is downloaded fresh each time you open
  the picker, so new precons appear once MTGJSON adds them (usually around release).
- When you add a card, its info is **saved with your collection**. Prices therefore freeze at that
  moment. Use **Settings → Update prices & card info** to refresh them.

**Backend = Supabase (optional).** Your collection is always saved in the browser first. When you're
logged in, it's also copied to a Supabase database (one row holding your whole collection) and pulled
down on your other devices. Supabase also handles logins. Row-level security rules mean only your
account can read or change your row.

```
 Phone / PC browser  ──── card lookups ────▶  Scryfall, MTGJSON
   (the app + a local copy of your data)
          │
          └──── login + your collection ────▶  Supabase (database + accounts)
```

## Setting up sync (Supabase)

1. In your Supabase project: **SQL Editor → New query**, paste `supabase/schema.sql`, click **Run**.
2. **Authentication → URL Configuration**: set **Site URL** to `https://5h1nyu.github.io/connectors/`.
3. **Project Settings → API**: copy the **Project URL** and the **publishable** (or `anon`) key into
   `src/config.js`. Never use the `secret` / `service_role` key.
4. Open the app → **Settings** → enter email + password → **Create account** → confirm the email → log in.
5. Optional, after you've made your account: **Authentication → Sign In / Providers** → turn off
   **Allow new users to sign up**, so nobody else can make an account on your app.

## Friends and sharing

The **Friends** tab lets you pick a username and profile picture (any card's art, or a photo), find friends
by username, and send/accept requests. Every deck has a **Private / Friends / Public** switch on its page,
and your loose cards have one on the Friends tab. Public things show up on your profile link
(`…/connectors/#/u/your-username`), which works for anyone, even without an account.

Your own profile (picture, names, link, and who can see each deck) lives under **your picture in the top
right → Your profile** (or the **You** tab on phones). Settings are in the same menu.

**One-time setup:** in Supabase → **SQL Editor** → New query, paste `supabase/social.sql` and click **Run**.
If you ran an older copy of it before, also run `supabase/usernames-v2.sql` (lets usernames use any characters).
It creates the profiles and friendships tables, the sharing rules, and storage for profile photos. Sharing
only shows what you've synced, so stay logged in.

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
| `src/components/Backup.jsx` | Download / restore your data as a file |
| `src/components/Account.jsx` | Log in / create account for sync |
| `src/components/CardData.jsx` | Refresh prices & card info from Scryfall |
| `src/components/DeleteDeckDialog.jsx` | "Added by mistake" vs "took it apart" when deleting |
| `src/lib/supabase.js` | Reads/writes your collection in Supabase |
| `src/lib/useCloudSync.js` | Decides when to upload/download so devices stay in step |
| `src/config.js` | Your Supabase project URL + publishable key |
| `supabase/schema.sql` | The database table + security rules (run once in Supabase) |
| `src/components/CardPreview.jsx` | Card names: hover popup that stays on screen, click opens the card page |
| `src/components/CardDetail.jsx` | The card page: details, prices, your copies and what to do with them |
| `src/components/MoveDialog.jsx` | Move copies between decks, loose, or out of your collection |
| `src/components/PrintingPicker.jsx` | Grid of every printing to choose from |
| `src/components/DeckShelf.jsx` | Decks as 3D card stacks that tilt and fan out on hover; sorting and drag-to-reorder |
| `src/components/CardImage.jsx` | A clickable card picture used in the picture views |
| `src/components/ExportDialog.jsx` | Export a deck for Tabletop Simulator or Moxfield/Archidekt |
| `src/components/NewDeckDialog.jsx` | "Build a new deck": name + optional commander |
| `src/components/BuildDialog.jsx` | "Finish building": gather owned cards, see what's left to buy |
| `src/components/SelectionBar.jsx` | The bar for ticked cards (move / remove many at once) |
| `src/components/Logo.jsx` | The ring logo with the Tengwar inscription |
| `src/components/PageHeader.jsx` | The big title + subtitle + buttons at the top of every page |
| `src/components/ThemePicker.jsx` | Settings → Look: three vibes plus 15 Magic colour themes (mono + guilds) |
| `src/components/NavIcon.jsx` | Icons for the navigation (bottom bar on phones) |
| `src/lib/theme.js` | Remembers your colour theme on this device |
| `src/lib/social.js` | Profiles, friend requests and shared vaults (Supabase) |
| `src/lib/useProfile.js` | Loads and saves your own profile |
| `src/components/FriendsView.jsx` | The Friends tab: add friends, requests, friends list |
| `src/components/ProfilePage.jsx` | Your profile: picture, names, link, who can see each deck |
| `src/components/HeaderMenu.jsx` | Your picture in the corner: profile, settings, log out |
| `src/components/FrontCardDialog.jsx` | Choose which card is on the front of a deck |
| `src/components/CardSearch.jsx` | Card search with live suggestions, thumbnails and a hover preview |
| `src/components/Portal.jsx` | Makes popups open over the screen, wherever you are on the page |
| `src/components/VaultView.jsx` | Someone's shared decks and collection (friends or public link) |
| `src/components/AvatarPicker.jsx` | Profile picture from card art or an uploaded photo |
| `src/components/VisibilityPicker.jsx` | Private / Friends / Public switch |
| `supabase/social.sql` | Database setup for friends and sharing (run once) |
| `supabase/usernames-v2.sql` | Update for older setups: any characters in usernames |
| `src/lib/useTilt.js` | Makes cards and deck stacks lean towards the mouse (3D) with a moving shine |
| `src/components/RingInscription.jsx` | Circles of glowing Tengwar (logo, background, card backs) |
| `src/components/Backdrop.jsx` | The slowly turning rings of writing behind every page |
| `src/components/ConfirmRemoveDialog.jsx` | "Are you sure?" showing exactly which cards will be removed |
| `src/lib/ringVerse.js` | The Ring verse in Tengwar characters |

## Roadmap

- [x] Step 1: add decks by pasting a list, hover any card to see it
- [x] Edit decks card by card, swapped-out cards, loose cards, full collection view
- [x] Step 2: Brew new decks with a buy list (replaced the separate Brew checker)
- [x] Step 3: pick a Commander precon from a list (MTGJSON)
- [x] Step 4: online with GitHub Pages
- [x] Step 5: sync between phone and PC with Supabase (needs `src/config.js` filled in)
- [ ] Later: "build this brew" (move cards out of other decks automatically), shop price comparison, binders as separate locations

## Credits

- Card data and images: [Scryfall](https://scryfall.com). Precon lists: [MTGJSON](https://mtgjson.com).
- Tengwar lettering: [Alcarin Tengwar](https://github.com/Tosche/Alcarin-Tengwar) by Toshi Omagari, the
  typeface used on The One Ring card, under the SIL Open Font License (`public/fonts/AlcarinTengwar-OFL.txt`).
  The inscription is the Ring verse in Black Speech from the font's sample texts.
