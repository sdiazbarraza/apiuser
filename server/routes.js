
require('../config/config');

const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');
const {ObjectID} = require('mongodb');

var {mongoose} = require('./db/mongoose');

var {User} = require('./models/user');

//var {authenticate} = require('./middleware/authenticate');

var app = express();
const port = process.env.PORT;
const env = process.env.NODE_ENV;

app.use(bodyParser.json());
app.listen(port, () => {
  console.log(`Started up at port ${port}`);

  console.log(`Started up at env ${env}`);
});



// POST /users
app.post('/users', (req, res) => {
  var body = _.pick(req.body, ['email', 'password','rut']);
  var user = new User(body);
  user.save().then(() => {
    return user.generateAuthToken();
  }).then((token) => {
    res.header('x-auth', token).send(user);
  }).catch((e) => {
    res.status(400).send(e);
  })
});



module.exports = {app};
