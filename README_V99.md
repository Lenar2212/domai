# DomAI v99 — ELEMENT GAUSS CONTACT + NEWTON/ACTIVE-SET

v99 переводит контакт грунта с узловой модели на элементный уровень.

Добавлено:
- 2×2 Gauss integration на каждом фундаментном plate element;
- contact pressure в Gauss points;
- contact reaction в Gauss points;
- contact residual;
- contact tangent;
- active-set/Newton iterations;
- strict block MPC Frame↔Foundation;
- equilibrium residual;
- MPC residual;
- patch/contact benchmarks;
- mesh/contact convergence.

Load path:
Surface → Shell → interpolation MPC → 3D Frame →
strict block MPC → Foundation Plate FE →
2×2 Gauss soil contact → Newton/active-set → reactions.

Ограничения:
- грунт всё ещё линейная вертикальная модель;
- нет полноценного 3D soil continuum;
- нет friction/sliding/consolidation/plasticity;
- нет полного нормативного расчёта армирования, трещин, продавливания и устойчивости;
- не является сертифицированным расчётом или рабочей документацией.

Следующий v100:
сделать контактный оператор в полноценном variational form:
R_contact = ∫ Nᵀ p dA, K_contact = ∫ Nᵀ k_t N dA,
явно собирать contact residual/tangent в глобальные K/F и выполнить
patch tests на равномерном давлении и реакциях.
