/// <reference path="../../typings/jQuery/jQuery.d.ts" />
var Told;
(function (Told) {
    (function (CommonCoreMathProblems) {
        (function (Data) {
            var UserSettings_LocalStorage = (function () {
                function UserSettings_LocalStorage() {
                }
                /*
                * Get User Settings from local storage provider
                *
                * @param key which setting to retrieve
                * @returns the value, or null if not found
                */
                UserSettings_LocalStorage.getUserSetting = function (key) {
                    var value = localStorage.getItem(key);
                    console.log("Get User Setting:" + key + "=" + value);
                    return value;
                };

                UserSettings_LocalStorage.setUserSetting = function (key, value) {
                    localStorage.setItem(key, value);
                    console.log("Set User Setting:" + key + "=" + value);
                };
                return UserSettings_LocalStorage;
            })();
            Data.UserSettings_LocalStorage = UserSettings_LocalStorage;
        })(CommonCoreMathProblems.Data || (CommonCoreMathProblems.Data = {}));
        var Data = CommonCoreMathProblems.Data;
    })(Told.CommonCoreMathProblems || (Told.CommonCoreMathProblems = {}));
    var CommonCoreMathProblems = Told.CommonCoreMathProblems;
})(Told || (Told = {}));
