
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
        const c = this.constraints[cIndex % this.constraints.length];
        if (c instanceof EmptyVoiceLinePlannerConstraint) {
            return;
        }
        let arr = result[hIndex];
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
        const constraintCount = this.constraints.length;
        if (constraintCount > 0) {
            const harmonyCount = harmony.getCount();

            for (let i=0; i<this.globalIndices.length; i++) {
                let cIndex = this.globalIndices[i];
                for (let j=0; j<harmonyCount; j++) {
                    this.checkAndAddConstraint(cIndex, resultConstraints, j)
                }
            }
            if (this.indexPattern.length > 0) {
                for (let i=0; i<harmonyCount; i++) {
                    let cIndex = getItemFromArrayWithStartEndItems(0, this.indexPattern, harmonyCount, i, this.startIndexPattern, this.endIndexPattern);
                    this.checkAndAddConstraint(cIndex, resultConstraints, i);
                }
            }
        }
    }
}







const SuspendVoiceLinePlannerConstraintMode = {
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
        let stepCost = 0;

        const absNotes = planner.possibleAbsoluteNoteTuples[harmonyIndex][stateIndex];
    //    let chordPitchClasses = planner.chordPitchClassesArr[harmonyIndex];
        const prevAbsNotes = planner.possibleAbsoluteNoteTuples[harmonyIndex-1][prevStateIndex];
    //    let prevChordPitchClasses = planner.chordPitchClassesArr[harmonyIndex-1];


        for (let j=0; j<this.suspendPitchClassPairs.length; j++) {
            const pair = this.suspendPitchClassPairs[j];
            const penalty = this.penalties[j % this.penalties.length];

            let found = false;
            for (let i=0; i<absNotes.length; i++) {
                if (this.onPattern[i % this.onPattern.length] == 1) {
                    const fromAbs = prevAbsNotes[i];
                    const fromPc = fromAbs % 12;
                    const toAbs = absNotes[i];
                    const toPc = toAbs % 12;
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
        let stepCost = 0;

        const absNotes = planner.possibleAbsoluteNoteTuples[harmonyIndex][stateIndex];
        const prevAbsNotes = planner.possibleAbsoluteNoteTuples[harmonyIndex-1][prevStateIndex];

        const chordPitchClasses = planner.chordPitchClassesArr[harmonyIndex];
        const prevChordPitchClasses = planner.chordPitchClassesArr[harmonyIndex-1];

        if (!arrayContains(prevChordPitchClasses, this.fromPitchClass) ||
            !arrayContains(chordPitchClasses, this.toPitchClass)) {
            return this.missingPenalty;
    //        logit(this._constructorName + " should not be used when it can't be fulfilled " + this.id);
    //        logit("  " + this.fromPitchClass + " -> " + this.toPitchClass + "  " + prevChordPitchClasses.join(", ") + " -> " + chordPitchClasses.join(", "));
        }

        let possibleCount = 0;
        let okCount = 0;
        for (let i=0; i<absNotes.length; i++) {
            const absNote = absNotes[i];
            const prevAbsNote = prevAbsNotes[i];

            const pc = absNote % 12;
            const prevPc = prevAbsNote % 12;

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

        const mustCount = Math.min(possibleCount, this.progressionCount);
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
        let stepCost = 0;

        const absNotes = planner.possibleAbsoluteNoteTuples[harmonyIndex][stateIndex];
        const prevAbsNotes = planner.possibleAbsoluteNoteTuples[harmonyIndex-1][prevStateIndex];

        let enterFound = false;
        let leaveFound = false;

        function getCostCount(range, fromAbs, toAbs) {
            let count = 0;
            const diff = toAbs - fromAbs;
            if (diff > range[1]) {
                count = diff - range[1];
            } else if (diff < range[0]) {
                count = range[0] - diff;
            }
            return count;
        }

        let leaveFrom = 0;
        let leaveTo = 0;
        let enterFrom = 0;
        let enterTo = 0;

        for (let i=0; i<absNotes.length; i++) {
            const fromAbs = prevAbsNotes[i];
            const fromPc = fromAbs % 12;
            const toAbs = absNotes[i];
            const toPc = toAbs % 12;
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
        let stepCost = 0;

        const absNotes = planner.possibleAbsoluteNoteTuples[harmonyIndex][stateIndex];
        const prevAbsNotes = planner.possibleAbsoluteNoteTuples[harmonyIndex-1][prevStateIndex];

        function getCostCount(range, fromAbs, toAbs) {
            let count = 0;
            const diff = toAbs - fromAbs;
            if (diff > range[1]) {
                count = diff - range[1];
            } else if (diff < range[0]) {
                count = range[0] - diff;
            }
            return count;
        }

        for (let i=0; i<this.voiceIndices.length; i++) {
            const voiceIndex = this.voiceIndices[i];
            if (voiceIndex < absNotes.length) {
                const fromAbs = prevAbsNotes[voiceIndex];
                const toAbs = absNotes[voiceIndex];
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
        let stepCost = 0;

        const absoluteNotes = planner.possibleAbsoluteNoteTuples[harmonyIndex][stateIndex];

        const pitchClassMap = planner.getPitchClassMap(absoluteNotes);

        const harmonyElement = planner.harmony.get(harmonyIndex);
        const isSeventh = harmonyElement.isSeventh();

        const chordPitchClasses = planner.chordPitchClassesArr[harmonyIndex];

        const rootPitchClass = chordPitchClasses[0];
        const thirdPitchClass = chordPitchClasses[1];
        const fifthPitchClass = chordPitchClasses[2];
        let seventhPitchClass = rootPitchClass;
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
        let stepCost = 0;

        const absoluteNotes = planner.possibleAbsoluteNoteTuples[harmonyIndex][stateIndex];

        const pitchClassMap = planner.getPitchClassMap(absoluteNotes);

        const harmonyElement = planner.harmony.get(harmonyIndex);
        const isSeventh = harmonyElement.isSeventh();

        const chordPitchClasses = planner.chordPitchClassesArr[harmonyIndex];

        const rootPitchClass = chordPitchClasses[0];
        const thirdPitchClass = chordPitchClasses[1];
        const fifthPitchClass = chordPitchClasses[2];
        let seventhPitchClass = rootPitchClass;
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
