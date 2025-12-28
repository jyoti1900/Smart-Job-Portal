const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

exports.connect = (seed) => {
    const con = mongoose.connect(config.mongoURI + config.db, {
        useCreateIndex: true,
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false
    });

    con.then(() => {
        console.log('successfully connected to database');
        if (seed)
            require('./seeders').seed(['admin']);//disable this line if you don't want default admin seeding
        else
            return con;
    }).catch((e) => {
        console.error(e);

        console.log("Cannot connect to database. Please check your database connection.");
        process.exit(1);
    })

}
