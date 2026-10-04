---
title: De-Google plan — Calendar & Banking
created: 2026-10-04
tags: [privacy, grapheneos, nixos, calendar, banking]
status: planning
---

# De-Google plan — Calendar & Banking

## Calendar (self-hosted CalDAV)
- Server: **Radicale** on NixOS (`services.radicale.enable = true`, htpasswd auth) — calendars + contacts
- Remote access: **Tailscale / WireGuard**, never an open port
- Alternatives: Fastmail (paid CalDAV), hosted Nextcloud

| Device | Client |
|---|---|
| Linux (KDE) | Merkuro / Thunderbird |
| Android | DAVx5 + Etar / Fossify Calendar |
| iPhone | built-in CalDAV |

### Tasks
- [ ] Choose always-on host for Radicale
- [ ] Add Radicale module to flake + rebuild
- [ ] Set up Tailscale/WireGuard
- [ ] Add account on desktop (Merkuro) and phone (DAVx5)
- [ ] Import old Google Calendar (.ics export)

## Banking without Google Android
Most banking apps run on GrapheneOS with **sandboxed Google Play**, but it is fragile: a bank can tighten Play Integrity checks after an update. Spanish banks (Santander, BBVA, CaixaBank, ING, Sabadell, Openbank, imagin) appear as tested in community lists — user reports, not guarantees.

### Plan
1. Buy a **Pixel** (only supported hardware) → install GrapheneOS
2. Check my bank on the PrivSec banking compatibility list **before** buying
3. Create a **separate profile** just for banking; install sandboxed Google Play only there
4. Install the bank app from Play in that profile (fallback: Aurora Store)
5. Payments: physical card or the bank's own NFC (Google Pay NFC is incompatible); Bizum works via the bank app
6. Backup: web banking on desktop (+ optional cheap Android used only for banking)

### Tasks
- [ ] Verify my bank on PrivSec list
- [ ] Pick Pixel model
- [ ] Install GrapheneOS
- [ ] Create banking profile + sandboxed Play
- [ ] Test login, transfers, Bizum
- [ ] Set up backup access (desktop web banking)

### Risks
- Sandboxed Play is still Google software, only isolated
- Banks may require stricter integrity checks later (e.g. N26 blocks new sign-ups, existing accounts still work)

## Related
[[Surface KDE tablet guide]] · [[MyNixOS repo]]
