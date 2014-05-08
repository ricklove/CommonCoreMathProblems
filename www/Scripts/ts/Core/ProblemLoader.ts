/// <reference path="../../typings/jquery/jquery.d.ts" />

module Told.CommonCoreMathProblems {

    export interface IVariable {
        rawText: string;
    }

    export interface IContext {
        heading: string;
        variablesRawText: string;
        variables: IVariable[];
    }

    export interface IScope {
        contexts: IContext[];
    }

    export interface IProblem {
        scope: IScope;
        questionRawText: string;
        answerRawText: string;
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
            var lastProblem: IProblem = { scope: null, questionRawText: "", answerRawText: "" };

            var itemText = "";

            contexts.push(lastContext);
            scopes.push(lastScope);

            var mode: ParseMode = ParseMode.None;

            // Parse Into Raw Texts
            for (var iLine = 0; iLine < lines.length; iLine++) {
                var line = lines[iLine].trim();

                if (line == "") {
                    // Skip blank lines
                    continue;
                }

                var closeItem = function () {

                    if (mode === ParseMode.Answer) {

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

            // Parse Raw Texts
            var breakdance = true;
        }

    }

}