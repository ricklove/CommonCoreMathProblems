/// <reference path="../../typings/knockout/knockout.d.ts" />
/// <reference path="../Support/AccessProviders.ts" />
/// <reference path="_Model.ts" />
/// <reference path="../Core/ProblemLoader.ts" />
var Told;
(function (Told) {
    (function (CommonCoreMathProblems) {
        (function (UI) {
            var MainViewModel = (function () {
                function MainViewModel(providers) {
                    this.problems = ko.observable(null);
                    if (providers == null) {
                        providers = Told.CommonCoreMathProblems.Data.createDefaultProviders();
                    }

                    this.providers = providers;

                    var self = this;

                    Told.CommonCoreMathProblems.ProblemLoader.loadProblems(function (problems) {
                        var pUI = [];

                        // One of each type
                        var id = 1;

                        problems.forEach(function (p) {
                            var pi = p.problemInstances[0];
                            pUI.push({
                                id: id,
                                question: pi.question.replace(/\r\n/g, "<br/>"),
                                answer: pi.answer.replace(/\r\n/g, "<br/>")
                            });

                            id++;
                        });

                        // All problems with debug
                        var id = 1;

                        problems.forEach(function (p) {
                            pUI.push({
                                id: id,
                                question: (p.questionRawText + "\r\n\r\n" + p.problemInstanceDebug.question).replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\r\n/g, "<br/>"),
                                answer: (p.answerRawText + "\r\n\r\n" + p.problemInstanceDebug.answer).replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\r\n/g, "<br/>")
                            });

                            p.problemInstances.forEach(function (pi) {
                                return pUI.push({
                                    id: null,
                                    question: pi.question.replace(/\r\n/g, "<br/>"),
                                    answer: pi.answer.replace(/\r\n/g, "<br/>")
                                });
                            });

                            id++;
                        });

                        self.problems(pUI);
                    });
                }
                return MainViewModel;
            })();
            UI.MainViewModel = MainViewModel;
        })(CommonCoreMathProblems.UI || (CommonCoreMathProblems.UI = {}));
        var UI = CommonCoreMathProblems.UI;
    })(Told.CommonCoreMathProblems || (Told.CommonCoreMathProblems = {}));
    var CommonCoreMathProblems = Told.CommonCoreMathProblems;
})(Told || (Told = {}));
