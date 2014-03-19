var ui;
var controller;
function ready(){
        var cs = new SudokuClientServer(_gameVariationId);
        cs.setSessionId(_sessionId);
        cs.setUser(_userId, _username, _isGuest);
        //cs.reuploadAttempts();
        $("#loadingProgressContainer").hide();
        controller = new GameController(cs, new SudokuSerializer());
        controller.setup();
        controller.load(parseJSON(_gameState), _userSettings);
}


$(document).ready(ready);