# Surface Pro 5 + KDE Plasma 6 (Wayland) — Tablet Guide

Legend: ✅ verified from docs/store pages · ⚠️ unverified, test it

## 1. System base (NixOS)

- linux-surface kernel + iptsd via `nixos-hardware` (touch, pen, SAM) ✅ (already in your flake)
- Wayland session: `services.displayManager.defaultSession = "plasma";`
- `i915.enable_psr=0` (fixes blank eDP) · `hardware.sensor.iio.enable = true;` (auto-rotate)
- Low-storage survival: `zramSwap.enable`, weekly `nix.gc`, `auto-optimise-store`
- `services.flatpak.enable = true;` for apps missing in nixpkgs
- Power: `powerManagement.cpuFreqGovernor = "powersave"` (already set); check battery with `powertop`
- Debug touch: `sudo libinput list-devices`, `libinput debug-events`

## 2. System Settings

|Setting|Where|Value|
|---|---|---|
|Touch Mode|Workspace → General Behavior|**Automatic** (on when keyboard detached) or **Always** ✅|
|Scale|Display & Monitor|150% (try 175% for pure tablet use)|
|Auto-rotate|Display & Monitor|On ✅ (needs iio-sensor-proxy)|
|Virtual keyboard|Keyboard → Virtual Keyboard|Plasma built-in (Wayland) ✅; set to show on lock/login screen|
|Touchscreen gestures|Input Devices → Touchscreen|Enable edge swipes; assign actions (Overview, Present Windows, Switch desktop) ✅|
|Screen edges|Workspace → Screen Edges|Left = Overview/Window switch, Bottom = show panel, Right = notifications|
|Touchpad|Input Devices → Touchpad|Tap-to-click, natural scroll, 3-finger swipe = desktops ✅|
|Cursor size|Appearance → Cursors|36|
|Fonts DPI|Appearance → Fonts|110–120 if text too small|
|Animations|Workspace Behavior|Slightly faster (i5-7300U)|
|Pen|Input Devices → Drawing Tablet|Map to screen, calibrate pressure curve, set button actions ✅ (Plasma 6.3+ has live pen test)|
|Power|Power Management|Screen dim 2 min, sleep 15 min, power button = sleep (via powerdevil)|
|Night Light|Display → Night Light|Auto, for evening studying|
|Single-click to open|Workspace → General Behavior → Clicking|Single click (better for touch)|
|Hide titlebars|Window Rules|Maximise new windows, no titlebar when maximised ⚠️|

## 3. Panel (tablet layout)

- Height **66–72 px**, **Floating: off**, position **bottom**
- Layout (left→right): Plasma Drawer · Task Manager (icons only) · spacer · Show Desktop · System Tray · Clock
- Task Manager: icons only, "Group when full", enable "Show tooltips" off (no hover on touch)
- System Tray: enlarge icons; hide unused entries
- Optional: second thin top panel with Application Title Bar (close/min buttons for maximised window)

## 4. Widgets / Plugins (right-click desktop → Add Widgets → Get New)

- **Plasma Drawer** ✅ fullscreen launcher with folders + krunner-style search (store.kde.org). CLI: `kpackagetool6 -t Plasma/Applet -i plasma-drawer-VERSION.plasmoid`. Touch scroll improved in latest version ✅. Search plugins in its config, incl. system settings.
- **Application Title Bar** ✅ window title + close/max/min buttons for Plasma 6 (github.com/antroids/application-title-bar). Install via Get New Widgets.
- **Win7 Show Desktop** ✅ thin "show desktop" button, can minimise all windows (Zren)
- **Kando** pie menu, touch-friendly radial launcher (`pkgs.kando`) ⚠️ check Wayland global shortcut works
- **Other launchers to try** ✅ listed on KDE Store: Tiled Menu, Andromeda Launcher, Simple Application Launcher
- **Panel Colorizer** (transparent/rounded panel, cosmetic) ⚠️
- **Command Output** (Zren) ✅ show custom info (e.g. battery, proxy state) in the panel
- Default widgets worth using: Overview/Present Windows button, Digital Clock (big), Media Controller, Notes, Quick Settings in tray
- After installing widgets, restart shell: `systemctl --user restart plasma-plasmashell`

## 5. Gestures cheat sheet

- Edge swipe from left → switch/overview (configurable) ✅
- Bottom drag → reveal panels ✅
- Long press → right-click (works in Plasma, Qt apps, Firefox/Chromium) ⚠️ some Electron/Flatpak apps need `--ozone-platform=wayland`
- Pinch to zoom: Firefox, Okular, Gwenview, Krita
- Two-finger tap on touchpad = right-click
- 3-finger swipe = switch desktops ✅
- Third-party gestures on Wayland: `kwin-gestures` ⚠️ (touchegg is X11 only; not needed)

## 6. Apps by use case

**Notes / handwriting:** Xournal++ (PDF annotation), Rnote, Okular (annotate PDFs), Obsidian (Markdown notes), Kleopatra n/a **Drawing:** Krita (full pen support, touch gestures), Concepts n/a on Linux **Reading:** Okular, Foliate (ebooks), Firefox (touch scroll, pinch) **Study:** Anki (flashcards), Zotero (papers), KDE Connect (clipboard/file sync with phone), Kalendar/Merkuro (calendar) **Media:** Elisa (music), VLC/Haruna (video), Gwenview (photos) **Files:** Dolphin (enable touch-friendly: single click, bigger icons), Syncthing (sync notes to desktop) **Coding (light):** VS Code (Remote-SSH to desktop), Konsole, Git, Python, SQLite/PostgreSQL clients (DBeaver is heavy) **Remote:** Moonlight (stream desktop from your Sunshine host), RustDesk **Virtual keyboard fallback:** Onboard (X11 era) — Plasma's built-in works on Wayland ✅

## 7. Firefox / Chromium touch tweaks

- Firefox: Wayland native by default in recent versions; `about:config` → `apz.overscroll.enabled = true`, `browser.touchmode.auto = true`, Customize toolbar → Density: Touch
- Chromium/Electron: `--ozone-platform=wayland --enable-features=TouchpadOverscrollHistoryNavigation`
- Enable pinch zoom: `apz.allow_zooming = true`

## 8. Known limits (honest)

- Plasma is touch-capable, not a pure keyboard-free tablet OS; some users report multi-touch navigation is weaker than GNOME Wayland ✅ (community reports)
- Virtual keyboard sometimes fails to appear automatically on detached Surface devices ✅ (reported on Surface Go 2); toggle it manually from the panel/tray
- Tablet-mode switch may not be reported on every Surface; use Touch Mode = **Always** if Automatic never triggers
- Auto-rotate may break after sleep (reboot or restart `iio-sensor-proxy`: `sudo systemctl restart iio-sensor-proxy`) ⚠️
- 8GB RAM / 128GB SSD: avoid Android Studio / IntelliJ; keep heavy work on the desktop

## 9. Studying DAM (Desarrollo de Aplicaciones Multiplataforma)

**Modules → tools:** Programación (Java) → VS Code/IntelliJ Community on desktop · Bases de datos → SQLite/PostgreSQL + DBeaver · Entornos de desarrollo → Git + GitHub · Acceso a datos → JDBC/Hibernate · Desarrollo de interfaces → JavaFX/Figma · Programación multimedia y móviles → Android Studio (desktop only) · Sistemas de gestión empresarial → Odoo (Docker on desktop) **Workflow:** PDFs in Okular/Xournal++ annotated per unit · Anki deck per module (SQL syntax, Java API, Git commands) · one small repo per module on GitHub · weekly review on the Surface · code on desktop via Remote-SSH or Moonlight **Routine:** 50/10 Pomodoro (KDE has Kronometer/Timer widgets), Night Light in the evening, sync notes with Syncthing

## 10. Useful commands

```
echo $XDG_SESSION_TYPE                     # wayland?
systemctl --user restart plasma-plasmashell
sudo libinput list-devices                 # touch/switch detection
kpackagetool6 -t Plasma/Applet -l          # installed widgets
sudo nix-collect-garbage -d                # free disk
```

---

# ADDITIONS (v2)

## 11. Gestures on Wayland (the big one)

- **InputActions** (formerly _kwin-gestures_, github.com/taj-ny/kwin-gestures) ✅ binds touchscreen + touchpad swipes/pinches/long-press to Plasma shortcuts, window actions, keystrokes, with per-app conditions. Supports Plasma 6 Wayland. Config is a YAML file. ⚠️ On NixOS check whether it's in nixpkgs (`nix search nixpkgs inputactions`); otherwise build from source or use a Flatpak-free workaround.
- KDE is also adding native assignable gestures (touchpad + touchscreen via `kglobalshortcutsrc`), but it missed Plasma 6.7 ✅ — check 6.8+.
- `touchegg` = X11 only, don't use on Wayland ✅.
- Built-in: System Settings → Input Devices → Touchscreen + Workspace → Screen Edges.
- Starter InputActions ideas: 3-finger swipe up = Overview, 3-finger left/right = switch desktop, 4-finger pinch = Present Windows, touchscreen edge swipe = Plasma Drawer.

## 12. More widgets / plugins

- **Panel Spacer Extended** ✅ (luisbocanegra/plasma-panel-spacer-extended): spacer with mouse/touch gestures — e.g. long-press/drag on the panel to maximize/move windows, run commands.
- **Application Title Bar** ✅ (already listed) — set to show only when a window is maximised.
- **Magnetile / KZones** ✅ (KWin scripts): zone snapping, handy when docked to a monitor (Wayland, Plasma 6.4+ for Magnetile).
- **Polonium** ✅ tiling for Plasma 6 (optional, docked mode only).
- **Kando / Plasma Drawer / Tiled Menu / Andromeda Launcher** ✅ launcher alternatives (you chose Drawer).
- **Material You colours** ✅ wallpaper-driven theming via `matugen` (Plasma, GTK, Konsole, Chrome…) — cosmetic.
- **Duskwatch** ✅ Night-colour replacement for Wayland if Plasma's Night Light is flaky (note: Redshift/gammastep don't work on Wayland).
- **Ambient noise player plasmoid** ✅ for studying (rain/cafe noise).
- **KDE Connect** widget in the tray for phone clipboard/files/notifications.
- Themes to make buttons feel bigger/touch friendly ✅ (awesome-kde list): Fluent, Layan, Sweet, Qogir, Orchis. Window decoration **Klassy** ✅ lets you enlarge titlebar buttons (good for fingers).
- Fork of Plasma blur (cosmetic) ✅ — skip on 8GB/i5.

## 13. Extra tablet tips

- Mixed-DPI docking: Wayland lets the tablet run 150% while an external monitor runs 100% ✅.
- Plasma 6.3+ pen settings: map whole tablet surface, adjust pressure range, live tilt/pressure test ✅.
- Keep animation speed "Fast" and disable blur/transparency on this i5-7300U if UI stutters.
- Use KDE **Activities** (Study / Coding / Media) with different panels/widgets.
- Install apps with Kirigami (touch-first) UI where possible: Okular, Gwenview, Elisa, Kalendar/Merkuro, KClock, Itinerary, Tokodon, NeoChat ✅ (Kirigami = KDE's mobile/convergent UI framework).
- Community: r/kde, r/SurfaceLinux, r/NixOS, linux-surface GitHub wiki + issues, discuss.kde.org, KDE bugs (bugs.kde.org, search "touch"/"tablet mode").


# Recommended apps — Surface Pro 5 / KDE tablet / DAM study

(✅ = nixpkgs name likely `pkgs.<name>`; verify with `nix search nixpkgs <name>`)

## Notes & handwriting

- Xournal++ (`xournalpp`) — PDF annotation, pen
- Rnote (`rnote`) — sketch/handwritten notes
- Obsidian (`obsidian`, unfree) — Markdown knowledge base
- Okular (`kdePackages.okular`) — read/annotate PDFs
- Zotero (`zotero`) — papers/references
- Anki (`anki`) — flashcards (SQL, Java, Git)
- Kate / KWrite (`kdePackages.kate`)

## Drawing / media

- Krita (`krita`) — pen + touch painting
- Gwenview (`kdePackages.gwenview`), Elisa (`kdePackages.elisa`)
- Haruna (`haruna`) or VLC (`vlc`) — video
- Foliate (`foliate`) — ebooks
- Kdenlive (`kdePackages.kdenlive`) — video editing (heavy; desktop better)

## KDE / convergent (touch-friendly)

- KDE Connect (`kdePackages.kdeconnect-kde`)
- KClock (`kdePackages.kclock`), Merkuro (`kdePackages.merkuro`) — calendar/contacts
- NeoChat (`kdePackages.neochat`), Itinerary, Tokodon
- Dolphin (single-click, large icons), Spectacle (screenshots), Ark, Filelight

## Browsers

- Firefox (`firefox`) — touch density, Wayland native
- Chromium (`chromium`) with `--ozone-platform=wayland`

## Dev (light on Surface; heavy on desktop)

- VS Code (`vscode`, unfree) + Remote-SSH extension
- Konsole, Git, `gh`, Python 3, JDK (`jdk21`), Maven/Gradle
- SQLite (`sqlite`), DB Browser for SQLite (`sqlitebrowser`), DBeaver (`dbeaver-bin`, heavy), `psql`
- Docker/Podman (`podman`) — keep containers on desktop
- Figma → browser; Excalidraw → browser
- IntelliJ Community / Android Studio → **desktop only**

## Remote / streaming

- Moonlight (`moonlight-qt`) — stream desktop from your Sunshine host
- RustDesk (`rustdesk`), `ssh`
- Syncthing (`syncthing`) — sync notes/projects between Surface and desktop

## Productivity / study

- Kronometer/timer widgets or a Pomodoro app (`gnome-pomodoro` ⚠️ GNOME deps)
- LibreOffice (`libreoffice-qt`), Joplin (`joplin-desktop`) as Obsidian alternative
- Flatpak apps via Discover for anything missing

## System / tablet utilities

- Kando (`kando`) — pie menu
- InputActions / kwin-gestures — gestures ⚠️ packaging varies
- powertop, `iio-sensor-proxy`, `libinput` tools, `brightnessctl`
- Plasma Drawer (KDE Store widget)
- Application Title Bar, Panel Spacer Extended (KDE Store widgets)
- Klassy (window decoration)