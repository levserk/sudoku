var _MOVE = 1;
var _CANDIDATE = 2;
var _SWITCHHELP = 3;
var _MARKCELL = 4;
function SudokuGame(){
    var that=this;
    var oldci=null, oldcj=null, prevButton;
    var fShowCandidates = true;
    var fAutoCandidates = false, fHightlight = true, clickPrior = 1, fSuperMove = false;
    var fActive, fComplete, fSilent=false, fFixed=false, fAutoCheck=false, fShowButtons=true, fAlt=false;
    var fStartGame = false;
    var cFILL_CELL_BACKGROUND = '#DFDFDF';
    var colors = ['#DFDFDF', '#E2E3FC', '#E8FDE7','#E7F9FD', '#FCF0ED', '#F6FAE5'];
    var clID=0;
    var fMistake = false, prevCell, mistakeCell = null, helpCell;

    var div =  $('#divTable');
    div.html(genTable());

    var cellWidth = div.width()/9;

    var sudoku = new Sudoku(function(cell){
        if (cell.isWrong && !fMistake) {
            fMistake = true;
            mistakeCell = prevCell;
        }
        showCell(cell,fAutoCheck);
        showCandidates(cell);
    },function(){
        fComplete = true;
        fActive = false;
        if (fSilent) return;
        console.log('Well done!');
        console.log(sudoku.toString());
        that.gm.gameIsWon();
    });

    bindEvents();

    this._helper = null;

    this.start = function(){
        console.log('plug', 'start');
        start();
    };

    this.preload = function(){
        fActive = false;
        div.html(genTable());
    };

    this.changeShowButtons = function(fS, cPriority) {
        fShowButtons = !fS;
        clickPrior = cPriority;
        if (prevButton!=null) $(prevButton).removeClass('bottomButtonActive');
        if (fShowButtons) $('#buttons').hide(); else $('#buttons').show();
        if (oldci!=null && oldcj!=null) {
            leaveDiv(getDiv(oldci,oldcj));
        }
    };

    this.init = function(gameId, deck){
        console.log('plug', 'init', gameId);
        fComplete = false; fActive = false;
        sudoku.loadPuzzle(deck, 9);
        if (oldci!=null && oldcj!=null) {
            leaveDiv(getDiv(oldci,oldcj));
            oldci=null; oldcj=null;
        }
    };

    this.replay = function(){
        console.log('plug', 'replay');
    };

    this.numClues = function(){return sudoku.clues()};

    this.setupNewGame = function(){
        console.log('plug', 'setupNewGame');
        start();
    };
    this.notifyGoSilent = function(f){
        console.log('plug', 'notifyGoSilent', f);
        fSilent = f;
    };

    this.isComplete = function(){return fComplete;};

    this.isActive = function(){return fActive;};

    this.help = function(){
        if (oldci!=null && oldcj!=null){
            leaveDiv(getDiv(oldci, oldcj));
        }
        if (helpCell){ // hide
            hideHelp();
        } else { // show
            $('#tbHelp').addClass('cpHighlight');
            var clue = that._helper.getHelp();
            console.log('help', clue);
            if (clue && clue.cell){
                switch (clue.type){
                    case 0: //  mistake
                        showHelp(clue.cell, 'cwrong');
                        break;
                    case 1: // single
                        showHelp(clue.cell,'csingle');
                        break;
                    case 2: // hidden single
                        showHelp(clue.cell,'csingle');
                        break;
                    case 3: // naked pairs
                        showHelp(clue.cell,'ccandidate');
                        break;
                    case 4:// naked triple
                        showHelp(clue.cell,'ccandidate');
                        break;
                }
            }
        }

        function showHelp(cell, cssClass){
            helpCell = cell;
            getDiv(cell.i,cell.j).addClass(cssClass);
        }
    };
    this.undoMove = function(move){
        fSilent = true;
        console.log('plug', 'undoMove', move);
        switch (move.type){
            case _SWITCHHELP:
                that.changeShowCandidates(move.oldn);
                break;
            case _MARKCELL:
                if (move.oldn>0) marks.addMark(sudoku.cell(move.ci,move.cj));
                else marks.removeMark(sudoku.cell(move.ci,move.cj));
                break;
            case _CANDIDATE:
                prevCell = sudoku.cell(move.ci,move.cj);
                sudoku.setCellCandidate(move.ci,move.cj,move.newn,fAutoCandidates);
                leaveDiv(getDiv(oldci,oldcj));
                enterDiv(getDiv(move.ci, move.cj),false);
                oldci = move.ci;
                oldcj = move.cj;
                break;
            case _MOVE:
                prevCell = sudoku.cell(move.ci,move.cj);
                sudoku.setCell(move.ci, move.cj, move.oldn);
                leaveDiv(getDiv(oldci,oldcj));
                enterDiv(getDiv(move.ci, move.cj),false);
                oldci = move.ci;
                oldcj = move.cj;
                break;
        }
        fSilent = false;
        updated();
    };

    this.redoMove = function(move){
        fSilent = true;
        console.log('plug', 'redoMove', move);
        switch (move.type){
            case _SWITCHHELP:
                that.changeShowCandidates(move.newn);
                break;
            case _MARKCELL:
                if (move.newn>0) marks.addMark(sudoku.cell(move.ci,move.cj));
                else marks.removeMark(sudoku.cell(move.ci,move.cj));
                break;
            case _CANDIDATE:
                fAnim = true;
                leaveDiv(getDiv(oldci,oldcj));
                oldci = move.ci; oldcj = move.cj;
                prevCell = sudoku.cell(move.ci,move.cj);
                sudoku.setCellCandidate(move.ci,move.cj,move.newn,fAutoCandidates);
                fAnim = false;
                enterDiv(getDiv(move.ci, move.cj),false);
                break;
            case _MOVE:
                fAnim = true;
                leaveDiv(getDiv(oldci,oldcj));
                oldci = move.ci; oldcj = move.cj;
                prevCell = sudoku.cell(move.ci,move.cj);
                sudoku.setCell(move.ci, move.cj, move.newn);
                fAnim = false;
                enterDiv(getDiv(move.ci, move.cj),false);
                break;
        }
        fSilent = false;
        updated();
    };

    this.doHistory = function(history){
        console.log('plug', 'doHistory');
        fSilent = true;
        var move;
        for (var i=0; i < history.length; i++){
            move = history[i];
            switch (move.type){
                case _SWITCHHELP:
                    that.changeShowCandidates(move.newn);
                    break;
                case _MARKCELL:
                    if (move.newn>0) marks.addMark(sudoku.cell(move.ci,move.cj));
                    else marks.removeMark(sudoku.cell(move.ci,move.cj));
                    break;
                case _CANDIDATE:
                    oldci = move.ci; oldcj = move.cj;
                    prevCell = sudoku.cell(move.ci,move.cj);
                    sudoku.setCellCandidate(move.ci,move.cj,move.newn,fAutoCandidates);
                    break;
                case _MOVE:
                    oldci = move.ci; oldcj = move.cj;
                    prevCell = sudoku.cell(move.ci,move.cj);
                    sudoku.setCell(move.ci, move.cj, move.newn);
                    break;
            }
            saveMove(move.type, move.ci, move.cj, move.oldn, move.newn);
        }
        fSilent = false;
        updated();
        showDesc();
        fStartGame = false;
    };

    this.changeShowCandidates = function(f){
        if (!fSilent) saveMove(_SWITCHHELP,0,0,fAutoCandidates?1:0,f?1:0);
        fAutoCandidates = f;
        if (fActive && !fComplete){
            showCandidates(null);
            showDesc()
        }
    };

    this.setSuperMove = function(f){
        fSuperMove = f;
    };

    this.check = function(){
        fAutoCheck=!fAutoCheck;
        showDesc();
        return fAutoCheck;
    };

    this.updateDesc = function() { showDesc(); };

    this.gameBegin = function(_fAutoCandidates){
        console.log('plug', 'gameBegin',_fAutoCandidates, fAutoCandidates, fStartGame);
        if (fStartGame || _fAutoCandidates != fAutoCandidates )that.changeShowCandidates(_fAutoCandidates);
    };

    function saveMove(type,ci,cj,oldn,newn){
        prevCell = sudoku.cell(ci,cj);
        //console.log('plug', 'savemove',type, ci,cj,oldn,newn);
        oldn = parseInt(oldn);
        newn = parseInt(newn);
        if (!(oldn>-1||oldn<10)) oldn = 0;
        if (!(newn>-1||newn<10)) newn = 0;
        that.gm.writeNumber(type, ci,cj,oldn, newn);
        if (!fSilent && type!=3) {
            that.gm.hasUserActivity();
            that.gc.cancelSuperMove();
        }
    }

    function start (){
        console.log('plug', 'start');
        sudoku.clearGrid();
        showDesc();
        showCandidates(null);
        fActive = true;
        fComplete = false;
        fSilent = false;
        fMistake = false;
        prevCell = null;
        mistakeCell = null;
        that._helper = new SudokuHelper(sudoku);
        helpCell = null;
        hideHelp();
        fStartGame = true;
    }

    function updated(){
        $('#numberCounter').html('Цифр: '+sudoku.numNumbers());
        hideHelp();
        return;
        if (fMistake){
            if (!sudoku.checkMistakes() && mistakeCell!=null){
                getDiv(mistakeCell.i,mistakeCell.j).removeClass('cwrong');
                fMistake = false;
                mistakeCell = null;
            }
            console.log(fMistake);
        }
    }

    function bindEvents(){
        div.mousemove(function(e){
            if (!fActive || fFixed) return;
            var relX = e.pageX - $(this).offset().left;
            var relY = Math.floor(e.pageY - $(this).offset().top);
            var cj = Math.floor(relX /cellWidth), ci = Math.floor(relY/cellWidth);
            if (ci<0||cj<0||ci>8||cj>8)return;
            if (oldci!=ci||oldcj!=cj){
                if (oldci!=null && oldcj!=null){
                    leaveDiv(getDiv(oldci,oldcj));
                }
                oldci = ci; oldcj = cj;
                enterDiv(getDiv(oldci,oldcj),false);
            }
        })
        .click(onDivClicked)
        .mouseleave(function(){
            if (!fActive || fFixed) return;
            if (oldci!=null && oldcj!=null) leaveDiv(getDiv(oldci,oldcj));
        })
        .bind('contextmenu', function(e){
            e.preventDefault();
            return false;
        });

        $('#filed').mouseleave(function(){
            if (!fActive || fFixed) return;
            if (oldci!=null && oldcj!=null) leaveDiv(getDiv(oldci,oldcj));
        });

        $('.bottomButtonsTable button').click(function(){
            if (clickPrior==2) {
                if (prevButton != this){
                    $(prevButton).removeClass('bottomButtonActive');
                    prevButton = this;
                    $(prevButton).addClass('bottomButtonActive');
                } else {
                    $(prevButton).removeClass('bottomButtonActive');
                    prevButton = null;
                }
            } else {
                var key = $(this).html();
                if (oldci!=null && oldcj!=null){
                    saveMove(_MOVE, oldci,oldcj,sudoku.value(oldci,oldcj),key);
                    sudoku.setCell(oldci, oldcj,key);
                    leaveDiv(getDiv(oldci, oldcj));
                    updated();
                }
            }
        });

        $('#markCell').click(function(){
            marks.switchMarking(!marks.isMarking());
        });

        $(document).keydown(function(e){
            fAlt = e.altKey;
            //if (fAlt && fShowButtons && oldci!=null && oldcj!=null) enterDiv(getDiv(oldci,oldcj));
        });
        document.onkeyup = function(e){
            if (!fActive) return;
            var key = e.keyCode-48;
            if (key>=0 && key<=9 && oldci!=null && oldcj!=null){
                if (e.altKey){
                    sudoku.setCellCandidate(oldci,oldcj,key,fAutoCandidates);
                    saveMove(_CANDIDATE, oldci,oldcj,key, key);
                    showCell(sudoku.cell(oldci,oldcj));
                } else {
                    fFixed = false;
                    saveMove(_MOVE, oldci,oldcj,sudoku.value(oldci,oldcj),key);
                    sudoku.setCell(oldci, oldcj,key);
                    updated();
                }
            }
            switch (e.keyCode){
                case 80: // P
                    fShowCandidates = !fShowCandidates;
                    showDesc();
                    break;
                case 79: // O

                    break;
                case 37: // left
                    moveSelection(0,-1);
                    break;
                case 38: // up
                    moveSelection(-1,0);
                    break;
                case 39: // right
                    moveSelection(0,1);
                    break;
                case 40: // down
                    moveSelection(1,0);
                    break;
                case 67: //C
                    clID++;
                    if (clID==colors.length) clID=0;
                    cFILL_CELL_BACKGROUND = colors[clID];
                    showDesc();
                    break;
                case 65: //A
                    that.check();
                    break;
                case 27: //ESC
                    fFixed = false;
                    if (oldci!=null&&oldcj!=null)leaveDiv(getDiv(oldci,oldcj));
                    marks.switchMarking(false);
                    break;
                case 46: //dell
                    if (oldci!=null&&oldcj!=null)sudoku.setCell(oldci,oldcj,0);
                    break
            }
            fAlt = false;
        }
    }

    function onDivClicked(e){
        if (!fActive || fAlt) return true;
        var relX = e.pageX - $(this).offset().left;
        var relY = Math.floor(e.pageY - $(this).offset().top);
        var cj = Math.floor(relX /cellWidth), ci = Math.floor(relY/cellWidth);
        if (ci<0||cj<0||ci>8||cj>8)return true;
        if (oldci!=ci||oldcj!=cj){
            if (oldci!=null && oldcj!=null){
                leaveDiv(getDiv(oldci,oldcj));
            }
            oldci = ci; oldcj = cj;
        }
        var cell = sudoku.cell(oldci,oldcj);
        // check user mode supermove
        if (fSuperMove){
            if (marks.isMarked(cell)) marks.removeMark(cell);
            that.gc.doSuperMove(that.gc.gm.superMove(cell));
            fSuperMove = false;
            return false;
        }
        // check mode user marking cells
        if (marks.isMarking()){
            if (cell.value>0){
                if (marks.isMarked(cell)){
                    marks.removeMark(cell);
                } else marks.addMark(cell);
                marks.switchMarking(false);
            }
            return;
        }
        // clear cell, show candidates, highlight
        fFixed = (!fShowButtons && clickPrior==1);
        enterDiv(getDiv(oldci,oldcj),true);
        if (!fShowButtons && clickPrior==2 && prevButton!=null){
            var key = $(prevButton).html();
            saveMove(_MOVE, oldci,oldcj,sudoku.value(oldci,oldcj),key);
            sudoku.setCell(oldci, oldcj,key);
            leaveDiv(getDiv(oldci, oldcj));
            updated();
        }
        return false;
    }

    function moveSelection(dci,dcj){
        if (!fActive) return;
        var ci = oldci+dci, cj = oldcj+dcj;
        if (ci<0||cj<0||ci>8||cj>8)return;
        if (oldci!=ci||oldcj!=cj){
            if (oldci!=null && oldcj!=null){
                leaveDiv(getDiv(oldci,oldcj));
            }
            oldci = ci; oldcj = cj;
            enterDiv(getDiv(oldci,oldcj),false);
        }
    }

    function enterDiv(div, fShow){
        var i = parseInt(div.attr("i"));
        var j = parseInt(div.attr("j"));
        var fFreeDiv=true;
        div.addClass('cellDivHover');
        if (!sudoku.cellIsGiven(i,j) ||  (sudoku.value(i,j)!=0 && !fShow)) return;
        if (sudoku.cell(i,j).value!=0) {
            saveMove(_MOVE, i,j,sudoku.value(i,j),0);
            sudoku.setCell(i,j,0);
            updated();
            fFreeDiv=false;
            if (marks.isMarked(sudoku.cell(i,j))) marks.removeMark(sudoku.cell(i,j));
        }
        if (!fShowButtons) return;
        divSetHtml(div, genTableButtons(i,j), 1);
        $('.cellDiv td').mousedown(function(e){
            if (e.which == 3) {
                $(this)[0].oncontextmenu = function() {
                    return false;
                }
            }
            if (!fShowButtons) return true;
            var ci = e.currentTarget.getAttribute('i'), cj = e.currentTarget.getAttribute('j'), n = e.currentTarget.getAttribute('n');
            if (!(parseInt(n) > -1)) return false;
            if (fAlt || e.which == 3){
                sudoku.setCellCandidate(ci,cj,n,fAutoCandidates);
                saveMove(_CANDIDATE, ci, cj, n, n);
                //showCell(sudoku.cell(ci,cj));
                enterDiv(div,true);
                updated();
            } else {
                saveMove(_MOVE, ci,cj,sudoku.value(ci,cj),n);
                sudoku.setCell(ci, cj, n);
                updated();
            }
            fFixed = false;
            return false;
        });
    }

    function leaveDiv(div){
        var i = parseInt(div.attr("i"));
        var j = parseInt(div.attr("j"));
        div.removeClass('cellDivHover');
        fFixed = false;
        oldci = null;
        oldcj = null;
        if (!sudoku.cellIsGiven(i,j)) return;
        showCell(sudoku.cell(i,j),fAutoCheck);
    }

    function showDesc(){
        var grid = sudoku.grid();
        for (var i = 0; i<= 8; i++){
            for (var j = 0; j <= 8; j++){
                showCell(grid[i][j],fAutoCheck);
            }
        }
        $('#numberCounter').html('Цифр: '+sudoku.numNumbers());
    }

    function showCell(cell, fShowWrong){
        var div = getDiv(cell.i,cell.j);
        if (cell.default!=0)
            div.parent().css({'background':cFILL_CELL_BACKGROUND});
        else div.parent().css({'background':"none"});
        div.removeClass('cwrong');
        var cellClass = "";
        if (cell.default==0){
                if (fShowWrong)  cellClass = (cell.isWrong?'cwrong':'cuser');
                else cellClass = 'cuser';
        }
        var cellCandidates = genTableCandidates(cell);
        divSetHtml(div,(cell.value==0?cellCandidates:'<span class="'+cellClass+'">'+cell.value+'</span>'));
        if (cell.default!=0)return;
        if (fSilent && cell.i==oldci && cell.j==oldcj) {
            div.children().hide();
            div.children().fadeIn(500);
        }
    }

    function hightlightNum(n) {
        if (!(n>=0 && n<=9)) return;
        sudoku.foreachCell(function(cell){
            if (cell.value==n){
                getDiv(cell.i,cell.j).addClass('cellDivTextHighlight');
            }
        });
    }

    function genTableButtons(ci,cj){
        var cell = sudoku.cell(ci,cj);
        var candidates = sudoku.getCellCandidates(cell,fAutoCandidates);
        var table = '<table class="tableButtons" >';
        var num = 0;
        var fPrev = false;
        if (fAutoCandidates && !sudoku.cellHaveCandidates(sudoku.cell(ci,cj))) return null;
        var cnd = (fAutoCandidates?getOneCandidate(candidates):0);
        for (var i=0; i<3; i++){
            table+='<tr>';
            for (var j=0; j<3; j++){
                num = i*3+j+1;
                fPrev = cell.prev == num;
                var btnclass = 'class="'+((fAutoCandidates)?'':'tableButtonsTDcandidate');
                if (cell.value==num) btnclass+=' tableButtonsTDchousen ';
                else {
                    if (candidates[num-1] <= 0){ if (fAutoCandidates) num='&nbsp;';}
                    else {
                        btnclass+=' tableButtonsTD ';
                        if (!fAutoCandidates) btnclass+=' tableButtonsTDchousen '
                    }
                }
                if (fPrev)  btnclass+=' cprev ';
                btnclass+='" ';
                table+='<td '+'i="'+ci+'" j="'+cj+'" n="'+(cnd?cnd:num)+'"'+btnclass+' >'+num+'</td>';
            }
            table+='</tr>';
        }
        table +='</table>';
        return table;
    }

    function genTable(){
        var table = '<table class="tableBoard">';
        for (var i=0; i<9; i++){
            table+='<tr>';
            for (var j=0; j<9; j++){
                var style=' style="';
                if (i % 3 == 0) style+=' border-top-width:3px; ';
                if ((i+1) % 3 == 0) style+=' border-bottom-width:3px; ';
                if (j % 3 == 0) style+=' border-left-width:3px; ';
                if ((j+1) % 3 == 0) style+=' border-right-width:3px; ';
                //if ((i+j) % 2 == 0) style+=' background: none !important;';
                style+='" ';
                var id=' id="c'+i+j+'"';
                table+='<td'+id+style+' tb="0"><div class="cellDiv" id="cd'+i+j+'" i="'+i+'" j="'+j+'">&nbsp;</div></td>';
            }
            table+='</tr>';
        }
        table +='</table>';
        return table;
    }

    function showCandidates(cell){
        if (!fShowCandidates) return;
        var i,j;
        if (cell==null){
            for (i=0;i<=8;i++){
                for (j=0; j<=8; j++){
                    if (sudoku.value(i,j)==0)divSetHtml(getDiv(i,j),genTableCandidates(sudoku.cell(i,j)))
                }
            }
        } else {
            for (i = 0 ; i < 9; i++){
                if (i!=cell.i && sudoku.value(i,cell.j)==0) divSetHtml(getDiv(i,cell.j),genTableCandidates(sudoku.cell(i,cell.j)))
            }
            for (j = 0 ; j < 9; j++){
                if (j!=cell.j && sudoku.value(cell.i, j)==0) divSetHtml(getDiv(cell.i,j),genTableCandidates(sudoku.cell(cell.i,j)))
            }
            var reg = sudoku.getRegion(cell.i,cell.j);
            for (i=reg.i1; i<=reg.i2; i++){
                for (j=reg.j1; j<=reg.j2; j++){
                    if (i!=cell.i && j!=cell.j && sudoku.value(i,j)==0) divSetHtml(getDiv(i,j),genTableCandidates(sudoku.cell(i,j)))
                }
            }
        }
    }

    function genTableCandidates(cell){
        if (!fShowCandidates) return null;
        var candidates = sudoku.getCellCandidates(cell,fAutoCandidates);
        if (candidates==null) {
            return '<span>&nbsp</span>';
        } else getDiv(cell.i,cell.j).removeClass('cwrong');
        var table = '<table class="tableButtons" >';
        var num = 0;
        for (var i=0; i<3; i++){
            table+='<tr>';
            for (var j=0; j<3; j++){
                num = i*3+j+1;
                table+='<td '+'i="'+cell.i+'" j="'+cell.j+'" n="'+num+'"'+' >'+(candidates[num-1]>0?num:'&nbsp; ')+'</td>';
            }
            table+='</tr>';
        }
        table +='</table>';
        return table;
    }

    function divSetHtml(div,html,animation){
        if (!div) return;
        if (!html || html=='') html = '&nbsp';
        $(div).html(html);
        if (false&&animation){
            $(div).css({opacity:0})
                .animate({opacity:1},150,"swing");
        }
    }

    function getDiv(ci,cj){
        return $('#c'+ci+cj+' div');
    }

    function hideHelp(){
        if (helpCell) getDiv(helpCell.i, helpCell.j).removeClass('ccandidate').removeClass('cwrong').removeClass('csingle');
        helpCell = null;
        $('#tbHelp').removeClass('cpHighlight');
    }

    function getOneCandidate(candidates){
        var c = 0;
        for (var i in candidates){
            if (candidates[i]>0) {
                if (c==0)c = parseInt(i)+1;
                else return 0;
            }
        }
        return c;
    }

    var marks = (function(){
        var fIsMarking = false;
        var markmap = {};
        var markedCells = [];
        var _max = 3;

        function updateMarks(){
            var marks = [];
            for (var i in markedCells){
                if (!markedCells[i] || !markmap[markedCells[i].getId()]){}
                else marks.push(markedCells[i]);
            }
            markedCells = marks;
            for (var i=0; i<markedCells.length; i++){
                var marks = "";
                for (var j=0; j<=i; j++) marks+='!';
                $('#mark'+markedCells[i].i+markedCells[i].j).html(marks);
            }
        }

        return {

            switchMarking : function(f){ // switch on|off user marking cells mode;
                fIsMarking = f;
                if (f){
                    $('#markCell').addClass('cellDivTextHighlight');
                } else {
                    $('#markCell').removeClass('cellDivTextHighlight');
                }
            },

            isMarking : function(){ return fIsMarking; },

            addMark : function(cell){
                if (cell.value==0 || markmap[cell.getId()]) return;
                if (!fSilent) saveMove(_MARKCELL,cell.i,cell.j,0,1);
                if (markedCells.length<_max) markedCells.push(cell);
                $(getDiv(cell.i,cell.j)).parent().append('<span id="mark'+cell.i+cell.j+'" class="cellMark"></span>');
                markmap[cell.getId()] = true;
                updateMarks();
            },

            removeMark : function(cell){
                if (!markmap[cell.getId()]) return;
                if (!fSilent) saveMove(_MARKCELL,cell.i,cell.j,1,0);
                markmap[cell.getId()] = null;
                $('#mark'+cell.i+cell.j).remove();
                updateMarks();
            },

            isMarked : function(cell){
                if (markedCells.length==0) return false;
                return (!!markmap[cell.getId()]);
            }
        }
    }());

}

function Sudoku(onCellUpdate, onPuzzleComplete){
    var puzzle, grid, size, lineSize, answ;
    var that = this;
    var numbers=0;
    var clues = 0;
    var max;

    this.loadPuzzle = function(str, gridSize){
        str = str.split(':');
        size = gridSize;
        lineSize = 3; //Math.sqrt(size);
        puzzle = str[0].split('.').join('0').split("").map(Number);
        answ = str[1].split('.').join('0').split("").map(Number);
        init();
    };

    this.clearGrid = function(){
        numbers=0;
        for (var i=0; i<grid.length; i++){
            for (var j=0; j<grid[i].length; j++){
                grid[i][j].clear();
                if (grid[i][j].default!=0) numbers++;
            }
        }
    };

    function init(){
        grid = [];
        numbers=0;
        for (var i = 0; i < size; i++){
            var tmp = [];
            for (var j = 0; j < size; j++){
                tmp[j] = new Cell(puzzle[i*size+j],i,j);
                if (puzzle[i*size+j]!=0)numbers++;
            }
            grid[i] = tmp;
        }
        clues = numbers;
        max = Math.pow(2, size)-1
    }

    this.setCell = function(ci,cj,number){
        ci = parseInt(ci); cj = parseInt(cj); number = parseInt(number);
        if (!(number>-1&&number<10))number=0;
        if (number!=0) numbers++; else numbers--;
        if (ci>size || cj>size || number>size || !that.cellIsGiven(ci,cj)) return;
        if (false && grid[ci][cj].value == number) grid[ci][cj].set(0); //TODO: Cell clear removed
        else grid[ci][cj].set(number);
        gridUpdated(ci,cj);
    };

    this.cellIsGiven = function(ci,cj){ return (puzzle[ci*size+cj]==0); };

    this.value = function(ci,cj){return grid[ci][cj].value;};

    this.cell = function(ci,cj){return grid[ci][cj];};

    this.isValid = function(cell){
        if (!cell || cell.value == 0) return true;
        return answ[cell.i*size+cell.j]==cell.value;
    };

    this.grid = function(){return grid;};

    this.numNumbers = function(){return numbers;}

    this.foreachCell = function(f){
        if (!f || !(typeof f === "function")) return;
        for (var i in grid){
            for (var j in grid[i]){
                f(grid[i][j]);
            }
        }
    };

    this.clues = function(){ return clues};

    function gridUpdated(ci,cj){
        var updatedCells = [], oldw, i, j;
        updatedCells.push(grid[ci][cj]);
        var fCompleate = checkComplete();

        for (i=0; i<updatedCells.length; i++)
            onCellUpdate(updatedCells[i]);

        if (fCompleate) onPuzzleComplete();
    }

    function checkValid(ci,cj){
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
        var reg = that.getRegion(ci,cj);
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
            var r = that.getRegion(n%3*3,Math.floor(n/3)*3);
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

    this.getCandidates = function(ci,cj,fUserCells){
        fUserCells = fUserCells||false;
        var candidates = [1,1,1,1,1,1,1,1,1], val = 0, i, j, mask=0;
        for (i = 0 ; i < size; i++){
            val = fUserCells ? grid[i][cj].value : grid[i][cj].default;
            if (i!=ci && val!=0) {
                candidates[val-1]=0;
                //mask |= Math.pow(2,val-1);
            }
        }
        for (j = 0 ; j < size; j++){
            val = fUserCells ? grid[ci][j].value: grid[ci][j].default;
            if (j!=cj && val!=0) {
                candidates[val-1]=0;
                //mask |= Math.pow(2,val-1);
            }
        }
        var reg = that.getRegion(ci,cj);
        for (i=reg.i1; i<=reg.i2; i++){
            for (j=reg.j1; j<=reg.j2; j++){
                val = fUserCells ? grid[i][j].value : grid[i][j].default;
                if (i!=ci && j!=cj && val!=0) {
                    candidates[val-1]=0;
                    //mask |= Math.pow(2,val-1);
                }
            }
        }
        //mask = max & ~mask;
        return candidates;
    };

    this.getCellCandidates = function(cell, fAuto){
        var ccandidates = cell.getCandidates(fAuto);
        if (ccandidates==null) ccandidates = [0,0,0,0,0,0,0,0,0];
        var scandidates = (fAuto?that.getCandidates(cell.i,cell.j,true):[0,0,0,0,0,0,0,0,0]);
        for (var i=0;i<size;i++){
            if (scandidates[i]!=ccandidates[i]){
                if (ccandidates[i]<0&&scandidates[i]>0)scandidates[i] = -1;
                if (!fAuto && ccandidates[i]>0)scandidates[i] = 1;
            }

        }
        return scandidates;
    };

    this.setCellCandidate = function(ci, cj, c, fAuto){
        var cell = grid[ci][cj];
        var candidates=[0,0,0,0,0,0,0,0,0];
        if (c==0) return; // candidates = (fAuto?that.getCandidates(cell.i,cell.j,true):candidates);
        else {candidates = that.getCellCandidates(cell,fAuto);
            if (candidates[c-1]>0)candidates[c-1]=(fAuto?-1:0);
            else candidates[c-1]=1;
        }
        cell.setCandidates(candidates,fAuto);
    };

    this.cellHaveCandidates = function(cell){
        var candidates = that.getCandidates(cell.i,cell.j,true);
        for (var i in candidates){
            if (candidates[i]!=0)return true;
        }
        return false;
    };

    this.updateCandidates = function(){
        var i,j;
        for (i = 0 ; i < 9; i++){
            for (j = 0 ; j < 9; j++){
                grid[i][j].setCandidates(that.getCandidates(i,j,true));
                onCellUpdate(grid[i][j]);
            }
        }
    };

    this.checkMistakes = function(){ //return true if sudoku wrong
        for(var i = 0; i<size; i++){
            if (checkMistake(i,i,0,size-1)) return true;
        }
        for(var j = 0; j<size; j++){
            if (checkMistake(0,size-1,j,j)) return true;
        }
        var reg;
        for (var i=0;i<size-1; i+=3){
            for (var j=0; j<size-1; j+=3){
                reg = that.getRegion(i,j);
                if (checkMistake(reg.i1,reg.i2,reg.j1,reg.j2)) return true;
            }
        }
        for (var i =0; i<size; i++){
            for(var j=0; j<size; j++){
                if (!that.cellHaveCandidates(grid[i][j])) return true;
            }
        }
        return false;

        function checkMistake(i1,i2,j1,j2){
            var numbers = [0,0,0,0,0,0,0,0,0,0];
            for (var i = i1; i<=i2; i++)
                for (var j = j1; j<=j2; j++){
                    if (grid[i][j].value>0 && numbers[grid[i][j].value]!=0) return true;
                    numbers[grid[i][j].value] = 1;
                }
            return false;
        }
    };

    this.getRegion = function(ci,cj){
        return {
            i1:Math.floor((ci)/lineSize)*lineSize,
            i2:Math.floor((ci)/lineSize)*lineSize+lineSize-1,
            j1:Math.floor((cj)/lineSize)*lineSize,
            j2:Math.floor((cj)/lineSize)*lineSize+lineSize-1
        }
    };

    this.toString = function(){
        var line='';
        for (var i=0; i<size; i++){
            for (var j=0; j<size; j++){
                line+=grid[i][j].value;
            }
        }
        return line;
    };

    this.hash = function(){
        return null;
    }

}

function Cell(val,i,j){
    this.default = val;
    this.value = val;
    this.prev = 0;
    this.isWrong = false;
    this.i = i;
    this.j = j;
    this.time = new Date();
    var that = this;
    var candidates = [0,0,0,0,0,0,0,0,0,0];
    var ucandidates = [0,0,0,0,0,0,0,0,0,0];

    this.set = function(v){
        that.prev = that.value;
        that.value = v;
        that.time = new Date();
    };

    this.getId = function() {return 'c'+that.i+that.j; };
    this.getCandidates = function(f){
        if (f) {
            for (var i=0;i<candidates.length;i++) if (candidates[i]!=0) return candidates;
        }
        else {
            for (var i=0;i<ucandidates.length;i++) if (ucandidates[i]!=0) return ucandidates;
        }
        return null
    };
    this.addCandidates = function(c){
        if (c==0) candidates = [0,0,0,0,0,0,0,0,0,0];
        else  candidates[c-1]=!candidates[c-1];
    };
    this.setCandidates = function(cs,f){ if (f) candidates = cs; else ucandidates = cs };

    this.clear = function(){
        that.value = that.default;
        that.prev = 0;
        candidates = [0,0,0,0,0,0,0,0,0,0];
        ucandidates = [0,0,0,0,0,0,0,0,0,0];
        that.time = new Date();
    };

}


function SudokuHelper(_sudoku){
    var _MISTAKE= 0, _SINGLE = 1, _HIDDENSINGLE = 2, _NAKEDPAIR = 3, _NAKEDTRIPLE = 4;
    var sudoku = _sudoku;
    var clue = null;
    var gridCandidates;
    var grid,sz=9;

    this.getHelp = function(){
        if (!checkValid()) return clue;
        if (!checkClue()) clue = findNextTurn();
        return clue;
    };

    function checkValid(){
        var wrongCell = null;
        sudoku.foreachCell(function(cell){
            if (!sudoku.isValid(cell)){
                if (!wrongCell || cell.time<wrongCell.time)
                    wrongCell = cell;
            }
        });
        if (wrongCell){
            clue = {
                cell: wrongCell,
                type:_MISTAKE
            };
            return false;
        } return true;
    }

    function checkClue(){
        if (clue==null || clue.cell.value>0) return false;
        switch (clue.type){
            case _SINGLE:
               if (isSingleOne(arrToByte(sudoku.getCellCandidates(clue.cell,true)))) return true;
               break;
            case _HIDDENSINGLE:
               if (isSHiddenSingle(clue.cell.i,clue.cell.j,true)) return true;
               break;
            case _NAKEDPAIR:
                var pair = isNakedPair(clue.pair.i,clue.pair.j, true);
                if (isNakedPair(clue.pair.i,clue.pair.j, true)) {
                    clue = {
                        cell : pair.cell,
                        pair : pair.p2,
                        type: _NAKEDPAIR
                    };
                    return true;
                }
                break;
            case _NAKEDTRIPLE:
                var triple = isNakedTriple(clue.triple[0].i,clue.triple[0].j, true);
                if (pair) {
                    clue = {
                        cell : triple.cell,
                        triple : triple.cells,
                        type: _NAKEDTRIPLE
                    };
                    return true;
                }
                break;
        }
        return false;
    }

    function findNextTurn(){
        grid = sudoku.grid();
        gridCandidates = [];
        if (findSingle()) return clue;          // here grid candidates filed
        if (findHiddenSingle()) return clue;
        if (findNakedPair()) return clue;
        if (findNakedTriples()) return clue;
        return null;
    }

    //-------------  Single  ---------------

    function findSingle(){
        for (var i=0;i<sz;i++){
            gridCandidates[i] = [];
            for (var j=0;j<sz;j++){
                if (grid[i][j].value>0){
                    gridCandidates[i][j] = 0;
                    continue;
                }
                gridCandidates[i][j] = arrToByte(sudoku.getCellCandidates(grid[i][j],true));
                if (isSingleOne(gridCandidates[i][j])){
                    clue = {
                        cell:grid[i][j],
                        type:_SINGLE
                    };
                    return true;
                }
            }
        }
        return false;
    }

    //-----------  Hidden Single  -------------

    function findHiddenSingle(){
       var i,j;
       for (i=0;i<sz;i++){
           for (j=0;j<sz;j++){
               if (grid[i][j].value==0 && isSHiddenSingle(i,j,false)){
                   clue = {
                       cell : grid[i][j],
                       type: _HIDDENSINGLE
                   };
                   return true;
               }
           }
       }
        return false;
    }

    function isSHiddenSingle(ci,cj,f){ // f=true to update candidates; need in check
        if (f) getCandidates(ci,cj);
        var otherCnd=0, i,j;
        for (i=0; i<grid.length; i++){
            if (grid[i][cj].value==0){
                if (f) getCandidates(i,cj);
                if (i!=ci) otherCnd |= gridCandidates[i][cj];
            }
        }
        if ((gridCandidates[ci][cj]&~otherCnd)>0) return true;
        otherCnd = 0;
        for (j=0; j<grid.length; j++){
            if (grid[ci][j].value==0){
                if (f) getCandidates(ci,j);
                if (j!=cj)otherCnd |= gridCandidates[ci][j];
            }
        }
        if ((gridCandidates[ci][cj]&~otherCnd)>0) return true;
        otherCnd = 0;
        var reg = sudoku.getRegion(ci,cj);
        for (i=reg.i1; i<=reg.i2; i++){
            for (j=reg.j1; j<=reg.j2; j++){
                if (grid[i][j].value==0){
                    if (f) getCandidates(i,j);
                    if (i!=ci || j!=cj) otherCnd |=gridCandidates[i][j];
                }
            }
        }
        return ((gridCandidates[ci][cj]&~otherCnd)>0) ;
    }

    //------------  Naked Pair  --------------

    function findNakedPair(){
        var i, j, pair;
        for (i=0;i<sz;i++){
            for (j=0;j<sz;j++){
                pair = isNakedPair(i,j);
                if (pair) {
                    clue = {
                        type:_NAKEDPAIR,
                        cell: pair.cell,
                        pair:pair.p2
                    };
                    return true;
                }
            }
        }
        return false;
    }

    function isNakedPair(ci,cj, f){ // return pair cells , f = true to update candidates, need in check
        if (f) getCandidates(ci,cj);
        if (gridCandidates[ci][cj]!=0 && getIntOneBytes(gridCandidates[ci][cj])==2){
            var pair;
            pair = find(ci,ci,0,sz-1,ci,cj, f);
            if (pair) {
                pair.p2 = grid[ci][cj];
                return pair;
            }
           pair = find(0,sz-1,cj,cj,ci,cj, f);
           if (pair) {
               pair.p2 = grid[ci][cj];
               return pair;
           }

            var reg = sudoku.getRegion(ci,cj);
            pair = find(reg.i1,reg.i2,reg.j1,reg.j2,ci,cj, f);
            if (pair) {
                pair.p2 = grid[ci][cj];
                return pair;
            }

        }

        return null;

        function find(i1,i2,j1,j2,ci,cj, f){ //f to update candidates
            var pair, cell, c = gridCandidates[ci][cj];
            for (var i=i1;i<=i2;i++){
                for (var j = j1; j<=j2; j++){
                    if (f) getCandidates(i,j);
                    if (i!=ci || j!= cj && gridCandidates[i][j]!=0){
                        if ((gridCandidates[i][j]&c) > 0){
                            if (gridCandidates[i][j] == c) pair = grid[i][j];
                            else cell = grid[i][j]
                        }
                        if (cell && pair)
                            return {
                                cell:cell,
                                p1:pair
                            };
                    }
                }
            }
            return null;
        }
    }

    //------------  Naked Triples  --------------

    function findNakedTriples(){
        var i, j, triple;
        for (i=0;i<sz;i++){
            for (j=0;j<sz;j++){
                triple = isNakedTriple(i,j);
                if (triple) {
                    clue = {
                        type:_NAKEDTRIPLE,
                        cell: triple.cell,
                        triple:triple.cells
                    };
                    return true;
                }
            }
        }
        return false;
    }

    function isNakedTriple(ci,cj, f){
        if (f) getCandidates(ci,cj);
        if (gridCandidates[ci][cj]!=0 && getIntOneBytes(gridCandidates[ci][cj])<=3){
            var triple;

            triple = find(ci,ci,0,sz-1,[grid[ci][cj]], null, f);
            if (triple) {
                triple.triple = grid[ci][cj];
                return triple;
            }

            triple = find(0,sz-1,cj,cj,[grid[ci][cj]], null, f);
            if (triple) {
                triple.triple = grid[ci][cj];
                return triple;
            }

            var reg = sudoku.getRegion(ci,cj);
            triple = find(reg.i1,reg.i2,reg.j1,reg.j2,[grid[ci][cj]], null, f);
            if (triple) {
                triple.triple = grid[ci][cj];
                return triple;
            }

        }

        return null;

        function find(i1,i2,j1,j2,cells,cell, f){ //f to update candidates
            var c = 0, i, fPushed = false;
            for (i = 0; i<cells.length; i++) c |= gridCandidates[cells[i].i][cells[i].j];
            for (i=i1;i<=i2;i++){
                for (var j = j1; j<=j2; j++){
                    if (f) getCandidates(i,j);
                    if (gridCandidates[i][j]!=0 && $.inArray(grid[i][j],cells)==-1){
                        if (getIntOneBytes(gridCandidates[i][j]|c)<=3){
                                cells.push(grid[i][j]);
                                fPushed = true;
                        } else
                            if ((gridCandidates[i][j]&c) > 0) cell = grid[i][j];
                        if (fPushed || (cells.length==3 && cell)){
                            if (cells.length<3 || (cells.length==3 &&!cell)){
                                return  find(i1,i2,j1,j2,cells,cell,f);
                            }   else {
                                return {
                                    cell:cell,
                                    cells:cells
                                };
                            }
                        }
                    }
                }
            }
            return null;
        }
    }

    function getCandidates(ci,cj){
        if (grid[ci][cj].value>0)  gridCandidates[ci][cj] = 0;
        else gridCandidates[ci][cj] = arrToByte(sudoku.getCellCandidates(grid[ci][cj],true));
    }

}

var isInteger = function(num){
    return (num^0)===num
};
var isSingleOne = function(num){
    return isInteger(Math.log(num)/Math.log(2));
};
var arrToByte = function(arr){
    var mask = 0, i=0;
    while (i < arr.length){
        if (arr[i]>0) mask |= Math.pow(2,parseInt(i));
        i++;
    }
    return mask;
};
var _g21 = 0x55555555, _g22 = 0x33333333, _g23 = 0x0f0f0f0f;
var getIntOneBytes = function (v){
    v = (v & _g21) + ((v >> 1) & _g21);
    v = (v & _g22) + ((v >> 2) & _g22);
    v = (v + (v >> 4)) & _g23;
    return (v + (v >> 8) + (v >> 16) + (v >> 24)) & 0x3f;
};