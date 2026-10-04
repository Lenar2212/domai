# DomAI v93 — MPC + 3D FRAME + FOUNDATION LOAD PATH

Добавлено:
- несовпадающие Shell/Frame сетки;
- автоматический поиск ближайших узлов;
- penalty-MPC для 6 DOF;
- полноценное локальное 3D frame направление;
- local→global transformation для frame;
- общая глобальная K/F/U;
- surface load;
- автоматический load path:
  Surface → Shell → MPC → 3D Frame → Base supports;
- equilibrium check;
- TXT/JSON export.

Важно:
Penalty-MPC является численным приближением связи и не заменяет строгую
MPC constraint formulation для промышленного solver.

Ограничения:
- нет нелинейного контакта грунта;
- нет material/geometric nonlinearities;
- нет полного second-order solver;
- нет нормативного армирования, трещин, продавливания и устойчивости;
- нет независимой верификации коммерческим FEM solver;
- результат не является сертифицированным расчётом или рабочей документацией.

Следующий v94:
реализовать строгий constraint/MPC condensation вместо penalty coupling,
добавить фундаментные элементы как отдельные FE и передавать реакции до
контактных spring/soil elements.
