Welcome to Travel Tracker!

This app allows the user to store data about their past trips and look up restaurants and other events to like. Any restaurant or event that they like, along with the trips they have added, are saved using Firebase and shown to the user on their homepage. 

In order to download and implement your own Travel Tracker app, there are a few steps:

    1. Setup a Firebase account and create a new project. 
    2. Once created, download your keys given the JSON file and save it to where you plan on storing this app. 
    3. Setup a yelp account and get an API key for the Yelp Fusion API.
    4. Setup a google places account and get an API key.
    5. Insert both API keys into the index.js file -- there will be two empty variables that are marked google or yelp
    6. After downloading this repository and saving it somewhere locally, go to your terminal and download the following packages:
    
        npm install firebase-admin --save
        npm install express
        npm install ejs
        npm install request
        npm install body-parser
        npm install yelp-fusion --save
