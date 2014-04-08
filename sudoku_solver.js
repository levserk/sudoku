function Solver(strPuzzle) {
    var result={}, size, lineSize, puzzleArr;
    var ones = 1;

    loadPuzzle(strPuzzle, 9);

    function loadPuzzle(str, gridSize){
        size = gridSize;
        lineSize = 3; //Math.sqrt(size);
        puzzleArr = str.split('.').join('0').split("").map(Number);
        ones = Math.pow(2,size)-1;
        SudokuS(puzzleArr)
    }

    function getRegion(ci,cj){
        return {
            i1:Math.floor((ci)/lineSize)*lineSize,
            i2:Math.floor((ci)/lineSize)*lineSize+lineSize-1,
            j1:Math.floor((cj)/lineSize)*lineSize,
            j2:Math.floor((cj)/lineSize)*lineSize+lineSize-1
        }
    }

    function SudokuS(puzzle){
        var grid;
        var numFreeCells = 0;
        var error = false;
        init(puzzle);
        solve();

        function init(puzzle){
            grid = [];
            for (var i = 0; i<= 8; i++){
                var tmp = [];
                for (var j = 0; j <= 8; j++){
                    tmp[j] = new Cell(puzzle[i*9+j],i,j);
                    if (puzzle[i*9+j]==0) numFreeCells++;
                }
                grid[i] = tmp;
            }
        }

        function solve(){
            var i, j,val,updated=0;
            updateCandidates(null,null);

            for (var i = 0; i<size; i++){
                for (var j=0; j<size; j++){
                    val = isSingle(i,j)
                    if (val!=null){
                        setCell(i,j,val);
                        updated++;
                    }
                }
            }
        }

        function setCell(ci,cj,n){
            grid[ci][cj].value = n;
            if (checkValid(ci,cj)) return false;
            numFreeCells--;
            //updateCandidates(ci,cj);
            return true;
        }

        function isSingle(ci,cj){
            var candidates =  grid[ci][cj].candidates, val=null,count=0;
            for (var i in candidates){
                if (candidates[i]!=0) {
                    count++;
                    if (val==null)  val=i+1;
                }
            }
            if (count==0) error = true;
            return val;
        }

        function isHiddenSingle(ci,cj){
            var cellCandidates = grid[ci][cj].candidates;
            
        }

        function updateCandidates(ci,cj){
            var i,j;
            if (ci==null||cj==null){
                for (i=0;i<size;i++){
                    for (j=0; j<size; j++){
                        grid[i][j].candidates = getCandidates(i,j);
                    }
                }
            } else {
                for (i = 0 ; i < size; i++){
                    grid[i][cj].candidates = getCandidates(i,cj);
                }
                for (j = 0 ; j < size; j++){
                    grid[ci][j].candidates = getCandidates(ci,j);
                }
                var reg = getRegion(ci,cj);
                for (i=reg.i1; i<=reg.i2; i++){
                    for (j=reg.j1; j<=reg.j2; j++){
                        grid[i][j].candidates = getCandidates(i,j);
                    }
                }
            }
        }

        function getCandidates(ci,cj){
            var candidates = ones, val= 0, i, j;
            if (grid[ci][cj].value!=0) return;
            for (i = 0 ; i < size; i++){
                val = grid[i][cj].value;
                if (i!=ci && val!=0) candidates&=~Math.pow(2,val);
            }
            for (j = 0 ; j < size; j++){
                val = grid[ci][j].value;
                if (j!=cj && val!=0) candidates&=~Math.pow(2,val);
            }
            var reg = getRegion(ci,cj);
            for (i=reg.i1; i<=reg.i2; i++){
                for (j=reg.j1; j<=reg.j2; j++){
                    val = grid[i][j].value;
                    if (i!=ci && j!=cj && val!=0) candidates&=~Math.pow(2,val);
                }
            }
            console.log(candidates.toString(2));
            return candidates;
        }

        function checkValid(ci,cj){ // return true, if is not
            var val = 0, cell = grid[ci][cj].value, i, j;
            if (cell==0 || grid[ci][cj].default!=0) return false;
            for (i = 0 ; i < size; i++){
                val = grid[i][cj].value;
                if (i!=ci && val!=0 && val==cell) return true;
            }
            for (j = 0 ; j < size; j++){
                val = grid[ci][j].value;
                if (j!=cj && val!=0 && val==cell) return true;
            }
            var reg = getRegion(ci,cj);
            for ( i=reg.i1; i<=reg.i2; i++){
                for (j=reg.j1; j<=reg.j2; j++){
                    val = grid[i][j].value;
                    if (i!=ci && j!=cj && val!=0 && val==cell) return true;
                }
            }
            return false;
        }

        function checkComplete(){
            for (var i=0; i<=8; i++){
                if (!checkValidLine(i,i,0,8)) return false;
            }
            console.log('horizontal lines ok!');
            for (var j=0; j<=8; j++){
                if (!checkValidLine(0,8,j,j)) return false;
            }
            console.log('vertical lines ok!');
            for (var n=0; n<=8; n++){
                var r = getRegion(n%3*3,Math.floor(n/3)*3);
                if (!checkValidLine(r.i1, r.i2, r.j1, r.j2)) return false;
            }
            console.log('regions ok!');
            return true;
        }

        function checkValidLine(i1,i2,j1,j2){
            var numbers = [0,0,0,0,0,0,0,0,0,0];
            for (var i = i1; i<=i2; i++)
                for (var j = j1; j<=j2; j++){
                    if (grid[i][j].value==0 || numbers[grid[i][j].value]!=0) return false;
                    numbers[grid[i][j].value] = 1;
                }
            return true;
        }
    }

    function Cell(val,i,j){
        this.default = val;
        this.value = val;
        this.i = i;
        this.j = j;
        var that = this;
        that.candidates = [0,0,0,0,0,0,0,0,0,0];

        this.getCandidates = function(){
            for (var i=0;i<candidates.length;i++)if (candidates[i]!=0)return candidates;
            return null
        };
        this.addCandidates = function(c){
            if (c==0) candidates = [0,0,0,0,0,0,0,0,0,0];
            else  candidates[c-1]=!candidates[c-1];
        };
        this.setCandidates = function(cs){ candidates = cs; };
    }

    return result;
}
