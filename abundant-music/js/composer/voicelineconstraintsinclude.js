
function VoiceLinePlannerConstraint() {
    this.id = "";
    this._constructorName = "VoiceLinePlannerConstraint";
}


class EmptyVoiceLinePlannerConstraint extends VoiceLinePlannerConstraint {
    constructor() {
        super();
        this._constructorName = "EmptyVoiceLinePlannerConstraint";
    }
}

class MinVoiceLinePlannerConstraint extends VoiceLinePlannerConstraint {
    constructor() {
        super();
        this.constraints = [];
        this._constructorName = "MinVoiceLinePlannerConstraint";

    }
}

class VoiceChordNotesVoiceLinePlannerConstraint extends VoiceLinePlannerConstraint {
    constructor() {
        super();
        this.chordRootPitchClassConstraints = []; // 2d arrays
        this.chordBassPitchClassConstraints = [];
        this.chordRootPitchClassConstraintCosts = [[1]]; // 2d arrays
        this.chordBassPitchClassConstraintCosts = [[1]];

        this._constructorName = "VoiceChordNotesVoiceLinePlannerConstraint";
    }
}
