<?php

require_once($_SERVER['DOCUMENT_ROOT'] . "/sharedAPI/SolitaireAPI.php");
define("GT_SUPEREASY", 11);

class SudokuServer extends SolitaireServer
{

    public function __construct($sessionId, $userId, $doLogin = false)
    {
        $this->gameVariationId = SUDOKU_ID;

        parent::__construct($sessionId, $userId, $doLogin);

        $this->attemptsTableName = "sudoku_attempts";
        $this->gamesTableName = "sudoku_games";
        $this->ratingsTableName = "sudoku_ratings";
        $this->gameListTableName = "sudoku_gamelist";
        $this->gameStateTableName = "sudoku_gamestate";
        //$this->monthlyRatingTableName = "sudoku_monthly_rating";

        $this->options['extendedChampionship'] = false;
        //$this->championshipTableName = "sudoku_championship";
        //$this->yearChampionshipTableName = "sudoku_year_championship";
        $this->userSettingsTableName = "sudoku_user_settings";

        $this->lowerGameIdBound = 1;
        $this->higherGameIdBound = 30000;
    }

    public function loadDeck($gameId)
    {
        $query = "SELECT `puzzle`
                  FROM $this->gameListTableName
                  WHERE gameId = $gameId";

        $queryResult = smart_mysql_query($query);
        $row = mysql_fetch_assoc($queryResult);
        if ($row) {
            return $row['puzzle'];
        } else return null;
    }

    public function loadDifficult($gameId)
    {
        $query = "SELECT `difficult`
                  FROM $this->gameListTableName
                  WHERE gameId = $gameId";

        $queryResult = smart_mysql_query($query);
        $row = mysql_fetch_assoc($queryResult);
        if ($row) {
            return intval($row['difficult']);
        } else return null;
    }

    function verifyNoDuplicateAttempts($attempt)
    {
        $query = "SELECT COUNT(*) AS duplicateCount
                  FROM $this->attemptsTableName
                  WHERE history = '$attempt->history' AND
                        userId = $this->userId AND
                        gameId = $attempt->gameId";

        $queryResult = smart_mysql_query($query);

        $row = mysql_fetch_assoc($queryResult);

        if ($row) {
            $duplicateCount = intval($row['duplicateCount']);
            return $duplicateCount == 0;
        } else {
            return true;
        }
    }

    function computeNextGame($gameId, $gameType, $playFilter, $playSucc, $skip = false)
    {
        if ($playFilter == PF_NOTPLAYED) {
            $playFilter = PF_ALL;
        }

        if ($gameType == GT_EASY) {
            $levelCondition = " difficult < 120";
        } else if ($gameType == GT_NORMAL) {
            $levelCondition = " difficult BETWEEN 150 AND 500";
        } else if ($gameType == GT_HARD) {
            $levelCondition = " difficult > 600";
        } else  $levelCondition = " difficult != 0";
        /*else if ($gameType == GT_UNSOLVED) {
            $levelCondition = " gameRating = 0 AND totalPlayed > 0 ";
        } else if ($gameType == GT_UNPLAYED) {
            $levelCondition = " gameRating = 0 AND totalPlayed = 0 ";
        } */

        $gameIdCond = generateRangeCond("gl", "gameId", $this->getGameIdRangeSet());

        if ($playFilter == PF_NOTWON) {
            $playFilterCondition = " (NOT ISNULL(f.winTime) AND f.winTime = 0 AND f.firstAttemptTS > 0) AND ";
        } else {
            $playFilterCondition = " (ISNULL(f.winTime) OR f.winTime = 0) AND ";
        }

        if ($this->isGuest()) {
            $playFilterCondition = "";
        }

        ////////// USER ONLY JOIN //////////

        if (!$this->isGuest()) {
            $userOnlyJoin = "LEFT JOIN
                                $this->gamesTableName AS f
                             ON
                                gl.gameId = f.gameId AND
                                f.userId = $this->userId AND
                                f.firstAttemptTS > 0";
        } else {
            $userOnlyJoin = "";
        }

        ////////// BETTER RANDOM //////////

        if ($playSucc) {
            $primaryGameId = $gameId;
            $secondaryGameId = $gameId;
        } else {
            $primaryGameId = $gameId;
            $secondaryGameId = $this->generateSecondaryGameId();

            // generating better random for secondary game id,
            // selecting one from actual game ids with
            // corresponding level
            if ($gameType == GT_SUPEREASY || $gameType == GT_EASY || $gameType == GT_NORMAL || $gameType == GT_HARD) {
                $subSelect = "SELECT gl.gameId" . (!$this->isGuest() ? ", f.winTime" : "") . "
                              FROM $this->gameListTableName AS gl
                              $userOnlyJoin
                              WHERE $playFilterCondition
                                    $gameIdCond AND $levelCondition";

                $query = "SELECT COUNT(*)
                          FROM ( $subSelect ) AS t1";

                $queryResult = smart_mysql_query($query);

                if ($row = mysql_fetch_row($queryResult)) {
                    $count = intval($row[0]);

                    //file_put_contents("_computeNextGame", $subSelect);

                    if ($count > 0) {
                        $start = mt_rand(0, $count - 1);

                        $query = "$subSelect LIMIT $start, 1";

                        $queryResult = smart_mysql_query($query);

                        if ($row = mysql_fetch_row($queryResult)) {
                            $secondaryGameId = intval($row[0]);
                        }
                    }
                }
            }
        }

        ////////// SELECT GAME ID //////////

        if ($gameType == GT_ALL) {
            $query = "
            SELECT gl.gameId, f.winTime
            FROM $this->gameListTableName AS gl
            LEFT JOIN $this->gamesTableName AS f
            ON gl.gameId = f.gameId AND f.userId = $this->userId
            WHERE $playFilterCondition " .
                ($skip ? "" : " (gl.gameId > $secondaryGameId) AND ") .
                " gl.gameId <> $primaryGameId AND" .
                " ( $gameIdCond )
            ORDER BY gl.gameId
            LIMIT 1";
        } else if ($gameType == GT_EASY ||
            $gameType == GT_NORMAL ||
            $gameType == GT_HARD ||
            $gameType == GT_UNSOLVED ||
            $gameType == GT_UNPLAYED
        ) {
            $query = "
            SELECT gl.gameId" . (!$this->isGuest() ? ", f.winTime" : "") . "
            FROM $this->gameListTableName AS gl
            $userOnlyJoin
            WHERE $playFilterCondition " .
                ($skip ? "" : " (gl.gameId > $secondaryGameId) AND ") .
                " gl.gameId <> $primaryGameId AND " .
                $levelCondition .
                (!$this->isSuperUser() ? " AND gl.gameId <= $this->higherGameIdBound " : "") . "
            ORDER BY gl.gameId
            LIMIT 1";
        }

//        file_put_contents("_q", $query);

        $queryResult = smart_mysql_query($query);

        if ($row = mysql_fetch_row($queryResult)) {
            return intval($row[0]);
        } else {
            if ($skip) {


                return -1;
            } else {
                return $this->computeNextGame($gameId, $gameType, $playFilter, $playSucc, true);
            }
        }
    }

    public static function addPuzzles($puzzles){
        $res = smart_mysql_query('select max(gameId) from sudoku_gamelist');
        $row = mysql_fetch_row($res);
        $id1 = ($row[0])+1;
        $id = $id1;
        if ($id>0){
            foreach ($puzzles as &$puzzle){
                $puz = $puzzle['puzzle'];
                $ans = $puzzle['answer'];
                $dif = $puzzle['difficult'];
                $clu = $puzzle['clues'];
                $res = smart_mysql_query("select 1 from `sudoku_gamelist` where `answer` = '$ans' ");
                if (!mysql_fetch_row($res)){
                    $query = "INSERT INTO `sudoku_gamelist` (`gameId`, `difficult`, `clues`, `puzzle`, `answer`) VALUES ($id, $dif, $clu, '$puz', '$ans');";
                    if (smart_mysql_query($query)) $id++;
                }
            }
        }
        return $id-$id1;
    }
}