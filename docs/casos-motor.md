# Casos iniciales del motor · A02

Cinco fixtures sintéticos preparados para revisar y programar; no son datos reales ni evidencia de motor implementado. Roberto calcula a mano y contrasta heurísticas con el prototipo; David revisa.

| Caso | Resultado esperado |
| --- | --- |
| primer-bloque | {"comparison_status": "baseline", "reason_codes": ["NO_PREVIOUS_COMPATIBLE_BLOCK"], "delta": null} |
| comparable | {"comparison_status": "comparable", "baseline_shooting_pct": 25, "current_shooting_pct": 30, "delta_pp": 5} |
| incompatible | {"comparison_status": "not_comparable", "reason_codes": ["MODE_MISMATCH"], "delta": null} |
| faltantes | {"shooting_pct": null, "shooting_missing_reason": "zero_denominator", "boost_rule_active": false} |
| empate | {"priority_rule_ids": ["rule-a", "rule-b", "rule-c"], "max_priorities": 3} |

El ejemplo comparable resume cinco partidas por bloque: 8 tiros/2 goles antes y 10/3 después; 25% → 30%, +5 pp. Estos totales no son una referencia de nivel del jugador.

## Completar con el prototipo real
| Regla | Métrica | Umbral real | Unidad | Limitación | Versión |
| --- | --- | --- | --- | --- | --- |
| Pendiente de contrastar en A02 | No inventar | Pendiente | Pendiente | Heurística por calibrar en A26 | Pendiente |

El desempate inicial propuesto es score descendente, rule_id ascendente; A02/A17 lo verifican y fijan. La prioridad precisa requiere regla y evidencia, no solo un score de fixture.
