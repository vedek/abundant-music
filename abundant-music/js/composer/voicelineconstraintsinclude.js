
class VoiceLinePlannerConstraint {

    constructor () {
        this.id = "";
        this._constructorName = "VoiceLinePlannerConstraint";
    }

    // The steps this constraint checks backward for costs and validity.
    // Not used during the planning phase, just the init phase.
    getCheckCostSteps() {
        //    return [0, 1, 2];
        return [];
    };
    getCheckValidSteps() {
        //    return [0, 1, 2];
        return [];
    };

    zeroStepCost(harmonyIndex, stateIndex, planner) {
        return 0;
    };
    oneStepCost(harmonyIndex, prevStateIndex, stateIndex, planner) {
        return 0;
    };
    twoStepCost(harmonyIndex, prevPrevStateIndex, prevStateIndex, stateIndex, planner) {
        return 0;
    };
    zeroStepValid(harmonyIndex, stateIndex, planner) {
        return true;
    };
    oneStepValid(harmonyIndex, prevStateIndex, stateIndex, planner) {
        return true;
    };
    twoStepValid(harmonyIndex, prevPrevStateIndex, prevStateIndex, stateIndex, planner) {
        return true;
    };

}


class EmptyVoiceLinePlannerConstraint extends VoiceLinePlannerConstraint {
    constructor() {
        super();
        this._constructorName = "EmptyVoiceLinePlannerConstraint";
    }

    getCheckCostSteps() {
        return [];
    };
    getCheckValidSteps() {
        return [];
    };
    
}

class MinVoiceLinePlannerConstraint extends VoiceLinePlannerConstraint {
    constructor() {
        super();
        this.constraints = [];
        this._constructorName = "MinVoiceLinePlannerConstraint";

    }

    getCheckCostSteps() {
        var result = [];
        for (var i=0; i<this.constraints.length; i++) {
            var c = this.constraints[i];
            var steps = c.getCheckCostSteps();
            for (var j=0; j<steps.length; j++) {
                if (!arrayContains(result, steps[j])) {
                    result.push(steps[j]);
                }
            }
        }
        return result;
    };
    
    zeroStepCost(harmonyIndex, stateIndex, planner) {
        if (this.constraints.length == 0) {
            return 0;
        }
        var result = 99999999;
        for (var i=0; i<this.constraints.length; i++) {
            var c = this.constraints[i];
            result = Math.min(result, c.zeroStepCost(harmonyIndex, stateIndex, planner));
        }
        return result;
    };
    oneStepCost(harmonyIndex, prevStateIndex, stateIndex, planner) {
        if (this.constraints.length == 0) {
            return 0;
        }
        var result = 99999999;
        for (var i=0; i<this.constraints.length; i++) {
            var c = this.constraints[i];
            result = Math.min(result, c.oneStepCost(harmonyIndex, prevStateIndex, stateIndex, planner));
        }
        return result;
    };
    twoStepCost(harmonyIndex, prevPrevStateIndex, prevStateIndex, stateIndex, planner) {
        if (this.constraints.length == 0) {
            return 0;
        }
        var result = 99999999;
        for (var i=0; i<this.constraints.length; i++) {
            var c = this.constraints[i];
            result = Math.min(result, c.twoStepCost(harmonyIndex, prevPrevStateIndex, prevStateIndex, stateIndex, planner));
        }
        return result;
    };
    
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

    getCheckCostSteps() {
        return [0];
    };
    
    setRootPitches(v) {
        this.chordRootPitchClassConstraints = v;
        return this;
    };
    setRootPitchCosts(v) {
        this.chordRootPitchClassConstraintCosts = v;
        return this;
    };
    
    zeroStepCost(harmonyIndex, stateIndex, planner) {
        var stepCost = 0;
    
        var absoluteNotes = planner.possibleAbsoluteNoteTuples[harmonyIndex][stateIndex];
        var chordPitchClasses = planner.chordPitchClassesArr[harmonyIndex];
    
        for (var i=0; i<this.chordRootPitchClassConstraints.length; i++) {
            var rootArr = this.chordRootPitchClassConstraints[i];
            var costArr = this.chordRootPitchClassConstraintCosts[i % this.chordRootPitchClassConstraintCosts.length];
    
            if (i < absoluteNotes.length) {
                // absolute note for voice with index i
                var absNote = absoluteNotes[i];
                var pitchClass = absNote % 12;
                for (var j=0; j<rootArr.length; j++) {
                    var rootIndex = rootArr[j];
                    var cost = costArr[j % costArr.length];
                    if (rootIndex < chordPitchClasses.length) {
                        var chordNotePitchClass = chordPitchClasses[rootIndex];
                        if (pitchClass == chordNotePitchClass) {
    //                        logit("chord pitch class " + chordNotePitchClass);
                            stepCost += cost;
                        }
                    }
                }
            }
        }
    
    //    if (stepCost > 0) {
    //        logit("Getting zero step cost for " + this._constructorName + " " + harmonyIndex + " " + stateIndex + " " + stepCost);
    //    }
    
        return stepCost;
    };
    
}
