// Samrid KC


var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
var authJwtController = require('./auth_jwt');
var User = require('./Users');
var Charity = require('./Charity');
var jwt = require('jsonwebtoken');
var Transaction = require('./Transaction');

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(passport.initialize());

var router = express.Router();

router.route('/postjwt')
    .post(authJwtController.isAuthenticated, function (req, res) {
            console.log(req.body);
            res = res.status(200);
            if (req.get('Content-Type')) {
                console.log("Content-Type: " + req.get('Content-Type'));
                res = res.type(req.get('Content-Type'));
            }
            res.send(req.body);
        }
    );


//Users
router.route('/users/:userId')
    .get(authJwtController.isAuthenticated, function (req, res) {
        var id = req.params.userId;
        User.findById(id, function(err, user) {
            if (err) res.send(err);

            var userJson = JSON.stringify(user);
            // return that user
            res.json(user);
        });
    });

router.route('/users')
    .get(authJwtController.isAuthenticated, function (req, res) {
        User.find(function (err, users) {
            if (err) res.send(err);
            // return the users
            res.json(users);
        });
    });

router.post('/signup', function(req, res) {
    if (!req.body.username || !req.body.password) {
        res.json({success: false, msg: 'Please pass username and password.'});
    }
    else {
        var user = new User();
        user.name = req.body.name;
        user.username = req.body.username;
        user.password = req.body.password;
        // save the user
        user.save(function(err) {
            if (err) {
                // duplicate entry
                if (err.code == 11000)
                    return res.json({ success: false, message: 'A user with that username already exists. '});
                else
                    return res.send(err);
            }

            res.json({ message: 'User created!' });
        });
    }
});

router.post('/signin', function(req, res) {
    var userNew = new User();
    userNew.name = req.body.name;
    userNew.username = req.body.username;
    userNew.password = req.body.password;

    User.findOne({ username: userNew.username }).select('name username password').exec(function(err, user) {
        if (err) res.send(err);

        user.comparePassword(userNew.password, function(isMatch){
            if (isMatch) {
                var userToken = {id: user._id, username: user.username};
                var token = jwt.sign(userToken, process.env.SECRET_KEY);
                res.json({success: true, token: 'JWT ' + token});
            }
            else {
                res.status(401).send({success: false, msg: 'Authentication failed. Wrong password.'});
            }
        });


    });
});


//Charity CRUD
router.post('/Charity/Save', function(req, res) { // save/create a new charity
        if (!req.body.Name) {
            res.json({success: false, msg: 'Please pass Name of Charity'});
        }

        if (!req.body.Amount) {
            res.json({success: false, msg: 'Please pass Amount.'});
        }

        else {

            var charity = new Charity();
            charity.Name = req.body.Name;
            charity.Amount = req.body.Amount;

            charity.save(function(err) {
                if (err) {
                    return res.send(err);
                }
                res.json({ message: 'Charity saved!' });
            });
        }
    });

router.get('/Charity/GetAll', function (req, res) {   // Get all Charities
        Charity.find(function (err, charities) {
            if (err) res.send(err);
            // return the charities
            res.json(charities);
        });
    });

router.get('/Charity/Get/:charityName', function (req, res) {  // Get by Name
        var Name = {Name: req.params.charityName};
        Charity.find(Name, function(err, charity) {
            if (err) res.send(err);

            if(!charity.length) return res.json({message: 'No such charity in DB'});
            // return that charity
            res.json(charity);
        });
    });

router.delete('/Charity/Delete/:charityName', function (req, res) {   // Delete by name
        var Name = {Name: req.params.charityName};
            //charity.remove();
            Charity.findOneAndRemove(Name, function(err, charity) {
                if (err) return res.send(err);

                if(!charity) return res.json({ message: 'No such charity in DB!'});

                res.json({ message: 'Charity has been deleted' });
        });
    });

router.put('/Charity/Update/:charityName', function(req, res) {   // Update by Name
        var Name = {Name: req.params.charityName};
        var opts = {runValidators : true};

        Charity.findOneAndUpdate(Name, req.body, opts, function(err, charity) {
            if (err) return res.send(err.message);

            if(!charity) return res.json({ message: 'No such charity in DB!'});

            res.json({ message: 'Charity has been updated!' });
        });
    });

//Transaction CRUD
router.post('/Transaction/Save', function(req, res) { // save/create a new charity

    var d = new Date();

    if (!req.body.Name) {
        res.json({success: false, msg: 'Please pass Name.'});
    }

    if (!req.body.Date) {
        res.json({success: false, msg: 'Please pass Date.'});
    }

    if (!req.body.Total) {
        res.json({success: false, msg: 'Please pass Total.'});
    }

    if (!req.body.CreditCard) {
        res.json({success: false, msg: 'Please pass Credit Card.'});
    }


    else {

        var transaction = new Transaction();
        transaction.Name = req.body.Name;
   //     transaction.Date = req.body.Date;
        transaction.Date = d;
        transaction.Total = req.body.Total;
        transaction.CreditCard = req.body.CreditCard;


        transaction.save(function(err) {
            if (err) {
                return res.send(err);
            }
            res.json({ message: 'Transaction saved!' });
        });
    }
});

app.use('/', router);
// app.listen(process.env.PORT || 8080);
app.listen(process.env.PORT || 3000, function(){
    console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});



// var express = require('express');
// var http = require('http');
// var bodyParser = require('body-parser');
//
// var app = express();
// app.use(bodyParser.text({
//   type: function(req) {
//     return 'text';
//   }
// }));
//
// app.post('/post', function (req, res) {
//   console.log(req.body);
//   res = res.status(200);
//   if (req.get('Content-Type')) {
//     console.log("Content-Type: " + req.get('Content-Type'));
//     res = res.type(req.get('Content-Type'));
//   }
//   res.send(req.body);
// });
//
// app.listen(process.env.PORT || 3000, function(){
//     console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
// });

