//Final Project

//SETUP
//npm install firebase-admin --save
//npm install express
//npm install ejs
//npm install request
//npm install body-parser
//npm install yelp-fusion --save



var admin = require("firebase-admin");

var serviceAccount = require("./firebaseKeys.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "YOUR FIREBASE LINK HERE"
});

var db = admin.database();
var ref = db.ref();
var usersRef = ref.child('users');

var express = require('express');
var request = require('request');
var app = express();
var ejs = require('ejs');
var bodyParser = require('body-parser');
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));
var request = require('request');

var googleAPIKey='INSERT GOOGLE PLACES API KEY';

const yelp = require('yelp-fusion');
const apiKey = 'INSERT YELP API KEY HERE';
const client = yelp.client(apiKey);


var loggedIn = false;
var user = null;
var requestLogIn = false;
var requestSignUp = false;

app.listen(3000,function(){
    console.log("listening on port 3000");
})

app.get('/',function(req,res){
    return res.render('homePage');
})

//sending user to the signup page
app.post('/toSignUp',function(req,res){
    return res.redirect('/signUpPage');
})

app.get('/traveltracker',function(req,res){
    if (loggedIn){
        usersRef.on('value',function(snapshot){
            var userList = snapshot.val()
            var sesUser = userList[user];
            var fName = sesUser.firstName;
            var tripData = sesUser.pastTrips;
            var starTrips = sesUser.starTrips;
            return res.render('traveltracker',{tripData:tripData,starTrips:starTrips,name:fName})
        })
    }
    else {return res.render('homePage')}
})


//sending user to login page
app.post('/toLogIn',function(req,res){
    return res.redirect('/logInPage');
})


//now load the signup page
app.get('/signUpPage',function(req,res){
    return res.render('signUpPage');
})

//used for the navbar to send the user back to the homepage
app.get('/tthomepage',function(req,res){
    return res.redirect('/traveltracker');
})


//load the login page
app.get('/logInPage',function(req,res){
    return res.render('logInPage',{message:null});
})

//once user signs up, we add the data to the firebase database
//the key is their username
app.post('/signUpPage',function(req,res){
    var userName = req.body.userName;
    var userPassword = req.body.password;
    var userfName = req.body.firstName;
    var userlName = req.body.lastName;
    //later make sure no two people can have same username
    usersRef.update({
        [userName]:{
            username: userName, 
            password: userPassword, 
            firstName: userfName,
            lastName: userlName,
        }
    })
    loggedIn = true;
    user = userName;
    return res.redirect('/traveltracker');
})



app.post('/loginPage',function(req,res){
    var enteredUsername = req.body.userName;
    var enteredPassword = req.body.password;
    usersRef.once('value',function(snapshot){
        var userList = snapshot.val()
        if (typeof userList[enteredUsername] == "undefined"){
                return res.render('loginPage',{message:"Incorrect username or user does not exist"})
        }
        else {
            findUser = userList[enteredUsername];
            if (findUser.password == enteredPassword){
                loggedIn = true;
                user = enteredUsername;
                return res.redirect('/traveltracker')
            } else {
                return res.render('loginPage',{message:"incorrect Password"})
            }
        }
        
    })
})

//user is logged out and sent back to the homepage
app.get("/logOut",function(req,res){
    if(loggedIn){
        loggedIn = false;
    }
    return res.render('homePage')
})

//button that redirects the user to search for restaurants
app.post('/toRestaurantPage',function(req,res){
    if (loggedIn){
        return res.render('restaurantSearch',{data:null})
    }
    else{
        return res.render('homePage')
    }
})

//button that redirects the user to search for events
app.post('/searchEvents',function(req,res){
    if (loggedIn){
        return res.render('searchEvents',{data:null,error:null})
    } else {
        return res.render('homePage')
    }
})



app.get('/goToaddTrip',function(req,res){
    if (loggedIn){
        return res.render('newTripUser',{message:null})
    }
    else{ return res.render('homePage')}
})

//function for saving the inputs of the user about their trip to firebase
//takes the name, location, and notes that the user inputs
//saves the location and notes 
app.post('/newUserTrip',function(req,res,next){
    if(loggedIn){
        tripName = req.body.name;
        tripLocation = req.body.location
        tripNotes = req.body.notes
        usersRef.once('value',function(snapshot){
            var userList = snapshot.val();
            var sesUser = userList[user];
            console.log("sesUser:")
            console.log(sesUser)
            var updates01= {};
            var postData = {
                location: tripLocation,
                notes: tripNotes
            }
            updates01['/users/'+user+'/pastTrips/'+tripName] = postData;
            ref.update(updates01);
            console.log(sesUser);
            return next();

        })
    }
    return res.render('homePage')
}, function(req,res){

        usersRef.once('value',function(snapshot){
            var userList = snapshot.val()
            var sesUser = userList[user];
            var fName = sesUser.firstName;
            var tripData = sesUser.pastTrips;
            var starTrips = sesUser.starTrips;
            return res.render('traveltracker',{tripData:tripData,starTrips:starTrips,name:fName})
        })
})
//})


//uses the yelp fusion api to find restaurants based on the location entered by the user
app.use('/findRestaurant',function(req,res){
    if (loggedIn){
        var buttonVal = req.body.rButton;
        var searchLoc = req.body.searchLoc;
        if (buttonVal == "Search"){
            searchRequest = {
                term: 'restaurants',
                limit:5,
                location: searchLoc
            }
            client.search(searchRequest).then(response => {
                var results = response.jsonBody.businesses;
                return res.render('restaurantSearch',{data:results})
            }).catch(e => {
                return res.render('restaurantSearch',{data:null})
            });
        }
    } else {
        return res.render('homePage')
    }
})


//calls the like button and saves the data based on the restaurant you chose' phone number since it is unique
app.post('/toLikeButton',function(req,res){
    if (loggedIn){
        var locPhone = req.body.locPhone;
        client.phoneSearch({
          phone: locPhone
        }).then(response => {
            data = response.jsonBody.businesses[0];
            return res.render('restaurantDetails',{data:data,message:null})
            
        }).catch(e => {
            return res.render('restaurantDetails',{data:null,message:"error"})
        });
        
    }
    else {
        return res.render('homePage')
    }
})

//liked button that is called when someone likes a restaurant
//their data is added to the database to the starTrips child 
//the name of the restaurant is the key in the database
//the user is then sent back to the homepage
app.post('/likeButton',function(req,res,next){
    if(loggedIn){
        console.log("like button")
        var locName = req.body.locName;
        var locAddress = req.body.locAddress;
        var updates01= {};
        var postData = {
            name: locName,
            address: locAddress
        }
            
        updates01['/users/'+user+'/starTrips/'+locName] = postData;
        ref.update(updates01);
        console.log("after firebase")
        return next();
        console.log("next")
    }
    else {
        return res.render('homePage')
    }
}, function(req,res){
        if (loggedIn){
        usersRef.on('value',function(snapshot){
            var userList = snapshot.val()
            var sesUser = userList[user];
            var fName = sesUser.firstName;
            var tripData = sesUser.pastTrips;
            var starTrips = sesUser.starTrips;
            return res.render('traveltracker',{tripData:tripData,starTrips:starTrips,name:fName})
        })
    }
    else {return res.render('homePage')}
})


//This uses the google Places api to get information
//user enters a query for the location and is given option to select a type -- listed in the checkbox
app.post('/googlePlaces',function(req,res){
    if (loggedIn){
        var queryLoc = req.body.queryLoc;
        var checkBoxLen = 8;
        //returns a list of check boxes that were checked
        var locType = req.body.locType;
        //google places api only allows one type to be chosen
        var url =`https://maps.googleapis.com/maps/api/place/textsearch/json?query=${queryLoc}&type=${locType}&key=${googleAPIKey}`

        request(url, function (err, response, body) {
            console.log("google query")
            if(err){
                return res.render('searchEvents', {data: null, error: 'Error, please try again'});
            } else {
                //parses the data and if it exits, sends the list of breeds to the user
                var data = JSON.parse(body);
                if(data == undefined){
                    return res.render('searchEvents', {data: null, error: 'Error, please try again'});
                } else {
                    return res.render('searchEvents', {data:data.results, error: null});
                }
            }
        });
    } else {
        return res.render('homePage')
    }
})


//called when the user likes a place 
//when called the even that has been liked it added to the database
//then next is called and the function returns the user to the homescreen
app.post('/eventLike',function(req,res,next){
    if(loggedIn){
        console.log("in event Like")
        var locName = req.body.locName;
        var locAddress = req.body.locAddress;
        var updates01= {};
        var postData = {
            //numTrip: findUser.pastTrip.numTrip+1
            name: locName,
            address: locAddress
        }
        //updates the information on the database
        //locName is the key in the database and it holds
        //the locName and the address
        updates01['/users/'+user+'/starTrips/'+locName] = postData;
        ref.update(updates01);
        console.log("firebase update")
        return next()
        console.log("next")
    } else {
        return res.render('homePage')
    }
}, function(req,res){
        console.log("in next function")
        if (loggedIn){
        usersRef.on('value',function(snapshot){
            var userList = snapshot.val()
            var sesUser = userList[user];
            var fName = sesUser.firstName;
            var tripData = sesUser.pastTrips;
            var starTrips = sesUser.starTrips;
            return res.render('traveltracker',{tripData:tripData,starTrips:starTrips,name:fName})
        })
    }
    else {return res.render('homePage')}
})


//button that is on the login and and sign up page in case a user wants to go back to the homepage
app.get('/returnHome',function(req,res){
    return res.render('homePage');
})












