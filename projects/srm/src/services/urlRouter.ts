// @ts-ignore
import inactiveCardIdToServiceName from '../configurations/inactiveCardIdToServiceName.json';

const getEndOfCardId = (urlPart: string) => {
  console.log('Ariel -> getEndOfCardId', urlPart);
  const hashIndex = urlPart.indexOf('#');
  const questionIndex = urlPart.indexOf('?');
  console.log('Ariel -> hashIndex questionIndex', hashIndex, questionIndex);
  let indexOfEndCardIdValue: number;
  if (hashIndex === -1) indexOfEndCardIdValue = questionIndex;
  else if (questionIndex === -1) indexOfEndCardIdValue = hashIndex;
  else indexOfEndCardIdValue = Math.min(hashIndex, questionIndex);

  console.log('Ariel -> indexOfEndCardIdValue', indexOfEndCardIdValue);
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
const notFoundToHomePage = () => {
  const urlParts = window.location.href.split('/');
  const isNotFound = urlParts.some(part => part.includes('not-found'));
  if (!isNotFound) return false;
  console.log('Redirecting to home page from not-found URL');
  const newUrl = urlParts.slice(0, 3).join('/');
  window.location.replace(newUrl);
  return true;
}

export const urlRouter = () => {
  if(checkOldUrl()) return;
  if(checkInactiveCardId()) return;

  notFoundToHomePage();
};

