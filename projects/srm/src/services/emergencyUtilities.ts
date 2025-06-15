import {Card} from "../app/consts";

export const sortResultsAsEmergencyFirst = (results: Array<Card>) => {
  if (!results || !Array.isArray(results)) return [];
  return results.sort((a, b) => {
    const aIsEmergency = a.responses.some(response => isEmergency(response.id || "")) ? 1 : 0;
    const bIsEmergency = b.responses.some(response => isEmergency(response.id || "")) ? 1 : 0;
    return bIsEmergency - aIsEmergency;
  });
}
export const isEmergency = (str: string) => str.includes("emergency") // They will need to give us condition.
