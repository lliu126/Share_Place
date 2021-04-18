const express = require('express');
const HttpError = require('./models/http-error');
const mongoose = require('mongoose');
require('dotenv').config();

const placesRoutes = require('./routes/places-routes');
const usersRoutes = require('./routes/users-routes');

const app = express();

app.use(express.json());
// app.use(express.urlencoded({
//   extended: true
// }));

// To work around block by CORS policy 
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
        'Access-Control-Allow-Headers', 
        'Origin, X-Requested-With, Content-Type, Accept, Authorization'
        );
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');

    next();
});

app.use('/api/users', usersRoutes);
app.use('/api/places', placesRoutes);

// error handling for unsupported routes
app.use((req, res, next) => {
    const error = new HttpError('Could not find this route' + process.env.NODE_ENV, 404);
    throw error;
});

// runs this error handling middleware if any middleware before it yields an error
app.use((error, req, res, next) => {
    // check if a response has already been sent
    if (res.headerSent) {
        return next(error);
    }

    const status = error.status || 500;
    res.status(status);
    // res.status(error.code || 500);

    res.json({message: error.message || 'unknown error occurred'});

});

if(process.env.NODE_ENV === 'production') {
    app.use(express.static('frontend/build'));
    
    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname , 'frontend', 'build', 'index.html'));
    });
}

// const url = 'mongodb+srv://leon:leon@cluster0.woatc.mongodb.net/mern?retryWrites=true&w=majority';
const url = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.woatc.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const PORT = process.env.PORT || 5000;

mongoose
    .connect(url,
        {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true })
    .then(
        app.listen(PORT))
    .catch(err => {
        console.log('error: ', err)
    });





