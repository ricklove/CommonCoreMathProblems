/// <reference path="../../typings/knockout/knockout.d.ts" />
/// <reference path="../Support/AccessProviders.ts" />
/// <reference path="_Model.ts" />
/// <reference path="../Core/ProblemLoader.ts" />

module Told.CommonCoreMathProblems.UI {

    export interface IProblemUI {
        id: number;
        question: string;
        answer: string;
    }

    export class MainViewModel {

        public providers: Data.IProviders;

        constructor(providers?: Data.IProviders) {

            if (providers == null) {
                providers = Data.createDefaultProviders();
            }

            this.providers = providers;

            var self = this;

            Told.CommonCoreMathProblems.ProblemLoader.loadProblems(function (problems) {

                var pUI: IProblemUI[] = [];

                // One of each type
                var id = 1;

                problems.forEach((p) => {
                    var pi = p.problemInstances[0];
                    pUI.push({
                        id: id,
                        question: pi.question
                            .replace(/\r\n/g, "<br/>"),
                        answer: pi.answer
                            .replace(/\r\n/g, "<br/>"),
                        //scope: p.scope.contexts
                    });

                    id++;
                });

                // All problems with debug
                var id = 1;

                problems.forEach((p) => {
                    pUI.push({
                        id: id,
                        question: (p.questionRawText + "\r\n\r\n" + p.problemInstanceDebug.question)
                            .replace(/</g, "&lt;")
                            .replace(/>/g, "&gt;")
                            .replace(/\r\n/g, "<br/>"),
                        answer: (p.answerRawText + "\r\n\r\n" + p.problemInstanceDebug.answer)
                            .replace(/</g, "&lt;")
                            .replace(/>/g, "&gt;")
                            .replace(/\r\n/g, "<br/>"),

                    });

                    p.problemInstances.forEach(pi=>
                        pUI.push({
                            id: null,
                            question: pi.question
                                .replace(/\r\n/g, "<br/>"),
                            answer: pi.answer
                                .replace(/\r\n/g, "<br/>")
                        })
                        );

                    id++;
                });

                self.problems(pUI);
            });


        }

        problems = ko.observable<IProblemUI[]>(null);
    }

}