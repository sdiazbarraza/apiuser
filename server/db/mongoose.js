var mongoose = require('mongoose');
mongoose.Promise=global.Promise;
var db = {
	localhost:process.env.MONGODB_URI,
	mlab:'mongodb://sdb_dev:Carmen123@ds121535.mlab.com:21535/todo_api'
}
mongoose.connect(process.env.PORT ? db.localhost: db.mlab);
module.exports = {mongoose}