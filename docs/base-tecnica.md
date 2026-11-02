# Base técnica de referencia

Referencia de contratos y conexiones. Para elegir qué hacer ahora abre [la guía breve](empieza-aqui.md). La demo sintética ya existe; API, autenticación y persistencia reales continúan pendientes.

## Qué vamos a construir
Una web donde un jugador entra, registra su identidad, carga cinco replays de PC, ve métricas y hasta tres prioridades explicadas, genera un plan, registra entrenamiento y compara un bloque posterior compatible. Jugador/admin son los roles. Conservamos las trece pantallas y los tres CRUD de objetivos, sesiones y ejercicios.

## Qué recibe cada uno ya preparado
| Documento | Qué resuelve | Qué debe hacer el equipo |
| --- | --- | --- |
| [Contrato API/datos](contratos-api.md) | Rutas, objetos, unidades, estados, errores y ejemplos | Implementar y verificar; ajustar con evidencia |
| [Trazabilidad de RF](../planning/trazabilidad-rf.csv) | Doce requisitos vinculados a pantallas, tareas, datos y pruebas | Consultar; añadir evidencia real al implementar |
| [Flujo de pantallas](flujo-pantallas.md) | Trece pantallas, navegación y estados | Luis valida contra bosquejos en A03 |
| [Diccionario de datos](diccionario-datos.md) | Entidades, propietarios, relaciones y snapshots | David consulta el esquema existente al preparar A23 y conecta consultas en A15/A24 |
| [Casos del motor](casos-motor.md) | Cinco entradas/resultados esperados sintéticos | Roberto comprueba casos y define heurísticas explícitas en A02 |
| [Nota de revisión](revision-base.md) | Plantilla pequeña con lo entendido, dudas y ajustes | Roberto completa A01; Tadeo revisa |

## Un recorrido con datos para entender las conexiones
1. Luis construye Perfil y Carga. La sesión identifica al usuario; perfil guarda plataforma/ID/modalidad.
2. Luis envía cinco archivos a POST blocks. Tadeo valida/carga privadamente y devuelve block_id y estado; David guarda propietario, replays y progreso.
3. Al estar listo, Tadeo entrega estadísticas del jugador elegido. Roberto normaliza: 2 goles/8 tiros = 25%; un dato ausente es null.
4. En otro bloque posterior compatible hay 3 goles/10 tiros = 30%. Roberto compara +5 pp, evalúa reglas verificadas y sirve el endpoint de Análisis. Él también conecta la pantalla A19 usando la base visual de Luis y las consultas de David.
5. Roberto genera el plan con catálogo de David, metas y minutos disponibles. David conserva la versión y snapshots; Luis conecta Plan. Una prioridad sin ejercicio compatible queda explicada.
6. Tadeo registra sesiones sobre la versión exacta; Luis conecta Sesiones. Rendimiento medido, entrenamiento y rango declarado se reportan por separado.

Los números anteriores son ejemplos sintéticos. El contrato ofrece objetos preparados en planning/examples; A05 entrega una respuesta real saneada para verificar el mapeo.

## Primer paso por integrante
La [guía breve](empieza-aqui.md) y las cuatro issues con etiqueta `siguiente` indican la entrega actual. La revisión de contratos/modelo acompaña la implementación de cada pieza.

## Estructura propuesta para el código
La planificación y ejemplos ya existen. `public/` contiene la demo. La primera subida de Luis usará `public/sitio/`; `src/` y los módulos reales se crean durante sus tareas. La estructura siguiente describe el destino de integración, no código ya implementado.

```text
public/                  HTML/CSS/JavaScript de las trece pantallas
  css/app.css            Base visual de Luis
  js/                    Controladores y gráficas; análisis A19 de Roberto
src/
  app.js                 Servidor Express común de Tadeo
  middleware/            Sesión, rol, estado y propiedad
  routes/                blocks, analysis, goals, plans, sessions, reports, admin
  services/              Adaptador Ballchasing e ingestión de Tadeo
  repositories/          Consultas y persistencia de David
  domain/                Métricas, comparación, reglas y planes de Roberto
tests/fixtures/analisis/  Casos sintéticos preparados; no son replays reales
planning/examples/       Objetos del contrato preparados
```

## Trabajar en paralelo y cuándo cerrar
El contrato/fixtures permiten construir una pantalla o función antes de que exista la API real. Los IDs de dependencia describen lo que debe estar conectado para cerrar la tarea. Cada ficha distingue primer paso, área, comprobación y entrega entre módulos. Si una prueba del proveedor cambia el diseño, registrar qué cambió y actualizar consumidores.

A01 es la revisión inicial de esta base: puede cerrarse con dudas técnicas asignadas a sus tareas. A05 confirma Ballchasing y A08 permisos. A07 solo registra y atiende observaciones del documento de Fase 2, que el equipo ya confirmó listo; no bloquea la implementación. Una tarea de integración necesita el recorrido real, revisión y código integrado. GitHub conserva el estado operativo.

## Aprendizaje con un camino definido
Roberto construye A19 de extremo a extremo: consulta → cálculo → endpoint → pantalla. Reutiliza módulos comunes. Cada integrante deja explicación breve y revisa una conexión con otra área por escrito. No hay trabajo acompañado obligatorio. Aprender incluye poder explicar por qué una métrica es null, por qué un bloque no es comparable y qué conserva una versión del plan.

## Calendario vigente
Fase 2 el 3; motor el 9; completo PROGSA el 16; LBPWEB el 23 tentativo. [Calendario](calendario-y-dependencias.md) · [30 tablas y estado](fase2-estado.md) · [Motor paso a paso](motor-paso-a-paso.md).
