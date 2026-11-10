# Field Desk

A desktop browser for people who open twenty tabs while following one question.
Real tabs and a fast everyday browser first; then a desk rail on the right edge for pinned
commanders, clipped passages, side-by-side sources and research sessions you can pick up tomorrow.

## Launch

You need [Node.js](https://nodejs.org) 22.12 or newer (`node -v` to check; on a Mac, `brew install node` or the installer from nodejs.org). From a fresh clone:

```sh
npm install
npm start
```

That is the whole procedure on macOS, Windows and Linux. The first `npm start` downloads the
Electron runtime for your machine (about 100 MB, once), then the window opens. On macOS the Dock
and menu bar say "Electron" because the app is run from source; quit with `Cmd+Q`.

## Where to click first

1. The app opens on **Fog of War**: Ulm, October 1805, with the map and Mack's decision on the left
   and the reading room on the right. Step through the three reports, pick a move, write what would
   change your mind, press **Commit and reveal**.
2. Click the **Napoleon** portrait on the right edge. That is a pinned commander: his file, a few
   sourced decisions, and whatever you clip to him.
3. Open any page, select a sentence, right-click, **Clip to Napoleon's file**.
4. Click **Desks** on the rail and open **Alexander vs. Caesar** to see two commanders compared
   under the question "Where did Caesar have an operational edge?".
5. Press `Ctrl+T` (`Cmd+T` on a Mac) for a new tab. The **Resume** button there takes you back to
   the last workspace.

## What is in it

**Browser.** Tabs (drag to reorder, middle-click to close), one address and search bar, back,
forward, reload, bookmarks, history, find in page, zoom, reopen closed tab, session restore.
Links that ask for a new tab get one; Ctrl/Cmd-click and middle-click open in the background.
The new tab page has search, pinned sites and Resume.

**Pin a Commander.** Alexander, Hannibal, Caesar, Napoleon or Turenne, pinned to the right edge
as a small portrait and name. The pin stays as you change tabs and comes back after a restart.
Click it for the drawer: your working question, four source-linked decisions from the campaigns,
and the passages you have saved. Right-click selected text on any page to clip it to a pinned
commander, optionally straight into a category.

**Compare.** Pin two and the drawer gains a Compare view: one column each, evidence filed under
intelligence, marching tempo, logistics, and recovery after setbacks. Mark any item as supporting
or challenging your current view. Click a clip to go back to its source. `Ctrl+.` hides the whole
rail when you just want to browse.

**Split view.** Two live pages side by side with a draggable divider (`Ctrl+\`, or right-click a
tab, or right-click a link and choose "Open link in split view").

**Workspaces.** A workspace is a question plus its tabs, their order, the split, the pins and the
notes. Everything saves as you go. Reopen one from **Desks** or from Resume. Export notes, saved
lines and clips as Markdown with source links (`Ctrl+Shift+E`).

**Rabbit Hole.** An optional branching trail per workspace (**Trail** on the rail): which page led
to which, where you are, and which branches you abandoned. Click any entry to go back.

**Layouts.** *Translation desk* puts an original and a translation side by side with a scratchpad.
*Speech practice* is a 60-second timer with an attempt log. Both are under Desks.

## Shortcuts

| | Windows / Linux | macOS |
|---|---|---|
| New tab / close tab / reopen closed | `Ctrl+T` / `Ctrl+W` / `Ctrl+Shift+T` | `Cmd+T` / `Cmd+W` / `Cmd+Shift+T` |
| Address and search bar | `Ctrl+L` | `Cmd+L` |
| Next / previous tab | `Ctrl+Tab` / `Ctrl+Shift+Tab` | same, or `Cmd+Opt+Right` / `Cmd+Opt+Left` |
| Tab 1 to 8, last tab | `Ctrl+1` … `Ctrl+9` | `Cmd+1` … `Cmd+9` |
| Back / forward | `Alt+Left` / `Alt+Right` | `Cmd+[` / `Cmd+]` |
| Reload | `Ctrl+R`, `F5` | `Cmd+R` |
| Find in page | `Ctrl+F` | `Cmd+F` |
| Bookmark | `Ctrl+D` | `Cmd+D` |
| Zoom | `Ctrl+=` `Ctrl+-` `Ctrl+0` | `Cmd+=` `Cmd+-` `Cmd+0` |
| Split view | `Ctrl+\` | `Cmd+\` |
| Hide or show the desk rail | `Ctrl+.` | `Cmd+.` |
| Save selected line to notes | `Ctrl+Shift+L` | `Cmd+Shift+L` |
| Export notes as Markdown | `Ctrl+Shift+E` | `Cmd+Shift+E` |

## Privacy and isolation

- Tabs, workspaces, notes, clips, bookmarks and history live in one JSON file in the app's data
  folder on your computer (`field-desk.json`). There is no account and no server.
- Every web page runs in its own sandboxed, context-isolated view with no Node access and no
  preload script, in a separate session from the app. Pages cannot reach the app's IPC or your notes.
- Pages are refused camera, microphone, location and notification access.
- The app's own window only ever loads the app.

## A note on the history

Commander decision cards and the Ulm scenario are Field Desk's own summaries, each with a citation
and a link. They are not quotations. Scenario simplifications are labelled "Scenario assumption" in
the app. Check anything you intend to rely on against the source.

## Checks

```sh
npm test          # the restart check: two real pages, pin Caesar, clip, restart, verify
```

On a headless Linux machine wrap it: `xvfb-run -a -s "-screen 0 1440x900x24" npm test`.
The checks need Playwright (`npm i -D playwright`) in addition to the app's own dependencies.

## Layout of the code

```
src/main.js        main process: window, isolated page views, menus, state file
src/preload.js     the narrow bridge exposed to the app's own UI only
app/               the UI (plain HTML, CSS and JavaScript; no build step)
  js/core.js       tabs, panes, split view, address bar, commands
  js/drawer.js     desk rail, commander files, compare, notes, workspaces, trail
  js/pages.js      new tab, Ulm decision, reading room, speech practice
  js/data-*.js     commander decisions and the Ulm scenario
test/              automated checks that drive the real app
```
