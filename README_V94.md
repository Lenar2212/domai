# DomAI v94 — STRICT MPC + FOUNDATION CONTACT

v94:
- strict identity MPC через condensation/reduction DOF;
- без penalty stiffness;
- общая Shell + 3D Frame K/F/U;
- отдельный foundation/contact слой;
- вертикальные soil springs;
- передача реакции в фундаментный контакт;
- автоматический load path:
  Surface → Shell → Strict MPC → Frame → Foundation → Soil;
- TXT/JSON export.

Важно:
Для несовпадающих сеток текущая связь использует identity constraint к ближайшему
master node. Это строгая редукция для такой связи, но не полноценный mortar/MPC
интерполяционный оператор.

Контакт грунта пока линейный и вертикальный:
нет uplift, sliding, friction, nonlinear compression-only iteration или 3D soil FE.

Также отсутствуют:
- полноценная nonlinear material/geometric analysis;
- second-order solver;
- reinforcement/crack/punching/stability normative engine;
- независимая верификация коммерческим FEM solver.

Результат не является сертифицированным расчётом или рабочей документацией.

Следующий v95:
сделать interpolation MPC (не ближайший узел), compression-only soil contact
с итерацией active-set, отдельный foundation strip/plate FE и расчёт контактного
давления по узлам.
