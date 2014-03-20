var CARD_MOVE = 0;
var CARD_TURNOVER_MOVE = 1;
var DEAL_FROM_STOCK_MOVE = 2;
var FOLD_MOVE = 3;

function SudokuGameManager(_gameId, _encodedGameData, _attempts, _gameInfo, _serializer) {
    var that = this;
    this.fRewiding = false;

    this.undo = function () {
        var history = that.currentAttempt.getHistory();
        var redo = that.currentAttempt.getRedo();

        if (history.length == 0) {
            return false;
        } else {
            var move = history.pop();
            if (move != null) {
                redo.push(move);
                that.g.undoMove(move);
            }
            this.notifyGameStateUpdate();
            _dev_printState();
            return true;
        }
    }

    this.rewind = function () {
        return;
        var history = that.currentAttempt.getHistory();
        var redo = that.currentAttempt.getRedo();

        if (history.length == 0) {
            return false;
        } else {
            that.g.notifyGoSilent(true);
            while (history.length != 0) {
                var move = history.pop();
                while (move != null && (move.type == CARD_TURNOVER_MOVE || move.type == FOLD_MOVE)) {
                    that.g.undoMove(move);
                    if (history.length > 0) {
                        move = history.pop();
                    } else {
                        move = null;
                    }
                }
                if (move != null) {
                    redo.push(move);
                    that.g.undoMove(move);
                }
            }
            that.g.notifyGoSilent(false);
            this.notifyGameStateUpdate();
            return true;
        }
    }

    this.redo = function () {
        var history = that.currentAttempt.getHistory();
        var redo = that.currentAttempt.getRedo();

        if (redo.length == 0) {
            return false;
        } else {
            var move = redo.pop();
            //that.g.getReady();
            history.push(move);
            that.g.redoMove(move);
            this.notifyGameStateUpdate();
            _dev_printState();

            if (!that.currentAttempt.isWon() && that.g.isComplete()) {
                this.gameIsWon();
            }

            return true;
        }
    }

    this.writeNumber = function(type, ci,cj,oldn,newn){
        if (type==1&&oldn!=0&&newn==0){
            var hs =  that.currentAttempt.getHistory();
            var lm = hs[hs.length-1];
            if (ci==lm.ci && cj==lm.cj){
                hs.pop();
            }else that.currentAttempt.getHistory().push({ci : ci, cj : cj, oldn:oldn, newn:newn, type:type});
        } else
        that.currentAttempt.getHistory().push({ci : ci, cj : cj, oldn:oldn, newn:newn, type:type});
        that.currentAttempt.clearRedo();
        that.notifyGameStateUpdate();
    }

    this.encodeDeck = function (gameData) {
        var encodedDeck = "";
        for (var i in that.gameData) {
            encodedDeck += "" + (CODE_SHIFT + that.gameData[i]);
        }
        return encodedDeck;
    }

    this.getEncodedDeck = function () {
        return this.encodeDeck(that.g.getDeck());
    }

    this.autoMove = function () {
        return that.g.autoMove();
    }

    this.historyMoveForward = function(){
        var history = that.currentAttempt.getHistory();
        var redo = that.currentAttempt.getRedo();
        var move;
        while (redo.length != 0) {
            move = redo.pop();
            history.push(move);
            that.g.redoMove(move);
            history = that.currentAttempt.getHistory();
            redo = that.currentAttempt.getRedo();
        }
        that.notifyGameStateUpdate();
    }

    this.historyMoveBack = function(){
        var history = that.currentAttempt.getHistory();
        var redo = that.currentAttempt.getRedo();
        var move;
        while (history.length != 0) {
            move = history.pop();
            if (move != null) {
                redo.push(move);
                that.g.undoMove(move);
            }

            history = that.currentAttempt.getHistory();
            redo = that.currentAttempt.getRedo();
        }
        that.notifyGameStateUpdate();
    }

    this.superMove = function (cell) {
        if (cell.default!=0||cell.value==0)return false;
        this.fRewiding = true;
        var hs = that.currentAttempt.getHistory();
        var ind=-1;
        for (var i = hs.length-1; i>0;i--){
            var move = hs[i];
            that.undo();
            if (move.ci == cell.i && move.cj == cell.j && move.type == _MOVE){
                ind = i;
                break;
            }
        }
        this.fRewiding = false;
        return ind!=-1;
    }


    this.cancelSuperMove = function() {
        this.fRewiding = true;
        while (that.currentAttempt.getRedo().length!=0){
            that.redo();
        }
        this.fRewiding = false;
    }

    multiExtendClass(SudokuGameManager, SharedGameManager, this);

    that.setupSharedGameManager();

    that.gameId = _gameId;
    that.gameData = decodeDeck(_encodedGameData);
    that.serializer = _serializer;

    that.attempts = _attempts;

    that.gameInfo = _gameInfo;

}


function decodeCard(encodedCard) {
    return parseInt(encodedCard) - 10;
}


function decodeDeck(encodedDeck) {
    //TODO: do this
    return encodedDeck;
    var gameData = new Array();
    for (var i = 0; i < encodedDeck.length; i += 2) {
        var encodedCard = encodedDeck.substr(i, 2);
        var cardId = decodeCard(encodedCard);
        gameData.push(cardId);
    }
    return gameData;
}