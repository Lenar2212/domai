# DomAI v92 — UNIFIED SHELL + 3D FRAME FEM

Единая глобальная модель:
- Q4 Mindlin-Reissner shell;
- 6 DOF/node;
- пространственный frame;
- общая нумерация узлов;
- глобальная K/F/U;
- shell surface load;
- shared-node compatibility;
- support reactions;
- equilibrium check;
- load path: Shell → shared nodes → Frame → Foundation/supports;
- JSON/TXT export.

Это важный шаг к связанной BIM/FEM модели, но текущая реализация всё ещё
предназначена для инженерных исследований и benchmark-задач.

Необходимо дальше:
- корректная ориентация frame для произвольной геометрии;
- полноценная 3D frame transformation;
- drilling stabilization;
- locking control;
- shell/frame MPC для несовпадающих сеток;
- foundation/soil nonlinear contact;
- geometric/material nonlinearities;
- second-order effects;
- independent analytical and commercial-solver benchmarks;
- normative checks and independent professional review.

Результат не является сертифицированным расчётом или рабочей документацией.

Следующий v93:
добавить MPC/constraint coupling для несовпадающих shell/frame сеток,
реальный 3D frame local-to-global transformation и автоматическое построение
load path до фундаментных элементов.
