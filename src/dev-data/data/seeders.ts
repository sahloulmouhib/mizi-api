import fs from 'fs';

import { faker } from '@faker-js/faker';

// Requiring fs module

const users = [];

// for (let i = 0; i <= 11; i += 1) {
//   const user = {
//     _id: `507f1f77bcf86cd79943901${String.fromCharCode('a'.charCodeAt(0) + i)}`,
//     firstName: faker.name.firstName(),
//     lastName: faker.name.lastName(),
//     birthDate: faker.date.between('01/01/1990', '12/30/2007'),
//     phoneNumber: faker.phone.phoneNumber('+216 29 ### ###'),
//     budgetRange: [
//       faker.datatype.number({ min: 100, max: 10000 }),
//       faker.datatype.number({ min: 100001, max: 10000 }),
//     ],
//     keywords: [
//       faker.commerce.productAdjective(),
//       faker.commerce.department(),
//       faker.commerce.productName(),
//       faker.commerce.product(),
//     ],
//     email: faker.internet.email(),
//     password: '123456',
//     photo: faker.internet.avatar(),
//     role: 'user',
//     active: true,
//     ratingsQuantity: 0,
//     ratingsAverage: 4.5,
//   };
//   users.push(user);
// }
const auctions = [];
let j = 0;
for (let i = 0; i <= 25; i += 1) {
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  i >= 10 ? (j = i % 10) : (j = i);
  const auction = {
    _id: `407f1f77bcf86cd79943901${String.fromCharCode('a'.charCodeAt(0) + i)}`,
    title: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    user: `507f1f77bcf86cd79943901${String.fromCharCode(
      'a'.charCodeAt(0) + j
    )}`,
    startingDate: faker.date.between('03/14/2022', '03/17/2022'),
    closingDate: faker.date.between('03/30/2022', '03/25/2022'),
    startingPrice: faker.datatype.number({ min: 100, max: 1000 }),
    preferredPrice: faker.datatype.number({ min: 1001, max: 10000 }),
    numberOfBids: 0,
    category: faker.helpers.randomize([
      'automotives',
      'real estate',
      'antiques and primitives',
      'collectibles',
      'electronics',
      'phones & computers',
      'entertainment',
      'clothing and wellness',
      'jewelry and watches',
      'others',
    ]),
    images: [
      faker.image.unsplash.technology(),
      faker.image.unsplash.technology(),
      faker.image.unsplash.objects(),
    ],
  };
  auctions.push(auction);
}

const saveData = (object: any, model: string) => {
  const newData = JSON.stringify(object);
  fs.writeFile(`${__dirname}/${model}.json`, newData, (err) => {
    // Error checking
    if (err) throw err;
    console.log('New data added');
  });
};
//saveData(users, 'users');
saveData(auctions, 'auctions');
