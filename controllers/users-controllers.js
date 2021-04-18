const { validationResult } = require('express-validator');

const HttpError = require('../models/http-error');
const User = require('../models/user');


const getUsers = async (req, res, next) => {
    let users;
    try {
        // excludes password
        users = await User.find({}, '-password');
    } catch (err) {
        const error = new HttpError(
            'Unable to get list of users, please check and try again',
            500
        );
        return next(error);
    }

    res.json({ users: users.map(user => user.toObject({ getters: true})) });
};

const signup = async (req, res, next) => {
    
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const error = new HttpError('Invalid registeration, please check input.', 422);
        return next(error);
    }

    const { name, email, password } = req.body;

    let exisitingUser;
    try {
        exisitingUser = await User.findOne({ email: email });
    } catch (err) {
        const error = new HttpError(
            'Sign up failed, try again later.',
            500
        );
        return next(error);
    }

    if (exisitingUser) {
        const error = new HttpError(
            'User exist already, please try again',
            422
        );
        return next(error);
    }

    // password will need to be encrypted later
    const createdUser = new User({
        name,
        email,
        image: req.file.path,
        password,
        places: []
    });

    try {
        await createdUser.save();
    } catch (err) {
        const error = new HttpError(
            'Sign up failed, please try again.',
            500
        );
        return next(error);
    }

    res.status(201).json({ user: createdUser.toObject({ getters: true })});
};

const login = async (req, res, next) => {
    const { email, password } = req.body;

    let exisitingUser;
    try {
        // find and validates email
        exisitingUser = await User.findOne({ email: email });
    } catch (err) {
        const error = new HttpError(
            'Login failed, try again later.',
            500
        );
        return next(error);
    }

    if (!exisitingUser || exisitingUser.password !== password) {
        const error = new HttpError(
            'Invalid credentials, could not log in',
            401
        );
        return next(error);
    }

    res.json({ 
        message: 'login successful!', 
        user: exisitingUser.toObject({ getters: true }) 
    });
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;