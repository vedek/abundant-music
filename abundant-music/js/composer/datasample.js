
function DataSample(options) {
//    this.id = "";
    this.likelihood = getValueOrDefault(options, "likelihood", 1);
    this.active = true;
    this._constructorName = "DataSample";
}

class IntDataSample extends DataSample {
    constructor(options) {
        super(options);
        this.data = 0;
        this._constructorName = "IntDataSample";
    }
}

class IntListDataSample extends DataSample {
    constructor(options) {
        super(options);
        this.data = [];
        this._constructorName = "IntListDataSample";
    }
}

class IntList2DDataSample extends DataSample {
    constructor(options) {
        super(options);
        this.data = [];
        this._constructorName = "IntList2DDataSample";
    }
}

class FloatDataSample extends DataSample {
    constructor(options) {
        super(options);
        this.data = 0.0;
        this._constructorName = "FloatDataSample";
    }
}

class FloatListDataSample extends DataSample {
    constructor(options) {
        super(options);
        this.data = [];
        this._constructorName = "FloatListDataSample";
    }
}

class MidiProgramDataSample extends DataSample {
    constructor(options) {
        super(options);
        this.data = getValueOrDefault(options, "data", MidiProgram.ACOUSTIC_GRAND_PIANO);
        this._constructorName = "MidiProgramDataSample";
    }
}

class MidiDrumDataSample extends DataSample {
    constructor(options) {
        super(options);
        this.data = getValueOrDefault(options, "data", MidiDrum.BASS_DRUM_1);
        this._constructorName = "MidiDrumDataSample";
    }
}

class PhraseGroupTypeDataSample extends DataSample {
    constructor(options) {
        super(options);
        this.data = getValueOrDefault(options, "data", SimpleModuleGeneratorPhraseGroupType.ANTECEDENT_CONSEQUENT);
        this._constructorName = "PhraseGroupTypeDataSample";
    }
}

class ModulationTargetDataSample extends DataSample {
    constructor(options) {
        super(options);
        this.data = getValueOrDefault(options, "data", DynamicHarmonyModulationTarget.MEDIANT);
        this._constructorName = "ModulationTargetDataSample";
    }
}

class SongPartStructureInfoDataSample extends DataSample {
    constructor(options) {
        super(options);
        this.data = [new SongPartStructureInfo()]; //getValueOrDefault(options, "data", new SongPartStructureInfo());
        this._constructorName = "SongPartStructureInfoDataSample";
    }
}

SongPartStructureInfoDataSample.prototype.data_allowedTypes = {"SongPartStructureInfo": 1};


class HarmonicPlanDataSample extends DataSample {
    constructor(options) {
        super(options);
        this.data = [DynamicHarmonyModulationTarget.DOMINANT, DynamicHarmonyModulationTarget.SUBDOMINANT]; //getValueOrDefault(options, "data", new SongPartStructureInfo());
        this._constructorName = "HarmonicPlanDataSample";
    }
}
