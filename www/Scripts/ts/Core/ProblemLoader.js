/// <reference path="../../typings/jquery/jquery.d.ts" />
var Told;
(function (Told) {
    (function (CommonCoreMathProblems) {
        (function (Operator) {
            Operator[Operator["add"] = 0] = "add";
            Operator[Operator["subtract"] = 1] = "subtract";
            Operator[Operator["multiply"] = 2] = "multiply";
            Operator[Operator["divide"] = 3] = "divide";
            Operator[Operator["modulo"] = 4] = "modulo";
        })(CommonCoreMathProblems.Operator || (CommonCoreMathProblems.Operator = {}));
        var Operator = CommonCoreMathProblems.Operator;

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

                contexts.push(lastContext);
                scopes.push(lastScope);

                var mode = 0 /* None */;
                var itemText = "";

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

                for (var iLine = 0; iLine < lines.length; iLine++) {
                    var line = lines[iLine].trim();

                    if (line == "") {
                        continue;
                    }

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

                for (var iContext = 0; iContext < contexts.length; iContext++) {
                    var c = contexts[iContext];

                    var variables = ProblemLoader.parseVariables(c.variablesRawText);
                }
            };

            ProblemLoader.parseVariables = function (variablesRawText) {
                var variables = [];

                // Any operation
                var rpOperator = "\\s*[+\\-*/%]+\\s*";
                var rpName = "\\s*[0-9a-zA-Z_]+\\s*";
                var rpFlatOperation = "(?:\\s*" + rpName + "(?:" + rpOperator + rpName + ")*" + "\\s*)";
                var rpOperationWithParens = "(?:\\s*\\(" + rpFlatOperation + "\\)\\s*)";
                var rpEitherOperation = "(?:" + rpFlatOperation + "|" + rpOperationWithParens + ")";
                var rpAnyOperation = rpEitherOperation + "(?:" + rpOperator + rpEitherOperation + ")*";

                // Single number 20; 1
                var regexExact = /^([0-9]+)$/;

                // Simple Variable
                var regexVariable = /^([0-9a-zA-Z_]+)$/;

                // Range [0,20]; [x+3,15]
                var rpRange = "\\[(" + rpAnyOperation + "),(" + rpAnyOperation + ")\\]";
                var regexRange = new RegExp("^" + rpRange + "$");

                // Operation x+y; x+(2+y+3)-5
                var regexOperation = new RegExp("^(" + rpAnyOperation + ")(" + rpOperator + ")(" + rpAnyOperation + ")$");

                // Operation with Range x+y [0,20]
                var regexOperationWithRange = new RegExp("^(" + rpAnyOperation + ")(" + rpRange + ")$");

                // WordSet {a,b,c}
                var rpWordMain = "\\s*[a-zA-Z]+\\s*";
                var rpWord = rpWordMain + "(?:\\(" + rpWordMain + "\\))?" + "(?:\\s*<\\s*s?he\\s*>\\s*)?";
                var rpWordGroups = "(?:\\s*" + rpWord + "(?:[;,]" + rpWord + ")*\\s*)";
                var regexWordSet = new RegExp("^\\s*\\{(" + rpWordGroups + ")\\}\\s*$");

                // Inner Word Set
                var regexWord = "^(" + rpWordMain + ")(?:\\((" + rpWordMain + ")\\))?" + "(?:\\s*<\\s*(s?he)\\s*>\\s*)?$";

                var parseWord = function (text) {
                    var t = text.trim();

                    var m = t.match(regexWord);

                    var mainText = m[1];
                    var pluralModifier = m[2] || "";
                    var genderModifier = m[3] || "";

                    return { rawText: text, mainText: mainText, pluralModifier: pluralModifier, genderModifier: genderModifier };
                };

                var parseWordGroup = function (text) {
                    var t = text.trim();

                    var wordTexts = t.split(",");

                    var words = wordTexts.map(parseWord);

                    return { words: words };
                };

                var parseWordSet = function (text) {
                    var t = text.trim();

                    var groupTexts = t.split(";");

                    var groups = groupTexts.map(parseWordGroup);

                    return { groups: groups };
                };

                var parseValue = function (text) {
                    var t = text.trim();

                    if (t.match(regexExact)) {
                        var m = t.match(regexExact);

                        return { exact: parseInt(m[1]) };
                    } else if (t.match(regexVariable)) {
                        var m = t.match(regexVariable);
                        var name = m[1].trim();

                        return { variable: name };
                    } else if (t.match(regexRange)) {
                        var m = t.match(regexRange);
                        var min = parseValue(m[1]);
                        var max = parseValue(m[2]);

                        return { range: { minValue: min, maxValue: max } };
                    } else if (t.match(regexOperation)) {
                        var m = t.match(regexOperation);
                        var left = parseValue(m[1]);
                        var oText = m[2].trim();
                        var right = parseValue(m[3]);

                        var operator = oText === "+" ? 0 /* add */ : oText === "-" ? 1 /* subtract */ : oText === "*" ? 2 /* multiply */ : oText === "/" ? 3 /* divide */ : 4 /* modulo */;

                        return { operation: { left: left, operator: operator, right: right } };
                    } else if (t.match(regexOperationWithRange)) {
                        var m = t.match(regexOperationWithRange);
                        var operation = parseValue(m[1]);
                        var range = parseValue(m[2]);

                        return { operation: operation, range: range };
                    } else if (t.match(regexWordSet)) {
                        var m = t.match(regexWordSet);
                        var wordSet = parseWordSet(m[1]);

                        return { wordSet: wordSet };
                    } else {
                        throw new Error("Unknown value pattern: " + text);
                    }
                };

                var lines = variablesRawText.replace("\r\n", "\n").split("\n");

                for (var iLine = 0; iLine < lines.length; iLine++) {
                    var line = lines[iLine].trim();

                    if (line == "") {
                        continue;
                    }

                    var parts = line.split("=");
                    var name = parts[0].trim();
                    var valueText = parts[1].trim();

                    var value = parseValue(valueText);

                    variables.push({ rawText: line, name: name, value: value });
                }

                return variables;
            };
            ProblemLoader.baseUrl = "";
            return ProblemLoader;
        })();
        CommonCoreMathProblems.ProblemLoader = ProblemLoader;
    })(Told.CommonCoreMathProblems || (Told.CommonCoreMathProblems = {}));
    var CommonCoreMathProblems = Told.CommonCoreMathProblems;
})(Told || (Told = {}));
