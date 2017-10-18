

function updateLoaderProgress(progress) {
    if (typeof($) != 'undefined') {
        $('#loader-progress').progressbar('option', 'value', progress);
    }
}



clientSources = `
    css/style.css 
    js/midi.js 
    js/fakebytearray.js 
    js/tween.js 
    js/classicalnoise.js 
    js/jquerycomponents.js 
    js/guiproperties.js 
    js/guipropertiescomponent.js 
    js/valuecomponents.js 
    js/guiobjectlistcomponent.js 
    js/uniqueidmanager.js 
    js/propertyinfoprovider.js 
    js/songsettingscomponents.js 
    js/asyncoperation.js 
    js/noterepr.js 
    js/audioplayer.js 
    js/sm2player.js 
    js/webaudioplayer.js 
    js/frustumcullingchunks.js 
    js/composevisualizer.js 
    js/composemain.js`.split(/\s+/);

    //    js/testmoduleconstants.js 

composeEditorSources=`
    js/stacktrace.js 
    js/composer/utils.js 
    js/composer/constants.js 
    js/composer/map.js 
    js/composer/mersennetwister.js 
    js/composer/midiconstants.js 
    js/composer/voicelineconstraintsinclude.js 
    js/composer/harmonyelement.js 
    js/composer/dynamicharmonygeneratorconstants.js 
    js/composer/plannedharmonyelement.js 
    js/composer/datasample.js 
    js/composer/testmoduleconstants.js
    js/composer/geninfo.js 
    js/composer/soundfont.js 
    js/songsettings.js`.split(/\s+/)

Modernizr.load(
    [
        {
            both: ["js/jquery-1.8.3.min.js", "js/jquery-ui-1.9.2.custom.js", "css/base/jquery-ui.css"],
            complete: function() {
                console.log("Loaded jQuery!");

                $.uiBackCompat = false;

                // Creating progressbar
                $('#loader-progress').progressbar();
                updateLoaderProgress(10);
            }
        },
        {
            both: composeEditorSources,
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
            both: ["js/jquery.cookie.js", "js/openid-jquery.js", "js/openid-en.js", "css/openid.css", "js/three.min.js"],
            complete: function() {
                console.log("Loaded jQuery plugins and three.js");
                updateLoaderProgress(30);
            }
        },
        {
            test: Modernizr.webgl,
            yep: ["js/webglonly-min.js"],
            complete: function() {
                console.log("Loaded webgl stuff for three.js");
                updateLoaderProgress(40);
            }
        },
        {
            both: clientSources,
            complete: function() {
                updateLoaderProgress(50);

                $(document).ready(function() {
                    composeSetup1();
                });
            }
        }
    ]
);

