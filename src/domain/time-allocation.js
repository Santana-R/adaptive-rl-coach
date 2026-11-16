// Cuotas proporcionales con un mínimo por ejercicio; los pesos vienen de la política publicada.
function allocateMinutes(minutes, entries, minimum = 5) {
  if (!entries.length) return {};
  let budget = minutes;
  let pending = [...entries];
  const quotas = {};
  while (pending.length) {
    const weight = pending.reduce((sum, entry) => sum + entry.weight, 0);
    const belowMinimum = pending.filter(entry => budget * entry.weight / weight < minimum);
    if (!belowMinimum.length) {
      for (const entry of pending) quotas[entry.key] = budget * entry.weight / weight;
      break;
    }
    for (const entry of belowMinimum) {
      quotas[entry.key] = minimum;
      budget -= minimum;
    }
    pending = pending.filter(entry => !belowMinimum.includes(entry));
  }
  const result = Object.fromEntries(entries.map(entry => [entry.key, Math.floor(quotas[entry.key])]));
  const remaining = minutes - Object.values(result).reduce((sum, value) => sum + value, 0);
  // entries conserva el orden de desempate; sort estable mantiene ese orden ante restos iguales.
  const byRemainder = [...entries].sort((a, b) =>
    (quotas[b.key] - result[b.key]) - (quotas[a.key] - result[a.key]));
  for (const entry of byRemainder.slice(0, remaining)) result[entry.key] += 1;
  return result;
}

module.exports = { allocateMinutes };
