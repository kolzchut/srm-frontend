// @ts-ignore
import inactiveCardIdToServiceName from '../configurations/inactiveCardIdToServiceName.json';

const getEndOfCardId = (urlPart: string) => {
  const hashIndex = urlPart.indexOf('#');
  const questionIndex = urlPart.indexOf('?');

  let indexOfEndCardIdValue: number;
  if (hashIndex === -1) indexOfEndCardIdValue = questionIndex;
  else if (questionIndex === -1) indexOfEndCardIdValue = hashIndex;
  else indexOfEndCardIdValue = Math.min(hashIndex, questionIndex);

  return indexOfEndCardIdValue;
}


const checkInactiveCardId = () => {
  const urlParts = window.location.href.split('/');
  const cardIdIndex = urlParts.findIndex(part => part === 'c') + 1;
  if (cardIdIndex === 0) return false;
  const rawCardIdValue: string = urlParts[cardIdIndex];
  const indexOfEndCardIdValue = getEndOfCardId(rawCardIdValue)

  const cardIdValue = indexOfEndCardIdValue === -1 ? rawCardIdValue : rawCardIdValue.slice(0, indexOfEndCardIdValue);
  if (!inactiveCardIdToServiceName[cardIdValue]) return false;
  const serviceName = inactiveCardIdToServiceName[cardIdValue];
  const newUrl = urlParts.slice(0, 3).join('/') + '/s/' + serviceName;
  window.location.replace(newUrl);
  return true;
}

const checkOldUrl = () => {
  const urlParts = window.location.href.split('/')
  let newUrl = undefined;

  const isOldURL = urlParts[7]?.length === 1;
  if (isOldURL) newUrl = urlParts.slice(0, 7).join('/');
  if (!newUrl) return false;
  window.location.replace(newUrl);
  return true;
}

const checkDoubleC = () => {
  const urlParts = window.location.href.split('/');
  const indicesOfC = urlParts
    .map((part, index) => (part === 'c' ? index : -1))
    .filter(index => index !== -1);

  if (indicesOfC.length < 2) return false;
  let foundServiceName: string | undefined = undefined;
  for (const cardId of indicesOfC) {
    const rawCardIdValue = urlParts[cardId + 1];

    const indexOfEndCardIdValue = getEndOfCardId(rawCardIdValue)
    const cardIdValue = indexOfEndCardIdValue === -1 ? rawCardIdValue : rawCardIdValue.slice(0, indexOfEndCardIdValue);
    const serviceName = inactiveCardIdToServiceName[cardIdValue];
    if (serviceName) {
      foundServiceName = serviceName
      break;
    }
  }
  let additionOfServiceName = '';
  if (foundServiceName) additionOfServiceName = '/s/' + foundServiceName
  const newUrl = urlParts.slice(0, 3).join('/') + additionOfServiceName;
  window.location.replace(newUrl);
  return true;
};

export const urlRouter = () => {
  if (checkDoubleC()) return;
  if (checkOldUrl()) return;
  if (checkInactiveCardId()) return;

};

