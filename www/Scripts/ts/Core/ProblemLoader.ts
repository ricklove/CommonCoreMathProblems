/// <reference path="../../typings/jquery/jquery.d.ts" />

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
        pluralText: string;
        genderText: string;
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

    export enum SingularOption {
        matchNumber,
        forceSingular,
        forcePlural
    }

    export enum PartOfSpeechOption {
        Subject,
        Object,
        Possessive
    }

    export enum CapitalOption {
        Capitalize,
        DontCapitalize
    }

    export interface IModifier {
        instanceModKey: string;
        referenceModKey: string;

        tag: number;
        singularOption: SingularOption;
        partOfSpeechOption: PartOfSpeechOption;
        capitalOption: CapitalOption;
    }

    export interface IReference {
        rawText: string;
        referenceID: number;
        lineNumber: number;
        name: string;
        modifier: IModifier;

        variableType: IVariable;
    }

    export interface IPhrase {
        plainText?: string;
        reference?: IReference;
    }

    export interface IProblemText {
        rawText: string;
        phrases: IPhrase[];
    }

    export enum SampleValueType {
        numberValue,
        nameValue,
        otherWordValue
    }

    export interface ISampleInstanceValue {
        hasError: boolean;
        valueType: SampleValueType;

        chosenNumberValue: number;
        chosenWord: IWord;
        chosenWordGroup: IWordGroup;

        possibleValuesDebug: string;
    }

    export interface ISampleInstance {
        type: IVariable;
        instanceModKey: string;

        value: ISampleInstanceValue;
    }

    export interface ISampleExpression {
        referenceID: number;
        text: string;
        possibleValuesDebug: string;
    }

    export interface ISample {
        references: IReference[];
        sortedReferences: IReference[];
        instances: ISampleInstance[];
        expressions: { [referenceID: number]: ISampleExpression };
    }

    export interface ISampleSet {
        references: IReference[];
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
        problemInstances?: IProblemInstance[];
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
            //var filename2 = "Problems001.txt";

            var url = this.baseUrl + "Problems/" + filename;

            $.ajax(url,
                {
                    dataType: "text",
                    cache: true,
                    success: function (data: any) { onLoaded(data); },
                    error: function (data: any) { if (onError) { onError(data); } }
                });

        }

        static loadProblems(onLoaded: (problems: IProblem[]) => void) {

            ProblemLoader.loadProblemFiles(function (fileText) {
                var problems = ProblemLoader.parseProblems(fileText);
                onLoaded(problems);
            });

        }

        static parseProblems(fileText: string): IProblem[] {
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

                    if (lastProblem.scope !== null) {
                        throw new Error("An ANSWER is missing from the QUESTION before: " + lastProblem.questionRawText);
                    }

                    lastProblem.scope = lastScope;
                    problems.push(lastProblem);

                    lastProblem = { scope: null, questionRawText: "", answerRawText: "", question: null, answer: null, sampleSet: null };
                } else {

                    if (lastProblem.questionRawText !== "") {
                        throw new Error("An ANSWER is missing QUESTION: " + lastProblem.questionRawText);
                    }

                    if (mode === ParseMode.None) {
                        if (itemText !== "") {
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

                if (line === "") {
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
            // DEBUG: Target 1 problem
            //problems = problems.slice(2, 3);

            problems.forEach(function (p) {
                p.problemInstanceDebug = ProblemLoader.createProblemInstance(p, true);

                p.problemInstances = [];
                for (var c = 0; c < 5; c++) {
                    p.problemInstances.push(ProblemLoader.createProblemInstance(p, false));
                }
            });

            var breakdance4 = true;


            return problems;
        }

        static createProblemInstance(problem: IProblem, isDebug: boolean= false): IProblemInstance {

            var sample = ProblemLoader.createSample(problem.sampleSet, problem.scope);
            ProblemLoader.populateSampleExpressions(sample);

            problem.sampleSet.samples.push(sample);

            var createText = function (pText: IProblemText): string {
                var t = "";
                // Go through the phrases and fill in the sample values
                pText.phrases.forEach(function (phrase) {
                    if (phrase.plainText !== "") {
                        t += phrase.plainText;
                    }
                    else {

                        var mExpression = sample.expressions[phrase.reference.referenceID];

                        if (mExpression === undefined) {
                            throw new Error("A variable is missing: " + phrase.reference.name);
                        }

                        t += mExpression.text;

                        if (isDebug) {
                            t += "<" + mExpression.possibleValuesDebug + ">";
                        }
                    }
                });

                // Choose the line options
                if (!isDebug) {
                    var lines = t.split("\r\n");
                    var simpleT = "";

                    var lastLine = "";
                    var lineGroup: string[] = [];

                    // Add a blank line at end to simplify logic
                    lines.push("");
                    lines.push("");

                    for (var iLine = 0; iLine < lines.length; iLine++) {
                        var curLine = lines[iLine];

                        if (curLine.indexOf("|| ") === 0) {
                            if (lineGroup.length === 0) {
                                lineGroup.push(lastLine);
                            }

                            lineGroup.push(curLine);
                        } else {

                            if (lineGroup.length > 0) {
                                var rLine = ProblemLoader.getRandomInt(0, lineGroup.length - 1);

                                var lineToUse = lineGroup[rLine];

                                if (lineToUse.indexOf("|| ") === 0) {
                                    lineToUse = lineToUse.substr(3);
                                }

                                simpleT += lineToUse + "\r\n";

                                lineGroup = [];

                            } else {
                                simpleT += lastLine;
                            }

                        }

                        lastLine = curLine;
                    }

                    t = simpleT.trim();
                }

                return t;
            };

            var qText = createText(problem.question);
            var aText = createText(problem.answer);

            return { question: qText, answer: aText, problemSource: problem, sampleSource: sample };
        }

        static populateSampleExpressions(sample: ISample) {

            var getModifiedWordText = function (word: IWord, modifier: IModifier, preceedingNameMainText: string, preceedingNumberValue: number): string {

                var t = "";

                var isFirst = word.mainText !== preceedingNameMainText;

                // If A person
                if (word.genderText !== "") {
                    if (modifier.partOfSpeechOption === PartOfSpeechOption.Subject) {
                        if (isFirst) {
                            t = word.mainText;
                        } else {
                            t = word.genderText;
                        }
                    } else if (modifier.partOfSpeechOption === PartOfSpeechOption.Object) {
                        if (isFirst) {
                            t = word.mainText;
                        } else {
                            if (word.genderText === "he") {
                                t = "him";
                            } else {
                                t = "her";
                            }
                        }
                    } else if (modifier.partOfSpeechOption === PartOfSpeechOption.Possessive) {
                        if (isFirst) {
                            t = word.mainText + "'s";
                        } else {
                            if (word.genderText === "he") {
                                t = "his";
                            } else {
                                t = "her";
                            }
                        }
                    }
                } else {
                    // If Not a person
                    var shouldShowSingular = false;

                    if (modifier.singularOption === SingularOption.forceSingular) {
                        shouldShowSingular = true;
                    } else if (modifier.singularOption === SingularOption.forcePlural) {
                        shouldShowSingular = false;
                    } else {
                        shouldShowSingular = preceedingNumberValue === 1;
                    }

                    if (shouldShowSingular) {
                        t = word.mainText;
                    } else {
                        if (word.pluralText === "") {
                            t = word.mainText;
                        } else if (word.pluralText === "s") {
                            t = word.mainText + "s";
                        } else if (word.pluralText === "es") {
                            t = word.mainText + "es";
                        } else {
                            t = word.pluralText;
                        }
                    }
                }

                if (t === "") {
                    t = word.mainText;
                }

                if (modifier.capitalOption === CapitalOption.Capitalize) {
                    t = t.substr(0, 1).toUpperCase() + t.substr(1);
                }

                return t;
            };

            var referenceValues: { reference: IReference; value: ISampleInstanceValue }[] = [];

            sample.references.forEach(function (ref, iRef, refs) {

                var mInstance = sample.instances.filter(function (instance) {
                    return instance.type.name === ref.name && instance.instanceModKey === ref.modifier.instanceModKey
                });

                if (mInstance.length > 1) {
                    throw new Error("More than one instance exists for the same reference" + ref.rawText);
                } else if (mInstance.length === 0) {
                    throw new Error("No instance exists for the reference: " + ref.rawText);
                }

                var instance = mInstance[0];

                if (instance.value.valueType === SampleValueType.numberValue) {
                    sample.expressions[ref.referenceID] = { referenceID: ref.referenceID, text: "" + instance.value.chosenNumberValue, possibleValuesDebug: instance.value.possibleValuesDebug };
                } else {
                    // DEBUG: Use the raw Text for the text before getting the actual text for the modification
                    // sample.expressions[ref.referenceID] = { referenceID: ref.referenceID, text: instance.value.chosenWord.rawText, possibleValuesDebug: instance.value.possibleValuesDebug };

                    // Get preceeding number
                    // Get preceeding name
                    var numValues = referenceValues.slice(referenceValues.length - 2).filter(function (rv) { return rv.value.valueType === SampleValueType.numberValue; });
                    var nameValues = referenceValues.filter(function (rv) { return rv.value.valueType === SampleValueType.nameValue; });

                    // Must be on same line
                    numValues = numValues.filter((rv) => rv.reference.lineNumber === ref.lineNumber);
                    nameValues = nameValues.filter((rv) => rv.reference.lineNumber === ref.lineNumber);

                    // Get preceeding
                    var preceedingNumber: number = numValues.length > 0 ? numValues[numValues.length - 1].value.chosenNumberValue : 1;
                    var preceedingName: string = nameValues.length > 0 ? nameValues[nameValues.length - 1].value.chosenWord.mainText : "";

                    var textValue = getModifiedWordText(instance.value.chosenWord, ref.modifier, preceedingName, preceedingNumber);

                    sample.expressions[ref.referenceID] = { referenceID: ref.referenceID, text: textValue, possibleValuesDebug: instance.value.possibleValuesDebug };
                }

                referenceValues.push({ reference: ref, value: instance.value });
            });

        }

        static createSample(sampleSet: ISampleSet, scope: IScope): ISample {

            var getWordValue = function (curInstances: ISampleInstance[], wordSet: IWordSet, typeName: string, instanceModKey: string): ISampleInstanceValue {

                var chosenWordGroup: IWordGroup = null;
                var chosenWord: IWord = null;

                // Check for already existing
                var mSameType = curInstances.filter(function (curInstance) { return curInstance.type.name === typeName; });
                var mSameInstance = mSameType.filter(function (curInstance) { return curInstance.instanceModKey === instanceModKey; });

                if (mSameInstance.length > 0) {

                    chosenWordGroup = mSameInstance[0].value.chosenWordGroup;
                    chosenWord = mSameInstance[0].value.chosenWord;

                } else if (mSameType.length > 0) {

                    // Choose different random word from group
                    chosenWordGroup = mSameType[0].value.chosenWordGroup;

                    var remainingWords = chosenWordGroup.words.filter(function (w) {
                        return !mSameType.some(function (s) { return s.value.chosenWord.mainText === w.mainText; });
                    });

                    var rWordIndex = ProblemLoader.getRandomInt(0, remainingWords.length - 1);
                    chosenWord = remainingWords[rWordIndex];

                } else {
                    // Choose random group and random word
                    var gIndex = ProblemLoader.getRandomInt(0, wordSet.groups.length - 1);
                    chosenWordGroup = wordSet.groups[gIndex];

                    var rWordIndex = ProblemLoader.getRandomInt(0, chosenWordGroup.words.length - 1);
                    chosenWord = chosenWordGroup.words[rWordIndex];
                }

                var valueType = chosenWord.genderText !== "" ? SampleValueType.nameValue : SampleValueType.otherWordValue;

                return {
                    chosenWordGroup: chosenWordGroup, chosenWord: chosenWord, valueType: valueType,
                    possibleValuesDebug: wordSet.rawText,
                    hasError: false, chosenNumberValue: null
                };
            };

            var getNumberValue = function (curValues: ISampleInstance[], valInner: IValue): ISampleInstanceValue {

                var val: ISampleInstanceValue = {
                    chosenNumberValue: null, chosenWord: null, chosenWordGroup: null,
                    valueType: SampleValueType.numberValue, possibleValuesDebug: "",
                    hasError: false
                };

                if (valInner.exact !== null) {

                    val.chosenNumberValue = valInner.exact;
                    val.possibleValuesDebug = "" + valInner.exact;

                } else if (valInner.variableRef) {

                    var typeName = valInner.variableRef;
                    var mInstance = curValues.filter(function (curInstance) { return curInstance.type.name === typeName; });

                    if (mInstance.length !== 1) {
                        throw new Error("Ambiguous Variable Reference: (Variable Declarations may be out of order)" + typeName);
                    }

                    val = mInstance[0].value;

                } else if (valInner.operation) {

                    var leftVal = getNumberValue(curValues, valInner.operation.left);
                    var rightVal = getNumberValue(curValues, valInner.operation.right);

                    var op = valInner.operation.operator;
                    var nVal = 0;
                    var pVal = "";

                    if (op === Operator.add) {
                        nVal = leftVal.chosenNumberValue + rightVal.chosenNumberValue;
                        pVal = leftVal.possibleValuesDebug + "+" + rightVal.possibleValuesDebug;
                    } else if (op === Operator.subtract) {
                        nVal = leftVal.chosenNumberValue - rightVal.chosenNumberValue;
                        pVal = leftVal.possibleValuesDebug + "-" + rightVal.possibleValuesDebug;
                    } else if (op === Operator.multiply) {
                        nVal = leftVal.chosenNumberValue * rightVal.chosenNumberValue;
                        pVal = leftVal.possibleValuesDebug + "*" + rightVal.possibleValuesDebug;
                    } else if (op === Operator.divide) {
                        nVal = leftVal.chosenNumberValue / rightVal.chosenNumberValue;
                        pVal = leftVal.possibleValuesDebug + "/" + rightVal.possibleValuesDebug;
                    } else if (op === Operator.modulo) {
                        nVal = leftVal.chosenNumberValue % rightVal.chosenNumberValue;
                        pVal = leftVal.possibleValuesDebug + "%" + rightVal.possibleValuesDebug;
                    }

                    val.chosenNumberValue = nVal;
                    val.possibleValuesDebug = pVal;

                }

                if (valInner.range) {

                    var minVal = getNumberValue(curValues, valInner.range.minValue);
                    var maxVal = getNumberValue(curValues, valInner.range.maxValue);

                    if (val.chosenNumberValue === null) {
                        // Create random range
                        var nVal = ProblemLoader.getRandomInt(minVal.chosenNumberValue, maxVal.chosenNumberValue);
                        var pVal = "[" + minVal.possibleValuesDebug + "," + maxVal.possibleValuesDebug + "]";

                        val.chosenNumberValue = nVal;
                        val.possibleValuesDebug = pVal;

                    } else {
                        // Verify range
                        if (val.chosenNumberValue < minVal.chosenNumberValue ||
                            val.chosenNumberValue > maxVal.chosenNumberValue) {
                            // Out of range
                            val.hasError = true;
                        }
                    }
                }

                return val;
            };

            var getValue = function (curValues: ISampleInstance[], valInner: IValue, typeName: string, instanceModKey: string): ISampleInstanceValue {

                if (valInner.wordSet) {
                    return getWordValue(curValues, valInner.wordSet, typeName, instanceModKey);
                } else {
                    return getNumberValue(curValues, valInner);
                }
            };


            // Calculate Instance values (by order of def)
            var sampleSetDebug = sampleSet;
            var instances: ISampleInstance[] = [];
            var hasError = true;
            var attempts = 0;

            while (hasError && attempts < 25) {

                instances = [];
                hasError = false;
                attempts++;

                var unsortedRefs = sampleSet.references.slice(0);

                // Resort refences by order of variable type definition
                var refs: IReference[] = [];

                scope.allVariables.forEach(function (v) {

                    var wasRefAdded = false;
                    var uMatching = unsortedRefs.filter(function (u) { return u.name === v.name; });

                    uMatching.forEach(function (u) {
                        var i = unsortedRefs.indexOf(u);
                        if (i >= 0) {
                            refs.push(unsortedRefs.splice(i, 1)[0]);
                            wasRefAdded = true;
                        }
                    });
                });

                refs.forEach(function (r) {

                    if (hasError) {
                        // Skip remaining if error is encountered
                        return;
                    }

                    // If reference does not have a instance, create a new instance value
                    var mInstances = instances.filter(function (i) { return i.type === r.variableType && i.instanceModKey === r.modifier.instanceModKey });

                    if (mInstances.length === 0) {

                        var value = getValue(instances, r.variableType.value, r.name, r.modifier.instanceModKey);

                        if (value.hasError) {
                            hasError = true;
                        }

                        instances.push({ type: r.variableType, instanceModKey: r.modifier.instanceModKey, value: value });
                    }

                });
            }

            return { references: sampleSet.references, sortedReferences: refs, instances: instances, expressions: {} };
        }

        static createSampleSet(problem: IProblem): ISampleSet {

            var refs: IReference[] = [];

            // Find all references (reference)
            // Identify each variable type in the references (variable -> type)

            // Create fake refs for all numeric variables in scope
            var allVarText = "";

            problem.scope.allVariables.forEach((v) => {
                if (v.value.wordSet === null) {
                    allVarText += "{" +v.name + "}";
                }
            });

            var fakePhrases = ProblemLoader.parseProblemText( allVarText ).phrases;

            // Find the type of each reference
            problem.question.phrases.concat(problem.answer.phrases).concat(fakePhrases).forEach(function (p) {
                if (p.reference !== null) {

                    var matching = problem.scope.allVariables.filter(function (v) { return v.name === p.reference.name; });

                    if (matching.length === 0) {
                        throw new Error("Unknown variable:'" + p.reference.name + "' in " + problem.questionRawText + "\r\nAnswer:\r\n" + problem.answerRawText);
                    }

                    var foundVarType = matching[matching.length - 1];

                    p.reference.variableType = foundVarType;

                    refs.push(p.reference);

                    //// If no match found, then add it
                    //if (refs.filter(function (v) { return v.variable.name === foundVar.name && v.modifier.idText === p.reference.modifier.idText; }).length === 0) {
                    //    variables.push({ variable: foundVar, modifier: p.reference.modifier });
                    //}
                }
            });


            var sampleDebug = "";

            refs.forEach(function (v) { sampleDebug += v.variableType.rawText + "(" + v.modifier + ")\r\n"; });

            return { references: refs, sampleDebug: sampleDebug, samples: [] };


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

        static nextReferenceID: number = 0;

        static parseProblemText(text: string): IProblemText {
            var rpCaptureBeginBeforeBraces = "(^\\s*[^\\{\\}]+\\s*)(?:{|$)";
            var rpCaptureBeginInsideBraces = "(?:^\\{([^\\{\\}]+)\\})";
            var rpStart = "(?:" + rpCaptureBeginBeforeBraces + "|" + rpCaptureBeginInsideBraces + ")";
            var regexStart = new RegExp(rpStart);

            var regexReference = /^([0-9a-zA-z]*[a-zA-z])([0-9]+)?('s|\+s|-s|\?s|@)?$/;

            var parseReference = function (referenceID: number, lineNumber: number, refText: string): IReference {

                if (refText === "") {
                    return null;
                }

                var m = refText.match(regexReference);
                var name = m[1].toLowerCase();

                var tag = parseInt(m[2] || "0");
                var partOfSpeechOption =
                    m[3] === "'s" ? PartOfSpeechOption.Possessive :
                    m[3] === "@" ? PartOfSpeechOption.Object :
                    PartOfSpeechOption.Subject;

                var singularOption =
                    m[3] === "-s" ? SingularOption.forceSingular :
                    m[3] === "+s" ? SingularOption.forcePlural :
                    SingularOption.matchNumber;

                var firstLetterOfName = m[1][0];
                var capitalOption =
                    firstLetterOfName.toUpperCase() === firstLetterOfName ? CapitalOption.Capitalize : CapitalOption.DontCapitalize;

                var instanceModKey = "" + tag;
                var referenceModKey = tag + ";pos=" + partOfSpeechOption + ";s=" + singularOption;

                var modifier: IModifier = {
                    instanceModKey: instanceModKey, referenceModKey: referenceModKey,
                    tag: tag, partOfSpeechOption: partOfSpeechOption, singularOption: singularOption, capitalOption: capitalOption
                };

                return { referenceID: referenceID, lineNumber: lineNumber, rawText: refText, name: name, modifier: modifier, variableType: null };
            };

            var problemText: IProblemText = { rawText: text, phrases: [] };
            var t = text.trim();
            var m = t.match(regexStart);

            var lineNumber = 0;

            while (m) {

                var plainText = m[1] || "";
                var ref = parseReference(ProblemLoader.nextReferenceID, lineNumber, m[2] || "");

                // Increment line number
                var iText = plainText.indexOf("\r\n", 0);

                while (iText >= 0) {
                    lineNumber++;
                    iText = plainText.indexOf("\r\n", iText + 1);
                }

                // create phrase
                problemText.phrases.push({ plainText: plainText, reference: ref });


                var capturedPart = m[1] || ("{" + m[2] + "}");
                t = t.substr(capturedPart.length);
                m = t.match(regexStart);

                ProblemLoader.nextReferenceID++;
            }

            if (t !== "") {
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
                var pluralText = m[2] || "";
                var genderText = m[3] || "";

                return { rawText: text, mainText: mainText, pluralText: pluralText, genderText: genderText };
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

                if (line === "") {
                    // Skip blank lines
                    continue;
                }

                var parts = line.split("=");
                var name = parts[0].trim().toLowerCase();
                var valueText = parts[1].trim();

                var value = parseValue(valueText);

                variables.push({ rawText: line, name: name, value: value });
            }

            return variables;
        }


        static getRandomInt(minimum: number, maximum: number): number {
            return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
        }
    }

}