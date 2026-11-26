'use strict';

// Solo presentación: las métricas y las reglas conservan sus valores originales.
(function (root) {
  const names = {
    bronze: 'Bronce', silver: 'Plata', gold: 'Oro', platinum: 'Platino',
    diamond: 'Diamante', champion: 'Campeón', grand_champion: 'Gran campeón',
    supersonic_legend: 'Leyenda supersónica',
    boost: 'Disponibilidad de boost',
    shooting: 'Colocación y finalización',
    defensive_review: 'Cobertura defensiva',
    'boost-pad-routes': 'Rutas de pads y recuperaciones',
    'boost-touch-recover': 'Golpeo, seguimiento y recarga',
    'review-last-defender': 'Revisión de cobertura defensiva'
  };

  function number(value) {
    return value == null ? 'No disponible' : typeof value === 'number' && Number.isFinite(value)
      ? value.toLocaleString('es-MX', { maximumFractionDigits: 2 }) : String(value);
  }

  function text(value) {
    return String(value ?? '').replace(/(^|[\s(=≤≥:])(\d+\.\d{3,})(?=$|[\s%),;])/g,
      (_, prefix, decimal) => prefix + number(Number(decimal)));
  }

  function summary(priority) {
    const evidence = priority.evidence || {};
    if (priority.priority_key === 'boost' && Number.isFinite(evidence.matched_replays) && Number.isFinite(evidence.threshold)) {
      return `En ${evidence.matched_replays} de 5 partidas estuviste sin boost al menos ${number(evidence.threshold)} % del tiempo medido. Practica rutas de recarga y conserva el movimiento.`;
    }
    if (priority.priority_key === 'defensive_review' && Number.isFinite(evidence.matched_replays) && Number.isFinite(evidence.threshold)) {
      return `En ${evidence.matched_replays} de 5 partidas se alcanzó el criterio de ${number(evidence.threshold)} goles como último defensor por cada 5 minutos. Revisa esas jugadas para entender qué pasó.`;
    }
    if (Number.isFinite(evidence.goals?.value) && Number.isFinite(evidence.shots?.value)) {
      return `Anotaste ${number(evidence.goals.value)} goles en ${number(evidence.shots.value)} tiros. Practica la colocación y la finalización.`;
    }
    return text(priority.explanation || 'Consulta el detalle de esta recomendación.');
  }

  root.CoachPlayerUI = Object.freeze({ number, text, summary, name: value => names[value] || String(value) });
}(window));
