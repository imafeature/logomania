var APP_ID = "amzn1.echo-sdk-ams.app.ba54358d-ea2f-4bb8-b40f-320aa2d5a108";
var urlPrefix = 'http://dictionary.reference.com/wordoftheday/';

var AlexaSkill = require('./AlexaSkill');
var WordRequest = require('./WordRetriever');

var LogophileSkill = function() {
    AlexaSkill.call(this, APP_ID);
};

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
        var speechOutput = "Closing Logophile. Be sure to check back tomorrow for a new Word of the Day.";
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

    response.askWithCard(speechOutput, repromptOutput, cardTitle, cardOutput);
}

function handleGetTodaysWordRequest(intent, session, response) {
    
    var wordRequest = new WordRequest();

    //Defines output variables with the promised data
    wordRequest.requestWord()

        .then(function(res){
            wordRequest.parsedResponse = wordRequest.returnWord(res);
            return wordRequest;
        })

        .then(function(wordObj){

            var output = wordObj.parsedResponse;

            var speechOutput = output.speechOutput;
            var cardTitle = output.cardTitle;
            var cardContent = output.cardContent;
            var repromptOutput = "You can use Logophile to retrieve today's or a previous day's Word of the Day from Dictionary.com by saying something like: " +
            "what is today's word of the day, or what was the Word of the Day on January first. You may also say never mind to exit. So, what would you like to do?";
   
            response.askWithCard(speechOutput, repromptOutput, cardTitle, cardContent);
                
        });

}

function handleSomeDaysWordRequest(intent, session, response) {
    
    var date;
    var dateFromSlot = new Date(intent.slots.date.value);

    if (dateFromSlot.valueOf() % 1 !== 0 ) {

        date = new Date();
        
    } else {

        if (dateFromSlot > new Date())
            dateFromSlot.setMonth(dateFromSlot.getMonth() -12)

        date = dateFromSlot;
    }

    var wordRequest = new WordRequest(date);

    //Defines output variables with the promised data
    wordRequest.requestWord()

        .then(function(res){
            wordRequest.parsedResponse = wordRequest.returnWord(res);
            return wordRequest;
        })

        .then(function(wordObj){

            var output = wordObj.parsedResponse;

            var speechOutput = output.speechOutput;
            var cardTitle = output.cardTitle;
            var cardContent = output.cardContent;
            var repromptOutput = "You can use Logophile to retrieve today's or a previous day's Word of the Day from Dictionary.com by saying something like: " +
            "what is today's word of the day, or what was the Word of the Day on January first. You may also say never mind to exit. So, what would you like to do?";
   
            response.askWithCard(speechOutput, repromptOutput, cardTitle, cardContent);
                
        });

 }

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    // Create an instance of the HistoryBuff Skill.
    var logophile = new LogophileSkill();
    logophile.execute(event, context);
};