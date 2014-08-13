<?php
require_once("../sharedAPI/LogicGameSessionManager.php");
require_once("gw/SudokuAPI.php");
$sm = new LogicGameSessionManager(BAKER_ID);
$s = $sm->getAuthServerInstance();
if($s->isSuperUser()){
    if (isset($_POST['puzzles'])){
        echo SudokuServer::addPuzzles($_POST['puzzles']);
    } else {
        echo "
        <html><head><script type=\"text/javascript\" src=\"https://ajax.googleapis.com/ajax/libs/jquery/2.0.3/jquery.min.js\"></script></head><body>
        ";
        echo "
            <textarea id=\"input\"></textarea>
            <script type=\"text/javascript\">
                var i=0;
                function send(){
                var lines= $('#input').val().split('\\n');
                var puzzles=[];
                for (var n=0;n<=lines.length-1;n++){
                try{
                    var line = lines[n+i].split(' ').join('');
                    var pzls = line.split('\"').join('').split(';');
                    var pzl = pzls[0];
                    var ans = pzls[1];
                    var clues = parseInt(pzls[2]);
                    var diff = parseInt(pzls[4]);
                    puzzles.push({
                        puzzle:pzls[0],
                        answer:pzls[1],
                        clues:parseInt(pzls[2]),
                        difficult: parseInt(pzls[3])
                    });
                    } catch(e){}
                    if (n>248) break;
                }
                i+=n;
                if (puzzles.length>0)
                $.post('addpuzzles.php',{puzzles:puzzles},function(request){
                    console.log(request);
                    if (i<lines.length-1) send();
                    });
                }
            </script>
            <button onclick='send()'>upload</button>
            </body></html>
        ";
    }

}