export function replaceUrlsWithLinks(text: string) {
  // Regular expression to match URLs
  var urlRegex = /(https?:\/\/[^\s]+)/g;

  // Replace URLs with anchor tags
  var replacedText = text.replace(urlRegex, (url) => '<a target="_blank" href="' + url + '">' + url + '</a>');
  return replacedText;
}