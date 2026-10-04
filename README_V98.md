# DomAI v98 — STRICT BLOCK MPC + GAUSS CONTACT

v98 убирает penalty tie Frame↔Foundation.

Добавлено:
- строгая constraint transformation;
- блочная MPC для Frame base ↔ Foundation top;
- reduced K = Tᵀ K T;
- reduced F = Tᵀ F;
- recovery полного U;
- foundation plate FE;
- compression-only soil contact;
- contact active-set;
- контактные силы через tributary/Gauss-area представление;
- MPC residual;
- equilibrium residual;
- автоматическая mesh convergence study;
- Load Path / TXT / JSON.

Цепочка:
Surface → Shell → interpolation MPC → 3D Frame →
strict block MPC → Foundation FE → Gauss/tributary soil contact → reactions.

Ограничения:
- soil пока линейный вертикальный;
- нет полноценного 3D soil continuum;
- нет friction/sliding/consolidation/plasticity;
- нет полноценного нормативного расчёта армирования, трещин, продавливания;
- нет независимой верификации коммерческим FEM;
- результат предварительный и не является сертифицированным расчётом или рабочей документацией.

Следующий v99:
полноценная element-level Gauss contact formulation с контактным давлением
по Gauss-точкам каждого фундаментного элемента, consistent contact tangent,
contact residual и Newton/active-set iterations; затем benchmark patch tests.
