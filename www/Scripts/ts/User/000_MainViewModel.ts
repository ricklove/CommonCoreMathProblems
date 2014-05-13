/// <reference path="../../typings/knockout/knockout.d.ts" />
/// <reference path="../Support/AccessProviders.ts" />
/// <reference path="_Model.ts" />
/// <reference path="../Core/ProblemLoader.ts" />

module Told.CommonCoreMathProblems.UI {

    export interface IProblemUI {
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
                problems.forEach((p) => {
                    pUI.push({
                        question: p.problemInstanceDebug.question
                            .replace(/</g, "&lt;")
                            .replace(/>/g, "&gt;")
                            .replace(/\r\n/g, "<br/>"),
                        answer: p.problemInstanceDebug.answer
                            .replace(/</g, "&lt;")
                            .replace(/>/g, "&gt;")
                            .replace(/\r\n/g, "<br/>"),
                    });

                    p.problemInstances.forEach(pi=>
                        pUI.push({
                            question: pi.question
                                .replace(/\r\n/g, "<br/>"),
                            answer: pi.answer
                                .replace(/\r\n/g, "<br/>")
                        })
                        );
                });

                self.problems(pUI);
            });


        }

        problems = ko.observable<IProblemUI[]>(null);
    }

}