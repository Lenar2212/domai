import re
from datetime import datetime, timezone

LEGAL_VERSION = "2026-10-03"
ENGINE_VERSION = "DomAI Compliance Engine 1.0"

def _num(text, pattern, default=None):
    m = re.search(pattern, text, re.I)
    return float(m.group(1).replace(",", ".")) if m else default

def check_project(project):
    p = project or {}
    text = str(p.get("description","")) + " " + str(p.get("prompt",""))
    warnings = []
    blockers = []
    notes = []

    area = p.get("area")
    floors = p.get("floors")
    setback = p.get("setback")
    land_area = p.get("land_area")

    if area is None:
        area = _num(text, r"площад[ьяеи]\D{0,20}(\d+(?:[.,]\d+)?)")
    if floors is None:
        floors = _num(text, r"(\d+)\s*(?:этаж|этажа|этажей)")
    if setback is None:
        setback = _num(text, r"(?:отступ|расстояние)\D{0,20}(\d+(?:[.,]\d+)?)")
    if land_area is None:
        land_area = _num(text, r"(?:участок|земельный участок)\D{0,20}(\d+(?:[.,]\d+)?)")

    if area is not None and area <= 0:
        blockers.append("Площадь дома должна быть положительным числом.")
    if floors is not None and (floors < 1 or floors > 10):
        warnings.append("Количество этажей выглядит нетипично для заданного сценария; требуется ручная проверка.")
    if land_area is not None and area is not None and area > land_area * 0.8:
        warnings.append("Площадь дома велика относительно площади участка. Проверьте размещение, отступы и местные правила.")
    if setback is not None and setback < 3:
        warnings.append("Указан малый отступ. DomAI не определяет допустимость размещения без точных данных участка и применимых правил.")
    if not p.get("site_verified"):
        blockers.append("Границы и характеристики участка не подтверждены документами/кадастровыми данными.")
    if not p.get("surveys_verified"):
        blockers.append("Инженерные изыскания не предоставлены и не проверены.")
    if not p.get("professional_review"):
        blockers.append("Профессиональная проверка проекта не выполнена.")

    # Safety triggers: never present as construction-ready
    risky = [
        r"\bготов[аоы]?\s+(?:к\s+)?строительств",
        r"\bможно\s+строить\b",
        r"\bгарантированно\s+соответствует\b",
        r"\bбез\s+(?:архитектора|проектировщика|инженера)\b",
    ]
    if any(re.search(x, text, re.I) for x in risky):
        blockers.append("Формулировка требует замены: AI-эскиз нельзя выдавать за подтверждённый строительный проект.")

    notes.append("Результат является предварительным цифровым эскизом и не заменяет инженерные изыскания, расчёты, проектную документацию и необходимые согласования.")
    notes.append("Перед строительством параметры должны быть проверены специалистами по фактическому участку и применимым требованиям.")

    level = "GREEN"
    if warnings:
        level = "YELLOW"
    if blockers:
        level = "RED"

    return {
        "engine_version": ENGINE_VERSION,
        "legal_version": LEGAL_VERSION,
        "checked_at": datetime.now(timezone.utc).isoformat(),
        "level": level,
        "blockers": blockers,
        "warnings": warnings,
        "notes": notes,
        "data_used": {
            "area_m2": area,
            "floors": floors,
            "setback_m": setback,
            "land_area_m2": land_area,
            "site_verified": bool(p.get("site_verified")),
            "surveys_verified": bool(p.get("surveys_verified")),
            "professional_review": bool(p.get("professional_review")),
        },
        "sources": [
            "ГрК РФ ст. 47 — инженерные изыскания",
            "ГрК РФ ст. 49 — экспертиза проектной документации и результатов изысканий",
            "ГрК РФ ст. 55.8 — требования к выполнению соответствующих работ членами СРО в предусмотренных случаях",
            "152-ФЗ — обработка персональных данных",
            "Закон РФ №2300-1 — информирование потребителей",
        ],
    }
