const fs = require('fs');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const path = require('path');
const HttpError = require('../models/http-error');
const getCoordsForAddress = require('../util/location');
const Place = require('../models/place');
const User = require('../models/user');
const mongooseUniqueValidator = require('mongoose-unique-validator');

// functions below contains CRUD for places

const getPlaceById = async ( req, res, next ) => {
    const placeId = req.params.pid;

    let place;
    try {
        // findById does not return a promise but you can with .exec() at end
        place = await Place.findById(placeId);
    } catch (err) {
        const error = new HttpError(
            'Something went wrong, could not find place', 
            500
        );
        return next(error)
    }

    if (!place) {
        const error = new HttpError(
            'Cannot find for provided id', 
            404);
        return next(error);
    }

    res.json({ place: place.toObject( {getters: true} )});
};

const getPlacesByUserId = async (req, res, next) => {
    const userId = req.params.uid;

    // let places;
    let userWithPlaces; // with userWithPlaces is an alternative working way
    try {
        // places = await Place.find({ creator: userId });
        userWithPlaces = await User.findById(userId).populate('places');
    } catch (err) {
        const error = new HttpError(
            'Something went wrong, could not find place', 
            500
        );
        return next(error);   
    }

    // if (!places || places.length === 0) {
    if (!userWithPlaces || userWithPlaces.length === 0) {
        return next (
            new HttpError('cannot find places for provided user id!', 404)
            );
         
    }

    res.json({ places: userWithPlaces.places.map(place => place.toObject({ getters: true })) });
};

// POST request expect data in body
const createPlace = async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return next(new HttpError('Invalid input, please check input data.', 422)); 
    }

    // object destructuring
    const { title, description, address, creator } = req.body;
    
    let coordinates;
    try {
        coordinates = await getCoordsForAddress(address);
    } catch (error) {
        return next(error);
    }

    const createdPlace = new Place({
        title,
        description,
        address,
        location: coordinates,
        image: req.file.path,
        creator
      });

    let user;
    try {
        user = await User.findById(creator);
    } catch (err) {
        const error = new HttpError(
            'Creating place failed, please try again',
            500
        );
        return next(error);
    }

    if (!user) {
        const error = new HttpError(
            'Could not find user for provided id',
            404
        );
        return next(error);
    }

    console.log(user);

    // Session: commit if changes succeed, else don't do anything
    try {
        // make sure to create 'places' collection if it doesn't exist yet, eg create it in MongoDB collection cluster
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await createdPlace.save({ session: sess });
        // this push method is by mongoose, establishes a connection between the models. Only adds the places id
        user.places.push(createdPlace);
        await user.save({ session: sess });
        await sess.commitTransaction();
    } catch (err) {
        const error = new HttpError(
            'Creating place failed, please try again', 500
        );
        return next(error)
    }

    res.status(201).json({place: createdPlace});
};

const updatePlaceById = async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return next(
            new HttpError('Invalid update, please check input.', 422)
        );
    }

    const { title, description } = req.body;
    const placeId = req.params.pid;

    let place;
    try {
        place = await Place.findById(placeId);
    } catch (err) {
        const error = new HttpError(
            'Something went wrong, could not update place.',
            500
        )
        return next(error);
    }

    place.title = title;
    place.description = description;

    try {
        await place.save();
    } catch (err) {
        const error = new HttpError(
            'Something went wrong, could not update place',
            500
        );
        return next(error);
    }

    // return success and updated data
    res.status(200).json({ place: place.toObject({ getters: true }) })
};

const deletePlaceById = async (req, res, next) => {
    const placeId = req.params.pid;

   let place;
   try {

    // populate allows you to get documents stored in different collections in mongoDB
       place = await Place.findById(placeId).populate('creator');
   } catch (err) {
       const error = new HttpError(
           'Cannot delete, something went wrong',
           500
       );
       return next(error);
   }

   if (!place) {
       const error = new HttpError(
           'Could not find place by Id',
           404
       );
       return next(error);
   }
   
   const imagePath = place.image

   try {

    //    place.remove();
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await place.remove({ session: sess });
        place.creator.places.pull(place); // pull automatically removes id
        await place.creator.save({ session: sess });
        await sess.commitTransaction();
   } catch (err) {
        const error = new HttpError(
            'Cannot delete, something went wrong',
            500
        );
        return next(error);
   }

   fs.unlink(imagePath, err => {
       console.log(err);
   })

    res.status(200).json({message: 'Delete successful'})
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlaceById = updatePlaceById;
exports.deletePlaceById = deletePlaceById;
