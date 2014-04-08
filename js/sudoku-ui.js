var OVER_FIELD_PANEL = 0;
var BOTTOM_PANEL = 1;

function SudokuUI(_gc) {
    var that = this;

//    var gc;

    var gameListRenderer, historyRenderer, gameInfoRenderer, ratingsRenderer, guestBookRenderer,
        loginRegisterManager, bonusRenderer;

    var fireworksRenderer;

    this.showGameListPanel = function () {
        gameListRenderer.run();
    }

    this.showHistoryPanel = function () {
        historyRenderer.run();
    }

    this.showGameInfo = function (gameId) {
        var gameId = ifDef(gameId, gc.getGameManager().getGameId());

        gameInfoRenderer.run(gameId);
    }

    this.showRatingsPanel = function () {
        ratingsRenderer.run();
    }

    this.updateActivity = function (guestCount, loggedCount, regCount) {

    }

    this.fireworks = function () {
        fireworksRenderer.fire();
    }

    this.getFieldBounds = function () {
        return {
            left : $("#field").offset().left,
            top : $("#field").offset().top,
            width : $("#field").width(),
            height : $("#field").height()
        }
    }

    this.showRegPanel = function () {
        loginRegisterManager.showRegMePanel();
    }


    this.updateShowPossibleMovesButton = function () {
        if (gc.doShowPossibleMoves()) {
            $("#tbShowPossibleMoves").removeClass("cpNormal");
            $("#tbShowPossibleMoves").addClass("cpHighlight");
        } else {
            $("#tbShowPossibleMoves").removeClass("cpHighlight");
            $("#tbShowPossibleMoves").addClass("cpNormal");
        }
    }

    this.updateAutoMove = function () {
        if (gc.doAutoTurn()) {
            $("#tbAutomove").removeClass("cpNormal");
            $("#tbAutomove").addClass("cpHighlight");
        } else {
            $("#tbAutomove").removeClass("cpHighlight");
            $("#tbAutomove").addClass("cpNormal");
        }
    }

    this.updateSuperMove = function (f, fc) {
        if (fc)  $("#tbSupermove").html(contexts.card.specialMoveCancel)
        else  $("#tbSupermove").html(contexts.card.specialMove)
        if (f) {
            $("#tbSupermove").removeClass("cpNormal");
            $("#tbSupermove").addClass("cpHighlight");
            $('#gameMessage').html('Выберите клетку или нажмите ESC для отмены.').fadeIn(100);
        } else {
            $("#tbSupermove").removeClass("cpHighlight");
            $("#tbSupermove").addClass("cpNormal");
            $('#gameMessage').fadeOut(100);
        }
    }

    this.showCongratulations = function (callbackFn) {
        $.doTimeout(500, function () {
            //fireworksRenderer.fire();
            $("#winBox").css("top", "205px");
            $('.desc').css('opacity','0.2');
            if (isDef(callbackFn)) {
                $("#winBox").fadeIn(callbackFn);
            } else {
                $("#winBox").fadeIn();
            }
        });
        $.doTimeout(15000, function () {
            that.hideCongratulations();
        })
    }

    this.gameStateChanged = function () {
        this.updateGameStats();
    }

    this.hideCongratulations = function () {
        //fireworksRenderer.suppress();
        $("#winBox").stop(false, true);
        $("#winBox").hide();
        $("#bonusNotice").stop(false, true);
        $("#bonusNotice").hide();
        $('.desc').css('opacity','1');
    }

    this.newGameStarted = function () {
        this.hideCongratulations();
    }

    this.newAttemptStarted = function () {
        this.hideCongratulations();
    }

    this.renderBonus = function (bonus) {
        bonusRenderer.render(bonus);
    }

    multiExtendClass(SudokuUI, SharedUI, this);

    that.setGameController(_gc);
    that.setupSharedUI();

    var gc = _gc;

    that.gc = _gc;

    gameListRenderer = new GameListRenderer(gc, this, {showDifficult:true});
    historyRenderer = new HistoryRenderer(gc, this, {
        showDays : false,
        showBestAttemptRank : false,
        bindCPButton : true
    });

    this.updateGameStats = function () {
//        _w("updateGameStats");

        var gm = that.gc.getGameManager();

//        alert(gm);

        if (gm) {
            var gameId = gm.getGameId();

            var gameIdHTML = "<span>" + gameId + "</span>";

            //////////

            var gameInfo = gm.getGameInfo();

            var gameInfoHTML = "—";

            if (gameInfo.totalPlayed > 0) {
                gameInfoHTML = (gameInfo.avgWinTime > 0 ? formatGameTimeMS(gameInfo.avgWinTime) : "—")
                    + (that.options.showWinCount?" (" + gameInfo.totalWon + "/" + gameInfo.totalPlayed + ")":"");
            }

            gameInfoHTML = "<span>" + that.i18n.get("ratingLabel") + " " + gameInfoHTML + " </span>";

            if (that.options.showGameLabel) {
                gameInfoHTML = "<span>" + gameInfo.label + "</span> / " + gameInfoHTML;
            }

            //////////

            var historyLengthHTML = "";

            if (that.options.showHistoryLength) {
                historyLengthHTML = "<span>" + that.i18n.get("historyLengthLabel")
                    + " " + that.gc.getGameManager().getHistoryLength() + "</span>";
            }

            //////////

            var gt = gm.getGameTimer();

            var timeMS = gt.getTime();

            var timeStr = formatGameTime(timeMS);

            var totalGameTime = gm.getTotalGameTime();

            var totalGameTimeStr = formatGameTime(totalGameTime);

            if (gt.isFrozen()) {
                var timeHTML = "<span class='frozenTime'>" + that.i18n.get("attemptTimeLabel") + " " + timeStr + "</span>";
                var totalGameTimeHTML = "<span class='frozenTime'>" + that.i18n.get("gameTimeLabel") + " " + totalGameTimeStr + "</span>";
            } else {
                timeHTML = "<span>" + that.i18n.get("attemptTimeLabel") + " " + timeStr + "</span>";
                totalGameTimeHTML = "<span>" + that.i18n.get("gameTimeLabel") + " " + totalGameTimeStr + "</span>";
            }

            //////////

            $("#gameStatePanel").empty().append(gameIdHTML + " / "
                + gameInfoHTML + " / "
                + (that.options.showHistoryLength ? (historyLengthHTML + " / ") : "")
                + timeHTML + " / " + totalGameTimeHTML);
            if (!gc.gameType())$("#gameStatePanel").show();

        } else {
            that.setGameLoading();
        }
    };

    // HACK, TODO
    that.historyRenderer = historyRenderer;

    gameInfoRenderer = new GameInfoRenderer(gc, this, {showSolution : false})
    ratingsRenderer = new RatingsRenderer(gc, this, {
        showTimeRatings : true
    });
    guestBookRenderer = new GuestBookRenderer(gc, this, null);
    fireworksRenderer = new FireworksRenderer(this);

        loginRegisterManager = new LoginRegisterManager(_isFreshUser, this, gc, {
            showWelcomePanel : true
        });

    bonusRenderer = new BonusRenderer(gc, this, null);

    that.informationRenderer = new InformationReneder(that.gc, that, null);
    that.options.showHistoryLength=true;
    that.options.showWinCount=false;
    that.options.showGameLabel = true;
}
