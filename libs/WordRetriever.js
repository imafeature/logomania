//Changes: 
// -added url as WordRequest object property
// -added url to response card 
// -added attributes property to WordRequest

var Promise = require('./es6-promise').Promise;
var https = require('https');

function WordRequest(date){
    
    var firstWordDate = new Date("1999-05-03");
    var todaysDate = new Date();

    if (!date || isNaN(date.valueOf())) {

      date = todaysDate;

    } else if (date < firstWordDate) {

      date = firstWordDate;

    } else if (date > todaysDate) {

      var thisYear = todaysDate.getFullYear();

      if (date.getFullYear() === thisYear + 1){

        date.setFullYear(thisYear);

      } else {

        date.setFullYear(thisYear - 1);
      
      }

    }
    
    this.date = date;
    this.weekday = date.getDay();
    this.year = date.getFullYear() + "";
    this.month = "" + (date.getMonth()+1);
    this.day = "" + date.getDate();  

    this.parsedResponse = {};

    this.spokenDate = function(){
        
        var day = (this.day.charAt(0) == '0') ? this.day.replace('0','') : this.day;

        var dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        var monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];   

        return dayNames[this.weekday] + ", " + monthNames[this.date.getMonth()] + " " + day + ", " + this.year;
    };

    //builds query
    this.query = function(){
        
        if (this.month.length < 2)
            this.month = "0" + this.month;

        if (this.day.length < 2)
            this.day = "0" + this.day;

        this.url = "http://dictionary.reference.com/wordoftheday/" + this.year + "/" + this.month + "/" + this.day ;

        var query = "https://echoserver.azureedge.net/verbivore/" + this.month + "/" + this.day + "/" + this.year;

        return query;
    };

    //promises word from https request
    this.requestWord = function(){

        var query = this.query();

        //NO ERROR HERE
        return new Promise(function(resolve, reject) {
            //EXIT BEFORE FINISHING HERE
            https.get(query, function(res) {
            //TIMEOUT HERE  
                var body = '';

                res.on('data', function(chunk) {
                    body += chunk;
                });

                res.on('end', function() {
                    resolve(function() {
                        var res = JSON.parse(body);
                        return res;
                    });

                });
              
            }).on('error', function(e) {
              reject(Error(e));
            });

        });
    };

    //use in the .then method for requestWord
    this.returnWord = function(res) {

        try{
                                    
            var attributes = {};
            var response = {};
            var rsp = res();
            var wotd = rsp["wordOfTheDay"];
            var defs = rsp["definitions"];
            var spokenDate = this.spokenDate();
            
            var cardTitle = wotd.toUpperCase() + ": " + spokenDate + " Word of the Day";
            var cardContent = "The Word of the Day for " + spokenDate + " is " + wotd + ", which means: ";

            var prefixContent = (spokenDate == "Monday, May 3, 1999") ? "Dictionary.com did not begin providing words of the day until " + spokenDate + 
                    ". This inaugural Word of the Day was " : "The Word of the Day for " + spokenDate + " is " ;
                prefixContent += wotd + ", which means: ";
            

            var speechText = ""; 
            var speechOutput;  

            if (defs.length == 0)
                throw new Error("There was a problem retrieving the definition for " + wotd + ", today's word of the day.");

            for (var i = 0; i < defs.length; i++) {
                
                var ordinal = (defs.length > 1) ? (i+1)+ ". " : "";


                cardContent = cardContent + ordinal + defs[i] + " ";
                speechText = speechText + ordinal +  defs[i] + " ";
            }

            speechText = speechText + "Would you like to hear another day's word of the day?";
            speechOutput = prefixContent + speechText;

            attributes.word = wotd;
            attributes.definition = defs;
            attributes.url = this.url;
            attributes.query = this.query();

            response = {
                speechOutput : speechOutput,
                cardTitle : cardTitle,
                cardContent : cardContent + " Read more at: " + this.url,
                attributes : attributes
            };

            return response;
        }

        catch(err) {
        
            err = err || "There is a problem connecting to Dictionary.com at this time. Please try again later.";

            response = {
                speechText : err,
                cardTitle : "Word of the Day",
                cardContent : err,
                attributes: attributes
            };

            return response;
        
        }              
    };

}

module.exports = WordRequest;
