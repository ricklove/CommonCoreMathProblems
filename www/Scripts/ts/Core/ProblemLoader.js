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

        (function (SingularOption) {
            SingularOption[SingularOption["matchNumber"] = 0] = "matchNumber";
            SingularOption[SingularOption["forceSingular"] = 1] = "forceSingular";
            SingularOption[SingularOption["forcePlural"] = 2] = "forcePlural";
        })(CommonCoreMathProblems.SingularOption || (CommonCoreMathProblems.SingularOption = {}));
        var SingularOption = CommonCoreMathProblems.SingularOption;

        (function (PartOfSpeechOption) {
            PartOfSpeechOption[PartOfSpeechOption["Subject"] = 0] = "Subject";
            PartOfSpeechOption[PartOfSpeechOption["Object"] = 1] = "Object";
            PartOfSpeechOption[PartOfSpeechOption["Possessive"] = 2] = "Possessive";
        })(CommonCoreMathProblems.PartOfSpeechOption || (CommonCoreMathProblems.PartOfSpeechOption = {}));
        var PartOfSpeechOption = CommonCoreMathProblems.PartOfSpeechOption;

        (function (SampleValueType) {
            SampleValueType[SampleValueType["numberValue"] = 0] = "numberValue";
            SampleValueType[SampleValueType["nameValue"] = 1] = "nameValue";
            SampleValueType[SampleValueType["otherWordValue"] = 2] = "otherWordValue";
        })(CommonCoreMathProblems.SampleValueType || (CommonCoreMathProblems.SampleValueType = {}));
        var SampleValueType = CommonCoreMathProblems.SampleValueType;

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
                var lastScope = { contexts: [lastContext], allVariables: null };
                var lastProblem = { scope: null, questionRawText: "", answerRawText: "", question: null, answer: null, sampleSet: null };

                contexts.push(lastContext);
                scopes.push(lastScope);

                var mode = 0 /* None */;
                var itemText = "";

                var closeItem = function () {
                    if (mode === 3 /* Answer */) {
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

                        if (mode === 0 /* None */) {
                            if (itemText !== "") {
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

                    if (line === "") {
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

                        lastScope = { contexts: lastScope.contexts.slice(0, level), allVariables: null };
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

                // Parse Variables
                contexts.forEach(function (c) {
                    c.variables = ProblemLoader.parseVariables(c.variablesRawText);
                });

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
                problems = problems.slice(2, 3);

                problems.forEach(function (p) {
                    p.problemInstanceDebug = ProblemLoader.createProblemInstance(p, true);

                    p.problemInstances = [];
                    for (var c = 0; c < 5; c++) {
                        p.problemInstances.push(ProblemLoader.createProblemInstance(p, false));
                    }
                });

                var breakdance4 = true;
            };

            ProblemLoader.createProblemInstance = function (problem, isDebug) {
                if (typeof isDebug === "undefined") { isDebug = false; }
                var sample = ProblemLoader.createSample(problem.sampleSet, problem.scope);
                ProblemLoader.populateSampleExpressions(sample);

                problem.sampleSet.samples.push(sample);

                var createText = function (pText) {
                    var t = "";

                    // Go through the phrases and fill in the sample values
                    pText.phrases.forEach(function (phrase) {
                        if (phrase.plainText !== "") {
                            t += phrase.plainText;
                        } else {
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

                    return t;
                };

                var qText = createText(problem.question);
                var aText = createText(problem.answer);

                return { question: qText, answer: aText, problemSource: problem, sampleSource: sample };
            };

            ProblemLoader.populateSampleExpressions = function (sample) {
                var getModifiedWordText = function (word, modifier, preceedingNameMainText, preceedingNumberValue) {
                    var isFirst = word.mainText !== preceedingNameMainText;

                    // If A person
                    if (word.genderText !== "") {
                        if (modifier.partOfSpeechOption === 0 /* Subject */) {
                            if (isFirst) {
                                return word.mainText;
                            } else {
                                return word.genderText;
                            }
                        } else if (modifier.partOfSpeechOption === 1 /* Object */) {
                            if (isFirst) {
                                return word.mainText;
                            } else {
                                if (word.genderText === "he") {
                                    return "him";
                                } else {
                                    return "her";
                                }
                            }
                        } else if (modifier.partOfSpeechOption === 2 /* Possessive */) {
                            if (isFirst) {
                                return word.mainText + "'s";
                            } else {
                                if (word.genderText === "he") {
                                    return "his";
                                } else {
                                    return "her";
                                }
                            }
                        }
                    } else {
                        // If Not a person
                        var shouldShowSingular = false;

                        if (modifier.singularOption === 1 /* forceSingular */) {
                            shouldShowSingular = true;
                        } else if (modifier.singularOption === 2 /* forcePlural */) {
                            shouldShowSingular = false;
                        } else {
                            shouldShowSingular = preceedingNumberValue === 1;
                        }

                        if (shouldShowSingular) {
                            return word.mainText;
                        } else {
                            if (word.pluralText === "") {
                                return word.mainText;
                            } else if (word.pluralText === "s") {
                                return word.mainText + "s";
                            } else if (word.pluralText === "es") {
                                return word.mainText + "es";
                            } else {
                                return word.pluralText;
                            }
                        }
                    }

                    return word.mainText;
                };

                sample.references.forEach(function (ref) {
                    var mInstance = sample.instances.filter(function (instance) {
                        return instance.type.name === ref.name && instance.instanceModKey === ref.modifier.instanceModKey;
                    });

                    if (mInstance.length > 1) {
                        throw new Error("More than one instance exists for the same reference" + ref.rawText);
                    } else if (mInstance.length === 0) {
                        throw new Error("No instance exists for the reference: " + ref.rawText);
                    }

                    var instance = mInstance[0];

                    if (instance.value.valueType === 0 /* numberValue */) {
                        sample.expressions[ref.referenceID] = { referenceID: ref.referenceID, text: "" + instance.value.chosenNumberValue, possibleValuesDebug: instance.value.possibleValuesDebug };
                    } else {
                        // DEBUG: Use the raw Text for the text before getting the actual text for the modification
                        sample.expressions[ref.referenceID] = { referenceID: ref.referenceID, text: instance.value.chosenWord.rawText, possibleValuesDebug: instance.value.possibleValuesDebug };
                    }
                });
                //// Get preceeding number
                //// Get preceeding name
                //var numValues = curValues.slice(curValues.length - 2).filter(function (v3) { return v3.value.numberValue != null; });
                //var nameValues = curValues.filter(function (v3) { return v3.value.isName; });
                //var preceedingNumber: number = numValues.length > 0 ? numValues[numValues.length - 1].value.numberValue : 1;
                //var preceedingName: string = nameValues.length > 0 ? nameValues[nameValues.length - 1].value.chosenWord.mainText : "";
                //var mSameText = mSameReference.filter(function (curInstance) { return curInstance.modifier.idText === modifier.idText; });
                //if (mSameText.length > 0) {
                //    textValue = mSameText[0].value.textValue;
                //    chosenWordGroup = mSameText[0].value.chosenWordGroup;
                //    chosenWord = mSameText[0].value.chosenWord;
                //} else
                //textValue = getModifiedWordText(mSameReference[0].value.chosenWord, modifier, preceedingName, preceedingNumber);
                //textValue = getModifiedWordText(chosenWord, modifier, preceedingName, preceedingNumber);
            };

            ProblemLoader.createSample = function (sampleSet, scope) {
                var getWordValue = function (curInstances, wordSet, typeName, instanceModKey) {
                    var chosenWordGroup = null;
                    var chosenWord = null;

                    // Check for already existing
                    var mSameType = curInstances.filter(function (curInstance) {
                        return curInstance.type.name === typeName;
                    });
                    var mSameInstance = mSameType.filter(function (curInstance) {
                        return curInstance.instanceModKey === instanceModKey;
                    });

                    if (mSameInstance.length > 0) {
                        chosenWordGroup = mSameInstance[0].value.chosenWordGroup;
                        chosenWord = mSameInstance[0].value.chosenWord;
                    } else if (mSameType.length > 0) {
                        // Choose different random word from group
                        chosenWordGroup = mSameType[0].value.chosenWordGroup;

                        var remainingWords = chosenWordGroup.words.filter(function (w) {
                            return !mSameType.some(function (s) {
                                return s.value.chosenWord.mainText === w.mainText;
                            });
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

                    var valueType = chosenWord.genderText !== "" ? 1 /* nameValue */ : 2 /* otherWordValue */;

                    return {
                        chosenWordGroup: chosenWordGroup, chosenWord: chosenWord, valueType: valueType,
                        possibleValuesDebug: wordSet.rawText,
                        hasError: false, chosenNumberValue: null
                    };
                };

                var getNumberValue = function (curValues, valInner) {
                    var val = {
                        chosenNumberValue: null, chosenWord: null, chosenWordGroup: null,
                        valueType: 0 /* numberValue */, possibleValuesDebug: "",
                        hasError: false
                    };

                    if (valInner.exact !== null) {
                        val.chosenNumberValue = valInner.exact;
                        val.possibleValuesDebug = "" + valInner.exact;
                    } else if (valInner.variableRef) {
                        var typeName = valInner.variableRef;
                        var mInstance = curValues.filter(function (curInstance) {
                            return curInstance.type.name === typeName;
                        });

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

                        if (op === 0 /* add */) {
                            nVal = leftVal.chosenNumberValue + rightVal.chosenNumberValue;
                            pVal = leftVal.possibleValuesDebug + "+" + rightVal.possibleValuesDebug;
                        } else if (op === 1 /* subtract */) {
                            nVal = leftVal.chosenNumberValue - rightVal.chosenNumberValue;
                            pVal = leftVal.possibleValuesDebug + "-" + rightVal.possibleValuesDebug;
                        } else if (op === 2 /* multiply */) {
                            nVal = leftVal.chosenNumberValue * rightVal.chosenNumberValue;
                            pVal = leftVal.possibleValuesDebug + "*" + rightVal.possibleValuesDebug;
                        } else if (op === 3 /* divide */) {
                            nVal = leftVal.chosenNumberValue / rightVal.chosenNumberValue;
                            pVal = leftVal.possibleValuesDebug + "/" + rightVal.possibleValuesDebug;
                        } else if (op === 4 /* modulo */) {
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
                            if (val.chosenNumberValue < minVal.chosenNumberValue || val.chosenNumberValue > maxVal.chosenNumberValue) {
                                // Out of range
                                val.hasError = true;
                            }
                        }
                    }

                    return val;
                };

                var getValue = function (curValues, valInner, typeName, instanceModKey) {
                    if (valInner.wordSet) {
                        return getWordValue(curValues, valInner.wordSet, typeName, instanceModKey);
                    } else {
                        return getNumberValue(curValues, valInner);
                    }
                };

                // Calculate Instance values (by order of def)
                var sampleSetDebug = sampleSet;
                var instances = [];
                var hasError = true;

                while (hasError) {
                    instances = [];
                    hasError = false;

                    var unsortedRefs = sampleSet.references.slice(0);

                    // Resort refences by order of variable type definition
                    var refs = [];

                    scope.allVariables.forEach(function (v) {
                        var uMatching = unsortedRefs.filter(function (u) {
                            return u.name === v.name;
                        });

                        uMatching.forEach(function (u) {
                            var i = unsortedRefs.indexOf(u);
                            if (i >= 0) {
                                refs.push(unsortedRefs.splice(i, 1)[0]);
                            }
                        });
                    });

                    refs.forEach(function (r) {
                        if (hasError) {
                            // Skip remaining if error is encountered
                            return;
                        }

                        // If reference does not have a instance, create a new instance value
                        var mInstances = instances.filter(function (i) {
                            return i.type === r.variableType && i.instanceModKey === r.modifier.instanceModKey;
                        });

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
            };

            ProblemLoader.createSampleSet = function (problem) {
                var refs = [];

                // Find all references (reference)
                // Identify each variable type in the references (variable -> type)
                // Find the type of each reference
                problem.question.phrases.concat(problem.answer.phrases).forEach(function (p) {
                    if (p.reference !== null) {
                        var matching = problem.scope.allVariables.filter(function (v) {
                            return v.name === p.reference.name;
                        });

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

                refs.forEach(function (v) {
                    sampleDebug += v.variableType.rawText + "(" + v.modifier + ")\r\n";
                });

                return { references: refs, sampleDebug: sampleDebug, samples: [] };
            };

            ProblemLoader.flattenContextVariables = function (contexts) {
                var vars = [];

                contexts.forEach(function (c) {
                    c.variables.forEach(function (v) {
                        vars.push(v);
                    });
                });

                return vars;
            };

            ProblemLoader.parseProblemText = function (text) {
                var rpCaptureBeginBeforeBraces = "(^\\s*[^\\{\\}]+\\s*)(?:{|$)";
                var rpCaptureBeginInsideBraces = "(?:^\\{([^\\{\\}]+)\\})";
                var rpStart = "(?:" + rpCaptureBeginBeforeBraces + "|" + rpCaptureBeginInsideBraces + ")";
                var regexStart = new RegExp(rpStart);

                var regexReference = /^([0-9a-zA-z]*[a-zA-z])([0-9]+)?('s|\\+s|-s|\\?s|@)?$/;

                var parseReference = function (referenceID, refText) {
                    if (refText === "") {
                        return null;
                    }

                    var m = refText.match(regexReference);
                    var name = m[1];

                    var tag = parseInt(m[2] || "0");
                    var partOfSpeechOption = m[3] === "'s" ? 2 /* Possessive */ : m[3] === "@" ? 1 /* Object */ : 0 /* Subject */;

                    var singularOption = m[3] === "-s" ? 1 /* forceSingular */ : m[3] === "+s" ? 2 /* forcePlural */ : 0 /* matchNumber */;

                    var instanceModKey = "" + tag;
                    var referenceModKey = tag + ";pos=" + partOfSpeechOption + ";s=" + singularOption;

                    var modifier = {
                        instanceModKey: instanceModKey, referenceModKey: referenceModKey,
                        tag: tag, partOfSpeechOption: partOfSpeechOption, singularOption: singularOption
                    };

                    return { referenceID: referenceID, rawText: refText, name: name, modifier: modifier, variableType: null };
                };

                var problemText = { rawText: text, phrases: [] };
                var t = text.trim();
                var m = t.match(regexStart);

                while (m) {
                    problemText.phrases.push({ plainText: m[1] || "", reference: parseReference(ProblemLoader.nextReferenceID, m[2] || "") });

                    var capturedPart = m[1] || ("{" + m[2] + "}");
                    t = t.substr(capturedPart.length);
                    m = t.match(regexStart);

                    ProblemLoader.nextReferenceID++;
                }

                if (t !== "") {
                    throw new Error("Not all the text was captured. Ensure that each {brace} is closed properly.");
                }

                return problemText;
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
                    var pluralText = m[2] || "";
                    var genderText = m[3] || "";

                    return { rawText: text, mainText: mainText, pluralText: pluralText, genderText: genderText };
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

                    return { rawText: text, groups: groups };
                };

                var parseValue = function (text) {
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

                        var operator = oText === "+" ? 0 /* add */ : oText === "-" ? 1 /* subtract */ : oText === "*" ? 2 /* multiply */ : oText === "/" ? 3 /* divide */ : 4 /* modulo */;

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

            ProblemLoader.getRandomInt = function (minValue, maxValue) {
                return Math.floor(minValue + Math.random() * (maxValue - minValue));
            };
            ProblemLoader.baseUrl = "";

            ProblemLoader.nextReferenceID = 0;
            return ProblemLoader;
        })();
        CommonCoreMathProblems.ProblemLoader = ProblemLoader;
    })(Told.CommonCoreMathProblems || (Told.CommonCoreMathProblems = {}));
    var CommonCoreMathProblems = Told.CommonCoreMathProblems;
})(Told || (Told = {}));
