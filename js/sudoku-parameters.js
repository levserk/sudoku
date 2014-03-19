var GTW_UPDATE_USER_SETTINGS = "/gw/shared/updateUserSettings.php";

var PM_PLAY_RANDOM = 0;
var PM_PLAY_SUCC = 1;

var GT_ALL = 0;
var GT_EASY = 1;
var GT_SUPEREASY = 11;
var GT_NORMAL = 2;
var GT_HARD = 3;

var PF_ALL = 0;
var PF_NOTWON = 1;
var PF_NOTPLAYED = 2;

function SudokuParametersManager(_gc, _ui, _options) {
    var that = this;

    var gc, ui, cs;

    var playMode;
    var gameType;
    var playFilter;
    var buttons = false;
    var oldGameType; // auto switch to new difficult
    var numClickPrior = 1;
    var showCandidates = true;

    var options = {};

    var i18n = new I18n();
    i18n.setContext('parameters');

    this.resetSettings = function () {
        if (isDef(options.defaultPlayMode)) {
            playMode = options.defaultPlayMode;
        } else {
            playMode = PM_PLAY_RANDOM;
        }
        gameType = GT_ALL;
        playFilter = PF_ALL;
    }

    this.run = function () {

        $("#gpThemeList").val(that.currentTheme);

        cs = gc.getClientServer();
        if (!$("#parametersPanel").is(":visible")) {
            this.setAndShow();
        }
        else {
            ui.hidePanel("parametersPanel");
        }
    }

    this.setAndShow = function () {
        if (playMode == PM_PLAY_RANDOM) {
            $("#playRandomOption").attr("checked", true);
        } else if (playMode == PM_PLAY_SUCC) {
            $("#playSuccOption").attr("checked", true);
        }
        oldGameType = gameType;

        if (gameType == GT_ALL) {
            $("#playAll").attr("checked", true);
        } else if (gameType == GT_EASY) {
            $("#playEasy").attr("checked", true);
        } else if (gameType == GT_NORMAL) {
            $("#playNormal").attr("checked", true);
        } else if (gameType == GT_HARD) {
            $("#playHard").attr("checked", true);
        }

        $("#cbButtonsBottomPanel").attr("checked", buttons);
        if (numClickPrior==1) $("#botButPriority1").attr("checked", true);
        else $("#botButPriority2").attr("checked", true);
        if (buttons) $("#buttonsBottomPanelSub").show();

        $("#dontServePlayedOption").attr("checked", playFilter == PF_NOTPLAYED);
        $("#dontServeWonGamesOption").attr("checked", playFilter == PF_NOTWON);

        $("#gameIdTextField").val("");

        $("#cbHideCandidates").attr("checked",!showCandidates);

        if (options != null && isDef(options.allowToChooseGameType) && !options.allowToChooseGameType) {
            $("#chooseGameTypeSection").hide();

            if (!(isDef(options.allowToChooseCardTheme) && options.allowToChooseCardTheme))
                $("#gpCommitCancelSection").css("margin-top", "30px");
        }

        ui.showPanel({
            id : "parametersPanel",
            type : OVER_FIELD_PANEL
        });
    }

    this.bindAll = function () {
        $("#dontServePlayedOption").change(function () {
            if ($("#dontServePlayedOption").attr("checked")) {
                $("#dontServeWonGamesOption").attr("checked", false);
            }
        });

        $("#dontServeWonGamesOption").change(function () {
            if ($("#dontServeWonGamesOption").attr("checked")) {
                $("#dontServePlayedOption").attr("checked", false);
            }
        });

        $("#gpCommit").bind("click", function () {
            ui.hidePanel("parametersPanel");
            that.updateUserSettings();
            if ($("#gameIdTextField").val() != "") {
                var gameId = parseInt(trimLeadingZeros($("#gameIdTextField").val()));
                if (gameId >= gc.getLowerGameIdBound() && gameId <= gc.getHigherGameIdBound() ||
                    cs.isSuperUser() && gc.isValidGameId(gameId)) {
                    gc.requestGame(gameId);
                } else {
                    ui.alert(
                        i18n.format(
                            "gameIdRangeAlert",
                            gc.getLowerGameIdBound(),
                            gc.getHigherGameIdBound()
                        )
                    );
                }
            } else {
                // gc.startNextGame();
            }

        });

        $("#gpCloseIcon").bind("click", function () {
            ui.hidePanel("parametersPanel");
            that.updateUserSettings();
        });

        $("#gpCancel").bind("click", function () {
            ui.hidePanel("parametersPanel");
        });

        $("#gpThemeList").change(function () {

        });

        $('#cbButtonsBottomPanel').change(function() {
            if(this.checked)
                $("#cbAlternativeControllHelp").attr("checked", false);
            if ($('#cbButtonsBottomPanel').is(':checked')) $("#buttonsBottomPanelSub").show();
            else $("#buttonsBottomPanelSub").hide();
        });
    }

    this.updateUserSettings = function () {
        if ($("#dontServePlayedOption").is(":checked")) {
            playFilter = PF_NOTPLAYED;
        } else if ($("#dontServeWonGamesOption").is(":checked")) {
            playFilter = PF_NOTWON;
        } else {
            playFilter = PF_ALL;
        }

        if ($("#playRandomOption").is(":checked")) {
            playMode = PM_PLAY_RANDOM;
        } else if ($("#playSuccOption").is(":checked")) {
            playMode = PM_PLAY_SUCC;
        }

        if ($("#playAll").is(":checked")) {
            gameType = GT_ALL;
        } else if ($("#playHard").is(":checked")) {
            gameType = GT_HARD;
        } else if ($("#playNormal").is(":checked")) {
            gameType = GT_NORMAL;
        } else if ($("#playEasy").is(":checked")) {
            gameType = GT_EASY;
        } else if ($("#playUnsolved").is(":checked")) {
            gameType = GT_UNSOLVED;
        } else if ($("#playUnplayed").is(":checked")) {
            gameType = GT_UNPLAYED;
        }

        numClickPrior =  ($("#botButPriority1").is(":checked")?1:2);
        buttons = $('#cbButtonsBottomPanel').is(":checked");
        that.gc.game.changeShowButtons(buttons,numClickPrior);
        showCandidates = !$('#cbHideCandidates').is(":checked");

        if (isDef(that.gc.resetNewGameLister)) {
            that.gc.resetNewGameLister();
        }

        that.uploadUserSettings();
    }

    this.uploadUserSettings = function () {
        var settings = new Object();
        settings.playMode = playMode;
        settings.gameType = that.getGameType();
        settings.playFilter = playFilter;
        settings.buttons = buttons;
        settings.numClickPrior = numClickPrior;
        settings.showCandidates = showCandidates;

        var JSONSettings = $.toJSON(settings);

        cs.sendRequest(GTW_UPDATE_USER_SETTINGS, {
            settings : JSONSettings
        });
        if (gameType!=oldGameType) that.gc.startNextGame();
    }

    this.applySettings = function (settingsObj) {
        if (settingsObj != null) {
            if (isDef(settingsObj.playMode)) {
                playMode = settingsObj.playMode;
            }
            if (isDef(settingsObj.gameType)) {
                gameType = settingsObj.gameType;

                if (gameType == GT_UNPLAYED) {
                    gameType = GT_UNSOLVED;
                }
            }
            if (isDef(settingsObj.playFilter)) {
                playFilter = settingsObj.playFilter;

                if (playFilter == PF_NOTPLAYED) {
                    playFilter = PF_ALL;
                }
            }
            if (isDef(settingsObj.buttons)){
                buttons =settingsObj.buttons;
            }

            if (isDef(settingsObj.numClickPrior)){
                numClickPrior = settingsObj.numClickPrior;
            }

            if (isDef(settingsObj.showCandidates)){
                showCandidates = settingsObj.showCandidates;
            }
        }
    }

    this.getPlayMode = function () {
        return playMode;
    }

    this.getGameType = function () {
        if (options != null && isDef(options.allowToChooseGameType) && !options.allowToChooseGameType) {
            return GT_ALL;
        }

        return gameType;
    }

    this.getPlayFilter = function () {
        return playFilter;
    }

    this.getShowCandidates = function () {
        return showCandidates;
    }


    gc = _gc;
    ui = _ui;

    that.gc = gc;
    that.ui = ui;

    if (isDef(_options) && _options != null) {
        options = _options;
    }

    that.options = options;

    that.currentTheme = "windows";

    if (isDef(that.options.allowToChooseCardTheme) && that.options.allowToChooseCardTheme) {
        $("#chooseCardThemeSection").show();
    }

    if (isDef(that.options.currentTheme)) {
        that.currentTheme = that.options.currentTheme;
    }

    this.bindAll();
    this.resetSettings();
}