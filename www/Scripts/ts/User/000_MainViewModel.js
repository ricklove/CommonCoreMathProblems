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
                    if (providers == null) {
                        providers = Told.CommonCoreMathProblems.Data.createDefaultProviders();
                    }

                    this.providers = providers;

                    var self = this;

                    Told.CommonCoreMathProblems.ProblemLoader.loadProblems();
                }
                return MainViewModel;
            })();
            UI.MainViewModel = MainViewModel;
        })(CommonCoreMathProblems.UI || (CommonCoreMathProblems.UI = {}));
        var UI = CommonCoreMathProblems.UI;
    })(Told.CommonCoreMathProblems || (Told.CommonCoreMathProblems = {}));
    var CommonCoreMathProblems = Told.CommonCoreMathProblems;
})(Told || (Told = {}));
