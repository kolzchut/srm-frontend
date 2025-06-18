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
  if (indexOfEndCardIdValue === -1) return false;
  const cardIdValue = rawCardIdValue.slice(0, indexOfEndCardIdValue);
  if (!inactiveCardIdToServiceName[cardIdValue]) return false;
  const serviceName = inactiveCardIdToServiceName[cardIdValue];
  const newUrl = urlParts.slice(0, cardIdIndex - 2).join('/') + '/' + serviceName;
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
  const isNotFound = urlParts[urlParts.length - 1] === 'not-found';
  if (!isNotFound) return false;
  const newUrl = urlParts.slice(0, -1).join('/');
  window.location.replace(newUrl);
  return true;

}

export const urlRouter = () => {
  if(checkOldUrl()) return;
  if(checkInactiveCardId()) return;

  notFoundToHomePage();
};

