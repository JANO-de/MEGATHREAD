---
cssclasses:
  - page-white
tags:
  - server
  - scpsl
  - games
---

# SCP: Secret Laboratory Server Setup

> Private server hosted on this PC (NixOS). Installed 2026-08-05.

## How to connect

| Who | How | Address |
| --- | --- | --- |
| Me (this PC) | In-game → Online → Direct Connect | `localhost:7777` |
| Friends on same Wi-Fi/router | Direct Connect (same LAN) | `192.168.0.108:7777` |
| Friends over internet | Direct Connect via Tailscale | `100.94.204.98:7777` |

The server is **not verified**, so it never appears in the public server browser. Everyone must use **Direct Connect** with the address above.

## Why Tailscale (and why port forwarding failed)

The router's WAN IP is a private address (`192.168.1.100`), meaning it sits behind a **second NAT** at `192.168.1.1` (ISP modem or double router). Port forwarding on our router can never work because the internet traffic is handled by the upstream device first. **Tailscale** creates a private VPN network that bypasses ALL of this — no port forwarding, works behind any router or CGNAT.

## The port thing (port forwarding) — DO NOT USE

The server listens on **UDP 7777** (all game traffic). Firewall ports `7777/udp` and `7779/tcp` are now opened permanently in the flake (`networking.firewall.allowedUDPPorts`/`allowedTCPPorts`).

Port forwarding on the router was **abandoned**: the router WAN is `192.168.1.100` (behind a second NAT), so forwarding can never reach us. Internet friends use **Tailscale** instead (section below).

**Friends on the same Wi-Fi still connect directly** via `192.168.0.108:7777` — no Tailscale needed for them.

## Tailscale setup (friends over internet)

Installed via the NixOS flake (`services.tailscale.enable = true` in `~/Documents/MyNixOS/hosts/laptop/default.nix`). This PC is `laptop-1` with IP `100.94.204.98`.

**To add a friend:**
1. Friend installs Tailscale (free) from https://tailscale.com/download and signs in with any account.
2. You go to https://login.tailscale.com/admin → Machines → `laptop-1` → **Share**.
3. Enter the friend's Tailscale email/account. They accept the share.
4. Friend connects to `100.94.204.98:7777` in-game (Direct Connect).

Commands:
```bash
tailscale status   # show tailnet devices + IPs
tailscale ip -4    # this machine's tailnet IP
tailscale up       # (re)authenticate if logged out
```

## Server management

```bash
# Start server
cd ~/scpsl && setsid nohup ./run-scpsl.sh 7777 &

# Stop server
pkill -f LocalAdmin

# Check it's running / see console output
tail -f /tmp/scpsl-run/server.log

# Update server (stop it first)
steamcmd +force_install_dir ~/scpsl +login anonymous +app_update 996560 validate +quit
```

- Game and server must be on the **same version**. Update the server after big game patches.
- Requires restart after a reboot of the PC.

## File locations

| Path | Purpose |
| --- | --- |
| `~/scpsl` | Server files (steamcmd AppID 996560) |
| `~/scpsl/run-scpsl.sh` | Launcher wrapper (handles NixOS libs) |
| `~/Documents/MyNixOS/hosts/laptop/default.nix` | NixOS flake config (tailscale + firewall ports) |
| `~/.config/SCP Secret Laboratory/config/7777/config_gameplay.txt` | Game settings (name, slots, FF, timers) |
| `~/.config/SCP Secret Laboratory/config/7777/config_remoteadmin.txt` | Admin roles |
| `~/.config/SCP Secret Laboratory/config/7777/UserIDWhitelist.txt` | Whitelist (empty, not enabled) |

**Important:** stop the server before editing configs — the server rewrites `config_gameplay.txt` on shutdown and will overwrite changes.

## Current settings

- Server name: `Private Server`
- Port: `7777` (UDP)
- Max players: `20`
- Whitelist: **disabled** (anyone who knows the IP can join — keeps it private since it's not listed publicly)
- Online mode: enabled (needs valid game account to join)
- Owner admin: `76561199221204773@steam` (press **M** in-game for the Remote Admin panel)

## Useful commands (LocalAdmin console)

| Command | Effect |
| --- | --- |
| `exit` | Shut down server |
| `restart` | Restart server |
| `help` | List commands |

## Troubleshooting

- **Friends can't connect from internet** → they must be on the Tailscale network and connect to `100.94.204.98:7777`. Check `tailscale status` that `laptop-1` is online.
- **"Failed to start server"** → run `pkill -f LocalAdmin` then start again.
- **Server not starting on reboot** → you started it with the command above, it doesn't auto-start.
