# DomAI v91 — GLOBAL 3D Q4 SHELL SOLVER

v91 интегрирует Q4 Mindlin–Reissner shell в глобальный solver:
- 4-node Q4;
- 6 DOF/node;
- local 24x24 stiffness;
- local-to-global transformation;
- global K/F/U assembly;
- uniform surface pressure;
- full 6-DOF support on boundary y=0;
- displacement solution;
- reaction recovery;
- equilibrium/balance control;
- mesh convergence for h = 2, 1, 0.5, 0.25 m;
- JSON/TXT export.

Ограничения:
- текущая модель предназначена для плоских shell benchmark задач;
- drilling DOF stabilization и locking-control требуют дальнейшей верификации;
- нет nonlinear material/geometric behavior;
- нет soil contact/nonlinear foundation;
- нет нормативных проверок армирования, трещин, продавливания и устойчивости;
- не является сертифицированным расчётом или рабочей документацией.

Следующий v92:
сопрячь глобальный Q4 shell с существующим 3D frame через общую глобальную
K/F/U, включая узловую совместимость и нагрузочный путь shell → frame → foundation,
после чего добавить независимые benchmark-задачи балки/плиты с известными решениями.
