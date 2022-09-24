"use strict";
require("dotenv").config();
const { createClient } = require("redis");
const mysql = require("mysql2");

// environment variables
const username = process.env.REDIS_USERNAME || "";
const password = process.env.REDIS_PASSWORD || "mypassword";
const redisHost = process.env.REDIS_HOST || "redis-pubsub";
const redisPort = process.env.REDIS_PORT || 6379;
const channel = process.env.CHANNEL || "channel1";

const subscriber = createClient({
  url: `redis://${username}:${password}@${redisHost}:${redisPort}`,
});

// get the client

// create the connection to database
const sqlConnection = mysql.createConnection({
  host: "172.30.0.3",
  user: "root",
  password: "password",
  database: "mydb",
});

// for debug purpose
// console.log({ port, username, password, redisHost, redisPort, channel });

(async function () {
  try {
    await subscriber.connect();
    subscriber.on("error", (err) => console.log("Redis error", err));
    subscriber.on("connect", () => console.log("\n Connected to Redis \n"));
    subscriber.on("ready", () => console.log("\n Redis ready for action! \n"));
    subscriber.on("reconnecting", () => {
      console.log("\nReconnecting to Redis...\n");
    });

    // the call back fn is required
    await subscriber.subscribe(channel, (message) => {
      console.log(message);
      sqlConnection.connect(function (err) {
        if (err) throw err;
        console.log("Connected!");
        const sql =
          "INSERT INTO customers (name, address) VALUES ('next data', 'next number')";
        sqlConnection.query(sql, function (err, result) {
          if (err) throw err;
          console.log("1 record inserted");
        });
      });
    });
  } catch (error) {
    // exited the reconnection logic
    console.error({ error });
  }
})();
