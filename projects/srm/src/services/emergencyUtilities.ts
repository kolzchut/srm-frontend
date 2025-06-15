import {Card} from "../app/consts";

export const sortResultsAsEmergencyFirst = (results: Array<Card>) => {
  if (!results || !Array.isArray(results)) return [];
  return results.sort((a, b) => {
    const bIsEmergency = b.responses.some(response => isEmergency(response.id || "")) ? 1 : 0;
    if (!bIsEmergency) return 0;
    for (let i = 0; i < a.responses.length; i++) {
      if (isEmergency(a.responses[i].id || "")) return 0;
    }
    return 1;
  });
}

export const isEmergency = (str: string) => str.includes("emergency") // They will need to give us condition.
