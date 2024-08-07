const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');

const processDataModule = require('./processData.js');

const app = express();
const port = 443;

app.use(bodyParser.json());

const pool = mysql.createPool({
  host: 'db',
  user: "root",
  database: "practice",
  password: "12345"
});

let connection;

async function startServer() {
  try {
    connection = await pool.getConnection();
    console.log("Подключение к серверу MySQL успешно установлено");
    app.use((req, res, next) => {
      res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
      res.setHeader('Access-Control-Allow-Methods', 'POST, GET');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      next();
    });

    app.get('/', (req, res) => {
      processDataModule.getData(req, res, connection);
    });

    app.post('/', (req, res, next) => {
      processDataModule.processData(req, res, pool, connection);
    });

    app.listen(port, () =>
      console.log(`Server running on port ${port}, http://localhost:${port}`)
    );
  } catch (err) {
    console.error("Ошибка: " + err.message);
  }
}

startServer(); 
