# DomAI v97 — COUPLED SHELL + FRAME + FOUNDATION + SOIL

v97 объединяет конструкцию и фундамент в одну глобальную расчётную схему.

Цепочка:
Surface → Mindlin Shell → interpolation MPC → 3D Frame →
Foundation Plate FE → Compression-only Soil Contact → Reactions.

Добавлено:
- единая глобальная K/F/U;
- отдельная фундаментная plate FE;
- непосредственная вертикальная совместимость Frame↔Foundation;
- active-set soil contact;
- узловое контактное давление;
- реакции грунта;
- equilibrium;
- compatibility residual;
- benchmarks;
- load-path report;
- JSON/TXT.

Ограничения:
- грунт представлен линейными вертикальными пружинами;
- нет полноценного 3D soil continuum;
- нет трения, сдвига, консолидации и пластичности;
- нет полноценного нормативного расчёта армирования/трещин/продавливания;
- расчёт предварительный, не сертифицированный и не является рабочей документацией.

Следующий v98:
нормальная блочная сборка DOF/constraint transformation без penalty tie,
двусторонняя MPC для Frame↔Foundation, распределение контактных сил по
Gauss-точкам и автоматическая проверка mesh/contact convergence.
