/* Examples:
 * One-shot model:
 * User:  "Alexa, ask Logophile for the word of the day."
 * Alexa: "Today's word of the day is [...] . Would you like to hear it used in a sentence?"
 * User: "No."
 * Alexa: "Alright then. Do you want the previous word of the day?"
 * User:  "Sure."
 * Alexa: "On February 8, 2016, the word of the day was [...] . Would you like to hear it used in a sentence?"
 * User: "No. I'm done."
 * Alexa: "Alright then. Check back tomorrow for the new word of the day."
 */


/**
 * App ID for the skill
 */
var APP_ID = "amzn1.echo-sdk-ams.app.ba54358d-ea2f-4bb8-b40f-320aa2d5a108";
var AlexaSkill = require('./AlexaSkill');
var Promise = require('./es6-promise').Promise;
var XMLHttpRequest = require("./xmlhttprequest").XMLHttpRequest;

var https = require('https');

var LogophileSkill = function() {
    AlexaSkill.call(this, APP_ID);
};

/**
 * URL prefix to download history content from Wikipedia
 */
var urlPrefix = 'http://dictionary.reference.com/wordoftheday/';



// Extend AlexaSkill
LogophileSkill.prototype = Object.create(AlexaSkill.prototype);
LogophileSkill.prototype.constructor = LogophileSkill;

LogophileSkill.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
    console.log("LogophileSkill onSessionStarted requestId: " + sessionStartedRequest.requestId
        + ", sessionId: " + session.sessionId);

    session.attributes.inquiry = "word";
};

LogophileSkill.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("LogophileSkill onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);

    getWelcomeResponse(response);
};

LogophileSkill.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("onSessionEnded requestId: " + sessionEndedRequest.requestId
        + ", sessionId: " + session.sessionId);

    // any session cleanup logic would go here
};

LogophileSkill.prototype.intentHandlers = {

    "GetTodaysWordIntent": function (intent, session, response) {
        handleGetTodaysWordRequest(intent, session, response);
    },

    "GetSomeDaysWordIntent": function (intent, session, response) {
        session.wordObject = {};
        handleSomeDaysWordRequest(intent, session, response);
    },

    "GetPreviousWordIntent": function (intent, session, response) {
        handleGetPreviousWordRequest(intent, session, response);
    },

    "GetExampleSentenceIntent": function (intent, session, response) {
        handleExampleSentenceRequest(intent, session, response);
    },

    "AMAZON.HelpIntent": function (intent, session, response) {
        var speechOutput = "Logophile returns Dictionary.com's Word of the Day. You can get today or another day's word by saying something like" +
            "What is today's word of the day, or what was the Word of the Day on January first. You may also say never mind to exit. So, what would you like to do?";
        var repromptOutput = "Which date's Word of the Day would you like?";

        response.ask(speechOutput, repromptOutput);
    },

    "AMAZON.StopIntent": function (intent, session, response) {
        var speechOutput = "Closing Logophile. Be sure to ask for the new Word of the Day tomorrow.";
        response.tell(speechOutput);
    },

    "AMAZON.CancelIntent": function (intent, session, response) {
        var speechOutput = "Closing Logophile. Goodbye";
        response.tell(speechOutput);
    }
};

function getWelcomeResponse(response) {
       
    var cardTitle = "Word of the Day";
    var repromptOutput = "You can use Logophile to retrieve today's or a previous day's Word of the Day from Dictionary.com by saying something like, " +
            "what is today's word of the day, or what was the Word of the Day on January first. You may also say never mind to exit. So, what would you like to do?";
    var speechOutput = "Hello logophile. Which day's Word of the Day do you want?";
    var cardOutput = "Logophile.Which day's Word of the Day do you want?";
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.

    response.askWithCard(speechOutput, repromptOutput, cardTitle, cardOutput);
}

/**
 * Gets a poster prepares the speech to reply to the user.
 */
function handleGetTodaysWordRequest(intent, session, response) {

    var monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"];

    var repromptOutput = "You can use Logophile to retrieve today's or a previous day's Word of the Day from Dictionary.com by saying something like: " +
            "what is today's word of the day, or what was the Word of the Day on January first. You may also say never mind to exit. So, what would you like to do?";

    d = new Date();
     
    year = d.getFullYear() + "";
    month = "" + d.getMonth()+1;
    day = "" + d.getDate();
    
    if (month.length < 2)
        month = "0" + month;

    if (day.length < 2)
        day = "0" + day;

    var baseQueryURL = "dictionary.reference.com%2Fwordoftheday";
    var slash = "%2F"; 
    var queryURL = "url%3D'"+baseQueryURL+slash+year+slash+month+slash+day+"'"; 

    var start = "https://query.yahooapis.com/v1/public/yql?q=SELECT%20*%20FROM%20data.html.cssselect%20WHERE%20(";
    var mid = "%20AND%20css%3D'div.definition-header')%20OR%20("
    var end = "%20AND%20css%3D'ol.definition-list')&format=json&diagnostics=true&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&callback=";

    var query = start+queryURL+mid+queryURL+end;
            
    function getWordOfTheDay() {
        // Return a new promise.
        return new Promise(function(resolve, reject) {
            // Do the usual XHR stuff
            https.get(query, function(res) {
              var body = '';
              res.on('data', function(chunk) {
                  body += chunk;
              });
              res.on('end', function() {
                  resolve(function() {
                    var res = JSON.parse(body).query.results;
                    return res;
                  });
              });
            }).on('error', function(e) {
              reject(Error(e));
            });
        });
    }

    getWordOfTheDay().then(function(res) {

        try{

            var definition;
            var defs = [];
            var rsp = res();
            var wotd = rsp.results[0].div.strong || rsp.results[0].div.h1.strong;
            var temp = rsp.results[1].ol.li;

            if (Array.isArray(temp)){
           
                for (var i = 0; i < temp.length; i++){

                    definition = temp[i].span.content || temp[i].span;
                    defs.push((i+1)+ ". " + definition);

                } 

            } else {
                
                definition = temp.span || temp.span.content;
                defs.push(definition);  
            
            }

            var cardTitle = wotd.toUpperCase();
            var prefixContent = "The Word of the Day for " + monthNames[d.getMonth()] + " " + day + ", " + year + " is " + wotd + ", which means: ";
            var cardContent = "The Word of the Day for " + monthNames[d.getMonth()] + " " + day + ", " + year + " is " + wotd + ", which means: ";

            var speechText = "";   

            if (defs.length == 0)
                throw new Error("There was a problem retrieving the definition for " + wotd + ", today's word of the day.");

            for (var i = 0; i < defs.length; i++) {
                cardContent = cardContent + defs[i] + " ";
                speechText = speechText + defs[i] + " ";
            }
            
            speechText = speechText + " Would you like to hear a previous word of the day?";
            var speechOutput = prefixContent + speechText;

            response.askWithCard(speechOutput, repromptOutput, cardTitle, cardContent);
        }

        catch(err) {
        
            err = err || "There is a problem connecting to Dictionary.com at this time. Please try again later.";
            speechText = err;
            cardContent = err;
            cardTitle = "Word of the Day";
            response.tellWithCard(speechText,cardTitle,cardContent);
        
        }     
              
    });

}

function handleSomeDaysWordRequest(intent, session, response) {
//     var cardTitle = "More events on this day in history",
//         sessionAttributes = session.attributes,
//         result = sessionAttributes.text,
//         speechText = "",
//         cardContent = "",
//         repromptText = "Do you want to know more about what happened on this date?",
//         i;
//     if (!result) {
//         speechText = "With History Buff, you can get historical events for any day of the year.  For example, you could say today, or August thirtieth. Now, which day do you want?";
//         cardContent = speechText;
//     } else if (sessionAttributes.index >= result.length) {
//         speechText = "There are no more events for this date. Try another date by saying <break time = \"0.3s\"/> get events for august thirtieth.";
//         cardContent = "There are no more events for this date. Try another date by saying, get events for august thirtieth.";
//     } else {
//         for (i = 0; i < paginationSize; i++) {
//             if (sessionAttributes.index>= result.length) {
//                 break;
//             }
//             speechText = speechText + "<p>" + result[sessionAttributes.index] + "</p> ";
//             cardContent = cardContent + result[sessionAttributes.index] + " ";
//             sessionAttributes.index++;
//         }
//         if (sessionAttributes.index < result.length) {
//             speechText = speechText + " Wanna go deeper in history?";
//             cardContent = cardContent + " Wanna go deeper in history?";
//         }
//     }
//     var speechOutput = {
//         speech: "<speak>" + speechText + "</speak>",
//         type: AlexaSkill.speechOutputType.SSML
//     };
//     var repromptOutput = {
//         speech: repromptText,
//         type: AlexaSkill.speechOutputType.PLAIN_TEXT
//     };
//     response.askWithCard(speechOutput, repromptOutput, cardTitle, cardContent);
    response.tell("The get previous word of the day intent has been triggered. Proper behavior will be implemented soon.");
 }

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    // Create an instance of the HistoryBuff Skill.
    var logophile = new LogophileSkill();
    logophile.execute(event, context);
};