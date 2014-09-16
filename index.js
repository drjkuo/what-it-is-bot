// Listbot config
//
// Config.keys uses environment variables so sensitive info is not in the repo.
var config = {
    me: 'StoriesInData', // The authorized account with a list to retweet.
    myList: 'data-driven-storytellers', // The list we want to retweet.
    regexReject: '(RT|@)', // Reject any tweets matching this regex pattern.
    regexFilter: '', // Accept only tweets matching this regex pattern.
    keys: {
        consumer_key: process.env.TWITTER_CONSUMER_KEY,
        consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
        access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
        access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
    },
};


// Functions

// Get the members of our list, and pass them into a callback function.
function getListMembers(callback) {
    var memberIDs = [];

    tu.listMembers({owner_screen_name: config.me,
        slug: config.myList
    },
    function(error, data){
        if (!error) {
            for (var i=0; i < data.users.length; i++) {
                memberIDs.push(data.users[i].id_str);
            }

            // This callback is designed to run listen(memberIDs).
            callback(memberIDs);
        } else {
            console.log(err);
            console.log(data);
        }
    });
}

// What to do after we retweet something.
function onReTweet(err) {
    if(err) {
        console.error("retweeting failed :(");
        console.error(err);
    }
}

// What to do when we get a tweet.
function onTweet(tweet) {
    // Reject the tweet if:
    //  1. it's flagged as a retweet
    //  2. it's matches our regex rejection criteria
    //  3. it doesn't match our regex acceptance filter
    var regexReject = new RegExp(config.regexReject, 'i');
    var regexFilter = new RegExp(config.regexFilter, 'i');
    if (tweet.retweeted) {
        return;
    }
    if (regexReject.test(tweet.text)) {
        return;
    }
    if (regexFilter.test(tweet.text)) {
        console.log(tweet);
        console.log("RT: " + tweet.text);
        // note we're using the id_str property since
        // javascript is not accurate for 64bit ints
        tu.retweet({
            id: tweet.id_str
        }, onReTweet);
    }
}

// Function for listening to twitter streams and retweeting on demand.
function listen(listMembers) {
    tu.filter({
        follow: listMembers
    }, function(stream) {
        console.log("listening to stream");
        stream.on('tweet', onTweet);
    });
}

// The application itself.

// Use the tuiter node module to get access to twitter.
var tu = require('tuiter')(config.keys);

// Run the application. The callback in getListMembers ensures we get our list
// of twitter streams before we attempt to listen to them via the twitter API.
getListMembers(listen);