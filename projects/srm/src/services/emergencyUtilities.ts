import {Card} from "../app/consts";
// @ts-ignore
import emergencyConditions from '../configurations/emergencyConditions.json';
export const sortResultsAsEmergencyFirst = (results: Array<Card>) => {
  if (!results || !Array.isArray(results)) return [];
  return results.sort((a, b) => {
    const bIsEmergency = b.responses.some(response => isEmergency(response.id || "")) ? 1 : 0;
    if (!bIsEmergency) return 0;
    for (let i = 0; i < a.responses.length; i++) {
      if (isEmergency(a.responses[i].id || "")) return -1;
    }
    return 1;
  });
}

export const isEmergency = (str: string) => emergencyConditions.includes(str);
