# DomAI v95 — INTERPOLATION MPC + ACTIVE-SET SOIL CONTACT

Добавлено:
- interpolation MPC для несовпадающих сеток;
- два ближайших master-узла;
- веса интерполяции нормированы до 1;
- constraint transformation T;
- reduced global K = Tᵀ K T;
- reduced F = Tᵀ F;
- отдельный foundation strip/plate contact representation;
- active-set compression-only soil contact;
- контактное давление по фундаментным узлам;
- реакции;
- load path:
  Surface → Shell → interpolation MPC → Frame → Foundation → Soil contact;
- TXT/JSON export.

Контакт грунта:
- вертикальная линейная пружина;
- контакт выключается при попытке растяжения;
- итерации active-set.

Ограничения:
- нет трения и горизонтального контакта;
- нет полноценного 3D soil FE;
- нет nonlinear constitutive soil model;
- нет uplift/sliding coupled contact;
- нет полного нормативного расчёта армирования, трещин, продавливания и устойчивости;
- результат не является сертифицированным расчётом или рабочей документацией.

Следующий v96:
добавить 2D/3D фундаментную plate/beam FE formulation с реальными
узловыми степенями свободы и распределением контактного давления по
элементам, а также проверку сходимости contact active-set.
