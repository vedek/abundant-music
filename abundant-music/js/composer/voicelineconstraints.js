
class AbstractVoiceLinePlannerConstraintZone {
    constructor() {
        this.id = "";

        this.addInstanceDuplicates = false;
        this.addClassDuplicates = false;
        this._constructorName = "AbstractVoiceLinePlannerConstraintZone";
    }

    applyZone(harmony, resultConstraints) {
    }
}

class IndexedVoiceLinePlannerConstraintZone extends AbstractVoiceLinePlannerConstraintZone {
    constructor() {
        super();

        // Adds constraints for all steps
        this.globalIndices = [];

        // Patterns for harmony index
        this.indexPattern = [];
        this.startIndexPattern = [];
        this.endIndexPattern = [];

        // Patterns for phrases
        this.phraseIndexPattern = [];
        this.startPhraseIndexPattern = [];
        this.endPhraseIndexPattern = [];

        // Index ranges
        this.indexRanges = [];

        // Adds constraints for specific indices (pairs of [index, constraint index])
        this.indexConstraintIndices = [];

        // List of all constraints that are indexed
        this.constraints = [];
        this._constructorName = "IndexedVoiceLinePlannerConstraintZone";
    }

    checkAndAddConstraint(cIndex, result, hIndex) {
        var c = this.constraints[cIndex % this.constraints.length];
        if (c instanceof EmptyVoiceLinePlannerConstraint) {
            return;
        }
        var arr = result[hIndex];
        if (!arr) {
            arr = [];
            result[hIndex] = arr;
        }
        if ((this.addInstanceDuplicates || !arrayContainsExactly(arr, c)) &&
            (this.addClassDuplicates || !arrayContainsSameProperty(arr, "_constructorName", c._constructorName))) {
            arr.push(c);
        }
    }

    // Adds constraints
    applyZone(harmony, resultConstraints) {
        var constraintCount = this.constraints.length;
        if (constraintCount > 0) {
            var harmonyCount = harmony.getCount();

            for (var i=0; i<this.globalIndices.length; i++) {
                var cIndex = this.globalIndices[i];
                for (var j=0; j<harmonyCount; j++) {
                    this.checkAndAddConstraint(cIndex, resultConstraints, j)
                }
            }
            if (this.indexPattern.length > 0) {
                for (var i=0; i<harmonyCount; i++) {
                    var cIndex = getItemFromArrayWithStartEndItems(0, this.indexPattern, harmonyCount, i, this.startIndexPattern, this.endIndexPattern);
                    this.checkAndAddConstraint(cIndex, resultConstraints, i);
                }
            }
        }
    }
}







var SuspendVoiceLinePlannerConstraintMode = {
    PITCH_CLASSES: 0
};

class SuspendVoiceLinePlannerConstraint extends VoiceLinePlannerConstraint {
    constructor() {
        super();
        this.mode = SuspendVoiceLinePlannerConstraintMode.PITCH_CLASSES;

        this.suspendPitchClassPairs = []; // [fromPc, toPc]


        this.onPattern = [1];

        this.penalties = [1];
        this._constructorName = "SuspendVoiceLinePlannerConstraint";
    }

    getCheckCostSteps() {
        return [1];
    }

    oneStepCost(harmonyIndex, prevStateIndex, stateIndex, planner) {
        var stepCost = 0;

        var absNotes = planner.possibleAbsoluteNoteTuples[harmonyIndex][stateIndex];
    //    var chordPitchClasses = planner.chordPitchClassesArr[harmonyIndex];
        var prevAbsNotes = planner.possibleAbsoluteNoteTuples[harmonyIndex-1][prevStateIndex];
    //    var prevChordPitchClasses = planner.chordPitchClassesArr[harmonyIndex-1];


        for (var j=0; j<this.suspendPitchClassPairs.length; j++) {
            var pair = this.suspendPitchClassPairs[j];
            var penalty = this.penalties[j % this.penalties.length];

            var found = false;
            for (var i=0; i<absNotes.length; i++) {
                if (this.onPattern[i % this.onPattern.length] == 1) {
                    var fromAbs = prevAbsNotes[i];
                    var fromPc = fromAbs % 12;
                    var toAbs = absNotes[i];
                    var toPc = toAbs % 12;
                    if (pair[0] == fromPc && pair[1] == toPc) {
                        // Should be resolved correctly
                        found = true;
                        if (fromAbs <= toAbs || fromAbs - toAbs > 2) {
                            stepCost += penalty;
                        }
                    }
                }
            }
            if (!found) {
                stepCost += penalty;
            }
        }

    //    if (this.suspendPitchClassPairs.length > 0 && stepCost == 0) {
    //        logit("succeeded!!!");
    //
    //    }

        return stepCost;
    }
}





class PitchClassStepVoiceLinePlannerConstraint extends VoiceLinePlannerConstraint {
    constructor() {
        super();
        this.fromPitchClass = 0;
        this.toPitchClass = 0;
        this.sameRegister = true;

        this.penalty = 2;
        this.missingPenalty = 3;

        this.progressionCount = 1; // This is stupid, always gives parallel octaves if set higher than 1
        this._constructorName = "PitchClassStepVoiceLinePlannerConstraint";

    }

    getCheckCostSteps() {
        return [1];
    }

    oneStepCost(harmonyIndex, prevStateIndex, stateIndex, planner) {
        var stepCost = 0;

        var absNotes = planner.possibleAbsoluteNoteTuples[harmonyIndex][stateIndex];
        var prevAbsNotes = planner.possibleAbsoluteNoteTuples[harmonyIndex-1][prevStateIndex];

        var chordPitchClasses = planner.chordPitchClassesArr[harmonyIndex];
        var prevChordPitchClasses = planner.chordPitchClassesArr[harmonyIndex-1];

        if (!arrayContains(prevChordPitchClasses, this.fromPitchClass) ||
            !arrayContains(chordPitchClasses, this.toPitchClass)) {
            return this.missingPenalty;
    //        logit(this._constructorName + " should not be used when it can't be fulfilled " + this.id);
    //        logit("  " + this.fromPitchClass + " -> " + this.toPitchClass + "  " + prevChordPitchClasses.join(", ") + " -> " + chordPitchClasses.join(", "));
        }

        var possibleCount = 0;
        var okCount = 0;
        for (var i=0; i<absNotes.length; i++) {
            var absNote = absNotes[i];
            var prevAbsNote = prevAbsNotes[i];

            var pc = absNote % 12;
            var prevPc = prevAbsNote % 12;

            if (prevPc == this.fromPitchClass) {
                possibleCount++;
            }

            if (prevPc == this.fromPitchClass && pc == this.toPitchClass &&
                (!this.sameRegister || Math.abs(absNote - prevAbsNote) <= 6)) {
                okCount++;
            }
        }
        if (possibleCount == 0) {
            // missing the pitch class
            stepCost += this.missingPenalty;
        }

        var mustCount = Math.min(possibleCount, this.progressionCount);
        if (okCount >= mustCount) {
    //        logit(this._constructorName + " made it!");
        } else {
            stepCost += this.penalty * (mustCount - okCount);
        }

        return stepCost;
    }
}

class PitchClassLeapRangeVoiceLinePlannerConstraint extends VoiceLinePlannerConstraint {
    constructor() {
        super();

        this.pitchClass = 0;

        this.enterRange = [-1, 1]; // [lower, upper]
        this.leaveRange = [-1, 1]; // [lower, upper]

        this.enterPenaltyFactor = 0.0;
        this.leavePenaltyFactor = 0.0;

        this.enterNotFoundPenalty = 0;
        this.leaveNotFoundPenalty = 0;

        this.enterDoublingPenalty = 0;
        this.leaveDoublingPenalty = 0;
        this._constructorName = "PitchClassLeapRangeVoiceLinePlannerConstraint";
    }

    getCheckCostSteps() {
        return [1];
    }

    oneStepCost(harmonyIndex, prevStateIndex, stateIndex, planner) {
        var stepCost = 0;

        var absNotes = planner.possibleAbsoluteNoteTuples[harmonyIndex][stateIndex];
        var prevAbsNotes = planner.possibleAbsoluteNoteTuples[harmonyIndex-1][prevStateIndex];

        var enterFound = false;
        var leaveFound = false;

        function getCostCount(range, fromAbs, toAbs) {
            var count = 0;
            var diff = toAbs - fromAbs;
            if (diff > range[1]) {
                count = diff - range[1];
            } else if (diff < range[0]) {
                count = range[0] - diff;
            }
            return count;
        }

        var leaveFrom = 0;
        var leaveTo = 0;
        var enterFrom = 0;
        var enterTo = 0;

        for (var i=0; i<absNotes.length; i++) {
            var fromAbs = prevAbsNotes[i];
            var fromPc = fromAbs % 12;
            var toAbs = absNotes[i];
            var toPc = toAbs % 12;
            if (this.pitchClass == toPc) {
                // Checking enter stuff
                if (enterFound) {
                    stepCost += this.enterDoublingPenalty;
                }
                enterFound = true;
                stepCost += getCostCount(this.enterRange, fromAbs, toAbs) * this.enterPenaltyFactor;
                enterFrom = fromAbs;
                enterTo = toAbs;
            }
            if (this.pitchClass == fromPc) {
                // Checking leave stuff
                if (leaveFound) {
                    stepCost += this.leaveDoublingPenalty;
                }
                leaveFound = true;
                stepCost += getCostCount(this.leaveRange, fromAbs, toAbs) * this.leavePenaltyFactor;
                leaveFrom = fromAbs;
                leaveTo = toAbs;
            }
        }
        if (!enterFound) {
            stepCost += this.enterNotFoundPenalty;
        }
        if (!leaveFound) {
            stepCost += this.leaveNotFoundPenalty;
        }

    //    if (stepCost == 0 && this.leavePenaltyFactor > 0.0) {
    //        logit(this._constructorName + " zero cost " + leaveFrom + " -> " + leaveTo);
    //    }

        return stepCost;
    }
}

class LeapRangeVoiceLinePlannerConstraint extends VoiceLinePlannerConstraint {
    constructor() {
        super();

        this.voiceIndices = [0, 1, 2, 3];

        this.range = [-1, 1]; // [lower, upper]

        this.penaltyFactor = 0.0;

        this._constructorName = "LeapRangeVoiceLinePlannerConstraint";
    }

    getCheckCostSteps() {
        return [1];
    }

    oneStepCost(harmonyIndex, prevStateIndex, stateIndex, planner) {
        var stepCost = 0;

        var absNotes = planner.possibleAbsoluteNoteTuples[harmonyIndex][stateIndex];
        var prevAbsNotes = planner.possibleAbsoluteNoteTuples[harmonyIndex-1][prevStateIndex];

        function getCostCount(range, fromAbs, toAbs) {
            var count = 0;
            var diff = toAbs - fromAbs;
            if (diff > range[1]) {
                count = diff - range[1];
            } else if (diff < range[0]) {
                count = range[0] - diff;
            }
            return count;
        }

        for (var i=0; i<this.voiceIndices.length; i++) {
            var voiceIndex = this.voiceIndices[i];
            if (voiceIndex < absNotes.length) {
                var fromAbs = prevAbsNotes[voiceIndex];
                var toAbs = absNotes[voiceIndex];
                stepCost += getCostCount(this.range, fromAbs, toAbs) * this.penaltyFactor;
            }
        }

        return stepCost;
    }
}







class ChordDoublingVoiceLinePlannerConstraint extends VoiceLinePlannerConstraint {
    constructor() {
        super();
        this.rootDoublingPenalty = 0;
        this.thirdDoublingPenalty = 1;
        this.fifthDoublingPenalty = 1;
        this.seventhDoublingPenalty = 1;
        this._constructorName = "ChordDoublingVoiceLinePlannerConstraint";
    }

    getCheckCostSteps() {
        return [0];
    }

    zeroStepCost(harmonyIndex, stateIndex, planner) {
        var stepCost = 0;

        var absoluteNotes = planner.possibleAbsoluteNoteTuples[harmonyIndex][stateIndex];

        var pitchClassMap = planner.getPitchClassMap(absoluteNotes);

        var harmonyElement = planner.harmony.get(harmonyIndex);
        var isSeventh = harmonyElement.isSeventh();

        var chordPitchClasses = planner.chordPitchClassesArr[harmonyIndex];

        var rootPitchClass = chordPitchClasses[0];
        var thirdPitchClass = chordPitchClasses[1];
        var fifthPitchClass = chordPitchClasses[2];
        var seventhPitchClass = rootPitchClass;
        if (isSeventh) {
            seventhPitchClass = chordPitchClasses[3];
        }

        if (pitchClassMap[rootPitchClass] > 1) {
            // Doubled or tripled root
            stepCost += this.rootDoublingPenalty *
                (pitchClassMap[rootPitchClass] - 1);
        }
        if (pitchClassMap[thirdPitchClass] > 1) {
            // Doubled or tripled third
            stepCost += this.thirdDoublingPenalty *
                (pitchClassMap[thirdPitchClass] - 1);
        }
        if (pitchClassMap[fifthPitchClass] > 1) {
            // Doubled or tripled fifth
            stepCost += this.fifthDoublingPenalty *
                (pitchClassMap[fifthPitchClass] - 1);
        }
        if (isSeventh && pitchClassMap[seventhPitchClass] > 1) {
            // Doubled or tripled seventh
            stepCost += this.seventhDoublingPenalty *
                (pitchClassMap[seventhPitchClass] - 1);
        }

        return stepCost;
    }
}

class ChordCompletenessVoiceLinePlannerConstraint extends VoiceLinePlannerConstraint {
    constructor() {
        super();

        this.missingRootPenalty = 3;
        this.missingThirdPenalty = 2;
        this.missingFifthPenalty = 1;
        this.missingSeventhPenalty = 2;

        this._constructorName = "ChordCompletenessVoiceLinePlannerConstraint";
    }

    getCheckCostSteps() {
        return [0];
    }

    zeroStepCost(harmonyIndex, stateIndex, planner) {
        var stepCost = 0;

        var absoluteNotes = planner.possibleAbsoluteNoteTuples[harmonyIndex][stateIndex];

        var pitchClassMap = planner.getPitchClassMap(absoluteNotes);

        var harmonyElement = planner.harmony.get(harmonyIndex);
        var isSeventh = harmonyElement.isSeventh();

        var chordPitchClasses = planner.chordPitchClassesArr[harmonyIndex];

        var rootPitchClass = chordPitchClasses[0];
        var thirdPitchClass = chordPitchClasses[1];
        var fifthPitchClass = chordPitchClasses[2];
        var seventhPitchClass = rootPitchClass;
        if (isSeventh) {
            seventhPitchClass = chordPitchClasses[3];
        }

        if (!pitchClassMap[rootPitchClass]) {
            // Missing root
            stepCost += this.missingRootPenalty;
        }
        if (!pitchClassMap[thirdPitchClass]) {
            // Missing third
            stepCost += this.missingThirdPenalty;
        }
        if (!pitchClassMap[fifthPitchClass]) {
            // Missing fifth
            stepCost += this.missingFifthPenalty;
        }
        if (isSeventh && !pitchClassMap[seventhPitchClass]) {
            // Missing seventh
            stepCost += this.missingSeventhPenalty;;
        }

        return stepCost;
    }
}
