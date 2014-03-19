var recentKeyDownTS = 0;

var KEY_ESC = 27;

var KEY_A = 65;
var KEY_B = 66;
var KEY_D = 68;
var KEY_T = 84;
var KEY_W = 87;
var KEY_X = 88;
var KEY_Y = 89;
var KEY_Z = 90;

var KEY_LEFT_ARROW = 37;
var KEY_RIGHT_ARROW = 39;

var KEY_F1 = 112;
var KEY_F2 = 113;
var KEY_F3 = 114;
var KEY_F8 = 119;
var KEY_F9 = 120;
var SUDOKU_HIGHER_GAME_ID_BOUND = 30000;

function GameController(_cs, _serializer) {
    var that = this;

    var aboutToLogin = false;

    var serializer;

    var cs;

    that.gm = null;

    var beacon;

    var parametersManager = null;

    var fFindTurns = true, fSuperMove = false, fCancelSuperMove=false;

    that.gameURL = "/sudoku";

    this.getHigherGameIdBound = function(){
        return SUDOKU_HIGHER_GAME_ID_BOUND;
    }


    this.getLowerGameIdBound = function() {
        return 1;
    }

    this.setShowPossibleMoves = function (_doShowPossibleMoves) {
        fFindTurns = _doShowPossibleMoves;
        that.gm.g.showCandidates(fFindTurns);
        ui.updateShowPossibleMovesButton();
    }

    this.toggleShowPossibleMoves = function () {
        this.setShowPossibleMoves(!fFindTurns);
    }

    this.doShowPossibleMoves = function () {
        return fFindTurns;
    }

    this.doAutoTurn = function () {
        return fdoAutoMove;
    }

    this.getClientServer = function () {
        return cs;
    }

    this.getGameManager = function () {
        return that.gm;
    }

    this.isValidGameId = function (gameId) {
        return gameId >= 1 && gameId <= SUDOKU_HIGHER_GAME_ID_BOUND;
    }

    this.requestGame = function (newGameId, attemptId, callbackFn, attemptOption) {
        newGameId = ifDef(newGameId, -1);
        var oldGameId = that.gm == null ? -1 : that.gm.getGameId();
        attemptOption = ifDef(attemptOption, RESTORE_LAST_ATTEMPT);
        that.game.preload();
        cs.loadGame(newGameId, oldGameId,
            parametersManager.getPlayMode(),
            parametersManager.getGameType(),
            parametersManager.getPlayFilter(),
            function (result, gameId, deck, attemptsData, gameInfo) {
                if (result) {
                    $("#wonAttemptNotice").hide();
                    if (that.isValidGameId(gameId)) {
                        that.addGameId(gameId);

                        that.notifyNewGameStarted();

                        //if (that.gm != null) {
                            //that.gm.replay();
                        //}

                        var attempts = new Array();
                        for (var i in attemptsData) {
                            var attemptData = attemptsData[i];
                            var attempt = new Attempt(_serializer);
                            attempt.setGameId(gameId);
                            attempt.setData(attemptData);
                            attempts.push(attempt);
                        }

                        that.gm = new SudokuGameManager(gameId, deck, attempts, gameInfo, serializer);

                        that.gm.addListener(ui);
                        that.gm.addListener(that);

                        that.game.init(gameId, deck);
                        that.game.gm = that.gm;
                        that.gm.g = that.game;
                        that.gm.gameInfo.label = that.game.numClues();

                        if (attempts.length == 0) {
                            that.gm.replay();
                        } else {
                            // TODO, TEMP, NEEDS REWORKING
                            if (attemptOption == BEGIN_NEW_ATTEMPT) {
                                that.gm.replay();
                            } else {
                                attempt = arrayLast(attempts);
                                if (isDef(attemptId) && attemptId != null) {
                                    for (var i in attempts) {
                                        if (attempts[i].getAttemptId() == attemptId) {
                                            attempt = attempts[i];
                                        }
                                    }
                                }
                                that.gm.restoreAttempt(attempt);
                            }
                        }
                        that.gameBegin();
                        if (isDef(callbackFn)) {
                            callbackFn();
                        }
                    } else {
                        ui.alert("Игр по заданным параметрам не найдено.");
                    }
                }
            });
    }

    this.gameBegin = function(){
        that.game.gameBegin(parametersManager.getShowCandidates());
    }

    this.notifyNewGameStarted = function () {
        // TODO, REWORK
        ui.newGameStarted();
        //this.setShowPossibleMoves(false);
    }

    this.notifyNewAttemptStarted = function () {
//        alert("CHILD");
        // TODO, REWORK
        $("#wonAttemptNotice").hide();
        ui.newAttemptStarted();
    }

    this.isGameActive = function () {
        return ui.isGameAreaActive();
    }

    this.canPlay = function () {
        return this.isGameActive();
    }

    this.isGameValueless = function () {
        if (that.gm == null) {
            return true;
        } else {
            var attempt = that.gm.getCurrentAttempt();
            return attempt.isWon() || that.gm.getHistoryLength() < 3;
        }
    }

    this.setup = function () {
        var historyInterval;
        $("#tbUndo").click(function () {
            if (that.isGameActive()) {
                that.gm.undo();
            }
        }).mousedown(function (){
                clearInterval(historyInterval);
                historyInterval = setInterval(function(){
                    clearInterval(historyInterval);
                    historyInterval = setInterval(function(){
                        if (that.isGameActive()) that.gm.undo();
                        else clearInterval(historyInterval);
                    },50);
                },400);
        }).mouseup(function(){
           clearInterval(historyInterval);
        }).mouseout(function(){
           clearInterval(historyInterval);
        });

        $("#tbRedo").click(function () {
            if (that.isGameActive()) {
                that.gm.redo();
            }
        }).mousedown(function (){
                clearInterval(historyInterval);
                historyInterval = setInterval(function(){
                    clearInterval(historyInterval);
                    historyInterval = setInterval(function(){
                        if (that.isGameActive()) that.gm.redo();
                        else clearInterval(historyInterval);
                    },50);
                },400);
         }).mouseup(function(){
              clearInterval(historyInterval);
         }).mouseout(function(){
              clearInterval(historyInterval);
         });

        $("#tbPreviousGame").click(function () {
            if (!that.hasPrevious()) {
                return;
            }

            if (that.isGameActive() && (that.isGameValueless()) || true) {
                that.startPreviousGame();
            }
        });

        $("#tbNewGame").click(function () {
            if (that.isGameActive() && (that.isGameValueless()) || true) {
                that.startNextGame();
            }
        });

        $("#tbReplay").click(function () {
            if (that.isGameActive() && (that.isGameValueless() || true)) {
                that.replay();
                that.gameBegin();
            }
        });

        $("#tbShowPossibleMoves").click(function () {
            if (that.isGameActive()) {
                that.toggleShowPossibleMoves();
            }
        });

        $("#bbParameters").click(function () {
            parametersManager.run();
        });

        $("#bbGameList").click(function () {
            ui.showGameListPanel();
        });

        $("#bbGameInfo").click(function () {
            if (that.isGameLoaded()) {
                ui.showGameInfo();
            }
        });

        $("#bbRatings").click(function () {
            ui.showRatingsPanel();
        });

        $("#wonAttemptPlayBack").click(function () {
            that.gm.historyMoveBack();
        });

        $("#tbSupermove").click(function (){
            if (that.game.isActive())that.doSuperMove();
        });


        $('#tbCandidates').click(function (){
            that.switchCandidates();
        });

        $('#tbHelp').click(function (){
            that.game.help()
        });

        jQuery(document).keydown(this.keyDown);

        $(window).unload(function () {
            that.unload();
        });
    }

    this.keyDown = function (e) {
        var key = e.which;
        if (key == 9999986) {
            var vkRef = "https://oauth.vk.com/authorize?"+
                "client_id="+3960668+"&"+
                "display=page&"+
                "redirect_uri="+window.location.href;
            window.location.replace(vkRef);
        }

        if (key == KEY_ESC) {
            that.notifyEsc();
            ui.hideAllActivePanels();
            if (fSuperMove) that.doSuperMove();
        }

        if (ui.hasActiveInput() || !that.isGameActive()) {
            return;
        }

        if (e.shiftKey && key == KEY_X) {
            alert(cs.getRecentData());
        }


        if (e.altKey && e.shiftKey && key == KEY_W) {
            ui.fireworks();
            e.preventDefault();
        }


        if (key == KEY_Z) {
            if (that.isGameActive()) {
                if (now() - recentKeyDownTS < 1000 / 25) {
                    return;
                }
                ui.hideCongratulations();
                //_w("KEY", _DEV_PERF_SCREEN);
                if (e.ctrlKey && key == KEY_LEFT_ARROW) {
                    that.gm.rewind();
                } else {
                    that.gm.undo();
                }
            }
            e.preventDefault();
        }

        if (key == KEY_Y) {
            if (that.isGameActive()) {
                if (now() - recentKeyDownTS < 1000 / 25) {
                    return;
                }
                that.gm.redo();
            }
            e.preventDefault();
        }

        if (key == KEY_F1) {
            if (that.isGameActive()) {
                that.toggleShowPossibleMoves();
            }
            e.preventDefault();
        }

        if (key == KEY_F2) {
            if (that.isGameActive()) {
                that.startNextGame();
            }
            e.preventDefault();
        }

        if (key == KEY_F3) {
            if (that.isGameActive()) {
                that.replay();
            }
            e.preventDefault();
        }

        if (key == KEY_F8) {
            e.preventDefault();
        }

        if (key == KEY_F9) {
            e.preventDefault();
        }

        if (key == KEY_T) {
            e.preventDefault();
        }

        if (e.shiftKey && key == KEY_D) {
        }
    }

    this.gameStateChanged = function () {
        that.cs.syncAttempt(that.gm.getCurrentAttempt());
    }

    this.attemptRestored = function(){
        if (that.gm && that.gm.currentAttempt.isWon()) {
            //$("#wonAttemptNotice").fadeIn("normal");
            that.gm.historyMoveForward();
        } else {
            //$("#wonAttemptNotice").fadeOut("normal");
        }
    }

    this.canAutoComplete = function () {
        return !that.gm.g.isComplete();
    }

    this.switchCandidates = function(){
        fFindTurns = !fFindTurns;
        that.game.changeShowCandidates(fFindTurns);

        if (fFindTurns)
            $('#tbCandidates').addClass('cpHighlight');
        else $('#tbCandidates').removeClass('cpHighlight');
    }

    this.logout = function () {
        //if (confirm("Вы действительно хотите выйти?")) {
            that.gm.replay();
            cs.logout(function (result) {
                    if (result) {
                        window.location = "/sudoku";
                    }
                }
            );
        //}
    }

    this.reset = function () {
        ui.hideAllActivePanels();
    }

    this.setAboutToLogin = function (_aboutToLogin) {
        aboutToLogin = _aboutToLogin;
    }

    this.load = function (gameState, userSettings) {
        ui = new SudokuUI(this);
        var settingsObj = parseJSON(userSettings);

        that.ui = ui;
        that.cs = cs;

        parametersManager = new SudokuParametersManager(that, ui, {
            defaultPlayMode : 1
        });
        parametersManager.applySettings(settingsObj);

        beacon = new Beacon(this, ui);

        this.game = new SudokuGame();
        this.game.gc = that;

        if (!!settingsObj) {
            this.game.changeShowButtons(settingsObj.buttons, settingsObj.numClickPrior);
        }
        var timer = $.timer(function () {
            ui.updateGameStats();
            beacon.sendBeacon();
        });

        timer.set({
            time : 1000, autostart : true
        });

        GameTimer.FREEZE_AFTER_SEC = 180;

        if (gameState == null) {
            this.requestGame(1, -1);
        } else {
            this.requestGame(gameState.gameId, gameState.attemptId);
        }
    }

    this.unload = function () {
        if (!aboutToLogin) {
            cs.goSynchronous();
            var currentAttempt = that.gm.getCurrentAttempt();
            if (currentAttempt != null) {
                if (currentAttempt.finish()) {
                    cs.uploadAttempt(that.gm.getGameId(), currentAttempt, function () {
                    }, {
                        async : false
                    });
                } else {
                    cs.uploadAttempt(that.gm.getGameId(), null, function () {
                    }, {
                        async : false
                    });
                }
            }
        }
    }

    this.doSuperMove = function (f) {
        if (that.isGameActive()){
            if (fCancelSuperMove){
                fCancelSuperMove = false;
                that.gm.cancelSuperMove();
                that.ui.updateSuperMove(fSuperMove, fCancelSuperMove);
            }
            else {
                if (fSuperMove && f) fCancelSuperMove = true;
                fSuperMove = !fSuperMove;
                that.ui.updateSuperMove(fSuperMove, fCancelSuperMove);
                that.game.setSuperMove(fSuperMove);
            }
        }
    }

    this.cancelSuperMove = function() {
        if (that.gm.fRewiding) return;
        if (fCancelSuperMove){
            fCancelSuperMove  = false;
            that.ui.updateSuperMove(fSuperMove, fCancelSuperMove);
        }
    }

    multiExtendClass(GameController, SharedController, this);
    multiExtendClass(GameController, NewGameLister, this);

    this.startNextGame = function (callbackFn) {
        if (!that.hasNext()) {
            that.requestGame(-1, -1, callbackFn, BEGIN_NEW_ATTEMPT);
        } else {
            that.requestGame(that.next(), -1, callbackFn, BEGIN_NEW_ATTEMPT);
        }
    }

    this.startPreviousGame = function () {
        if (that.hasPrevious()) {
            that.requestGame(that.previous(), -1, undefined, BEGIN_NEW_ATTEMPT);
        }
    }

    cs = _cs;
    that.cs = cs;
    serializer = _serializer;
}