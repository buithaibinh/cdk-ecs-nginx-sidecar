const express = require('express');
const cors = require('cors');
const { json, urlencoded } = require('express');
const apiRouter = require('./routes/index');

const PORT = 8000;

const app = express();

app.use(
  cors({
    credentials: false,
    origin: ['*'],
  }),
);

app.use('/', apiRouter);

app.use(json());
app.use(urlencoded({ extended: true }));

app.listen(8080, () => console.log(`This app listening on port ${PORT}!`));
