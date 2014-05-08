/// <reference path="../../typings/knockout/knockout.d.ts" />
/// <reference path="../Support/AccessProviders.ts" />
/// <reference path="_Model.ts" />
/// <reference path="../Core/ProblemLoader.ts" />

module Told.CommonCoreMathProblems.UI {

    export class MainViewModel {

        public providers: Data.IProviders;

        constructor(providers?: Data.IProviders) {

            if (providers == null) {
                providers = Data.createDefaultProviders();
            }

            this.providers = providers;

            var self = this;

            Told.CommonCoreMathProblems.ProblemLoader.loadProblems();
        }

    }

}