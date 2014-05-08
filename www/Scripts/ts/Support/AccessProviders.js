/// <reference path="AccessUserSettings.ts" />
var Told;
(function (Told) {
    (function (CommonCoreMathProblems) {
        (function (Data) {
            function createDefaultProviders() {
                return {
                    userSettings: new Told.CommonCoreMathProblems.Data.UserSettings_LocalStorage()
                };
            }
            Data.createDefaultProviders = createDefaultProviders;
        })(CommonCoreMathProblems.Data || (CommonCoreMathProblems.Data = {}));
        var Data = CommonCoreMathProblems.Data;
    })(Told.CommonCoreMathProblems || (Told.CommonCoreMathProblems = {}));
    var CommonCoreMathProblems = Told.CommonCoreMathProblems;
})(Told || (Told = {}));
