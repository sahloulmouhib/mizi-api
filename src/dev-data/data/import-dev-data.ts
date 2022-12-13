import dotenv from 'dotenv';
import mongoose from 'mongoose';
import fs from 'fs';
import Auction from '../../models/auctionModel';
import User from '../../models/userModel';

dotenv.config({ path: './config.env' });

// const DB = process.env.DATABASE!.replace(
//   '<PASSWORD>',
//   process.env.DATABASE_PASSWORD!
// );
mongoose
  .connect(
    'mongodb+srv://sahloulmouhib:sahloul1992@cluster0.qvcjt.mongodb.net/acutionAppDatabase?retryWrites=true&w=majority',
    {}
  )
  .then((con) => {
    //console.log(con.connections);
    console.log('DB connection successful');
  });

//Read Json File
// const auctions = JSON.parse(
//   fs.readFileSync(`${__dirname}/auctions.json`, 'utf-8')
// );
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));

//Import Data into DB
const importData = async () => {
  try {
    // await Auction.create(auctions, { validateBeforeSave: false });
    await User.create(users, { validateBeforeSave: false });
    console.log('Data successefully loaded ');
  } catch (err: any) {
    console.log(err.message);
  }
  process.exit();
};

// //Delete All Data from Db
// const deleteData = async () => {
//   try {
//     await Auction.deleteMany();
//     await User.deleteMany();
//     console.log('Data successefully deleted ');
//   } catch (err: any) {
//     console.log(err.message);
//   }
//   process.exit();
// };

// console.log(process.argv);

if (process.argv[2] === '--import') {
  importData();
  // } else if (process.argv[2] === '--delete') {
  //   deleteData();
  // }
}
