// Formato interno: fecha/hora ISO con zona explícita y hasta milisegundos.
// Se comprueba el calendario para no aceptar, por ejemplo, un 30 de febrero.
function parseTimestamp(value) {
  if (typeof value !== 'string') return null;
  const parts = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/.exec(value);
  if (!parts) return null;
  const [year, month, day, hour, minute, second] = parts.slice(1, 7).map(Number);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (month < 1 || month > 12 || day < 1 || day > days[month - 1] ||
      hour > 23 || minute > 59 || second > 59) return null;
  if (parts[7] !== 'Z') {
    const [zoneHour, zoneMinute] = parts[7].slice(1).split(':').map(Number);
    if (zoneHour > 23 || zoneMinute > 59) return null;
  }
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

module.exports = { parseTimestamp };
