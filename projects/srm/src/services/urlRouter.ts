export const urlRouter = () =>{
  const urlParts = window.location.href.split('/')
  let newUrl = undefined;

  const isOldURL = urlParts[7]?.length === 1;
  if(isOldURL){
    newUrl =  urlParts.slice(0,  7).join('/');
  }

  if(!newUrl) return;
  window.location.replace(newUrl);
};

