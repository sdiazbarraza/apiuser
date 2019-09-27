const mongoose = require('mongoose');
const request = require('request');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt = require('bcryptjs');

var UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    unique: true,
    validate: {
      validator: validator.isEmail,
      message: '{VALUE} is not a valid email'
    }
  },
  password: {
    type: String,
    require: true,
    minlength: 6
  },
  rut: {
    type: String,
    require: true,
    minlength: 9,
  },
  tokens: [{
    access: {
      type: String,
      required: true
    },
    token: {
      type: String,
      required: true
    }
  }],
  dataElectoral:[{
    nombre: {
      type: String,
      required: true
    },
    region: {
      type: String,
      required: true
    },
    provincia: {
      type: String,
      required: true
    },
    comuna: {
      type: String,
      required: true
    }  
  }]
});

UserSchema.methods.toJSON = function () {
  var user = this;
  var userObject = user.toObject();

  return _.pick(userObject, ['_id', 'email','rut']);
};

UserSchema.methods.generateAuthToken = function () {
  var user = this;
  var access = 'auth';
  var token = jwt.sign({_id: user._id.toHexString(), access}, process.env.JWT_SECRET).toString();

  user.tokens.push({access, token});
  return user.save().then(() => {
    return token;
  });
};
UserSchema.methods.getDataPerson = function () {
  var user = this;
  var rut =user.rut;
  var dataRequest = new Promise(function(resolve,reject){
      request("https://api.rutify.cl/rut/"+rut, function (error, response, body) {
      var statusCode= response && response.statusCode;
      if(error) return reject(error);
      try{
        resolve(JSON.parse(body));
      }catch(e){
        reject(error);
      }
    });
  });
  return dataRequest;
   // TODO:Validar Rut si es rut  buscar en api https://api.rutify.cl/search?q=17998689-2 el nombrede la persona 
};
UserSchema.methods.removeToken = function (token) {
  var user = this;

  return user.update({
    $pull: {
      tokens: {token}
    }
  });
};

UserSchema.statics.findByToken = function (token) {
  var User = this;
  var decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (e) {
    return Promise.reject();
  }

  return User.findOne({
    '_id': decoded._id,
    'tokens.token': token,
    'tokens.access': 'auth'
  });
};

UserSchema.statics.findByCredentials = function (email, password) {
  var User = this;

  return User.findOne({email}).then((user) => {
    if (!user) {
      return Promise.reject();
    }

    return new Promise((resolve, reject) => {
      // Use bcrypt.compare to compare password and user.password
      bcrypt.compare(password, user.password, (err, res) => {
        if (res) {
          resolve(user);
        } else {
          reject();
        }
      });
    });
  });
};

UserSchema.pre('save', function (next) {
  var user = this;
   

  if (user.isModified('password')) {
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(user.password, salt, (err, hash) => {
        user.password = hash;
        next();
      });
    });
  } else {
    user.getDataPerson().then(function(dataUser){
      var region=dataUser.servel.region;
      var provincia=dataUser.servel.provincia;
      var comuna=dataUser.servel.comuna;
      var nombre=dataUser.nombre;
      user.dataElectoral.push({region,provincia,comuna,nombre});
     });
     next();
  }
});

var User = mongoose.model('User', UserSchema);

module.exports = {User}
