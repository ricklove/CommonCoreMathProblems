/// <reference path="../../typings/jquery/jquery.d.ts" />
var Told;
(function (Told) {
    (function (CommonCoreMathProblems) {
        var ParseMode;
        (function (ParseMode) {
            ParseMode[ParseMode["None"] = 0] = "None";
            ParseMode[ParseMode["Variables"] = 1] = "Variables";
            ParseMode[ParseMode["Question"] = 2] = "Question";
            ParseMode[ParseMode["Answer"] = 3] = "Answer";
        })(ParseMode || (ParseMode = {}));

        var ProblemLoader = (function () {
            function ProblemLoader() {
            }
            ProblemLoader.loadProblemFiles = function (onLoaded, onError) {
                var filename = "Problems001.txt";

                var url = this.baseUrl + "Problems/" + filename;

                $.ajax(url, {
                    dataType: "text",
                    cache: true,
                    success: function (data) {
                        onLoaded(data);
                    },
                    error: function (data) {
                        if (onError) {
                            onError(data);
                        }
                    }
                });
            };

            ProblemLoader.loadProblems = function () {
                ProblemLoader.loadProblemFiles(ProblemLoader.parseProblems);
            };

            ProblemLoader.parseProblems = function (fileText) {
                var lines = fileText.replace("\r\n", "\n").split("\n");

                var problems = [];
                var scopes = [];
                var contexts = [];

                var lastContext = { heading: "", variablesRawText: "", variables: [] };
                var lastScope = { contexts: [lastContext] };
                var lastProblem = { scope: null, questionRawText: "", answerRawText: "" };

                var itemText = "";

                contexts.push(lastContext);
                scopes.push(lastScope);

                var mode = 0 /* None */;

                for (var iLine = 0; iLine < lines.length; iLine++) {
                    var line = lines[iLine].trim();

                    if (line == "") {
                        continue;
                    }

                    var closeItem = function () {
                        if (mode === 3 /* Answer */) {
                            lastProblem.answerRawText = itemText;
                            itemText = "";

                            if (lastProblem.scope != null) {
                                throw new Error("An ANSWER is missing from the QUESTION before: " + lastProblem.questionRawText);
                            }

                            lastProblem.scope = lastScope;
                            problems.push(lastProblem);

                            lastProblem = { scope: null, questionRawText: "", answerRawText: "" };
                        } else {
                            if (lastProblem.questionRawText != "") {
                                throw new Error("An ANSWER is missing QUESTION: " + lastProblem.questionRawText);
                            }

                            if (mode === 0 /* None */) {
                                if (itemText != "") {
                                    throw new Error("Closing a non-empty item without a current mode: This should not be logically possible");
                                }
                            } else if (mode === 1 /* Variables */) {
                                lastContext.variablesRawText = itemText;
                                itemText = "";
                            } else if (mode === 2 /* Question */) {
                                lastProblem.questionRawText = itemText;
                                itemText = "";
                            }
                        }
                    };

                    // Parse Line
                    if (line.match(/^#+/i)) {
                        closeItem();
                        mode = 0 /* None */;

                        // New Context
                        var level = line.match(/^#+/i)[0].length;

                        lastContext = { heading: line.substr(level).trim(), variablesRawText: "", variables: [] };
                        contexts.push(lastContext);

                        lastScope = { contexts: lastScope.contexts.slice(0, level) };
                        lastScope.contexts.push(lastContext);
                        scopes.push(lastScope);
                    } else if (line.match(/^VARIABLES:$/i)) {
                        closeItem();
                        mode = 1 /* Variables */;
                    } else if (line.match(/^QUESTION:$/i)) {
                        closeItem();
                        mode = 2 /* Question */;
                    } else if (line.match(/^ANSWER:$/i)) {
                        closeItem();
                        mode = 3 /* Answer */;
                    } else {
                        if (mode === 0 /* None */) {
                            throw new Error("Unknown Command: Check for a missing 'QUESTION:' or 'VARIABLES:' keyword");
                        } else {
                            itemText += line + "\r\n";
                        }
                    }
                }

                // Parse Raw Texts
                var breakdance = true;
            };
            ProblemLoader.baseUrl = "";
            return ProblemLoader;
        })();
        CommonCoreMathProblems.ProblemLoader = ProblemLoader;
    })(Told.CommonCoreMathProblems || (Told.CommonCoreMathProblems = {}));
    var CommonCoreMathProblems = Told.CommonCoreMathProblems;
})(Told || (Told = {}));
