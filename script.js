'use strict';

const _ = require('lodash');
const Script = require('smooch-bot').Script;

const scriptRules = require('./script.json');

module.exports = new Script({
    processing: {
        //prompt: (bot) => bot.say('Beep boop...'),
        receive: () => 'processing'
    },

    start: {
        receive: (bot) => {
            return bot.say('So you want to learn about Ondrej? Just say HELLO to get started.')
                .then(() => 'speak');
        }
    },

    speak: {
        receive: (bot, message) => {

            let upperText = message.text.trim().toUpperCase();

            function updateSilent() {
                switch (upperText) {
                    case "CONNECT ME":
                        return bot.setProp("silent", true);
                    case "DISCONNECT":
                        return bot.setProp("silent", false);
                    default:
                        return Promise.resolve();
                }
            }

            function getSilentAndNotUnderstood() {
                return Promise.all([
                    bot.getProp("silent"),
                    bot.getProp("not-understood")
                ]);
            }

            function processMessage(isSilentAndNotUnderstood) {
                let isSilent = isSilentAndNotUnderstood[0];
                let notUnderstood = isSilentAndNotUnderstood[1] || 0;

                let fallbackText = `NOT UNDERSTOOD ${notUnderstood + 1}`;

                if (isSilent) {
                    return Promise.resolve("speak");
                }

                let incNotUnderstood = false;
                if (!_.has(scriptRules, upperText) &&
                    _.has(scriptRules, fallbackText)) {
                    upperText = fallbackText;
                    incNotUnderstood = true;
                } else if (!_.has(scriptRules, upperText)) {
                    return bot.setProp("not-understood", notUnderstood + 1).
                        then(() => bot.say(`I didn't understand that.`)).
                        then(() => 'speak');
                }

                var response = scriptRules[upperText];
                var lines = response.split('\n');

                let p;
                if (incNotUnderstood) {
                    p = bot.setProp("not-understood", notUnderstood + 1);
                } else if (notUnderstood > 0) {
                    p = bot.setProp("not-understood", 0);
                } else {
                    p = Promise.resolve();
                }
                _.each(lines, function(line) {
                    line = line.trim();
                    p = p.then(function() {
                        console.log(line);
                        return bot.say(line);
                    });
                });

                return p.then(() => 'speak');
            }

            return updateSilent()
                .then(getSilentAndNotUnderstood)
                .then(processMessage);
        }
    }
});
