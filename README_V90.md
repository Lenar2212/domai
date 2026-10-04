# DomAI v90 — Mindlin–Reissner Q4 Shell FEM

Добавлен 4-узловой плоский shell Q4:
- 6 DOF на узел: u, v, w, rx, ry, rz;
- локальная матрица 24×24;
- мембранная составляющая;
- изгибная составляющая;
- поперечный сдвиг Mindlin-Reissner;
- 2×2 Gauss integration;
- материал E, ν, толщина t;
- shear correction;
- симметрия и базовые benchmark tests.

Важное ограничение:
это уже FEM shell formulation, но ещё не промышленный/сертификационный solver.
Для следующего уровня необходимы:
- 3D local-to-global transformation;
- корректное сопряжение shell с 3D frame;
- drilling DOF stabilization;
- контроль shear/membrane locking (MITC/EAS/selective integration);
- сборка общей K/F/U;
- нагрузки и граничные условия на shell;
- mesh convergence;
- независимые benchmark cases с известными аналитическими решениями;
- nonlinear/contact/geotechnical modules;
- нормативные проверки и независимая инженерная экспертиза.

Следующий v91:
встроить Q4 shell 24×24 в глобальный 3D solver DomAI и выполнить
local→global transformation, сборку K/F/U, закрепления, поверхностные нагрузки
и mesh-convergence test.
