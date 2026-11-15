# Flujo preparado de las trece pantallas

Base funcional preparada el 13 de octubre; responsabilidad de frontend aclarada el 14 de noviembre. Luis diseña y construye las pantallas definitivas del jugador según los bosquejos, incluidas Carga/Análisis/Plan, y mantiene la coherencia visual del sitio. El cascarón PROGSA fue provisional. A03/A04 cerradas registran el avance inicial; las tareas de construcción continúan. [Guía y reparto por pantalla](frontend-luis.md). El seguimiento vive en Análisis, Objetivos y Sesiones, sin añadir una pantalla de Reportes.

| Pantalla | Acceso | Acción y destino | RF | Tareas | Estados | Datos |
| --- | --- | --- | --- | --- | --- | --- |
| Inicio | Público | Explicar producto y entrar a Registro o Carga si hay sesión | RF01;RF03 | A04 | Sin sesión / sesión iniciada | Presentación estática |
| Acerca | Público | Explicar reglas, límites y ciclo adaptativo | RF08 | A04 | Texto legible y enlaces válidos | Presentación estática |
| Ayuda | Público | Explicar .replay de PC, cinco archivos y errores comunes | RF03;RF05 | A04 | Ayuda para pendiente/fallo; no promete coaching en vivo | Presentación estática |
| Registro/login | Público | Correo o Google → Perfil | RF01 | A08;A12 | Enviando / error / éxito / cierre de sesión | Supabase Auth |
| Perfil | Jugador | Guardar identidad, modalidad y disponibilidad → Carga | RF02;RF09 | A12;A15 | Vacío / inválido / guardando / guardado | profile |
| Carga/historial | Jugador | Elegir cinco archivos → seguimiento del bloque → Análisis | RF03;RF04;RF05 | A11;A13;A14;A30 | Sin historial / pendiente / procesando / fallido / inválido / listo | block |
| Análisis | Jugador | Ver métricas, comparación y hasta tres prioridades → Plan | RF06;RF07;RF08;RF11 | A09;A10;A17;A19;A28 | Primer bloque / comparable / incompatible / null / error | analysis y report |
| Objetivos | Jugador | Crear, editar, consultar y borrar/archivar metas | RF10;RF11 | A16;A20;A28 | Sin metas / error / meta vinculada archivada | goal y report |
| Plan | Jugador | Generar/consultar versiones y cobertura → Sesiones | RF09;RF10 | A18;A23;A24;A27 | Sin plan / completo / parcial / vacío / actualización disponible | plan-version |
| Sesiones | Jugador | Registrar/corregir/borrar entrenamiento y ver historial | RF10;RF11 | A21;A22;A27;A28;A31 | Sin sesiones / versión elegida / guardando / error | session y report |
| Panel admin | Administrador | Acceder a Usuarios y Ejercicios | RF12 | A32 | Rol permitido / acceso denegado | me y resúmenes administrativos |
| Usuarios admin | Administrador | Consultar y cambiar activo/suspendido | RF12 | A29;A32 | Cargando / vacío / error / cambio confirmado | admin-user |
| Ejercicios admin | Administrador | Crear, consultar, editar y desactivar catálogo | RF12 | A23;A32 | Vacío / formulario inválido / guardado / desactivado | exercise |

## Recorrido que deben poder explicar
Público: Inicio → Registro/login → Perfil. Jugador: Perfil → Carga/historial → Análisis → Objetivos/Plan → Sesiones → nuevo bloque → Análisis. Administrador: login → Panel admin → Usuarios admin o Ejercicios admin. Inicio, Acerca y Ayuda permanecen accesibles desde la navegación común.

Los botones protegidos usan la sesión. El servidor verifica identidad, rol y propiedad aunque alguien salte la interfaz. Un bloque listo permite abrir Análisis. Un bloque pendiente explica que debe esperar; uno fallido muestra motivo y reintento; uno inválido explica qué archivo/contexto necesita corregir.

## Ejemplo de mensajes para implementar
- Cuatro archivos: «Selecciona exactamente cinco replays .replay de PC».
- Primer bloque: «Esta es tu línea base; todavía no tienes otro bloque compatible para comparar».
- Dato ausente: «No disponible en estos replays»; conservar el motivo del servidor.
- Incompatible: «Los bloques tienen distinta modalidad» o el motivo específico recibido.
- Plan parcial: «Hay ejercicios para dos de las tres prioridades» con la prioridad sin cobertura.
- Plan vacío: «No hay ejercicios activos compatibles» o el motivo específico.

## Qué valida Luis en A03
Comprobar enlaces, controles, mensajes y correspondencia con los bosquejos actuales. Registrar ajustes aquí y compartirlos con Roberto. Esta tabla es una propuesta funcional; su publicación no acredita pantallas implementadas.

## Construcción y revisión visual

Luis construye Carga (A11), acceso/Perfil (A12), Análisis con Roberto (A19), Objetivos (A20), Plan (A27) y Sesiones/historial/seguimiento (A28). David implementa las tres vistas administrativas (A32) con componentes y revisión visual de Luis. A35 comprueba escritorio/móvil y coherencia del conjunto. El detalle funcional de la tabla no acredita implementación.
