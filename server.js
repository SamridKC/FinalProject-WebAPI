// Samrid KC


var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
var authJwtController = require('./auth_jwt');
var User = require('./Users');
var Charity = require('./Charity');
var jwt = require('jsonwebtoken');
var Transaction = require('./Transaction');
var Product = require('./Product');

var app = express();
var cors = require('cors');

app.use(cors());
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

router.route('/Name/:name')
    .get(authJwtController.isAuthenticated, function (req,res) {

//        var name = {name: req.params.name};

        User.aggregate([
            { "$match": {"name": String(req.params.name)} },
            {
                "$lookup": {
                    "from": "transactions",
                    "localField": "name",
                    "foreignField": "Name",
                    "as": "transaction"
                }
            }
        ]).exec(function(err, results){
            if(err) res.send(err);
            return res.json(results);
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
        user.TotalDonation = req.body.TotalDonation;
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

router.route('/Charity/Save')
    .post(authJwtController.isAuthenticated, function(req, res) { // save/create a new charity
        if (!req.body.Name) {
            res.json({success: false, msg: 'Please pass Name of Charity'});
        }

        if (!req.body.imageUrl) {
            res.json({success: false, msg: 'Please pass an image Url. '});
        }

        if (!req.body.About) {
            res.json({success: false, msg: 'Please pass info about the charity. '});
        }

        else {

            var charity = new Charity();
            charity.Name = req.body.Name;
            charity.Amount = req.body.Amount;
            charity.imageUrl = req.body.imageUrl;
            charity.About = req.body.About;

            charity.save(function(err) {
                if (err) {
                    return res.send(err);
                }
                res.json({ message: 'Charity saved!' });
            });
        }
    });

// router.route('/users')
//     .get(authJwtController.isAuthenticated, function (req, res) {
//
//
//     }

router.route('/Charity/GetAll')
    .get(authJwtController.isAuthenticated, function (req, res) {   // Get all Charities
        Charity.find(function (err, charities) {
            if (err) res.send(err);
            // return the charities
            res.json(charities);
        });
    });

router.route('/Charity/Get/:charityName')
    .get(authJwtController.isAuthenticated, function (req, res) {  // Get by Name
        var Name = {Name: req.params.charityName};
        Charity.find(Name, function(err, charity) {
            if (err) res.send(err);

            if(!charity.length) return res.json({message: 'No such charity in DB'});
            // return that charity
            res.json(charity);
        });
    });

router.route('/Charity/Delete/:charityName')
    .delete(authJwtController.isAuthenticated, function (req, res) {   // Delete by name
        var Name = {Name: req.params.charityName};
            //charity.remove();
            Charity.findOneAndRemove(Name, function(err, charity) {
                if (err) return res.send(err);

                if(!charity) return res.json({ message: 'No such charity in DB!'});

                res.json({ message: 'Charity has been deleted' });
        });
    });

router.route('/Charity/Update/:charityName')
    .put(authJwtController.isAuthenticated, function(req, res) {   // Update by Name
        var Name = {Name: req.params.charityName};
        var opts = {runValidators : true};

        Charity.findOneAndUpdate(Name, req.body, opts, function(err, charity) {
            if (err) return res.send(err.message);

            if(!charity) return res.json({ message: 'No such charity in DB!'});

            res.json({ message: 'Charity has been updated!' });
        });
    });

// //Transaction Create and Read
router.route('/Transaction/Save')
    .post(authJwtController.isAuthenticated, function(req, res) { // save/create a new charity

    var d = new Date();
    var totalPlusDonation;

    if (!req.body.Name) {
        res.json({success: false, msg: 'Please pass Name.'});
    }

    // if (!req.body.Date) {
    //     res.json({success: false, msg: 'Please pass Date.'});
    // }

    if (!req.body.Total) {
        res.json({success: false, msg: 'Please pass Total.'});
    }

    if (!req.body.CreditCard) {
        res.json({success: false, msg: 'Please pass Credit Card.'});
    }

    if (!req.body.ExpirationDate) {
            res.json({success: false, msg: 'Please pass Expiration Date.'});
    }


    else {

        var transaction = new Transaction();
        transaction.Name = req.body.Name;
   //     transaction.Date = req.body.Date;
        transaction.Date = d;
        transaction.Total = req.body.Total;
        transaction.CreditCard = req.body.CreditCard;
        transaction.ExpirationDate = req.body.ExpirationDate;
        if(req.query.donation === 'true') {
        totalPlusDonation = Math.ceil(req.body.Total);
        transaction.DonationAmount = (totalPlusDonation - req.body.Total).toFixed(2);  // floating point upto 2 decimal points
        }
        else {
            transaction.DonationAmount = 0;
        }
        transaction.CharityName = req.body.CharityName;

        //*********
//          var UserName = {UserName: req.params.Name};
//         User.findOne(UserName, function(err, nameUser) {
//        User.findOne({name: req.body.Name}).select('name').exec(function (err, nameUser) {

        User.findOne({name: req.body.Name}, function(err, nameUser) {

        if (err) res.send(err);
            // return that charity
            nameUser.TotalDonation += transaction.DonationAmount.toFixed(2);
            nameUser.save(function(err) {
                if (err) {
                    return res.send(err);
                }
            });
        });

        Charity.findOne({Name: req.body.CharityName}, function(err, nameCharity) {

            if (err) res.send(err);
            // return that charity
            nameCharity.Amount += transaction.DonationAmount;
            nameCharity.save(function(err) {
                if (err) {
                    return res.send(err);
                }
            });
        });

        // //*********



        transaction.save(function(err) {
            if (err) {
                return res.send(err);
            }
            res.json({ message: 'Transaction saved!' });
        });


        //
    }
});

router.route('/Transaction/GetAll')
    .get(authJwtController.isAuthenticated, function (req, res) {   // Get all Transactions
        Transaction.find(function (err, transactions) {
            if (err) res.send(err);
            // return all transactions
            res.json(transactions);
        });
    });


router.route('/Product/Save')
    .post(authJwtController.isAuthenticated, function(req, res) { // save/create a new charity
        if (!req.body.Name) {
            res.json({success: false, msg: 'Please pass Name of Product.'});
        }

        if (!req.body.Price) {
            res.json({success: false, msg: 'Please pass a Price.'});
        }

        if (!req.body.imageUrl) {
            res.json({success: false, msg: 'Please pass an image Url.'});
        }

        else {

            var product = new Product();
            product.Name = req.body.Name;
            product.Price = req.body.Price;
            product.imageUrl = req.body.imageUrl;

            product.save(function(err) {
                if (err) {
                    return res.send(err);
                }
                res.json({ message: 'Product saved!' });
            });
        }
    });

router.route('/Product/GetAll')
    .get(authJwtController.isAuthenticated, function (req, res) {   // Get all Charities
        Product.find(function (err, products) {
            if (err) res.send(err);
            // return the charities
            res.json(products);
        });
    });

router.route('/Product/Get/:productName')
    .get(authJwtController.isAuthenticated, function (req, res) {  // Get by Name
        var Name = {Name: req.params.productName};
        Product.find(Name, function(err, product) {
            if (err) res.send(err);

            if(!product.length) return res.json({message: 'No such product in DB'});
            // return that charity
            res.json(product);
        });
    });

// router.route('/Charity/Get/:charityName')
//     .get(authJwtController.isAuthenticated, function (req, res) {  // Get by Name
//         var Name = {Name: req.params.charityName};
//         Charity.find(Name, function(err, charity) {
//             if (err) res.send(err);
//
//             if(!charity.length) return res.json({message: 'No such charity in DB'});
//             // return that charity
//             res.json(charity);
//         });
//     });

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
