// @ts-ignore
import inactiveCardIdToServiceName from '../configurations/inactiveCardIdToServiceName.json';

const getEndOfCardId = (urlPart: string) =>{
  const hashIndex = urlPart.indexOf('#');
  const questionIndex = urlPart.indexOf('?');

  let indexOfEndCardIdValue: number;

  if (hashIndex === -1) {
    indexOfEndCardIdValue = questionIndex;
  } else if (questionIndex === -1) {
    indexOfEndCardIdValue = hashIndex;
  } else {
    indexOfEndCardIdValue = Math.min(hashIndex, questionIndex);
  }
  return indexOfEndCardIdValue;
}


const checkInactiveCardId = () => {
  const urlParts = window.location.href.split('/');
  console.log("Ariel - urlParts", urlParts);
  const cardIdIndex = urlParts.findIndex(part => part === 'c') + 1;
  console.log("Ariel - cardIdIndex", cardIdIndex);
  if (cardIdIndex === 0) return;
  const rawCardIdValue: string = urlParts[cardIdIndex];
  const indexOfEndCardIdValue = getEndOfCardId(rawCardIdValue)
  console.log("Ariel - indexOfEndCardIdValue", indexOfEndCardIdValue);
  if (indexOfEndCardIdValue === -1) return;
  const cardIdValue = rawCardIdValue.slice(0, indexOfEndCardIdValue);
  if (!inactiveCardIdToServiceName[cardIdValue]) return;
  const serviceName = inactiveCardIdToServiceName[cardIdValue];
  console.log("Ariel - serviceName", serviceName);
  const newUrl = urlParts.slice(0, cardIdIndex - 2).join('/') + '/' + serviceName;
  console.log("Ariel - newUrl", newUrl);
  window.location.replace(newUrl);
}

const checkOldUrl = () => {
  const urlParts = window.location.href.split('/')
  let newUrl = undefined;

  const isOldURL = urlParts[7]?.length === 1;
  if (isOldURL) {
    newUrl = urlParts.slice(0, 7).join('/');
  }
  if (!newUrl) return;
  window.location.replace(newUrl);
}

export const urlRouter = () => {
  checkOldUrl();
  checkInactiveCardId();
};

