interface IGroupArrayByFeature{
  array: Array<any>;
  field: string;
}
export const groupArrayByFeature = ({array, field}: IGroupArrayByFeature) => {
  const groups = {};
  if(!array || !Array.isArray(array) || array.length === 0)  return({});
  array.forEach((item) => {
    const key = item[field];
    // @ts-ignore
    if (!groups[key]) {
      // @ts-ignore
      groups[key] = [];
    }
    // @ts-ignore
    groups[key].push(item);
  });
  return groups;
}

export const mapToArray = (obj: any) => {
  const arr: Array<any> = [];
  Object.keys(obj).forEach((key: string) => {
    arr.push( {key, vals: obj[key]});
  });
  return arr;
}


