function Solver() {
    var sz, size, lineSize, puzzleArr;
    var ones = 1;
    var log=(typeof  _log == "undefined")?1:_log;
    var maxSolutions = 2;
    var sudokus;

    //loadPuzzle(strPuzzle, 9);

    this.init = function(strPuzzle, _log){
        log=(typeof  _log == "undefined")?1:_log;
        loadPuzzle(strPuzzle, 9);
    };

    function loadPuzzle(str, gridSize){
        size = sz = gridSize;
        lineSize = 3; //Math.sqrt(size);
        puzzleArr = str.split('.').join('0').split("").map(Number);
        ones = Math.pow(2,size)-1;
        sudokus = new SudokuS(puzzleArr);
    }

    function getRegion(ci,cj){
        return {
            i1:Math.floor((ci)/lineSize)*lineSize,
            i2:Math.floor((ci)/lineSize)*lineSize+lineSize-1,
            j1:Math.floor((cj)/lineSize)*lineSize,
            j2:Math.floor((cj)/lineSize)*lineSize+lineSize-1
        };
    }

    function SudokuS(puzzle){
        var grid;
        var numFreeCells = 0, steps=0;
        var error = false;
        var history=[];
        var solutions=[];
        var emptyCells=false;
        init(puzzle);
        var clues;

        function init(puzzle){
            grid = [];
            if (typeof puzzle[0]=="object") {
                copyGrid(puzzle);
            }
            else{
                for (var i = 0; i<= 8; i++){
                    var tmp = [];
                    for (var j = 0; j <= 8; j++){
                        tmp[j] = new Cell(puzzle[i*9+j],i,j);
                        if (puzzle[i*9+j]==0) numFreeCells++;
                    }
                    grid[i] = tmp;
                }
                updateCandidates(null,null);
            }
            clues = 81-numFreeCells;
        }

        this.solve = function(cell,value){
            var canSolve = true, st = new Date();
            if (cell) setCell(cell.i,cell.j,value);

            while(canSolve && numFreeCells>0){
                if (log>-1)console.log('step', steps++, toString());
                canSolve = false;
                emptyCells = false;

                if (!canSolve)
                    canSolve = findSingle();
                if (!canSolve)
                    canSolve = findHiddenSingle();
                if (!canSolve)
                    canSolve = findNakedPair();
                if (!canSolve)
                    canSolve = findNakedTriples();
                if (!canSolve)
                    canSolve = findNakedQuads();
                if (!canSolve)
                    canSolve = findHiddenPairs();
                if (!canSolve)
                    canSolve = findHiddenTriples();
                if (!canSolve)
                    canSolve = findPointingLines();
                if (!canSolve)
                    canSolve = findBoxLines();
                if (emptyCells) return false;
            }
            if (numFreeCells>0){
                history.push({numbers:numFreeCells, type:10});
                canSolve = backTracking();
                if (log>0)console.log(solutions, history);
            } else {
                if (checkComplete())
                    solutions.push(toString());
                else return false;
            }
            if (log>-1)console.log('end', new Date() - st,toString());
            return canSolve;
        };

        function setCell(ci,cj,n){
            grid[ci][cj].value = n;
            if (checkValid(ci,cj)) return false;
            numFreeCells--;
            emptyCells = !updateCandidates(ci,cj);
            return true;
        }

        function updateCandidates(ci,cj){
            var i, j,res=true;
            if (ci==null||cj==null){
                for (i=0;i<size;i++){
                    for (j=0; j<size; j++){
                        grid[i][j].candidates = getCandidates(i,j);
                    }
                }
            } else {
                for (i = 0 ; i < size; i++){
                    grid[i][cj].candidates = getCandidates(i,cj);
                    if (grid[i][cj].candidates==0)res=false;
                }
                for (j = 0 ; j < size; j++){
                    grid[ci][j].candidates = getCandidates(ci,j);
                    if (grid[ci][j].candidates==0)res=false;
                }
                var reg = getRegion(ci,cj);
                for (i=reg.i1; i<=reg.i2; i++){
                    for (j=reg.j1; j<=reg.j2; j++){
                        grid[i][j].candidates = getCandidates(i,j);
                        if (grid[i][j].candidates==0)res=false;
                    }
                }
            }
            return res;
        }

        function getCandidates(ci,cj){
            var candidates = ones, val= 0, i, j;
            if (grid[ci][cj].value!=0) return;
            for (i = 0 ; i < size; i++){
                val = grid[i][cj].value-1;
                if (i!=ci) {
                    if (val>0)candidates&=~Math.pow(2,val);
                    else if (val==0)  { candidates>>=1; candidates<<=1; }
                }
            }
            for (j = 0 ; j < size; j++){
                val = grid[ci][j].value-1;
                if (j!=cj ) {
                    if (val>0)candidates&=~Math.pow(2,val);
                    else if (val==0)  { candidates>>=1; candidates<<=1; }
                }
            }
            var reg = getRegion(ci,cj);
            for (i=reg.i1; i<=reg.i2; i++){
                for (j=reg.j1; j<=reg.j2; j++){
                    val = grid[i][j].value-1;
                    if (i!=ci && j!=cj) {
                        if (val>0)candidates&=~Math.pow(2,val);
                        else if (val==0)  { candidates>>=1; candidates<<=1; }
                    }
                }
            }
            //console.log(candidates.toString(2),ci,cj);
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
            //console.log('horizontal lines ok!');
            for (var j=0; j<=8; j++){
                if (!checkValidLine(0,8,j,j)) return false;
            }
            //console.log('vertical lines ok!');
            for (var n=0; n<=8; n++){
                var r = getRegion(n%3*3,Math.floor(n/3)*3);
                if (!checkValidLine(r.i1, r.i2, r.j1, r.j2)) return false;
            }
            //console.log('regions ok!');
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

        //-------------  Single  ---------------

        function findSingle(){
            var val= 0, res = false;
            for (var i=0;i<sz;i++){
                for (var j=0;j<sz;j++){
                    if (grid[i][j].value>0){
                        continue;
                    }
                    val = getOneCandidate(grid[i][j].candidates);
                    if (val>0&&val<=sz){
                        res = true;
                        if (log>0)console.log({
                            cell:grid[i][j],
                            type:'_SINGLE',
                            val:val
                        });
                        history.push({numbers:numFreeCells, type:1});
                        if (!setCell(i,j,val)) throw new Error('wrong number!');
                    }
                }
            }
            return res;
        }

        //-----------  Hidden Single  -------------

        function findHiddenSingle(){
            var i, j, val, res=false;
            for (i=0;i<sz;i++){
                for (j=0;j<sz;j++){
                    if (grid[i][j].value>0) continue;
                    val = isSHiddenSingle(i,j);
                    if (val>0)val = getOneCandidate(val)
                    if (val>0&&val<=sz){
                        res = true;
                        if (log>0)console.log({
                            cell:grid[i][j],
                            type: '_HIDDENSINGLE',
                            val:val
                        });
                        history.push({numbers:numFreeCells, type:2});
                        if (!setCell(i,j,val)) throw new Error('wrong number!');
                    }
                }
            }
            return res;
        }

        function isSHiddenSingle(ci,cj){
            var otherCnd=0, i,j;
            for (i=0; i<grid.length; i++){
                if (grid[i][cj].value==0){
                    if (i!=ci) otherCnd |= grid[i][cj].candidates;
                }
            }
            otherCnd = grid[ci][cj].candidates&~otherCnd;
            if ((otherCnd)>0) return otherCnd;
            otherCnd = 0;
            for (j=0; j<grid.length; j++){
                if (grid[ci][j].value==0){
                    if (j!=cj)otherCnd |= grid[ci][j].candidates;
                }
            }
            otherCnd = grid[ci][cj].candidates&~otherCnd;
            if ((otherCnd)>0) return otherCnd;
            otherCnd = 0;
            var reg = getRegion(ci,cj);
            for (i=reg.i1; i<=reg.i2; i++){
                for (j=reg.j1; j<=reg.j2; j++){
                    if (grid[i][j].value==0){
                        if (i!=ci || j!=cj) otherCnd |=grid[i][j].candidates;
                    }
                }
            }
            otherCnd = grid[ci][cj].candidates&~otherCnd;
            return (otherCnd>0?otherCnd:0) ;
        }

        //------------  Naked Pair  --------------

        function findNakedPair(){
            var i, j, pair=false;
            for (i=0;i<sz;i++){
                for (j=0;j<sz;j++){
                    if (isNakedPair(i,j)) {
                        if (log>0)console.log({
                            type:'_NAKEDPAIR'
                        });
                        history.push({numbers:numFreeCells, type:3});
                        pair = true;
                    }
                }
            }
            return pair;
        }

        function isNakedPair(ci,cj, f){ // return pair cells , f = true to update candidates, need in check
            if (f) getCandidates(ci,cj);
            if (grid[ci][cj].candidates!=0 && getIntOneBytes(grid[ci][cj].candidates)==2){
                var reg = getRegion(ci,cj);
                var pair=(find(ci,ci,0,sz-1,ci,cj))||(find(0,sz-1,cj,cj,ci,cj))||find(reg.i1,reg.i2,reg.j1,reg.j2,ci,cj);
            }

            return pair;

            function find(i1,i2,j1,j2,ci,cj){
                var cells=[], c = grid[ci][cj].candidates, result = false;
                cells.push(grid[ci][cj]);
                for (var i=i1;i<=i2;i++){
                    for (var j = j1; j<=j2; j++){
                        if (i!=ci || j!= cj && grid[i][j].value==0){
                             if (grid[i][j].candidates == c)cells.push(grid[i][j]);
                            break;
                        }
                    }
                }
                if (cells.length==2){
                    for (var i=i1;i<=i2;i++){
                        for (var j = j1; j<=j2; j++){
                            if (grid[i][j].value==0 && _.contains(cells,grid[i][j])==false && (grid[i][j].candidates&c)){
                                if (log>1)console.log('pair', c.toString(2),grid[i][j].candidates.toString(2) );
                                result = true;
                                grid[i][j].candidates&=~c;
                            }
                        }
                    }
                }
                return result;
            }
        }

        //------------  Naked Triples  --------------

        function findNakedTriples(){
            var i, j;
            for (i=0;i<sz;i++){
                for (j=0;j<sz;j++){
                    if (isNakedTriple(i,j)) {
                        if (log>0)console.log({
                            type:'_NAKEDTRIPLE'
                        });
                        history.push({numbers:numFreeCells, type:4});
                        return true;
                    }
                }
            }
            return false;
        }

        function isNakedTriple(ci,cj, f){
            if (f) getCandidates(ci,cj);
            if (grid[ci][cj].value==0 && getIntOneBytes(grid[ci][cj].candidates)<=3){
                var reg = getRegion(ci,cj);
                var triple = find(ci,ci,0,sz-1,[grid[ci][cj]]) || find(0,sz-1,cj,cj,[grid[ci][cj]]) || find(reg.i1,reg.i2,reg.j1,reg.j2,[grid[ci][cj]]);
            }

            return triple;

            function find(i1,i2,j1,j2,cells){ //f to update candidates
                var c = 0, i, fPushed = false;
                for (i = 0; i<cells.length; i++) c |= cells[i].candidates;
                for (i=i1;i<=i2;i++){
                    for (var j = j1; j<=j2; j++){
                        if (grid[i][j].value==0 && _.contains(cells,grid[i][j])==false){
                            if (cells.length==3){
                                if ((grid[i][j].candidates&c) > 0){
                                    fPushed = true;
                                    if (log>1)console.log(cells, c.toString(2), grid[i][j].candidates.toString(2));
                                    grid[i][j].candidates &=~c;
                                    if (log>1)console.log(grid[i][j].candidates.toString(2));
                                }
                            } if (cells.length<3) {
                                if (getIntOneBytes(c|grid[i][j].candidates)<=3){
                                    cells.push(grid[i][j]);
                                    c |= grid[i][j].candidates;
                                    if (cells.length==3) return find(i1,i2,j1,j2,cells);
                                    fPushed = true;
                                }
                            }

                        }
                    }
                }
                if (cells.length < 3 && fPushed) return find(i1,i2,j1,j2,cells);
                else return fPushed;
            }
        }

        //------------  Naked Quads  --------------

        function findNakedQuads(){
            //return false
            var i, j;
            for (i=0;i<sz;i+=3){
                for (j=0;j<sz;j+=3){
                    if (isNakedQuad(i,j)) {
                        if (log>0)console.log({
                            type:'_NAKEDQUAD'
                        });
                        history.push({numbers:numFreeCells, type:5});
                        return true;
                    }
                }
            }
            return false;
        }

        function isNakedQuad(ci,cj){
           var reg = getRegion(ci,cj), count = 0;
            for (var i=reg.i1;i<=reg.i2;i++){
                for (var j = reg.j1; j<=reg.j2; j++){
                    if (grid[i][j].value==0) count++;
                }
            }
            if (count>4)return find(reg.i1,reg.i2,reg.j1,reg.j2,[]);
            return null;

            function find(i1,i2,j1,j2,cells){
                var c = 0, i, j,result, cell;
                for (i = 0; i<cells.length; i++) c |= cells[i].candidates;
                for (i=i1;i<=i2;i++){
                    for (j = j1; j<=j2; j++){
                        if (grid[i][j].value==0 && _.contains(cells,grid[i][j])==false){
                            if (getIntOneBytes(c|grid[i][j].candidates)<=4){
                                cells.push(grid[i][j]);
                                if (cells.length<4) {
                                    result = find(i1,i2,j1,j2,cells);
                                    return result;
                                }
                                else {
                                   return findCell(i1,i2,j1,j2,cells);
                                }
                                cells.pop();
                            }
                        }
                    }
                }
                return null;
            }

            function findCell(i1,i2,j1,j2,cells){
                var c = 0, i, j, res=false;
                for (i = 0; i<cells.length; i++) c |= cells[i].candidates;
                for (i=i1;i<=i2;i++){
                    for (j = j1; j<=j2; j++){
                        if (grid[i][j].value==0 &&_.contains(cells,grid[i][j])==false)
                            if ((grid[i][j].candidates&c)>0){
                                if (log>1)console.log(cells, c.toString(2), grid[i][j].candidates.toString(2));
                                grid[i][j].candidates &=~c;
                                if (log>1)console.log(grid[i][j].candidates.toString(2));
                                res=true;
                            }
                    }
                }
                return res;
            }
        }

        //------------  Hidden Pairs  --------------

        function findHiddenPairs(){
            var i, j;
            for (i=0;i<sz;i++){
                for (j=0;j<sz;j++){
                    if (isHiddenPair(i,j)) {
                        if (log>0)console.log({
                            type:'_HIDDENPAIR'
                        });
                        history.push({numbers:numFreeCells, type:6});
                        return true;
                    }
                }
            }
            return false;
        }

        function isHiddenPair(ci,cj){
            if (grid[ci][cj].value==0 && getIntOneBytes(grid[ci][cj].candidates)>2){
                var reg = getRegion(ci,cj);
                return find(ci,ci,0,sz-1,ci,cj) || find(0,sz-1,cj,cj,ci,cj) || find(reg.i1,reg.i2,reg.j1,reg.j2,ci,cj);
            }

            return null;

            function find(i1,i2,j1,j2,ci,cj){
                var c = grid[ci][cj].candidates;
                for (var i=i1;i<=i2;i++){
                    for (var j = j1; j<=j2; j++){
                        if (i!=ci || j!= cj && grid[i][j].value==0){
                            if (getIntOneBytes(grid[i][j].candidates&c) >= 2){
                                if (c=check(i1,i2,j1,j2,ci,cj, grid[i][j], c&grid[i][j].candidates)){
                                    if (log>1)console.log(grid[ci][cj].candidates.toString(2), grid[i][j].candidates.toString(2), c.toString(2));
                                    grid[ci][cj].candidates = grid[i][j].candidates = c;
                                    return true;
                                }
                            }
                        }
                    }
                }
                return false;
            }

            function check(i1,i2,j1,j2,ci,cj, pair, c){
                for (var i=i1;i<=i2;i++){
                    for (var j = j1; j<=j2; j++){
                        if ((i!=ci || j!=cj) && (i!=pair.i || j!=pair.j) && grid[i][j].value==0){
                            c &= (c&~grid[i][j].candidates);
                            if (getIntOneBytes(c)<2) return false;
                        }
                    }
                }
                return getIntOneBytes(c)==2?c:null;
            }
        }

        //------------  Hidden Triples  --------------

        function findHiddenTriples(){
            var i, j;
            for (i=0;i<sz;i++){
                for (j=0;j<sz;j++){
                    if (isHiddenTriple(grid[i][j])) {
                        if (log>0)console.log({
                            type:'_HIDDENTRIPLE'
                        });
                        history.push({numbers:numFreeCells, type:7});
                        return true;
                    }
                }
            }
            return false;
        }

        function isHiddenTriple(cell){
            var ci = cell.i, cj = cell.j;
            if (grid[ci][cj].value==0 && getIntOneBytes(grid[ci][cj].candidates)>3){
                var reg = getRegion(ci,cj);
                return find(ci,ci,0,sz-1,[grid[ci][cj]]) || find(0,sz-1,cj,cj,[grid[ci][cj]]) || find(reg.i1,reg.i2,reg.j1,reg.j2,[grid[ci][cj]]);
            }

            return null;

            function find(i1,i2,j1,j2,cells){
                var c = cellsUnion(cells), i, j, result;
                for (i=i1;i<=i2;i++){
                    for (j = j1; j<=j2; j++){
                        if (grid[i][j].value==0 && _.contains(cells,grid[i][j])==false){
                            if (getIntOneBytes(grid[i][j].candidates|c) >= 3){
                                cells.push(grid[i][j]);
                                if (cells.length<3){
                                    result = find(i1,i2,j1,j2,cells);
                                    if (result) return result;
                                } else  if (c=check(i1,i2,j1,j2,cells)){
                                    if (log>1)console.log(cells[0].candidates.toString(2), cells[1].candidates.toString(2), cells[2].candidates.toString(2), c.toString(2));
                                    cells[0].candidates &=c;
                                    cells[1].candidates &=c;
                                    cells[2].candidates &=c;
                                    return true;
                                }
                                cells.pop();
                            }
                        }
                    }
                }
                return false;
            }

            function check(i1,i2,j1,j2,cells){
                var c =  cellsUnion(cells), i, j;
                if (getIntOneBytes(c)<3) return false;
                for (i=i1;i<=i2;i++){
                    for (j = j1; j<=j2; j++){
                        if (grid[i][j].value==0 && _.contains(cells,grid[i][j])==false){
                            c &= (c&~grid[i][j].candidates);
                            if (getIntOneBytes(c)<3) return false
                        }
                    }
                }
                return getIntOneBytes(c)==3?c:null;
            }
        }


        //------------  Pointing Lines  --------------

        function findPointingLines(){
            var i, j, i1, j1, line, reg;
            for (i=0;i<sz;i+=3){
                for (j=0;j<sz;j+=3){
                    reg = getRegion(i,j);
                    for (i1=reg.i1; i1<=reg.i2; i1++){
                        if (isPointingLine(i1,i1,reg.j1,reg.j2)) line = true;
                    }
                    for (j1=reg.j1; j1<=reg.j2; j1++){
                        if (isPointingLine(reg.i1,reg.i2,j1,j1)) line = true;
                    }
                }
            }
            if (line){
                if (log>0)console.log({
                    type:'_POINTINGLINE'
                });
                history.push({numbers:numFreeCells, type:8});
                return true;
            }
        }

        function isPointingLine(i1,i2,j1,j2){
            var reg = getRegion(i1,j1), c = getLineUnion(i1,i2,j1,j2), i, j, res=false;
            if (c===0) return null;
            for (i=reg.i1; i<=reg.i2; i++){
                for (j=reg.j1; j<=reg.j2; j++){
                    if (i>i2||i<i1||j>j2||j<j1 && grid[i][j].value==0){
                        c&=~grid[i][j].candidates;
                    }
                }
            }

            if (c!=0) {
                i=0;j=0;
                if (i1==i2) i=i1; else j=j1;
                while(i<sz&&j<sz){
                    if (i>i2||i<i1||j>j2||j<j1){
                        if ((grid[i][j].candidates&c)!=0){
                            res =  true;
                            if (log>1)console.log(c.toString(2), grid[i][j].candidates.toString(2))
                            grid[i][j].candidates&=~c;
                        }
                    }
                    if (i1==i2) j++;  else i++;
                }
            }
            return res;

            function getLineUnion(i1,i2,j1,j2){
                var c=0;
                for (var i = i1; i<=i2; i++){
                    for (var j = j1; j<=j2; j++){
                        c |= grid[i][j].candidates;
                    }
                }
                return c;
            }
        }

        //------------  Box Lines  --------------

        function findBoxLines(){
            var i, j, i1, j1, line=false, reg;
            for (i=0;i<sz;i+=3){
                for (j=0;j<sz;j+=3){
                    reg = getRegion(i,j);
                    for (i1=reg.i1; i1<=reg.i2; i1++){
                        line = line||isBoxLine(i1,i1,reg.j1,reg.j2);
                    }
                    for (j1=reg.j1; j1<=reg.j2; j1++){
                        line = line||isBoxLine(reg.i1,reg.i2,j1,j1);
                    }
                }
            }
            if (line){
                if (log>0)console.log({
                    type:'_BOXLINE'
                });
                history.push({numbers:numFreeCells, type:9});
                return true;
            }
        }

        function isBoxLine(i1,i2,j1,j2){
            var reg = getRegion(i1,j1), c = getLineUnion(i1,i2,j1,j2), i, j, res;
            if (c===0) return null;
            i=0;j=0;
            if (i1==i2) i=i1; else j=j1;
            while(i<sz&&j<sz){
                if (i>i2||i<i1||j>j2||j<j1){
                    c &= ~grid[i][j].candidates;
                }
                if (i1==i2) j++; else i++;
            }
            if (c===0) return null;
            for (i=reg.i1; i<=reg.i2; i++){
                for (j=reg.j1; j<=reg.j2; j++){
                    if (i>i2||i<i1||j>j2||j<j1){
                        if ((grid[i][j].candidates&c)!=0){
                            res =  true;
                            if (log>1)console.log(c.toString(2), grid[i][j].candidates.toString(2));
                            grid[i][j].candidates&=~c;
                        }
                    }
                }
            }
            return res;

            function getLineUnion(i1,i2,j1,j2){
                var c=0;
                for (var i = i1; i<=i2; i++){
                    for (var j = j1; j<=j2; j++){
                        c |= grid[i][j].candidates;
                    }
                }
                return c;
            }
        }

        //--------------------------------------------------


        function backTracking(){
            var cell = getMinCell(), res=false;
            var candidates = byteToArr(cell.candidates);
            var solver, result;
            for (var i=0;i<candidates.length;i++){
                if (log>-1) console.log('backtracking',numFreeCells, cell,cell.candidates.toString(2), candidates, candidates[i])
                solver = new SudokuS(grid.slice(0));
                result = solver.solve(cell,candidates[i]);
                if (!result) cell.candidates&=~Math.pow(2,candidates[i]-1);
                else {
                    res=true;
                    solutions = solutions.concat(solver.getSolutions());
                    history = history.concat(solver.getHistory());
                    numFreeCells = solver.getCells();
                }
                //if (solutions.length>=maxSolutions) break;
            }
            return res;
        }

        function copyGrid(puzzle){
            var cell; grid = [];
            for(var i =0; i<sz; i++){
                grid[i] = [];
                for(var j=0; j<sz; j++){
                    cell = new Cell(puzzle[i][j].value,i,j); cell.candidates = puzzle[i][j].candidates;
                    grid[i][j] = cell;
                    if(cell.value==0)numFreeCells++;
                }
            }
        }

        function getMinCell(){
            var cell, i, j, n, cn=0;
            for (i=0;i<sz;i++){
                for(j=0;j<sz;j++){
                    if (grid[i][j].value==0){
                        n = getIntOneBytes(grid[i][j].candidates);
                        if (n<=2) return grid[i][j];
                        if (!cell || n<cn){
                            cn=n;
                            cell = grid[i][j];
                        }
                    }
                }
            }
            return cell;
        }

        function toString(){
            var str = "";
            for (var i=0;i<sz;i++){
                for (var j=0;j<sz;j++){
                    str+=grid[i][j].value;
                }
            }
            return str;
        }

        this.getHistory = function() { return history; };
        this.getSolutions = function() { return solutions; };
        this.getCells = function() { return numFreeCells; };
        this.getClues = function() { return clues; }

    }

    function Cell(val,i,j){
        this.default = val;
        this.value = val;
        this.i = i;
        this.j = j
        this.candidates = 0;
    }

    this.getSolves = function(){
        if (sudokus.solve()){
            return sudokus.getSolutions();
        }else return null;
    };

    this.getHistory = function(){
        return sudokus.getHistory();
    };

    this.getDifficult = function(){
        var hs = sudokus.getHistory(), his, moves={}, dif=0, clues=sudokus.getClues();
        var type='E';
        for (var i = 0; i<hs.length; i++){
            his = hs[i];
            if (!moves.hasOwnProperty(his.type)){
                moves[his.type]=his.numbers;
                moves[his.type+'_']=1;
            } else moves[his.type+'_']++;
            dif+=his.numbers*his.type;
            if (i==0 && his.type==1) type='B';
            if (type!='B' && type!='0'){
                if (his.type>2) type='M';
            }
            else if (his.type>2) type='0';
        }
        if (type!='B' && type!='0' && moves.hasOwnProperty('10')){
            if (moves['10']<35&&moves['10_']<4) type='H';
            else if (moves['10']<45&&moves['10_']<5) type='X';
            else type='I';
            if (clues>27) type='0';
        }
        if (type=='B' && clues<30) type='0';
        return {
            difficult:dif,
            steps:hs.length,
            moves:moves,
            type:type
        }
    };
}


var isInteger = function(num){
    return (num^0)===num
};
var isSingleOne = function(num){
    return isInteger(Math.log(num)/Math.log(2));
};
var getOneCandidate = function(candidates){
    var res = Math.log(candidates)/Math.log(2)+1;
    return isInteger(res)?res:0;
};

var arrToByte = function(arr){
    var mask = 0, i=0;
    while (i < arr.length){
        if (arr[i]>0) mask |= Math.pow(2,parseInt(i));
        i++;
    }
    return mask;
};
var byteToArr = function(byte){
    var arr=[];
    for (var i=0;i<9; i++){
        if ((Math.pow(2,i)&byte)>0)arr.push(i+1)
    }
    return arr;
};

var _g21 = 0x55555555, _g22 = 0x33333333, _g23 = 0x0f0f0f0f;
var getIntOneBytes = function (v){
    v = (v & _g21) + ((v >> 1) & _g21);
    v = (v & _g22) + ((v >> 2) & _g22);
    v = (v + (v >> 4)) & _g23;
    return (v + (v >> 8) + (v >> 16) + (v >> 24)) & 0x3f;
};

var cellsUnion = function (cells){
    switch (cells.length){
        case 0: return 0;
        case 1: return cells[0].candidates;
        case 2: return cells[0].candidates&cells[1].candidates;
        case 3: return ((cells[0].candidates&cells[1].candidates)|(cells[1].candidates&cells[2].candidates)|(cells[0].candidates&cells[2].candidates));
    }
    return 0;
};
