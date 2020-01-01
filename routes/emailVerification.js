const { Router } = require('express');
const router = new Router();
const User = require('../models/user');

const { sendEmailVerification, isThrowawayEmail } = require('../myFunctions/sendEmailVerification');
const validator = require('validator');


function checkEmailVerifiedAlready(req, res, next) {
    if (req.user.emailVerified === true) {
        req.flash("error", "You have already verified your email.");
        res.redirect("/");
    }
    else {
        next();
    }
}

router.get('/', checkEmailVerifiedAlready, (req, res) => {
    res.render('verifyEmail', { currentUser: req.user });
});

router.get('/resendEmailVerification', checkEmailVerifiedAlready, (req, res) => {
    sendEmailVerification(req.user);
    res.render('simpleText', {contents: "Verification email resent!"});
});

router.post('/addNewEmail', checkEmailVerifiedAlready, async (req, res) => {
    console.log("AA");
    if (await emailExists(req.body.emailAddress) === true) {
        req.flash('error', 'This email address is already in use.');
        res.redirect('/emailVerification');
    }
    else if (validEmail(req.body.emailAddress) === false) {
        req.flash("error", "Please provide a valid email address.");
        res.redirect('/emailVerification');
    }
    else {
        // All is good.
        console.log("A");
        req.user.emailAddress = req.body.emailAddress;
        req.user.markModified("emailAddress");
        console.log("B");
        await req.user.save();
        console.log("C");
        sendEmailVerification(req.user);

        res.render('simpleText', {contents: "Email added. Thank you."});
    }
});

function validEmail(email) {
    return (
        emailContainsBadCharacter(email) === false || 
        validator.isEmail(email) === true || 
        isThrowawayEmail(email) === false
    );
}

async function emailExists(email) {
    var userEmailDuplicate = await User.findOne({emailAddress: email}).populate('notifications').exec();
    if (userEmailDuplicate) {
        return true;
    }
    else {
        return false;
    }
}

function emailContainsBadCharacter(str) {
    // only allow alphanumerical and @ and . symbols.
    const regx = /^[A-Za-z0-9\@\.]+$/;

    if (str.includes('&lt;')
        || str.includes('&gt;')
        || str.includes('&apos;')
        || str.includes('&quot;')
        || str.includes('[')
        || str.includes(']')
        || str.includes('/')
        || str.includes('\\')
        || str.includes('&')
        || str.includes(';')
    ) {
        return true;
    }
    if (!regx.test(str)) {
        return true;
    }

    return false;
}


module.exports.emailVerificationRoutes = router;
module.exports.validEmail = validEmail;
module.exports.emailExists = emailExists;