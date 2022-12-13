export interface FilterObject {
  [prop: string]: any;
}

const filterObj = (obj: FilterObject, ...allowedFields: string[]) => {
  const newObj: FilterObject = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};
export default filterObj;
