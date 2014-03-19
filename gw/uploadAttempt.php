<?php

//require "../../mysql_connect.php";
require "SudokuAPI.php";

$sessionId = $_POST['sessionId'];
$userId = intval($_POST['userId']);
$gameVariationId = intval($_POST['gameVariationId']);

$gameId = intval($_POST['gameId']);
$attemptData = json_decode($_POST['attempt']);

try {
    $s = new SudokuServer($sessionId, $userId);

    $oldRankBySolvedCount = $s->getUserRankBySolvedCount();
    $oldGameInfo = $s->getGameInfo($gameId);

    if ($attemptData != null) {
        $attempt = new Attempt($gameId, $attemptData->attemptId, $attemptData->history, $attemptData->elapsed);
        $result = $s->saveAttempt($attempt);
        $attemptId = $result['attemptId'];
    } else {
        $attemptId = -1;
    }

    $s->updateGameState(json_encode(array('gameId' => $gameId, 'attemptId' => $attemptId)));

    if ($attemptId == -1) {
        echo json_encode(
            array(
                'status' => 'ok',
                'attemptId' => $attemptId,
                'data' => array(
                    'attemptId' => $attemptId
                )
            )
        );
    } else {
        echo json_encode(
            array(
                'status' => 'ok',
                'attemptId' => $attemptId,
                'data' => array(
                    'attemptId' => $attemptId,
                    'timestamp' => $result['timestamp'],
                    'bonus' => array(
                        'winBonus' => $result['winBonus'],
                        'attemptBonus' => $result['attemptBonus'],
                        'oldBestAttemptRank' => $result['oldBestAttemptRank'],
                        'oldGameInfo' => $oldGameInfo,
                        'newGameInfo' => $s->getGameInfo($gameId),
                        'newUserRanks' => $s->getUserRanks($gameId),
                        'oldRankBySolvedCount' => $oldRankBySolvedCount,
                        'newRankBySolvedCount' => $result['newRankBySolvedCount']
                    )
                )
            )
        );
    }
} catch (NotLoggedException $ex) {
    respondNotLogged();
}