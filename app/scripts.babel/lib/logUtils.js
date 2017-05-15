export function valueIsLogable(value) {
  return (value !== undefined && value !== null && !(Array.isArray(value) && typeof(value[0]) === 'object'));
}

export function prepareValueForLog(value) {
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  if (typeof value === 'string') {
    return '"' + value + '"';
  }
  return value;
}
