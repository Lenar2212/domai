# DomAI v100 — VARIATIONAL CONTACT + PATCH TESTS

v100 переводит контакт в вариационную FE-форму.

Основные операторы:
R_contact = ∫ Nᵀ p dA
K_contact = ∫ Nᵀ k_t N dA

Добавлено:
- element-level 2×2 Gauss integration;
- контактный residual;
- consistent linear contact tangent для линейного soil law;
- непосредственная сборка контактных вкладов в глобальные K/F;
- active-set/Newton iteration;
- strict block MPC Frame↔Foundation;
- equilibrium;
- MPC residual;
- uniform-pressure patch test;
- total-reaction patch test;
- mesh convergence.

Patch test проверяет:
1. воспроизведение равномерного давления;
2. совпадение суммарной реакции с интегралом приложенной нагрузки.

Ограничения:
- грунт линейный compression-only;
- нет полноценного 3D soil continuum;
- нет трения, сдвига, консолидации, пластичности;
- нет полного нормативного расчёта армирования, трещин, продавливания и устойчивости;
- нет независимой верификации коммерческим FEM;
- расчёт предварительный и не является сертифицированным расчётом или рабочей документацией.

Следующий v101:
добавить многослойную модель грунта, разные k по слоям,
contact gap/penetration, uplift/open status и энергетический контроль
||R||, ||ΔU||, strain/contact energy.
