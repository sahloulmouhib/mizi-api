export const AI_API_BASE_URL = 'http://127.0.0.1:5000/predict-auctions/';
export const NUMBER_OF_AUCTION_IMAGES = 4;
export const IMAGE_QUALITY = 90;
export const JWT_EXPIRED = 24 * 60 * 60 * 1000;
export const USER_PHOTO_SIZE = [500, 500];

export const Categories = [
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
];

export const CATEGORIES_ARRAAY = [
  { id: 1, name: 'electronics' },
  { id: 2, name: 'entertainment' },
  { id: 3, name: 'collectibles' },
  { id: 4, name: 'jewelry and watches' },
  { id: 5, name: 'automotives' },
  { id: 6, name: 'clothing and wellness' },
  { id: 7, name: 'real estate' },
  { id: 300, name: 'others' },
];
export const CATEGORIES_ID = [1, 2, 3, 4, 5, 6, 7, 300];
export const CategoriesArray = [
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
];
// const m = Categories[1];
// console.log(m);
export const BID_PERCENTAGE = 1.1;
export const AUCTION_DURATION = 1440 * 90 * 60 * 1000;
export const DUPLICATE_FIELD = 11000;
export const VALIDATION_CONSTANTS = {
  USER_RATING: { MAX: 5, DEFAULT_MIN: 0, MIN: 1, AVERAGE: 0, QUANTITY: 0 },
  AUCTION_TITLE: { MAX: 40, MIN: 3 },
  AUCTION_DESCRIPTION: { MAX: 350, MIN: 3 },
  DEFAULT_NB_BIDS: 0,
  REPORT: { REASON: { MAX: 500, MIN: 30 }, TITLE: { MAX: 40, MIN: 3 } },

  FIRST_NAME: { MAX: 20, MIN: 3 },
  LAST_NAME: { MAX: 20, MIN: 3 },
  PASSWORD: { MAX: 16, MIN: 6 },
};
export const PASSWORD_RESET_EXPIRED = 10 * 60 * 1000;
export const SALT_ROUNDS_HASH = 12;
export const LIMITER = { MAX: 100, WINDOWS_MS: 60 * 60 * 1000 };

export const INTERESTED_AUCTION_TYPES = [300, 200, 100];
export type INTERESTED_AUCTION_TYPE = 300 | 200 | 100;
