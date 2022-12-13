import dotenv from 'dotenv';
import mongoose from 'mongoose';

import app from './app';

//Catching uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  console.log('Uncqught exception Shutting down...!');
  process.exit(1);
});

dotenv.config({ path: './config.env' });
const DB = process.env.DATABASE!.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD!
);
mongoose.connect(DB, {}).then((con) => {
  //console.log(con.connections);
  console.log('DB connection successful');
});

const port = process.env.port || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}....`);
});

//Handle promises' rejections
process.on('unhandledRejection', (err: Error) => {
  console.log(err.name, err.message);
  console.log('Unhandled Rejecton Shutting down...!');
  server.close(() => {
    //code 1 for uncaught exception and 0 for success
    process.exit(1);
  });
});
