
importScripts('sudoku_solver.js');
importScripts('underscore-min.js');
var solver = new Solver(), tst, dif, solution, str;
addEventListener('message', function(e) {
    if (typeof  e.data.puzzle == "undefined") {
        postMessage(null);
        return
    }
    solver.init(e.data.puzzle,-1);
    tst = new Date();
    solution = solver.getSolves();
    tst = new Date() - tst;
    if (!solution || solution.length!=1) {
        console.log((solution?'multisolve ':'nosolution ')+e.data.puzzle);
        postMessage(null);
        return;
    }
    solution = solution[0];
    dif = solver.getDifficult();
    if (solution.indexOf('0')!=-1 || dif.type!='H' || dif.difficult<2500 || (dif.type=='0'||dif.type=='I')){
        postMessage(null);
        return
    }
    postMessage({
        puzzle: e.data.puzzle,
        solution:solution,
        clues:  e.data.clues,
        difficult: getStringDifficult(dif),
        time: tst
    });
}, false);

function getStringDifficult(dif){
    str = "";
    str =   dif.difficult+';'+
            dif.steps+';';
    for( var i=1; i<=10; i++){
        if (typeof dif.moves[i]!="undefined"){
            str+=dif.moves[i]+';'+dif.moves[i+'_']+';';
        } else str+='0;0;';
    }
    str+=dif.type+';';
    //console.log(JSON.stringify(dif));
    //console.log(str);
    return str;
}