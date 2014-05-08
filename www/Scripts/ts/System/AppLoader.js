﻿var Told;
(function (Told) {
    (function (AppLoader) {
        function loadScripts(scriptList, onLoaded, onProgress) {
            function loadScriptInner(url, onScriptLoad) {
                // Based on jQuery.getScript
                var head = document.getElementsByTagName("head")[0] || document.documentElement;
                var script = document.createElement("script");
                script.src = url;

                // Handle Script loading
                var done = false;

                // Attach handlers for all browsers
                script.onload = script.onreadystatechange = function () {
                    if (!done && (!this.readyState || this.readyState === "loaded" || this.readyState === "complete")) {
                        done = true;

                        onScriptLoad();

                        // Handle memory leak in IE
                        script.onload = script.onreadystatechange = null;
                        if (head && script.parentNode) {
                            head.removeChild(script);
                        }
                    }
                };

                // Use insertBefore instead of appendChild  to circumvent an IE6 bug.
                // This arises when a base node is used (#2709 and #4378).
                head.insertBefore(script, head.firstChild);
            }

            var scriptsToLoad = [];
            var scriptCount = 0;
            var isLoading = false;

            var loadNextScript = function () {
                if (onProgress) {
                    onProgress(1.0 - (scriptsToLoad.length / scriptCount));
                }

                if (scriptsToLoad.length > 0) {
                    var nextScript = scriptsToLoad.shift();
                    loadScriptInner(nextScript, loadNextScript);
                } else {
                    isLoading = false;
                    if (onProgress) {
                        onProgress(1);
                    }
                    onLoaded();
                }
            };

            function loadScript(url) {
                scriptsToLoad.push(url);
                scriptCount++;

                if (!isLoading) {
                    isLoading = true;

                    setTimeout(loadNextScript, 0);
                }
            }

            scriptList.map(function (s) {
                loadScript(s);
            });
        }
        AppLoader.loadScripts = loadScripts;

        function loadScript(url, onLoaded) {
            loadScripts([url], onLoaded);
        }
        AppLoader.loadScript = loadScript;

        function loadCss(url) {
            var link = document.createElement("link");
            link.type = "text/css";
            link.rel = "stylesheet";
            link.href = url;
            document.getElementsByTagName("head")[0].appendChild(link);
        }
        AppLoader.loadCss = loadCss;

        function loadRequirements_Main(onLoaded, onProgress) {
            loadCss('Styles/css/External/base.css');
            loadCss('Styles/css/External/skeleton.css');
            loadCss('Styles/css/External/layout.css');
            loadCss('Styles/css/Theme.css');

            loadCss('Styles/css/App.css');

            var scriptList = [
                'Scripts/js/External/jquery.min.js',
                'Scripts/js/External/knockout-3.0.0.min.js',
                'Scripts/js/External/dust-full-0.3.0.min.js',
                'Scripts/ts/Support/AccessUserSettings.js',
                'Scripts/ts/Support/AccessProviders.js',
                'Scripts/ts/Core/ProblemLoader.js',
                'Scripts/ts/User/000_MainViewModel.js'
            ];

            loadScripts(scriptList, onLoaded, onProgress);
        }
        AppLoader.loadRequirements_Main = loadRequirements_Main;

        function loadRequirements_Testing(onLoaded, onProgress) {
            loadCss('Styles/css/External/qunit-1.14.0.css');

            var scriptList = [
                'Scripts/js/External/qunit-1.14.0.min.js',
                'Scripts/ts/System/FeatureTests.js'
            ];

            loadScripts(scriptList, onLoaded, onProgress);
        }
        AppLoader.loadRequirements_Testing = loadRequirements_Testing;

        function loadRequirements_UnitTests(onLoaded, onProgress) {
            var scriptList = [];

            loadScripts(scriptList, onLoaded, onProgress);
        }
        AppLoader.loadRequirements_UnitTests = loadRequirements_UnitTests;
    })(Told.AppLoader || (Told.AppLoader = {}));
    var AppLoader = Told.AppLoader;
})(Told || (Told = {}));
