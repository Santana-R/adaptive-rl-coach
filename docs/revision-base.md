# Revisión técnica de la base · A01

## Recorrido y responsabilidades

1. Supabase Auth identifica al usuario; el perfil conserva plataforma/ID de juego, modalidad y disponibilidad.
2. Carga recibe cinco replays. A13 procesa y A14 valida identidad, modalidad, tipo y duplicados; A15 conserva dueño, estados y métricas.
3. El adaptador de bloques guardados alimenta A09; calcula goles, tiros y eficiencia con totales. Faltantes siguen null con motivo.
4. Análisis combina A09/A10/A17: línea base o comparación compatible, hasta tres prioridades y evidencia versionada.
5. A18 genera recursos y minutos según contexto/catálogo. A24 guarda versiones inmutables; otra versión no sobrescribe la anterior.
6. Objetivos/sesiones y reportes continúan en sus módulos. Su práctica autorreportada no demuestra mejora competitiva.
7. Luis aporta las interfaces oficiales; Roberto motor/API/conexión; Tadeo servidor/procesamiento y David consultas/persistencia/catálogo.

## Cobertura revisada

La [matriz](../planning/trazabilidad-rf.csv) contiene doce RF y el [flujo](flujo-pantallas.md) trece pantallas. La correspondencia documental está presente; no prueba que cada pantalla/CRUD esté integrado o verificado.

| RF | Área y evidencia/localización |
| --- | --- |
| RF01–RF02 | Auth y Perfil: A08/A12/A15; middleware y repositorio de perfil |
| RF03–RF05 | Carga/validación/estados: A13/A14/A30 |
| RF06–RF08 | Métricas/comparación/reglas: A09/A10/A17/A19; resultados de A33 |
| RF09 | Propuestas, catálogo y versiones: A18/A23/A24; interfaz A27 |
| RF10 | Objetivos/sesiones/historial: A16/A20/A21/A31/A39 |
| RF11 | Seguimiento y reportes: A22/A28/A31 |
| RF12 | Administración: A23/A29/A32/A39 |

**Ajuste concreto:** RF06 en la matriz apuntaba a `GET /blocks/:blockId/metrics`, ruta propuesta que no figura implementada en la aplicación revisada. Se corrige a `GET /api/v1/blocks/:blockId/analysis`, cuya respuesta incluye las métricas. No se crea un endpoint adicional ni se marcan todos los RF como implementados.

## Integración y pendientes localizados

Main revisado: `64d49bf8face6ad01d2073ed96971668d506bdcd`. Regresión: 503 pruebas y 43 casos A26 correctos, según [informe](resultados-regresion.md). A13/A15 y motor/API están integrados; el comprobador privado A19 está preparado.

- Los originales de porcentaje de boost, positioning y reloj con procedencia no están conservados por A15; sus reglas pueden quedar no evaluables en bloques guardados.
- La ejecución local de A19 con dos sesiones reales no se completó. Lo simulado no sustituye esa evidencia.
- Revisión visual final: A35/Luis. Ciclo completo: A25. Sesiones, reportes y CRUD mantienen sus propias tareas.
- La matriz es una referencia de cobertura; su columna histórica de evidencia no se interpreta como estado automático de GitHub.

## Cierre administrativo del corte

Roberto pidió continuar con el cierre de sus issues y omitir las comprobaciones que no se alcanzaron a ejecutar. Se entrega esta revisión técnica y se registra el cierre administrativo de A01. **No se acredita una explicación oral de Roberto, una revisión conjunta ni una aprobación de Tadeo:** esa comprobación no se realizó y se deja diferida. El texto fue preparado con asistencia de IA; no se atribuye a Tadeo.
