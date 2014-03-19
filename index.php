<?php
/*
ini_set ( "display_errors", "1");
ini_set ( "display_startup_errors", "1");
ini_set ( "html_errors", "1");
ini_set ( "docref_root", "http://www.php.net/");
ini_set ( "error_prepend_string", "<div style='color:red; font-family:verdana; border:1px solid red; padding:5px;'>");
ini_set ( "error_append_string", "</div>");
*/

require_once("../sharedAPI/LogicGameResourceManager.php");
require_once("../sharedAPI/LogicGameLocalization.php");
require_once("../sharedAPI/LogicGameSessionManager.php");
require_once("../sharedAPI/LogicGameVkAuth.php");
require_once("../sharedAPI/LogicGameFbAuth.php");
require_once("gw/SudokuAPI.php");

$sm = new LogicGameSessionManager(SUDOKU_ID);
$s = $sm->getAuthServerInstance();

appendToSessionLog($s, "[LOADING PAGE] " . $_SERVER['REQUEST_URI'], false);

// Vk auth
$isVk = false;
$vkAuth = new LogicGameVkAuth($s, $sm);
$vkAuth->tryVkAuth();
$isVk = $vkAuth->hasVkAuth();

// Fb auth
$refresh=false;
$isFb = false;
$i18n = $s->getI18n();

if (!$s->isGuest()) {
    $displayNotLogged = " style='display: none;'";
    $displayLogged = "";
} else {
    $displayLogged = " style='display: none;'";
    $displayNotLogged = "";
}

$isFreshUser = $sm->isFreshUser();
$s->updateActivity();
$visitorStats = $s->getVisitorStats();

$rm = new LogicGameResourceManager("/sudoku");
$rm->add3rdPartyLibJS();
$rm->addSharedJS();
$rm->addLangJS($s->getI18n()->get("locale", "id"));
$rm->addResource("/sudoku/js/sudoku-networking.js", RESOURCE_JS, "sudoku");
$rm->addResource("/baker/js/baker-util.js", RESOURCE_JS, "sudoku");
$rm->addResource("/sudoku/js/sudoku-ui.js", RESOURCE_JS, "sudoku");
$rm->addResource("/sudoku/js/sudoku-serialization.js", RESOURCE_JS, "sudoku");
$rm->addResource("/baker/js/baker-dev.js", RESOURCE_JS, "sudoku");
$rm->addResource("/sudoku/js/sudoku-game-manager.js", RESOURCE_JS, "sudoku");
$rm->addResource("/sudoku/js/sudoku-game-controller.js", RESOURCE_JS, "sudoku");
$rm->addResource("/sudoku/js/sudoku-main.js", RESOURCE_JS, "sudoku");
$rm->addResource("/sudoku/js/sudoku-game.js", RESOURCE_JS, "sudoku");
$rm->addResource("/sudoku/js/sudoku-parameters.js", RESOURCE_JS, "sudoku");
$rm->addResource("css/sudoku.css", RESOURCE_CSS, "sudoku");
$rm->addResource("css/sudoku-gameplay.css", RESOURCE_CSS, "sudoku");
$rm->addResource("css/sudoku-ui.css", RESOURCE_CSS, "sudoku");
$rm->addResource("css/sudoku-dev.css", RESOURCE_CSS, "sudoku");
$rm->addResource("css/sudoku-layout.css", RESOURCE_CSS, "sudoku");
$rm->addSharedCSS();
?>

<!DOCTYPE HTML>
<html>
<head>
    <meta http-equiv="content-type" content="text/html; charset=UTF-8"/>
    <meta name="HandheldFriendly" content="True">
    <meta name="MobileOptimized" content="624">
    <meta name="viewport" content="width=624, target-densitydpi=160dpi,  user-scalable=no">
    <title>Судоку</title>
    <script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jquery/2.0.3/jquery.min.js"/>
    <?php
    if(!$isVk) echo '<script src="//vk.com/js/api/openapi.js" type="text/javascript"/>';
    if ($refresh){
        echo '
        <script type="text/javascript">
            location.replace(location.href);
        </script>';
    }
    $rm->setGrouping(false);
    $rm->printHeaders();
    ?>
    <link rel="shortcut icon" type="image/x-icon" href="/freecell/favicon.ico"/>
</head>
<body style="max-height: 1000px;">
<script type="text/javascript">

    var _sessionId = "<?php echo $s->getSessionId(); ?>";
    var _userId = <?php echo $s->getUserId(); ?>;
    var _username = "<?php echo $s->getUsername(); ?>";
    var _isGuest = <?php if ($s->isGuest()) echo "true"; else echo "false"; ?>;
    var _gameState = '<?php echo $s->loadGameState(); ?>';
    var _userSettings = '<?php echo $s->loadSettings(); ?>';

    var _gameVariationId = <?php echo $s->getGameVariationId(); ?>;

    <?php if ($isFreshUser): ?>
    var _isFreshUser = true;
        <?php else: ?>
    var _isFreshUser = false;
        <?php endif; ?>

    var _isVk = <?php echo $GLOBALS['isVk']?'true':'false'; ?>;
    var _isFb = (window.location!=top.location&&!_isVk);

</script>

<?php
include '../snippets/fireworks.htm';
?>

<div class="informationOuter" id="informationBubble">
    <div class="informationMain" id="informationMain">
        <div class="informationPadding">
            <img class="closePanelIcon" id="closeInformationBubble" src="/img/icons/icon_close.png" alt=""/>
            <?php
            include 'snippets/sudoku-description.' . $i18n->get("locale", "id") . '.htm';
            ?>
        </div>
    </div>
</div>

<table class="mainLayout" cellspacing="0" cellpadding="0">

<tr>
<td class="gameAreaLayout">

    <div class="gameArea" id="gameArea">
        <?php
        include '../snippets/lg-title-band.htm';
        ?>

        <div class="controlPanel nonSelectable">
            <table class="controlPanelLayout" cellpadding="0">
                <tr>
                    <td id="tbUndo" class="cpButton cpNormal nonSelectable">
                        <?=$i18n->get("topCP", "undo")?>
                    </td>
                    <td id="tbRedo" class="cpButton cpNormal nonSelectable">
                        <?=$i18n->get("topCP", "redo")?>
                    </td>
                    <td id="tbNewGameContainer" class="cpButton cpNormal nonSelectable cpKillHover">
                        <table style="width: 100%; height: 100%;" cellspacing="0" cellpadding="0">
                            <tr>
                                <td id="tbPreviousGame" style="border-right: 1px solid #BBB; width: 15px;"
                                    class="cpNormal roundedLeft4px">
                                    <
                                </td>
                                <td id="tbNewGame" class="cpNormal roundedRight4px">
                                    <?=$i18n->get("topCP", "newGame")?>
                                </td>
                            </tr>
                        </table>
                    </td>
                    <td id="tbReplay" class="cpButton cpNormal nonSelectable">
                        <?=$i18n->get("topCP", "replay")?>
                    </td>
                    <td id="tbSupermove" class="cpButton cpNormal nonSelectable">
                        <?=$i18n->get("topCP", "specialMove")?>
                    </td>
                    <td id="tbHelp" class="cpButton cpNormal nonSelectable" style="padding: 5px;">Подсказка</td>
                    <!--<td id="tbShowPossibleMoves" class="cpButton cpNormal nonSelectable" style="padding-left: 8px; padding-right: 8px;">Подсказки</td>-->
                </tr>
            </table>
        </div>

        <div id="field">

            <div id=topNumbers>
                <table style="width: 100%">
                    <tr><td>1<td>2<td>3<td>4<td>5<td>6<td>7<td>8<td>9</tr>
                </table>
            </div>

            <div id=leftNumbers>
                <table style="height: 100%">
                    <tr><td>a</tr>
                    <tr><td>b</tr>
                    <tr><td>c</tr>
                    <tr><td>d</tr>
                    <tr><td>e</tr>
                    <tr><td>f</tr>
                    <tr><td>g</tr>
                    <tr><td>h</tr>
                    <tr><td>j</tr>
                </table>
            </div>

            <div class="desc">
                <div class="table" id="divTable"></div>
            </div>
            <div id="buttons"><table class="bottomButtonsTable">
                <tr>
                    <td><button class="bottomButton">1</button>
                    <td><button class="bottomButton">2</button>
                    <td><button class="bottomButton">3</button>
                    <td><button class="bottomButton">4</button>
                    <td><button class="bottomButton">5</button>
                    <td><button class="bottomButton">6</button>
                    <td><button class="bottomButton">7</button>
                    <td><button class="bottomButton">8</button>
                    <td><button class="bottomButton">9</button>
                </tr>
            </table></div>

            <div id="notificationArea" class="fieldInfoPanel"></div>
            <div id="attemptsPanel" class="fieldInfoPanel"></div>
            <p id="infoFieldPanel">Выберите клетку или нажмите ESC для отмены.</p>
            <p id="numberCounter"></p>
            <div id="gameStatePanel" class="fieldInfoPanel"></div>
            <div id="winBox"><?=$i18n->get("gameplay", "winNotice")?></div>
            <div id="bonusNotice"></div>
            <div id="markCell" title="пометить или снять пометку">пометить клетку</div>

            <?php
            include '../snippets/lg-beacon.htm';
            ?>
        </div>

        <?php
        include '../snippets/lg-login-register.htm';
        ?>

        <?php
        include 'snippets/lg-parameters.htm';
        ?>

        <div class="controlPanel nonSelectable">
            <table class="controlPanelLayout">
                <tr>
                    <td id="bbParameters" class="cpButton cpNormal nonSelectable">
                        <?=$i18n->get("bottomCP", "parameters")?>
                    </td>
                    <td id="bbGameList" class="cpButton cpNormal nonSelectable">
                        Все головоломки
                    </td>
                    <td id="bbHistory" class="cpButton cpNormal nonSelectable">
                        <?=$i18n->get("bottomCP", "history")?>
                    </td>
                    <td id="bbGameInfo" class="cpButton cpNormal nonSelectable">
                        О головоломке
                    </td>
                    <td id="bbRatings" class="cpButton cpNormal nonSelectable"><?=$i18n->get("bottomCP", "rating")?></td>
                    <td id="bbLoginRegister"
                        class="cpButton cpNormal nonSelectable" <?php echo $displayNotLogged; ?>>
                        <?=$i18n->get("bottomCP", "loginRegister")?>
                    </td>
                    <td id="bbProfile" class="cpButton cpNormal nonSelectable" <?php echo $displayLogged; ?>>
                        <span id="bbProfileLabel"><?=$i18n->get("bottomCP", "profile")?></span> <span id="bbUnreadMsgCount"></span>
                    </td>
                </tr>
            </table>
        </div>
    </div>

    <div class="bottomArea" id="bottomArea">
        <?php
        include '../snippets/lg-history.htm';
        ?>
        <?php
        include '../snippets/lg-game-info.htm';
        ?>
        <?php
        include '../snippets/lg-ratings.htm';
        ?>
        <?php
        include '../snippets/lg-profile.htm';
        ?>
        <?php
        include '../snippets/lg-game-list.htm';
        ?>
        <?php
        include '../snippets/lg-guestbook.htm';
        ?>
        <?php
        include '../snippets/lg-dev.htm';
        ?>
    </div>

    <div style="clear:both;"></div>
</td>
</tr>
<tr>
    <td style="text-align: center; padding-bottom: 10px;">
        <?php
        include '../snippets/lg-activity.htm';
        ?>
    </td>
</tr>
</table>
</body>
</html>