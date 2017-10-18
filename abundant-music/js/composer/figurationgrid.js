
class FigurationGridCellInfo {
    constructor() {
        this.startBeat = 0.0;
        this.endBeat = 1.0;
    }
}

class FigurationGrid {
    constructor(options) {
        this.beatCellSize = getValueOrDefault(options, "beatCellSize", 1);
        this.noteCellSize = getValueOrDefault(options, "noteCellSize", 5);

        this.infos = [];
        this.nextIndices = [];
        this.previousIndices = [];
    }

    storeInfo(info) {
        this.infos.push(info);
    }

    getBeatCellIndex(beat) {
        return Math.floor(beat / this.beatCellSize);
    }

    getNoteCellIndex(note) {
        return Math.floor(note / this.noteCellSize);
    }

    getOverlapIndices(beatInterval, note) {
        
    }
}






