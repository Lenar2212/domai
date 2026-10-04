# DomAI v106 — 3D BIM ENGINEERING COORDINATION

v106 extends v105 with conceptual 3D coordination of engineering networks.

## Added
- 3D elevations for electricity, gas, water, sewer and heating.
- Automatic vertical risers between floors when compatible points exist at matching plan coordinates/system.
- Automatic preliminary level assignment with minimum separation.
- 3D visualization of network segments and risers.
- Preliminary 3D conflict detection using segment sample points and minimum separation.
- JSON/TXT export.
- Data persisted in `localStorage` as `domai106_bim`.

## Important limitation
This is a conceptual coordination tool. It does not certify routing through real structures, fire compartments, gas zones, electrical clearances, drainage slopes, hydraulic design, cable ampacity, short-circuit protection, ventilation, or structural penetrations. Working documentation must be checked and signed by qualified specialists.
