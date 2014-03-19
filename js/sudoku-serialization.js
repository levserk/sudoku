function SudokuSerializer() {
    var that = this;
    this.encodeMove = function (move) {
        if (move){
            return ''+move.type+move.ci+move.cj+move.oldn+move.newn;
        }
    }

    this.getDecodedHistory = function (encodedHistory) {
        var history=[];
        if (encodedHistory && encodedHistory.length>0){
            var type, ci,cj, oldn, newn;
            while(encodedHistory.length>3){
                type = parseInt(encodedHistory.substr(0,1));
                ci = parseInt(encodedHistory.substr(1,1));
                cj = parseInt(encodedHistory.substr(2,1));
                oldn = parseInt(encodedHistory.substr(3,1));
                newn = parseInt(encodedHistory.substr(4,1));
                encodedHistory = encodedHistory.substr(5);
                history.push({ci:ci,cj:cj,oldn:oldn,newn:newn,type:type});
            }
        }
        return history;
    }

    this.applyEncodedHistory = function (g, encodedHistory) {
        if (encodedHistory && encodedHistory.length>0){
            g.doHistory(that.getDecodedHistory(encodedHistory));
        }
    }
}