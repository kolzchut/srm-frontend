import {Card, HomepageEntry} from "../app/consts";
// @ts-ignore
import emergencyConditions from '../configurations/emergencyConditionsByResponseId.json';
//@ts-ignore
import emergencyConditionsByTitle from '../configurations/emergencyConditionsByTitle.json';

export const sortResultsAsEmergencyFirst = (results: Array<Card>) => {
  if (!results || !Array.isArray(results)) return [];
  return results.sort((a, b) => {
    const bIsEmergency = b.responses.some(response => isEmergency(response.id || "")) ? 1 : -1;
    if (!bIsEmergency) return 0;
    for (let i = 0; i < a.responses.length; i++) {
      if (isEmergency(a.responses[i].id || "")) return -1;
    }
    return 1;
  });
}

export const isEmergency = (str: string) => emergencyConditions.includes(str);

export const checkIfIsEmergencyByTitle = (title: string) => emergencyConditionsByTitle.some((condition:string)=> title === condition);

export const sortGroupsAsEmergencyFirst = (groups: {
  title: string,
  query: string,
  group_link: string,
  items: HomepageEntry[]
}[]) =>{
  const sortedGroups = []
  for(let i = 0; i < groups.length; i++) {
    const group = groups[i];
    if (checkIfIsEmergencyByTitle(group.title)) {
      sortedGroups.unshift(group);
    } else {
      sortedGroups.push(group);
    }
  }
  return sortedGroups;
}
