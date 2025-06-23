import {Card, HomepageEntry} from "../app/consts";
// @ts-ignore
import emergencyConditions from '../configurations/emergencyConditionsByResponseId.json';
//@ts-ignore
import emergencyConditionsByTitle from '../configurations/emergencyConditionsByTitle.json';


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
