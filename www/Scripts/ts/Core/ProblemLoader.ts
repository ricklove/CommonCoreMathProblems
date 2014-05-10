﻿/// <reference path="../../typings/jquery/jquery.d.ts" />

module Told.CommonCoreMathProblems {

    export interface IValue {
        exact: number;
        range: IRange;
        operation: IOperation;
        variableRef: string;
        wordSet: IWordSet;
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
        allVariables: IVariable[];
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

    export interface IVariableWithModifier {
        variable: IVariable;
        modifier: string;
    }

    export interface ISamplePoint {
        numberValue: number;
        textValue: string;
        possibleValuesDebug: string;
    }

    export interface ISampleValue {
        name: string;
        modifier: string;
        value: ISamplePoint;
    }

    export interface ISample {
        values: ISampleValue[];
    }

    export interface ISampleSet {
        variables: IVariableWithModifier[];
        sampleDebug: string;
        samples: ISample[];
    }

    export interface IProblemInstance {
        problemSource: IProblem;
        sampleSource: ISample;
        question: string;
        answer: string;
    }

    export interface IProblem {
        scope: IScope;
        questionRawText: string;
        question: IProblemText;
        answerRawText: string;
        answer: IProblemText;
        sampleSet: ISampleSet;
        problemInstanceDebug?: IProblemInstance;
        problemInstances?: IProblemInstance;
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
            var lastScope: IScope = { contexts: [lastContext], allVariables: null };
            var lastProblem: IProblem = { scope: null, questionRawText: "", answerRawText: "", question: null, answer: null, sampleSet: null };

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

                    lastProblem = { scope: null, questionRawText: "", answerRawText: "", question: null, answer: null, sampleSet: null };
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

                    lastScope = { contexts: lastScope.contexts.slice(0, level), allVariables: null };
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

            var breakdance1 = true;

            // Flatten Scope for each problem
            problems.forEach(function (p) {
                if (p.scope.allVariables === null) {
                    p.scope.allVariables = ProblemLoader.flattenContextVariables(p.scope.contexts);
                }
            });

            var breakdance2 = true;

            // Create sample set for each problem
            problems.forEach(function (p) {
                p.sampleSet = ProblemLoader.createSampleSet(p);
            });

            var breakdance3 = true;

            // Calculate a debug problemInstance for each problem
            problems.forEach(function (p) {
                p.problemInstanceDebug = ProblemLoader.createProblemInstance(p, true);
            });

            var breakdance4 = true;

        }

        static createProblemInstance(problem: IProblem, isDebug: boolean= false): IProblemInstance {

            var sample = ProblemLoader.createSample(problem.sampleSet);

            var createText = function (pText: IProblemText): string {
                var t = "";
                // Go through the phrases and fill in the sample values
                pText.phrases.forEach(function (phrase) {
                    if (phrase.plainText != "") {
                        t += phrase.plainText;
                    }
                    else {

                        var mVar = sample.values.filter(function (v) { return v.name === phrase.reference.name && v.modifier === phrase.reference.modifier; });

                        if (mVar.length === 0) {
                            mVar = sample.values.filter(function (v) { return v.name + "s" === phrase.reference.name && v.modifier === phrase.reference.modifier; });
                        }

                        if (mVar.length === 0) {
                            throw new Error("A variable is missing: " + phrase.reference.name);
                        }

                        if (mVar.length > 1) {
                            throw new Error("LOGIC ERROR: A variable is duplicated: " + phrase.reference.name);
                        }

                        var val = mVar[0].value;
                        if (val.numberValue != null) {
                            t += val.numberValue;
                        } else {
                            t += val.textValue;
                        }

                        if (isDebug) {
                            t += "<" + val.possibleValuesDebug + ">";
                        }
                    }
                });

                return t;
            };

            var qText = createText(problem.question);
            var aText = createText(problem.answer);

            return { question: qText, answer: aText, problemSource: problem, sampleSource: sample };
        }

        static createSample(sampleSet: ISampleSet): ISample {

            var values: ISampleValue[] = [];
            var isOk = false;

            while (!isOk) {

                values = [];
                isOk = true;

                var getValue = function (valInner: IValue, modifier: string): ISamplePoint {

                    var val: ISamplePoint = { numberValue: null, textValue: null, possibleValuesDebug: "" };

                    if (valInner.exact !== null) {
                        val = { numberValue: valInner.exact, possibleValuesDebug: "" + valInner.exact, textValue: null };
                    } else if (valInner.variableRef) {

                        var vRef = valInner.variableRef;
                        var vMatches = values.filter(function (v2) { return v2.name === vRef; });

                        if (vMatches.length !== 1) {
                            throw new Error("Ambiguous VariableRef: (Variable Declarations may be out of order)" + valInner.variableRef);
                        }

                        val = vMatches[0].value;

                    } else if (valInner.operation) {

                        var leftVal = getValue(valInner.operation.left, "");
                        var rightVal = getValue(valInner.operation.right, "");

                        var op = valInner.operation.operator;
                        var nVal = 0;
                        var pVal = "";

                        if (op === Operator.add) {
                            nVal = leftVal.numberValue + rightVal.numberValue;
                            pVal = leftVal.possibleValuesDebug + "+" + rightVal.possibleValuesDebug;
                        } else if (op === Operator.subtract) {
                            nVal = leftVal.numberValue - rightVal.numberValue;
                            pVal = leftVal.possibleValuesDebug + "-" + rightVal.possibleValuesDebug;
                        } else if (op === Operator.multiply) {
                            nVal = leftVal.numberValue * rightVal.numberValue;
                            pVal = leftVal.possibleValuesDebug + "*" + rightVal.possibleValuesDebug;
                        } else if (op === Operator.divide) {
                            nVal = leftVal.numberValue / rightVal.numberValue;
                            pVal = leftVal.possibleValuesDebug + "/" + rightVal.possibleValuesDebug;
                        } else if (op === Operator.modulo) {
                            nVal = leftVal.numberValue % rightVal.numberValue;
                            pVal = leftVal.possibleValuesDebug + "%" + rightVal.possibleValuesDebug;
                        }

                        val = { numberValue: nVal, possibleValuesDebug: pVal, textValue: null };

                    } else if (valInner.wordSet) {

                        var wSet = valInner.wordSet;

                        wSet.rawText;

                        // TODO: Choose words from the word set correctly
                        // TODO: Handle modifiers

                        //throw "Not Implemented";
                        val = { textValue: wSet.rawText, possibleValuesDebug: wSet.rawText, numberValue: null };
                    }

                    if (valInner.range) {

                        var minVal = getValue(valInner.range.minValue, "");
                        var maxVal = getValue(valInner.range.maxValue, "");

                        if (val.numberValue == null) {
                            // Create random range
                            var nVal = Math.floor(minVal.numberValue + Math.random() * (maxVal.numberValue - minVal.numberValue));
                            val = { numberValue: nVal, possibleValuesDebug: "[" + minVal.possibleValuesDebug + "," + maxVal.possibleValuesDebug + "]", textValue: null };

                        } else {
                            // Verify range
                            if (val.numberValue < minVal.numberValue ||
                                val.numberValue > maxVal.numberValue) {
                                isOk = false;
                            }
                        }
                    }

                    return val;
                };

                sampleSet.variables.forEach(function (v) {
                    values.push({ name: v.variable.name, modifier: v.modifier, value: getValue(v.variable.value, v.modifier) });
                });
            }

            return { values: values };
        }

        static createSampleSet(problem: IProblem): ISampleSet {

            var variables: IVariableWithModifier[] = [];

            problem.question.phrases.concat(problem.answer.phrases).forEach(function (p) {
                if (p.reference != null) {

                    var matching = problem.scope.allVariables.filter(function (v) { return v.name == p.reference.name; });

                    if (matching.length === 0) {
                        matching = problem.scope.allVariables.filter(function (v) { return v.name + "s" == p.reference.name; });
                    }

                    if (matching.length === 0) {
                        throw new Error("Unknown variable:'" + p.reference.name + "' in " + problem.questionRawText + "\r\nAnswer:\r\n" + problem.answerRawText);
                    }

                    var foundVar = matching[matching.length - 1];

                    if (variables.filter(function (v) { return v.variable.name == foundVar.name && v.modifier == p.reference.modifier; }).length === 0) {
                        variables.push({ variable: foundVar, modifier: p.reference.modifier });
                    }
                }
            });


            // Resort variables by priority
            var unsorted = variables;
            variables = [];

            problem.scope.allVariables.forEach(function (v) {

                var uMatching = unsorted.filter(function (u) { return u.variable.name === v.name; });

                uMatching.forEach(function (u) {
                    var i = unsorted.indexOf(u);
                    if (i >= 0) {
                        variables.push(unsorted.splice(i, 1)[0]);
                    }
                });


            });

            var sampleDebug = "";

            variables.forEach(function (v) { sampleDebug += v.variable.rawText + "(" + v.modifier + ")\r\n"; });

            return { variables: variables, sampleDebug: sampleDebug, samples: [] };
        }

        static flattenContextVariables(contexts: IContext[]): IVariable[] {

            var vars: IVariable[] = [];

            contexts.forEach(function (c) {
                c.variables.forEach(function (v) {
                    vars.push(v);
                });
            });

            return vars;
        }

        static parseProblemText(text: string): IProblemText {
            var rpCaptureBeginBeforeBraces = "(^\\s*[^\\{\\}]+\\s*)(?:{|$)";
            var rpCaptureBeginInsideBraces = "(?:^\\{([^\\{\\}]+)\\})";
            var rpStart = "(?:" + rpCaptureBeginBeforeBraces + "|" + rpCaptureBeginInsideBraces + ")";
            var regexStart = new RegExp(rpStart);

            var regexReference = /^([0-9a-zA-z]*[a-zA-z])('s|\\+s|-s|[0-9])?$/;

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

                return { rawText: text, groups: groups };
            }

            var parseValue = function (text: string): IValue {

                var t = text.trim();

                if (t.match(regexExact)) {

                    var m = t.match(regexExact);

                    return { exact: parseInt(m[1]), operation: null, range: null, variableRef: null, wordSet: null };

                } else if (t.match(regexVariable)) {

                    var m = t.match(regexVariable);
                    var name = m[1].trim();

                    return { variableRef: name, exact: null, operation: null, range: null, wordSet: null };

                } else if (t.match(regexRange)) {

                    var m = t.match(regexRange);
                    var min = parseValue(m[1]);
                    var max = parseValue(m[2]);

                    return { range: { minValue: min, maxValue: max }, exact: null, operation: null, variableRef: null, wordSet: null };

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


                    return { operation: { left: left, operator: operator, right: right }, exact: null, range: null, variableRef: null, wordSet: null };

                } else if (t.match(regexOperationWithRange)) {

                    var m = t.match(regexOperationWithRange);
                    var outOperation = parseValue(m[1]);
                    var outRange = parseValue(m[2]);

                    return { operation: outOperation.operation, range: outRange.range, exact: null, variableRef: null, wordSet: null };

                } else if (t.match(regexWordSet)) {

                    var m = t.match(regexWordSet);
                    var wordSet = parseWordSet(m[1]);

                    return { wordSet: wordSet, exact: null, operation: null, range: null, variableRef: null };

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