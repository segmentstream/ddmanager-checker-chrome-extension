export default function parseDigitalData(digitalDataJSON) {
  const digitalData = JSON.parse(digitalDataJSON);
  delete digitalData.events;
  delete digitalData.changes;
  return digitalData;
}
