addEventListener('message', function(e) {
    importScripts('sudoku_backtracking.js');
    if (typeof  e.data.puzzle == "undefined") {
        return;
    }
    var puzzle = e.data.puzzle.split("").map(Number);
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
    var sudoku = new Sudoku(out);
    tst = new Date() - tst;
    var difficult = sudoku.getDifficult();
    if (e.data.clues != clues || e.data.solution!=sudoku.getStringSolution()) postMessage(null);
    else
    postMessage({
        puzzle: e.data.puzzle,
        solution:sudoku.getStringSolution(),
        steps:sudoku.getSteps(),
        backsteps:sudoku.getBacktracking(),
        clues: clues,
        difficult: difficult,
        singles: sudoku.getSingles(),
        hiddenSingles: sudoku.getHiddenSingles(),
        first: sudoku.fSingle(),
        time: tst
    });
}, false);