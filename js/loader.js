

function updateLoaderProgress(progress) {
/*    if (typeof($) != 'undefined') {
        $('#loader-progress').progressbar('option', 'value', progress);
    }
    */
}

Modernizr.load(
    [
        {
            both: [],
            complete: function() {
                console.log("Loaded jQuery!");

                $.uiBackCompat = false;

                // Creating progressbar
                $('#loader-progress').progressbar();
                updateLoaderProgress(10);
            }
        },
        {
            both: [],
            complete: function() {
                loadSettingsFromLocalStorage();
                var theme = JQueryUITheme.toUrlString(themeSettings.theme);
                console.log("loading theme: " + theme);
                var themeHref = "css/" + theme + "/jquery.ui.theme.css";
                Modernizr.load(themeHref);
                updateLoaderProgress(20);
            }
        },
        {
            both: [],
            complete: function() {
                console.log("Loaded jQuery plugins and three.js");
                updateLoaderProgress(30);
            }
        },
        {
            test: Modernizr.webgl,
            yep: [],
            complete: function() {
                console.log("Loaded webgl stuff for three.js");
                updateLoaderProgress(40);
            }
        },
        {
            both: [],
            complete: function() {
                updateLoaderProgress(50);

                $(document).ready(function() {
                    composeSetup1();
                });
            }
        }
    ]
);

$(function() {

    loadSettingsFromLocalStorage();
 
    composeSetup1();
});

