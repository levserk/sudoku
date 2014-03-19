function SudokuClientServer(_gameVariationId) {
    var that = this;
    var gameVariationId;

    var beaconCounter = -2;

    that.globalAsync = true;
    that.globalTimeout = 15000;

    this.goSynchronous = function () {
        that.globalAsync = false;
        that.globalTimeout = 0;

        jQuery.ajaxSetup({
            async : false
        });
    }

    this.isLogged = function () {
        return !that.isGuest();
    }

    this.getGameVariationId = function () {
        return gameVariationId;
    }

    this.loadGame = function (newGameId, oldGameId, playMode, gameType, playFilter, callbackFn) {
        $.post("gw/loadGame.php", {
                sessionId : that.getSessionId(),
                userId : that.getUserId(),
                gameVariationId : that.getGameVariationId(),
                newGameId : newGameId,
                oldGameId : oldGameId,
                playMode : playMode,
                gameType : gameType,
                playFilter : playFilter
            },
            function (data) {
                that.setRecentData(data);
                var response = parseJSON(data);
                if (response != null && response.status == "ok") {
                    if (isDef(callbackFn)) {
                        callbackFn(true, response.data.gameId, response.data.deck, response.data.attempts, response.data.gameInfo);
                    }
                } else {
                    if (isDef(callbackFn)) {
                        callbackFn(false);
                    }
                }
            });
    }

    this.handleUploadAttemptResponse = function (gameId, attempt, data, callbackFn) {
        that.setRecentData(data);
        var response = parseJSON(data);
        if (response != null && response.status == "ok") {
            if (attempt != null && response.attemptId != -1) {
                attempt.setAttemptId(response.data.attemptId);
            }
            if (isDef(callbackFn)) {
                callbackFn(true, response.data);
            }
        } else {
            if (isDef(callbackFn)) {
                callbackFn(false);
            }
        }
    }

    this.syncAttempt = function (attempt) {
        that.attemptLocalStorage.sync(attempt);
    }

    this.reuploadAttempts = function () {
        that.attemptLocalStorage.reuploadAttempts();
    }

    this.reuploadAttempt = function (gameId, attempt, attemptData, options) {
        if (attempt != null) {
            attemptData = attempt.getData();
        }

        if (isDef(options) && isDef(options.async)) {
            var async = options.async;
        } else {
            async = true;
        }

        $.ajax({
            url : "gw/uploadAttempt.php",
            type : "POST",
            data : {
                sessionId : that.getSessionId(),
                userId : that.getUserId(),
                gameVariationId : that.getGameVariationId(),
                gameId : gameId,
                attempt : $.toJSON(attemptData)
            },
            timeout : 15000,
            async : async
        }).done(function (data) {
                that.attemptLocalStorage.remove(attemptData);

//                if (attempt != null) {
                that.handleUploadAttemptResponse(gameId, attempt, data);
//                } else {
//                    if (isDef(callbackFn)) {
//                        callbackFn();
//                    }
//                }
            }).error(function (jqXHR, textStatus, errorThrown) {
                if (textStatus != "timeout") {
                    setTimeout(function () {
                        that.reuploadAttempt(gameId, attempt, attemptData);
                    }, 15000);
                }
            });
    }

    this.uploadAttempt = function (gameId, attempt, callbackFn, options) {
        if (isDef(options) && isDef(options.async) && !options.async) {
            that.globalAsync = false;
            that.globalTimeout = 0;
        }

        $.ajax({
            url : "gw/uploadAttempt.php",
            type : "POST",
            data : {
                sessionId : that.getSessionId(),
                userId : that.getUserId(),
                gameVariationId : that.getGameVariationId(),
                gameId : gameId,
                attempt : (attempt != null ? $.toJSON(attempt.getData()) : $.toJSON(null))
            },
            timeout : that.globalTimeout,
            async : that.globalAsync
        }).done(function (data) {
                if (attempt != null) {
                    that.attemptLocalStorage.remove(attempt.getData());
                }

                that.handleUploadAttemptResponse(gameId, attempt, data, callbackFn);
            }).error(function (jqXHR, textStatus, errorThrown) {
                if (attempt != null) {
                    that.attemptLocalStorage.sync(attempt);

                    that.reuploadAttempt(gameId, attempt, null);
                }
            });
    }

    this.sendBeacon = function (threshold, timeout, callbackFn) {
        beaconCounter++;

        if (beaconCounter >= threshold || beaconCounter == -1) {
            beaconCounter = 0;

            $.ajax({
                url : "/gw/beacon.php",
                type : "POST",
                data : {
                    nocache : new Date().getTime(),
                    sessionId : that.getSessionId(),
                    userId : that.getUserId(),
                    gameVariationId : that.getGameVariationId()
                },
                timeout : timeout,
                async : true
            }).done(function (data) {
                    var response = parseJSON(data);
                    if (response != null && response.status == "ok" && isDef(callbackFn)) {
                        callbackFn(true, response);
                    }
                }).error(function (jqXHR, textStatus, errorThrown) {
                    if (isDef(callbackFn)) {
                        callbackFn(false);
                    }
                });
        }
    };

    multiExtendClass(SudokuClientServer, ProfileClientServer, this);
    multiExtendClass(SudokuClientServer, SharedClientServer, this);

    gameVariationId = _gameVariationId;

    that.attemptLocalStorage = new AttemptLocalStorage(that);
}