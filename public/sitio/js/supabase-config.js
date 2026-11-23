'use strict';

// Respaldo para las vistas abiertas como archivos: no se conecta a ningún proyecto.
// Express sirve esta misma ruta con la configuración pública tomada de .env.
window.SUPABASE_CONFIG = window.SUPABASE_CONFIG || { url: '', anonKey: '' };
