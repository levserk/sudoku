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
            $('#infoFieldPanel').fadeIn(100);
        } else {
            $("#tbSupermove").removeClass("cpHighlight");
            $("#tbSupermove").addClass("cpNormal");
            $('#infoFieldPanel').fadeOut(100);
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

    gameListRenderer = new GameListRenderer(gc, this, null);
    historyRenderer = new HistoryRenderer(gc, this, {
        showDays : false,
        showBestAttemptRank : false,
        bindCPButton : true
    });

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
