const express = require('express');
const cors = require('cors');
const { json, urlencoded } = require('express');
const apiRouter = require('./routes/index');

const PORT = 8000;
const HOST = '0.0.0.0';

const app = express();

app.use(
  cors({
    credentials: false,
    origin: ['*'],
  }),
);

app.use('/api', apiRouter);

app.use(json());
app.use(urlencoded({ extended: true }));

app.listen(PORT, HOST);
console.log(`This app listening on port ${PORT}!`);
