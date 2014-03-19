<?php

require_once("SudokuAPI.php");

$sessionId = $_POST['sessionId'];
$userId = intval($_POST['userId']);
$gameVariationId = intval($_POST['gameVariationId']);

$newGameId = intval($_POST['newGameId']);
$oldGameId = intval($_POST['oldGameId']);
$playMode = intval($_POST['playMode']);
$gameType = intval($_POST['gameType']);
$playFilter = intval($_POST['playFilter']);

try {
    $s = new SudokuServer($sessionId, $userId);
    //$s->setGameVariationId($gameVariationId);

    if ($newGameId == -1) {
        $gameId = $s->computeNextGame($oldGameId, $gameType, $playFilter, $playMode == PM_PLAY_SUCC);
    } else {
        $gameId = $newGameId;
    }

    echo json_encode(array(
        'status' => 'ok',
        'data' => array(
            'gameId' => $gameId,
            'deck' => $s->loadDeck($gameId),
            'attempts' => $s->loadAttempts($gameId),
            'gameInfo' => $s->getGameInfo($gameId)
        )
    ));
} catch (NotLoggedException $ex) {
    respondNotLogged();
}