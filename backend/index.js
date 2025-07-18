import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

dotenv.config();
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.get('/', (req, res) => {
  res.send('Hello World!');
})

app.listen(process.env.PORT || 3001, () => {
  console.log('Server is running on http://localhost:3001');
})

