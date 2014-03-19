window.onload = function(){
    min = 1;
    max = 999999999;
    file = "pzl/pzl_26.csv";

    document.getElementById('btn2').onclick = function(){
        var lines;
        var output = document.getElementById('output');
        output.value='';
        var value="";
        var n=-1;
        var numWorkers=4;
        var done=false;

        if (document.getElementById('text').value.length>0)start(document.getElementById('text').value);
        else readTextFile(file)

        function start(str){
            lines = str.split('\n');
            //test(); return;
            for (var i=0; i<numWorkers; i++){
                var worker = new Worker('webw1.js?v='+Math.random());
                worker.id=i;
                worker.onmessage = onSolve;
                worker.onerror = function(e){
                    console.log(e);
                }
                solveNext(worker);
            }
        }



        function onSolve(e){
            if (e.data!=null){
                //console.log(e.data);
                value+=' "'+ e.data.puzzle+'"; "'+ e.data.solution+'"; '
                    + e.data.clues + '; ' + e.data.difficult+'; ' + e.data.steps+'; '
                    + e.data.singles + '; ' + e.data.hiddenSingles+'; '
                    + e.data.backsteps +'; '+ e.data.time+'; '+e.data.first+'; \n';
            }
            solveNext(this);
        }

        function solveNext(w){
            n++;
            if (n<lines.length)solve(w);
            else {
                console.log('done!');
                if (!done){
                    done = true;
                    output.value = value;
                    //document.location = 'data:Application/octet-stream,' +encodeURIComponent(value);
                    console.log('complete!');
                }
            }
        }

        function solve(w){
            var line, pzls, puzzle, solution, clues;
            log(n);
            line=lines[n].split(' ').join('');
            pzls = line.split('"').join('').split(';');
            puzzle = pzls[1];
            solution = pzls[0];
            clues = parseInt(pzls[2]);
            w.postMessage({puzzle:puzzle, solution:solution, clues:clues});

        }

        function outInNewWindow(output){
            var OpenWindow = window.open("child.html", "mywin", '');
            //OpenWindow.dataFromParent = output; // dataFromParent is a variable in child.html
            OpenWindow.document.write(output);
        }

        var lastlog=0;
        function log(n){
            if (!lastlog || new Date()-lastlog>300 || n==lines.length-1){
                lastlog = new Date();
                document.getElementById('status').innerHTML = n+'/'+(lines.length-1)+' '+Math.floor(n/(lines.length-1)*100)+'%';
            }
        }

        function test(){
            var line=lines[0].split(' ').join('');
            var pzls = line.split('"').join('').split(';');
            var puzzle = pzls[1];
            console.log(pzls);
            puzzle = puzzle.split("").map(Number);
            var out = [];
            var clues = 0;
            var tst = new Date();
            for (var i = 0; i<= 8; i++){
                var tmp = [];
                for (var j = 0; j <= 8; j++){
                    tmp[j] = puzzle[i*9+j];
                    if ( tmp[j]!=0 ) clues ++;
                }
                out[i] = tmp;
            }
            var t1 = new Date(), sudoku;
            for (var i=0;i<100;i++) do_test();
            function do_test(){
                sudoku = new Sudoku(out);
            }
            console.log(sudoku.getStringSolution(), sudoku.getDifficult(),sudoku.getSteps(), sudoku.getBacktracking(), new Date() - t1, sudoku.fSingle());
        }

        function readTextFile(file)
        {
            var rawFile = new XMLHttpRequest();
            rawFile.open("GET", file, true);
            rawFile.onreadystatechange = function ()
            {
                if(rawFile.readyState === 4)
                {
                    if(rawFile.status === 200 || rawFile.status == 0)
                    {
                        var allText = rawFile.responseText;
                        start(allText);
                    }
                }
            }
            rawFile.send(null);
        }

    }




    function getTable(arr, pzl){
        var table = '<table>'
        for (var i =0; i<arr.length; i++){
            table+='<tr>';
            tmp = arr[i];
            for (var j = 0; j<tmp.length; j++) {
                var flg = pzl && pzl[i*9+j]==0;
                table+='<td'+ (flg?' style="color:#18D36A;"':'')+'>';
                table+=tmp[j]!=0?tmp[j]:'';
                table+='</td>';
            }
            table+='</tr>';
        }
        table+='</table>';
        return table;
    }
};


function save_content_to_file(content, filename){
    var dlg = false;
    with(document){
        ir=createElement('iframe');
        ir.id='ifr';
        ir.location='about.blank';
        ir.style.display='none';
        body.appendChild(ir);
        with(getElementById('ifr').contentWindow.document){
            open("text/plain", "replace");
            charset = "utf-8";
            write(content);
            close();
            document.charset = "utf-8";
            dlg = execCommand('SaveAs', false, filename);
        }
        body.removeChild(ir);
    }
    return dlg;
}

array=[{a:'1',b:'2'},{x:'3',y:'4'}];

function dl(array,filename){
    var b=document.createElement('a');
    b.download=filename;
    b.textContent=filename;
    b.href='data:application/json;base64,'+
        window.btoa(unescape(encodeURIComponent(JSON.stringify(array))))
    // or
    // b.href='data:application/javascript;charset=utf-8,'+JSON.stringify(json);
    return b
}


