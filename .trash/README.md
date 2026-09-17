# end4-pC on niri, for JANO-de/MyNixOS

## Read this first: I need to correct what I told you earlier in this chat

My first two answers were wrong on a key point, because I'd only read
end4-pC's README, not its actual code. I've now cloned the real repo
(commit `7ec99ebcba9c56134484e80a6c1c0d0cd8f5db21`) and it's a different
situation than "deeply Hyprland-coupled shell that needs a from-scratch
QML port":

- `services/WM.qml` is a compositor-abstraction singleton that
  auto-detects Hyprland vs niri (via `XDG_CURRENT_DESKTOP`) and loads
  either `services/HyprlandBackend.qml` or `services/NiriBackend.qml`.
- `services/NiriBackend.qml` is a complete, working niri backend built on
  `niri msg -j windows/workspaces/outputs` and a niri event-stream --
  window list, workspaces, monitors, focus, all of it.
- There's a dedicated `modules/ii/overview/NiriOverview.qml`, a
  `modules/ii/settings/pages/NiriConfig.qml` settings page, niri-aware
  keyboard-layout handling (`services/NiriXkb.qml`), and niri-aware night
  light (`services/Hyprsunset.qml` runs `wlsunset` instead of `hyprsunset`
  when `WM.compositor === "niri"`).
- Every togglable panel (bar, sidebars, overview, settings, lock screen,
  region selector, media controls, etc. -- 20 files) already exposes an
  `IpcHandler` target, which is exactly the mechanism niri keybinds are
  *meant* to drive instead of Hyprland's dispatcher/`GlobalShortcut`
  system. `services/CompositorGlobalShortcut.qml` already disables the
  Hyprland-only portal-based shortcut and relies on the IPC route when
  `WM.compositor !== "hyprland"` -- this isn't a bug to fix, it's the
  intended niri path.

**So there is no QML left to rewrite for basic niri functionality.** What
was actually missing was the NixOS/Home Manager plumbing to fetch it,
install its runtime dependencies declaratively, and wire niri keybinds to
its IPC targets. That's what's in this zip. I did not fabricate a "ported"
copy of the shell -- I'm pointing your flake at pctrade's real upstream
source and adding the glue around it.

## What's in this zip

```
modules/home/end4-pc.nix              Home Manager module: fetches end4-pC,
                                       installs its runtime deps, places the
                                       config at ~/.config/quickshell/end4-pC
modules/home/niri-end4pc-keybinds.kdl Snippet to merge into your existing
                                       niri config.kdl
README.md                             This file
```

I looked at your actual repo (`JANO-de/MyNixOS`) to fit these into your
existing layout -- you already have `modules/home/niri.nix` templating
`modules/home/niri/config.kdl` from a static file with `theme.color` and
`${pkgs.quickshell}` substitutions, and `pkgs.quickshell` is already
available via your `tide-island` overlay chain. This module reuses that,
it doesn't replace it.

## Integration steps

**1. Copy the files in**
```
cp modules/home/end4-pc.nix <your-repo>/modules/home/end4-pc.nix
```
Keep `niri-end4pc-keybinds.kdl` next to it for reference -- you'll copy
its *contents* into your existing kdl template in step 3, not the file
itself.

**2. Import the new module**

In `modules/home/default.nix`, add it to the imports list:
```nix
imports = [
  ./niri.nix
  ./theme.nix
  ./end4-pc.nix   # add this
];
```

**3. Merge the keybinds into your existing niri config template**

Open `modules/home/niri/config.kdl` (your existing one, templated by
`niri.nix`). Add the `spawn-at-startup "qs" "-c" "end4-pC"` line near your
other `spawn-at-startup` entries, and merge the binds from
`niri-end4pc-keybinds.kdl` into your existing `binds { ... }` block --
**don't** paste a second `binds { }` block, niri only reads one per file.
Check the bind keys I chose (Mod+Space, Mod+A, Mod+N, etc.) against what
you've already bound for Tide Island / other things, and change any that
collide.

**4. Get the real source hash**

`end4-pc.nix` fetches end4-pC with `hash = lib.fakeHash;` as a
placeholder -- Nix can't know the real hash without you building once.
Run your normal rebuild command; it will fail with an error like:
```
error: hash mismatch in fixed-output derivation:
  specified: sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=
     got:    sha256-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX=
```
Copy the `got:` hash into `end4-pc.nix` in place of `lib.fakeHash`, then
rebuild again.

**5. Rebuild**
```
sudo nixos-rebuild switch --flake .#laptop
```

## Before you trust it on your daily driver

I couldn't run niri, Quickshell, or a Wayland session in the sandbox I
analyzed this in -- everything here is verified against the actual source
code (grepped, not guessed), but **not** verified by actually running the
shell. Please test it logged into a spare TTY/VT or a throwaway user
first:
```
qs -c end4-pC
```
Watch stderr for QML errors before wiring it into `spawn-at-startup`.

## Known gaps / things to expect

- **In-app niri Settings editor won't persist.** end4-pC's Settings panel
  has a page (`NiriConfig.qml`) that edits `~/.config/niri/config.kdl`
  directly with shell commands so you can rebind keys from the GUI. Your
  flake generates that file read-only from the Nix store on every
  rebuild, so GUI edits will get silently discarded (or fail outright, on
  most systems the file itself won't be writable). Bind changes go in
  `modules/home/niri/config.kdl` + rebuild, not the in-app editor.
- **Python theming deps.** `scripts/colors/generate_colors_material.py`
  needs `materialyoucolor`, `pillow`, `loguru`, `numpy`, `opencv4`,
  `pygobject3`, `google-auth` -- I packaged these via
  `python3.withPackages` in `end4-pc.nix`. `materialyoucolor` is in
  nixpkgs as of late 2025 but package sets move; if the build fails on
  one of these names, run `nix search nixpkgs <name>` and fix it rather
  than deleting it -- without it, wallpaper-based color extraction breaks
  silently rather than erroring loudly.
- **Two Quickshell configs running at once.** Since Tide Island and
  end4-pC are separate `qs -c <name>` configs, nothing stops both running
  simultaneously if you don't remove Tide Island's autostart -- you'll get
  duplicate bars/panels. Decide whether you're replacing Tide Island or
  trying end4-pC alongside it, and comment out one autostart accordingly.
- **This is one commit's worth of analysis.** end4-pC is a fork someone
  actively maintains; if you update the pin in `end4-pc.nix` later,
  re-check `services/WM.qml`, `NiriBackend.qml`, and the `IpcHandler`
  targets I used for keybinds in case names change.
