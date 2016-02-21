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
    // var cardTitle = "More events on this day in history",
    //     sessionAttributes = session.attributes,
    //     result = sessionAttributes.text,
    //     speechText = "",
    //     cardContent = "",
    //     repromptText = "Do you want to know more about what happened on this date?",
    //     i;
    // if (!result) {
    //     speechText = "With History Buff, you can get historical events for any day of the year.  For example, you could say today, or August thirtieth. Now, which day do you want?";
    //     cardContent = speechText;
    // } else if (sessionAttributes.index >= result.length) {
    //     speechText = "There are no more events for this date. Try another date by saying <break time = \"0.3s\"/> get events for august thirtieth.";
    //     cardContent = "There are no more events for this date. Try another date by saying, get events for august thirtieth.";
    // } else {
    //     for (i = 0; i < paginationSize; i++) {
    //         if (sessionAttributes.index>= result.length) {
    //             break;
    //         }
    //         speechText = speechText + "<p>" + result[sessionAttributes.index] + "</p> ";
    //         cardContent = cardContent + result[sessionAttributes.index] + " ";
    //         sessionAttributes.index++;
    //     }
    //     if (sessionAttributes.index < result.length) {
    //         speechText = speechText + " Wanna go deeper in history?";
    //         cardContent = cardContent + " Wanna go deeper in history?";
    //     }
    // }
    // var speechOutput = {
    //     speech: "<speak>" + speechText + "</speak>",
    //     type: AlexaSkill.speechOutputType.SSML
    // };
    // var repromptOutput = {
    //     speech: repromptText,
    //     type: AlexaSkill.speechOutputType.PLAIN_TEXT
    // };
    // response.askWithCard(speechOutput, repromptOutput, cardTitle, cardContent);
    response.tell("The get previous word of the day intent has been triggered. Proper behavior will be implemented soon.");
 }

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    // Create an instance of the HistoryBuff Skill.
    var logophile = new LogophileSkill();
    logophile.execute(event, context);
};