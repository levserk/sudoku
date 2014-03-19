/**
 * Решаем Судоку.
 *
 * Функция решает судоку. Входной параметр -- массив 9х9 с исходными значениями.
 * Возвращает массив 9х9, каждый элемент которого является массивом из двух элементов:
 * числа и его типа. Тип показывает было ли это исходное число или число, найденное
 * в ходе решения.
 *
 * @author   Victor Grischenko <victor.grischenko@gmail.com>
 * @license  GPLv3
 */
Sudoku = function(in_val, _steps) {
    var solved = [];
    var steps = _steps||0;
    var backtracking_call=0;
    var cSingle=0;
    var cHiddenSingle=0;
    var diff = 0;
    var fFirstSingle = check_Single(in_val);


    initSolved(in_val);
    solve();


    /**
     * Инициализация рабочего массива
     *
     * Рабочий массив представляет собой матрицу 9х9, каждый элемент которой
     * является списком из трех элементов: число, тип элемента (in - заполнен
     * по услвоию, unknown - решение не найдено, solved - решено) и перечень
     * предполагаемых значений элемента.
     */
    function initSolved(in_val) {
        backtracking_call=0;
        cSingle=0;
        cHiddenSingle=0;
        var suggest = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        for ( var i=0; i<9; i++) {
            solved[i] = [];
            for ( var j=0; j<9; j++ ) {
                if ( in_val[i][j] ) {
                    solved[i][j] = [in_val[i][j], 'in', []];
                }
                else {
                    solved[i][j] = [0, 'unknown', suggest];
                }
            }
        }
    }; // end of method initSolved()


    function check_Single(grid){

        for (var n=0; n<9; n++){
            for (var m=0; m<9; m++){
                if (grid[n][m]==0 && numCandidates(n,m)==1) return true;
            }
        }

        return false;

        function numCandidates(ci,cj){
            var candidates = [1,1,1,1,1,1,1,1,1], val= 0, i, j;
            for (i = 0 ; i < 9; i++){
                val = grid[i][cj];
                if (i!=ci && val!=0)
                    candidates[val-1]=0;
            }
            for (j = 0 ; j < 9; j++){
                val = grid[ci][j];
                if (j!=cj && val!=0)
                    candidates[val-1]=0;
            }
            var reg = getRegion(ci,cj);
            for (i=reg.i1; i<=reg.i2; i++){
                for (j=reg.j1; j<=reg.j2; j++){
                    val = grid[i][j];
                    if (i!=ci && j!=cj && val!=0)
                        candidates[val-1]=0;
                }
            }
            var num=0;
            for (i in candidates){
                if (candidates[i]!=0) num++;
            }
            return num;
        }

        function getRegion(ci,cj){
            return {
                i1:Math.floor((ci)/3)*3,
                i2:Math.floor((ci)/3)*3+3-1,
                j1:Math.floor((cj)/3)*3,
                j2:Math.floor((cj)/3)*3+3-1
            }
        }
    }


    /**
     * Решение судоку
     *
     * Метод в цикле пытается решить судоку, если на текущем этапе не изменилось
     * ни одного элемента, то решение прекращается.
     */
    function solve() {
        var changed = 0;
        do {
            // сужаем множество значений для всех нерешенных чисел
            changed = updateSuggests();
            steps++;
            //console.log(steps, cSingle, cHiddenSingle);
            diff+=Math.floor(Math.log(steps*20/(cHiddenSingle*1.5+cSingle*0.5+1)+1)*10);
            if ( 810 < steps ) {
                // Зашита от цикла
                break;
            }
        } while (changed);

        if ( !isSolved() && !isFailed() ) {
            // используем поиск с возвратом
            backtracking();
        }
        if (!fFirstSingle) diff+=10;
    }; // end of method solve()


    /**
     * Обновляем множество предположений
     *
     * Проверяем основные правила -- уникальность в строке, столбце и секции.
     */
    function updateSuggests() {
        var changed = 0, c=0; cSingle = 0; cHiddenSingle = 0;
        var buf = arrayDiff(solved[1][3][2], rowContent(1));
        buf = arrayDiff(buf, colContent(3));
        buf = arrayDiff(buf, sectContent(1, 3));
        for ( var i=0; i<9; i++) {
            for ( var j=0; j<9; j++) {
                if ( 'unknown' != solved[i][j][1] ) {
                    // Здесь решение либо найдено, либо задано
                    continue;
                }
                // "Одиночка"
                c = solveSingle(i, j);
                changed += c;
                cSingle += c;
                
                // "Скрытый одиночка"
                c = solveHiddenSingle(i, j);
                changed += c;
                cHiddenSingle += c;
            }
        }
        return changed;
    }; // end of methos updateSuggests()

    function updateSuggests2() {
        var changed = 0;
        var buf = arrayDiff(solved[1][3][2], rowContent(1));
        buf = arrayDiff(buf, colContent(3));
        buf = arrayDiff(buf, sectContent(1, 3));
        for ( var i=0; i<9; i++) {
            for ( var j=0; j<9; j++) {
                if ( 'unknown' != solved[i][j][1] ) {
                    continue;
                }
                changed += solveSingle(i, j);
            }
        }
        cSingle+=changed;
        if (changed==0){
            for ( var i=0; i<9; i++) {
                for ( var j=0; j<9; j++) {
                    if ( 'unknown' != solved[i][j][1] ) {
                        continue;
                    }
                    solveSingle(i,j);
                    changed += solveHiddenSingle(i, j);
                    if (changed>0) break;
                }
                if (changed>0) break;
            }
            cHiddenSingle+=changed;
        }
        return changed;
    }; // end of methos updateSuggests()



    /**
     * Метод "Одиночка"
     */
    function solveSingle(i, j) {
        solved[i][j][2] = arrayDiff(solved[i][j][2], rowContent(i));
        solved[i][j][2] = arrayDiff(solved[i][j][2], colContent(j));
        solved[i][j][2] = arrayDiff(solved[i][j][2], sectContent(i, j));
        if ( 1 == solved[i][j][2].length ) {
            // Исключили все варианты кроме одного
            markSolved(i, j, solved[i][j][2][0]);
            return 1;
        }
        return 0;
    }; // end of method solveSingle()


    /**
     * Метод "Скрытый одиночка"
     */
    function solveHiddenSingle(i, j) {
        var less_suggest = lessRowSuggest(i, j);
        var changed = 0;
        if ( 1 == less_suggest.length ) {
            markSolved(i, j, less_suggest[0]);
            changed++;
        }
        var less_suggest = lessColSuggest(i, j);
        if ( 1 == less_suggest.length ) {
            markSolved(i, j, less_suggest[0]);
            changed++;
        }
        var less_suggest = lessSectSuggest(i, j);
        if ( 1 == less_suggest.length ) {
            markSolved(i, j, less_suggest[0]);
            changed++;
        }
        return changed;
    }; // end of method solveHiddenSingle()
    
    
    /**
     * Отмечаем найденный элемент
     */
    function markSolved(i, j, solve) {
        solved[i][j][0] = solve;
        solved[i][j][1] = 'solved';
    }; // end of method markSolved()


    /**
     * Содержимое строки
     */
    function rowContent(i) {
        var content = [];
        for ( var j=0; j<9; j++ ) {
            if ( 'unknown' != solved[i][j][1] ) {
                content[content.length] = solved[i][j][0];
            }
        }
        return content;
    }; // end of method rowContent()


    /**
     * Содержимое столбца
     */
    function colContent(j) {
        var content = [];
        for ( var i=0; i<9; i++ ) {
            if ( 'unknown' != solved[i][j][1] ) {
                content[content.length] = solved[i][j][0];
            }
        }
        return content;
    }; // end of method colContent()


    /**
     * Содержимое секции
     */
    function sectContent(i, j) {
        var content = [];
        var offset = sectOffset(i, j);
        for ( var k=0; k<3; k++ ) {
            for ( var l=0; l<3; l++ ) {
                if ( 'unknown' != solved[offset.i+k][offset.j+l][1] ) {
                    content[content.length] = solved[offset.i+k][offset.j+l][0];
                }
            }
        }
        return content;
    }; // end of method sectContent()


    /**
     * Минимизированное множество предположений по строке
     */
    function lessRowSuggest(i, j) {
        var less_suggest = solved[i][j][2];
        for ( var k=0; k<9; k++ ) {
            if ( k == j || 'unknown' != solved[i][k][1] ) {
                continue;
            }
            less_suggest = arrayDiff(less_suggest, solved[i][k][2]);
        }
        return less_suggest;
    }; // end of method lessRowSuggest()


    /**
     * Минимизированное множество предположений по столбцу
     */
    function lessColSuggest(i, j) {
        var less_suggest = solved[i][j][2];
        for ( var k=0; k<9; k++ ) {
            if ( k == i || 'unknown' != solved[k][j][1] ) {
                continue;
            }
            less_suggest = arrayDiff(less_suggest, solved[k][j][2]);
        }
        return less_suggest;
    }; // end of method lessColSuggest()


    /**
     * Минимизированное множество предположений по секции
     */
    function lessSectSuggest(i, j) {
        var less_suggest = solved[i][j][2];
        var offset = sectOffset(i, j);
        for ( var k=0; k<3; k++ ) {
            for ( var l=0; l<3; l++ ) {
                if ( ((offset.i+k) == i  && (offset.j+l) == j)|| 'unknown' != solved[offset.i+k][offset.j+l][1] ) {
                    continue;
                }
                less_suggest = arrayDiff(less_suggest, solved[offset.i+k][offset.j+l][2]);
            }
        }
        return less_suggest;
    }; // end of method lessSectSuggest()


    /**
     * Вычисление разницы между двумя массивами
     */
    function arrayDiff (ar1, ar2) {
        var arr_diff = [];
        for ( var i=0; i<ar1.length; i++ ) {
            var is_found = false;
            for ( var j=0; j<ar2.length; j++ ) {
                if ( ar1[i] == ar2[j] ) {
                    is_found = true;
                    break;
                }
            }
            if ( !is_found ) {
                arr_diff[arr_diff.length] = ar1[i];
            }
        }
        return arr_diff;
    }; // end of method arrayDiff()


    /**
     * Уникальные значения массива
     */
    function arrayUnique(ar){
        var sorter = {};
        for(var i=0,j=ar.length;i<j;i++){
        sorter[ar[i]] = ar[i];
        }
        ar = [];
        for(var i in sorter){
        ar.push(i);
        }
        return ar;
    }; // end of method arrayUnique()

    
    /**
     * Расчет смещения секции
     */
    function sectOffset(i, j) {
        return {
            j: Math.floor(j/3)*3,
            i: Math.floor(i/3)*3
        };
    }; // end of method sectOffset()


    /**
     * Вывод найденного решения
     */
    this.html = function() {
        var html = '<table>';
        for ( var i=0; i<9; i++) {
            if ( 2 == i || 5 == i ) {
                html += '<tr class="bb">';
            }
            else {
                html += '<tr>';
            }
            for ( var j=0; j<9; j++ ) {
                
                html += '<td class="'+((2 == j || 5 == j) ? 'rb ' : '')+solved[i][j][1]+'"'+( 'unknown' == solved[i][j][1] ? ' title="'+solved[i][j][2].join(', ')+'"' : '' )+'>'+(solved[i][j][0] ? solved[i][j][0] : '&nbsp;')+'</td>';
            }
            html += '</tr>';
        }
        html += '</table>';
        html += '<p>Решено за '+steps+' шагов</p>';
        return html;
    }; // end of method html()

    this.getSolution = function(){
        var slv=[];
        for (var i =0; i<solved.length; i++){
            var tmp = [];
            for (var j = 0; j<solved[i].length; j++) {
                tmp[j] = solved[i][j][0];
            }
            slv[i] = tmp;
        }
        return slv;
    }

    this.getStringSolution = function(){
        var str='';
        for (var i =0; i<solved.length; i++){
            var tmp = solved[i];
            for (var j = 0; j<tmp.length; j++) {
                str+=tmp[j][0];
            }
        }
        return str;
    }

    this.getBacktracking = function(){
        return backtracking_call;
    }

    this.getSingles = function(){ return cSingle; }
    this.getHiddenSingles = function() { return cHiddenSingle; }
    this.getSteps = function(){return steps;}
    this.fSingle = function(){return fFirstSingle;}
    this.getDifficult = function(){
        return diff;
    }


    /**
     * Проверка на найденное решение
     */
    function isSolved() {
        for ( var i=0; i<9; i++) {
            for ( var j=0; j<9; j++ ) {
                if ( 'unknown' == solved[i][j][1] ) {
                    return false;
                }
            }
        }
        return true;
    }; // end of method isSolved()




    /**
     * Публичный метод isSolved
     */
    this.isSolved = function() {
        return isSolved();
    }; // end of public method isSolved()


    /**
     * Есть ли ошибка в поиске решения
     *
     * Возвращает true, если хотя бы у одной из ненайденных ячеек
     * отсутствуют кандидаты
     */
    function isFailed() {
        var is_failed = false;
        for ( var i=0; i<9; i++) {
            for ( var j=0; j<9; j++ ) {
                if ( 'unknown' == solved[i][j][1] && !solved[i][j][2].length ) {
                    is_failed = true;
                }
            }
        }
        return is_failed;
    }; // end of method isFailed()


    /**
     * Публичный метод isFailed
     */
    this.isFailed = function() {
        return isFailed();
    }; // end of public method isFailed()


    /**
     * Мпетод поиска с возвратом
     */
    function backtracking() {
        backtracking_call++;
        // Формируем новый массив
        var in_val = [[], [], [], [], [], [], [], [], []];
        var i_min=-1, j_min=-1, suggests_cnt=0;
        for ( var i=0; i<9; i++ ) {
            in_val[i].length = 9;
            for ( var j=0; j<9; j++ ) {
                in_val[i][j] = solved[i][j][0];
                if ( 'unknown' == solved[i][j][1] && (solved[i][j][2].length < suggests_cnt || !suggests_cnt) ) {
                    suggests_cnt = solved[i][j][2].length;
                    i_min = i;
                    j_min = j;
                }
            }
        }

        // проходим по всем элементам, находим нерешенные,
        // выбираем кандидата и пытаемся решить
        for ( var k=0; k<suggests_cnt; k++ ) {
            in_val[i_min][j_min] = solved[i_min][j_min][2][k];
            // инициируем новый цикл
            var sudoku = new Sudoku(in_val,steps);
            if ( sudoku.isSolved() ) {
                // нашли решение
                //console.log("back " + diff + " " +  steps  + " " +  Math.floor(1/(Math.log(steps)*3)*50));
                diff+=Math.floor(1/(Math.log(steps+1)*3)*50); //1 - 400, 5 - 100, 10 - 50
                out_val = sudoku.solved();
                diff+=sudoku.getDifficult();
                steps=sudoku.getSteps();
                backtracking_call+=sudoku.getBacktracking();
                // Записываем найденное решение
                for ( var i=0; i<9; i++ ) {
                    for ( var j=0; j<9; j++ ) {
                        if ( 'unknown' == solved[i][j][1] ) {
                            markSolved(i, j, out_val[i][j][0])
                        }
                    }
                }
                return;
            }
        }
    }; // end of function backtracking)(


    /**
     * Возвращает найденное решение
     */
    this.solved = function() {
        return solved;
    }; // end of solved()
}; // end of class sudoku()
