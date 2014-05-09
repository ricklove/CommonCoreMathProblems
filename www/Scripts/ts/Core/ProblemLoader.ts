/// <reference path="../../typings/jquery/jquery.d.ts" />

module Told.CommonCoreMathProblems {

    export interface IValue {
        exact?: number;
        range?: IRange;
        operation?: IOperation;
        variable?: string;
        wordSet?: IWordSet;
    }

    export interface IRange {
        minValue: IValue;
        maxValue: IValue;
    }

    export enum Operator {
        add,
        subtract,
        multiply,
        divide,
        modulo
    }

    export interface IOperation {
        left: IValue;
        operator: Operator;
        right: IValue;
    }

    export interface IVariable {
        rawText: string;
        name: string;
        value: IValue;
    }

    export interface IWord {
        rawText: string;
        mainText: string;
        pluralModifier: string;
        genderModifier: string;
    }

    export interface IWordGroup {
        words: IWord[]
    }

    export interface IWordSet {
        rawText: string;
        groups: IWordGroup[];
    }

    export interface IContext {
        heading: string;
        variablesRawText: string;
        variables: IVariable[];
    }

    export interface IScope {
        contexts: IContext[];
    }

    export interface IReference {
        rawText: string;
        // ignore s at end of name when looking up variable
        name: string;
        // adjust to number: [default]
        // force singular: -s
        // force plural: +s
        // possessive: 's
        modifier: string;
    }

    export interface IPhrase {
        plainText?: string;
        reference?: IReference;
    }

    export interface IProblemText {
        rawText: string;
        phrases: IPhrase[];
    }

    export interface IProblem {
        scope: IScope;
        questionRawText: string;
        question: IProblemText;
        answerRawText: string;
        answer: IProblemText;
    }

    enum ParseMode {
        None,
        Variables,
        Question,
        Answer
    }

    export class ProblemLoader {
        private static baseUrl: string = "";

        private static loadProblemFiles(onLoaded: (text: string) => void, onError?: (text: string) => void) {

            var filename = "Problems001.txt";

            var url = this.baseUrl + "Problems/" + filename;

            $.ajax(url,
                {
                    dataType: "text",
                    cache: true,
                    success: function (data: any) { onLoaded(data); },
                    error: function (data: any) { if (onError) { onError(data); } }
                });

        }

        static loadProblems() {

            ProblemLoader.loadProblemFiles(ProblemLoader.parseProblems);

        }

        static parseProblems(fileText: string) {
            var lines = fileText.replace("\r\n", "\n").split("\n");

            var problems: IProblem[] = [];
            var scopes: IScope[] = [];
            var contexts: IContext[] = [];

            var lastContext: IContext = { heading: "", variablesRawText: "", variables: [] };
            var lastScope: IScope = { contexts: [lastContext] };
            var lastProblem: IProblem = { scope: null, questionRawText: "", answerRawText: "", question: null, answer: null };

            contexts.push(lastContext);
            scopes.push(lastScope);

            var mode: ParseMode = ParseMode.None;
            var itemText = "";

            var closeItem = function () {

                if (mode === ParseMode.Answer) {

                    lastProblem.answerRawText = itemText;
                    itemText = "";

                    if (lastProblem.scope != null) {
                        throw new Error("An ANSWER is missing from the QUESTION before: " + lastProblem.questionRawText);
                    }

                    lastProblem.scope = lastScope;
                    problems.push(lastProblem);

                    lastProblem = { scope: null, questionRawText: "", answerRawText: "", question: null, answer: null };
                } else {

                    if (lastProblem.questionRawText != "") {
                        throw new Error("An ANSWER is missing QUESTION: " + lastProblem.questionRawText);
                    }

                    if (mode === ParseMode.None) {
                        if (itemText != "") {
                            throw new Error("Closing a non-empty item without a current mode: This should not be logically possible");
                        }
                    } else if (mode === ParseMode.Variables) {

                        lastContext.variablesRawText = itemText;
                        itemText = "";

                    } else if (mode === ParseMode.Question) {

                        lastProblem.questionRawText = itemText;
                        itemText = "";

                    }
                }
            };

            // Parse Into Raw Texts
            for (var iLine = 0; iLine < lines.length; iLine++) {
                var line = lines[iLine].trim();

                if (line == "") {
                    // Skip blank lines
                    continue;
                }

                // Parse Line
                if (line.match(/^#+/i)) {

                    closeItem();
                    mode = ParseMode.None;

                    // New Context
                    var level = line.match(/^#+/i)[0].length;

                    lastContext = { heading: line.substr(level).trim(), variablesRawText: "", variables: [] };
                    contexts.push(lastContext);

                    lastScope = { contexts: lastScope.contexts.slice(0, level) };
                    lastScope.contexts.push(lastContext);
                    scopes.push(lastScope);

                } else if (line.match(/^VARIABLES:$/i)) {
                    closeItem();
                    mode = ParseMode.Variables;
                } else if (line.match(/^QUESTION:$/i)) {
                    closeItem();
                    mode = ParseMode.Question;
                } else if (line.match(/^ANSWER:$/i)) {
                    closeItem();
                    mode = ParseMode.Answer;
                } else {

                    if (mode === ParseMode.None) {
                        throw new Error("Unknown Command: Check for a missing 'QUESTION:' or 'VARIABLES:' keyword");
                    } else {
                        itemText += line + "\r\n";
                    }

                }

            }

            // Parse Variables
            contexts.forEach(function (c) { c.variables = ProblemLoader.parseVariables(c.variablesRawText); });

            // Parse Problems
            problems.forEach(function (p) {
                p.question = ProblemLoader.parseProblemText(p.questionRawText);
                p.answer = ProblemLoader.parseProblemText(p.answerRawText);
            });

            var breakdance = true;

        }

        static parseProblemText(text: string): IProblemText {
            var rpCaptureBeginBeforeBraces = "(^\\s*[^\\{\\}]+\\s*)(?:{|$)";
            var rpCaptureBeginInsideBraces = "(?:^\\{([^\\{\\}]+)\\})";
            var rpStart = "(?:" + rpCaptureBeginBeforeBraces + "|" + rpCaptureBeginInsideBraces + ")";
            var regexStart = new RegExp(rpStart);

            var regexReference = /^([0-9a-zA-z]+)('s|\\+s|-s)?$/;

            var parseReference = function (refText: string): IReference {

                if (refText === "") {
                    return null;
                }

                var m = refText.match(regexReference);
                var name = m[1];
                var modifier = m[2] || "";

                return { rawText: refText, name: name, modifier: modifier };
            };

            var problemText: IProblemText = { rawText: text, phrases: [] };
            var t = text.trim();
            var m = t.match(regexStart);

            while (m) {

                problemText.phrases.push({ plainText: m[1] || "", reference: parseReference(m[2] || "") });

                var capturedPart = m[1] || ("{" + m[2] + "}");
                t = t.substr(capturedPart.length);
                m = t.match(regexStart);
            }

            if (t != "") {
                throw new Error("Not all the text was captured. Ensure that each {brace} is closed properly.");
            }

            return problemText;
        }

        static parseVariables(variablesRawText: string): IVariable[] {

            var variables: IVariable[] = [];

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

            var parseWord = function (text: string): IWord {
                var t = text.trim();

                var m = t.match(regexWord);

                var mainText = m[1];
                var pluralModifier = m[2] || "";
                var genderModifier = m[3] || "";

                return { rawText: text, mainText: mainText, pluralModifier: pluralModifier, genderModifier: genderModifier };
            }

            var parseWordGroup = function (text: string): IWordGroup {
                var t = text.trim();

                var wordTexts = t.split(",");

                var words = wordTexts.map(parseWord);

                return { words: words };
            }

            var parseWordSet = function (text: string): IWordSet {
                var t = text.trim();

                var groupTexts = t.split(";");

                var groups = groupTexts.map(parseWordGroup);

                return { groups: groups };
            }

            var parseValue = function (text: string): IValue {

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

                    var operator =
                        oText === "+" ? Operator.add :
                        oText === "-" ? Operator.subtract :
                        oText === "*" ? Operator.multiply :
                        oText === "/" ? Operator.divide :
                        Operator.modulo;


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
                    // Skip blank lines
                    continue;
                }

                var parts = line.split("=");
                var name = parts[0].trim();
                var valueText = parts[1].trim();

                var value = parseValue(valueText);

                variables.push({ rawText: line, name: name, value: value });
            }

            return variables;
        }

    }

}