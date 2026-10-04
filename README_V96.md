# DomAI v96 — FOUNDATION PLATE FE + DISTRIBUTED CONTACT

В v96 добавлена самостоятельная расчётная FE-модель фундаментной плиты:
- отдельная FE-сетка фундамента;
- plate bending/shear stiffness;
- собственные вертикальные узловые DOF;
- распределение нагрузки по фундаментным элементам;
- узловая tributary area;
- compression-only soil springs;
- active-set iteration;
- автоматическое выключение растянутых контактных узлов;
- nodal contact pressure;
- реакции;
- equilibrium;
- mesh/contact convergence study.

Load path:
Surface → Shell → interpolation MPC → Frame → Foundation Plate FE → Soil Contact.

Ограничения:
- soil пока представлен линейными вертикальными пружинами;
- нет полноценного 3D soil continuum;
- нет трения/сдвига/консолидации/пластичности;
- нет полноценного нормативного армирования, трещин, продавливания;
- не заменяет проектный/экспертный расчёт;
- не является сертифицированной рабочей документацией.
