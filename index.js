const express = require("express");
const redis = require("redis");
const fetch = require("node-fetch");
const app = express();

const REDIS_PORT = process.env.PORT || 6379;
const APP_PORT = process.env.PORT || 5000;

const client = redis.createClient(REDIS_PORT);

app.use(express.urlencoded({ extended: false }));

// make set Response function
function setResponse(username, repos) {
  return `<h2>${username} has ${repos} Github repos</h2>`;
}

// middleware cache redis
function cacheRedis(req, res, next) {
  const { name } = req.params;
  client.get(name, (err, data) => {
    if (err) throw err;
    if (data !== null) {
      res.send(setResponse(name, data));
    } else {
      next();
    }
  });
}

const getFunction = async (req, res) => {
  try {
    console.log("Fetching data");

    const { name } = req.params;
    const response = await fetch(`https://api.github.com/users/${name}`);
    const data = await response.json();

    const repos = data.public_repos;

    // set random key and value in redis
    client.set("randomkey", "okValue");

    //set data to redis
    client.setex(name, 3600, repos);

    res.send(setResponse(name, repos));
  } catch (e) {
    console.error(e);
    res.status(500);
  }
};

app.get("/repos/:name", cacheRedis, getFunction);

app.listen(APP_PORT, () => {
  console.log("App listening on port 5000!");
});
