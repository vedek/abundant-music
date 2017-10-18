

class ClassicalVoiceLineState {
    constructor() {
        this.stateIndex = 0;
    //    this.absoluteNotes = [];
    //    this.scaleIndices = [];
    }

    copy() {
        const result = new ClassicalVoiceLineState();
        result.stateIndex = this.stateIndex;
        //    result.absoluteNotes = arrayCopy(this.absoluteNotes);
        //    result.scaleIndices = arrayCopy(this.scaleIndices);
        return result;
    }

    toString() {
        return (
            //    "absoluteNotes: " + this.absoluteNotes +
            //    "scaleIndices: " + this.scaleIndices +
            `CVLS{stateIndex: ${this.stateIndex}}`
        );
    }
}

class ClassicalVoiceLineGenerator extends VoiceLineGenerator {
    constructor(options) {
        super(options);

        this.voiceCount = getValueOrDefault(options,
            "voiceCount", 4);

        this.maxDomainSize = getValueOrDefault(options,
            "maxDomainSize", 100);

        // General constraints, one for each harmony index
        this.constraints = getValueOrDefault(options, "constraints", []);

        // For constant voices
        this.constants = getValueOrDefault(options, "constants", [[false], [false], [false], [false]]);

        // For undefined voices
        this.undefines = getValueOrDefault(options, "undefines", [[false], [false], [false], [false]]);

        this.anticipations = getValueOrDefault(options, "anticipations", [[false], [false], [false], [false]]);
        this.suspensions = getValueOrDefault(options, "suspensions", [[false], [false], [false], [false]]);

        // Ranges
        this.absoluteNoteRanges = getValueOrDefault(options, "absoluteNoteRanges", [[[65, 85]], [[50, 75]], [[40, 70]], [[35, 60]]]); // Hard limit
        this.penaltyAbsoluteNoteRanges = getValueOrDefault(options, "penaltyAbsoluteNoteRanges", [[[65, 85]], [[50, 75]], [[40, 70]], [[35, 60]]]); // Soft limit
        this.noteRangePenalties = getValueOrDefault(options, "noteRangePenalties", [[0.5], [0.5], [0.5], [0.5]]);

        // Hints
        this.absoluteNoteHints = getValueOrDefault(options, "absoluteNoteHints", [[70], null, null, [40]]);
        this.maxAbsoluteHintDistances = getValueOrDefault(options, "maxAbsoluteHintDistances", [[6], null, null, [10]]); // Hard limit

        this.penaltyMaxAbsoluteHintDistances = getValueOrDefault(options, "penaltyMaxAbsoluteHintDistances", [[3], null, null, [3]]); // Soft limit
    //    this.hintDistancePenalties = getValueOrDefault(options, "hintDistancePenalties", [[0.3], [0.2], [0.2], [0.2]]);
        this.hintDistancePenalties = getValueOrDefault(options, "hintDistancePenalties", [[0.5], [0.5], [0.5], [0.5]]);



        // Pitch class constraints
        this.chordRootPitchClassConstraints = getValueOrDefault(options, "chordRootPitchClassConstraints", [null, null, null, null]);
        this.chordBassPitchClassConstraints = getValueOrDefault(options, "chordBassPitchClassConstraints", [null, null, null, [[0]]]);

        // Voice spacings
        this.maxSpacings = getValueOrDefault(options, "maxSpacings", [[12], [12], [12], [24]]); // Hard limit

        this.penaltyMaxSpacings = getValueOrDefault(options, "penaltyMaxSpacings", [[12], [12], [12], [24]]); // Soft limit
        this.spacingPenalties = getValueOrDefault(options, "spacingPenalties", [[0.5], [0.5], [0.5], [0.5]]);


        // Parallel perfects
        this.parallelOctavesAndUnisonsPenalties = getValueOrDefault(options, "parallelOctavesAndUnisonsPenalties", [4, 4, 4, 4]);
        this.parallelFifthsPenalties = getValueOrDefault(options, "parallelFifthsPenalties", [3, 3, 3, 3]);

        // Leaps
        this.maxLeapSizes = getValueOrDefault(options, "maxLeapSizes", [[12], [5], [5], [12]]);
        this.maxLeapSizePenalties = getValueOrDefault(options, "maxLeapSizePenalties", [[1], [1], [1], [1]]);
        this.maxFinalLeapSizes = getValueOrDefault(options, "maxFinalLeapSizes", [[4], [5], [5], [12]]);
        this.maxFinalLeapSizePenalties = getValueOrDefault(options, "maxFinalLeapSizePenalties", [[3], [0.5], [0.5], [0.5]]);
        this.suspensionLeapPenalties = getValueOrDefault(options, "suspensionLeapPenalties", [[2], [2], [2], [2]]);
        this.largeLeapReverseDirectionPenaltyFactors = getValueOrDefault(options, "largeLeapReverseDirectionPenaltyFactor", [1, 1, 1, 1]);

        // Sus chord preparations and resolution
        this.unresolvedSusChordPenalties = getValueOrDefault(options, "unresolvedSusChordPenalties", [[1], [1], [1], [1]]);
        this.unpreparedSusChordPenalties = getValueOrDefault(options, "unpreparedSusChordPenalties", [[0.2], [0.2], [0.2], [0.2]]);


        // Melodic dissonances
        this.augmentedSecondPenalties = getValueOrDefault(options, "augmentedSecondPenalties", [3]);

        // Doublings
        this.rootDoublingPenalties = getValueOrDefault(options, "rootDoublingPenalties", [0]);
        this.thirdDoublingPenalties = getValueOrDefault(options, "thirdDoublingPenalties", [1]);
        this.fifthDoublingPenalties = getValueOrDefault(options, "fifthDoublingPenalties", [1]);
        this.seventhDoublingPenalties = getValueOrDefault(options, "seventhDoublingPenalties", [1]);

        this.leadingToneDoublingPenalties = getValueOrDefault(options, "leadingToneDoublingPenalties", [3]);

        // Chord completeness
        this.missingRootPenalties = getValueOrDefault(options, "missingRootPenalties", [3]);
        this.missingThirdPenalties = getValueOrDefault(options, "missingThirdPenalties", [2]);
        this.missingFifthPenalties = getValueOrDefault(options, "missingFifthPenalties", [0.25]);
        this.missingSeventhPenalties = getValueOrDefault(options, "missingSeventhPenalties", [2]);

        this.invertedMissingRootPenalties = getValueOrDefault(options, "missingRootPenalties", [3]);
        this.invertedMissingThirdPenalties = getValueOrDefault(options, "missingThirdPenalties", [2]);
        this.invertedMissingFifthPenalties = getValueOrDefault(options, "missingFifthPenalties", [1]);
        this.invertedMissingSeventhPenalties = getValueOrDefault(options, "missingSeventhPenalties", [2]);

        // Preparations and resolutions of dissonances
        this.unpreparedSeventhPenalties = getValueOrDefault(options, "unpreparedSeventhPenalties", [0.25]);
        this.unresolvedSeventhPenalties = getValueOrDefault(options, "unresolvedSeventhPenalties", [0.5]);

        this.unprepared64FourthPenalties = getValueOrDefault(options, "unprepared64FourthPenalties", [0.2]);
        this.unresolved64FourthPenalties = getValueOrDefault(options, "unresolved64FourthPenalties", [0.4]);

        // Cross relations
        this.crossRelationPenalties = getValueOrDefault(options, "crossRelationPenalties", [3]);


        // The following properties will be set in prepareBeforeSearch()
        this.chordPitchClassesArr = [];
        this.scalePitchClassesArr = [];

        this.allPairs = [];
        this.adjacentPairs = [];

        this.possibleAbsoluteNoteTuples = [];
        this.possibleScaleIndexTuples = [];
        this.zeroStepCosts = [];
        this.zeroStepDomainIndices = [];
        this.oneStepCosts = [];
        this.oneStepHeuristicCosts = [];
        this.oneStepDomainIndices = [];

        this.zeroStepConstraints = [];
        this.oneStepConstraints = [];
        this.twoStepConstraints = [];
    }

    getTwoStepCost(harmonyIndex, prevPrevStateIndex, prevStateIndex, stateIndex, verbose) {
        let stepCost = 0;

        const absoluteNotes = this.possibleAbsoluteNoteTuples[harmonyIndex][stateIndex];
        const prevAbsoluteNotes = this.possibleAbsoluteNoteTuples[harmonyIndex - 1][prevStateIndex];


        // Check smooth entering and resolution of sevenths and fourths here!

        // Check that a large leap has a step or small leap that follows
        const prevPrevAbsoluteNotes = this.possibleAbsoluteNoteTuples[harmonyIndex - 2][prevPrevStateIndex];
        for (let i=0; i<absoluteNotes.length; i++) {
            const factor = this.largeLeapReverseDirectionPenaltyFactors[i % this.largeLeapReverseDirectionPenaltyFactors.length];
            const count = this.getlargeLeapReverseDirectionPenaltyCount(prevPrevAbsoluteNotes[i],
                prevAbsoluteNotes[i], absoluteNotes[i]);
            stepCost += factor * count;
        }

        return stepCost;
    }

    getOneStepCost(harmonyIndex, prevStateIndex, stateIndex, verbose) {
        let stepCost = 0;

        for (let i=0; i<this.oneStepConstraints[harmonyIndex].length; i++) {
            const cstr = this.oneStepConstraints[harmonyIndex][i];
            stepCost += cstr.oneStepCost(harmonyIndex, prevStateIndex, stateIndex, this);
        }

        const absoluteNotes = this.possibleAbsoluteNoteTuples[harmonyIndex][stateIndex];
        const prevAbsoluteNotes = this.possibleAbsoluteNoteTuples[harmonyIndex - 1][prevStateIndex];
        const scaleIndices = this.possibleScaleIndexTuples[harmonyIndex][stateIndex];
        const prevScaleIndices = this.possibleScaleIndexTuples[harmonyIndex - 1][prevStateIndex];

        const chordPitchClasses = this.chordPitchClassesArr[harmonyIndex];
        const prevChordPitchClasses = this.chordPitchClassesArr[harmonyIndex - 1];

        const harmonyElement = this.harmony.get(harmonyIndex);
        const hasSeventh = harmonyElement.hasSeventh();
        const isSus = harmonyElement.isSus();
        let susPitchClass = chordPitchClasses[0];
        if (isSus) {
            susPitchClass = chordPitchClasses[1];
        }

        const rootPitchClass = chordPitchClasses[0];
        const prevRootPitchClass = prevChordPitchClasses[0];
        const thirdPitchClass = chordPitchClasses[1];
        const fifthPitchClass = chordPitchClasses[2];
        let seventhPitchClass = rootPitchClass;
        if (hasSeventh) {
            seventhPitchClass = chordPitchClasses[3];
        }

        const is64 = harmonyElement.is64Triad();

        const prevHarmonyElement = this.harmony.get(harmonyIndex - 1);
        const prevHasSeventh = prevHarmonyElement.hasSeventh();
        const prevIsSus = prevHarmonyElement.isSus();
        let prevSusPitchClass = prevChordPitchClasses[0];
        if (prevIsSus) {
            prevSusPitchClass = prevChordPitchClasses[1];
        }

        let prevSeventhPitchClass = prevChordPitchClasses[0];
        if (prevHasSeventh) {
            prevSeventhPitchClass = prevChordPitchClasses[3];
        }
        const prevIs64 = prevHarmonyElement.is64Triad();
        const prev64PitchClass = prevChordPitchClasses[0]; // The root of the chord is the fourth and dissonant note

        // Check for large leaps into final index
        const finalIndex = harmonyIndex == this.harmony.getCount() - 1;

        const scaleChanged = this.changedScaleArr[harmonyIndex];

        const scalePitchClasses = this.scalePitchClassesArr[harmonyIndex];
        const prevScalePitchClasses = this.scalePitchClassesArr[harmonyIndex - 1];

        // Checking cross relations when changing scale
        if (scaleChanged) {
            let wasCrossRelation = false;

            const bassAbsNote = absoluteNotes[absoluteNotes.length - 1];
            const bassPrevAbsNote = prevAbsoluteNotes[prevAbsoluteNotes.length - 1];

            const bassPitchClass = bassAbsNote % 12;

            const bassHasNewPitchClass = !arrayContains(prevScalePitchClasses, bassPitchClass);

            if (bassHasNewPitchClass) {
                // Check if it is smooth in the bass
                if (Math.abs(bassAbsNote - bassPrevAbsNote) <= 2) {
                    // No problem?
                } else {
                    const maxUpperIndex = Math.floor(absoluteNotes.length / 2);

                    let foundSmoothInUpper = false;
                    for (let i=0; i<maxUpperIndex; i++) {
                        let prevAbsNote = prevAbsoluteNotes[i];
                        let curAbsNote = absoluteNotes[i];
                        if ((curAbsNote % 12) == bassPitchClass && Math.abs(curAbsNote - prevAbsNote) <= 2) {
                            // Enters smoothly in the upper voice, no problemo
                            foundSmoothInUpper = true;
                            break;
                        }
                    }
                    if (!foundSmoothInUpper) {
    //                    logit("is cross relation! " + (new ConstantHarmonicRythm([prevHarmonyElement, harmonyElement]).toRomanString()));
                        stepCost += this.crossRelationPenalties[harmonyIndex % this.crossRelationPenalties.length];
                        wasCrossRelation = true;
                    }
                }
            }
    //        if (!wasCrossRelation) {
    //            stepCost += 10;
    //        }
        }


        // Iterator through all voices
        for (let i=0; i<absoluteNotes.length; i++) {
            let prevAbsNote = prevAbsoluteNotes[i];
            let curAbsNote = absoluteNotes[i];

            // Check preparation and resolution of of sevenths
            // Moving within a seventh chord with same root is OK
            const seventhExpanded = hasSeventh && prevHasSeventh && rootPitchClass == prevRootPitchClass;

    //        if (seventhExpanded) {
    //            logit("Seventh expanded!");
    //        }

            if (hasSeventh && !seventhExpanded) {
                const prepareSeventhFactor = this.unpreparedSeventhPenalties[harmonyIndex % this.unpreparedSeventhPenalties.length];
                stepCost += prepareSeventhFactor * this.getlargeLeapToPitchClassPenaltyCount(prevAbsNote, curAbsNote, 1, seventhPitchClass);
            }
            if (prevHasSeventh && !seventhExpanded) {
                const resolveSeventhFactor = this.unresolvedSeventhPenalties[harmonyIndex % this.unresolvedSeventhPenalties.length];
    //            stepCost += resolveSeventhFactor * this.getlargeLeapFromPitchClassPenaltyCount(prevAbsNote, curAbsNote, 1, prevSeventhPitchClass);
                const seventhResolveCost = resolveSeventhFactor * this.getLeapRangeFromPitchClassPenaltyCount(prevAbsNote, curAbsNote, -2, -1, prevSeventhPitchClass);
                stepCost += seventhResolveCost;
    //            if (seventhResolveCost == 0 && (prevAbsNote % 12) == prevSeventhPitchClass) {
    //                logit(" 7th resolve cost " + seventhResolveCost + " " + prevAbsNote + " " + curAbsNote);
    //            }
            }
            // Check preparation and resolution of of the fourths in 64 chords
            if (is64) {
                const prepare64Factor = this.unprepared64FourthPenalties[harmonyIndex % this.unprepared64FourthPenalties.length];
                stepCost += prepare64Factor * this.getlargeLeapToPitchClassPenaltyCount(prevAbsNote, curAbsNote, 1, rootPitchClass);
            }
            if (prevIs64) {
                const resolve64Factor = this.unresolved64FourthPenalties[harmonyIndex % this.unresolved64FourthPenalties.length];
    //            stepCost += resolve64Factor * this.getlargeLeapFromPitchClassPenaltyCount(prevAbsNote, curAbsNote, 1, prev64PitchClass);
                const resolve64Cost = resolve64Factor * this.getLeapRangeFromPitchClassPenaltyCount(prevAbsNote, curAbsNote, -2, -1, prev64PitchClass);
                stepCost += resolve64Cost;
            }


            // Checking augmented 2nds
            if (Math.abs(prevAbsNote - curAbsNote) == 3) {
                // Could be an augmented 2nd

                let wasAug2nd = false;
                const scaleIndex = scaleIndices[i];
                const prevScaleIndex = prevScaleIndices[i];

                if (scaleChanged) {
                    const curAbsNotePartOfPreviousScale = arrayContains(prevScalePitchClasses, curAbsNote % 12);
                    const prevAbsNotePartOfCurrentScale = arrayContains(scalePitchClasses, prevAbsNote % 12);

                    if (!curAbsNotePartOfPreviousScale || !prevAbsNotePartOfCurrentScale) {
                        wasAug2nd = true;
    //                    logit("Found aug2nd " + scalePitchClasses.join(", ") + "  " + prevScalePitchClasses.join(", ") + " " + curAbsNote + " " + prevAbsNote);
                    }
                } else if (Math.abs(prevScaleIndex - scaleIndex) == 1) {
                    // Moved within same scale a single index and this resulted in a minor third/aug 2nd
                    wasAug2nd = true;
                }
                if (wasAug2nd) {
    //                logit("Found aug2nd!!");
                    stepCost += this.augmentedSecondPenalties[harmonyIndex % this.augmentedSecondPenalties.length];
                }
            }

            // Compare with all other voices except the current
            const parallelOctavesAndUnisonsPenalty = this.parallelOctavesAndUnisonsPenalties[i % this.parallelOctavesAndUnisonsPenalties.length];
            const parallelFifthsPenalty = this.parallelFifthsPenalties[i % this.parallelFifthsPenalties.length];

            for (let j=i+1; j<absoluteNotes.length; j++) {
                const curOtherAbsNote = absoluteNotes[j];
                const prevOtherAbsNote = prevAbsoluteNotes[j];

                if (this.isParallelOctavesOrUnisons(prevOtherAbsNote, curOtherAbsNote, prevAbsNote, curAbsNote)) {
                    stepCost += parallelOctavesAndUnisonsPenalty;
                }
                if (this.isParallelPerfectFifths(prevOtherAbsNote, curOtherAbsNote, prevAbsNote, curAbsNote)) {
                    stepCost += parallelFifthsPenalty;
                }
                // Check augmented seconds as well!

            }

            const leapSizePenaltyArr = this.maxLeapSizePenalties[i % this.maxLeapSizePenalties.length];
            const maxLeapArr = this.maxLeapSizes[i % this.maxLeapSizes.length];
            stepCost += leapSizePenaltyArr[harmonyIndex % leapSizePenaltyArr.length] * this.getlargeLeapPenaltyCount(prevAbsNote, curAbsNote, maxLeapArr[harmonyIndex % maxLeapArr.length]);

            if (finalIndex) {
                const finalLeapSizePenaltyArr = this.maxFinalLeapSizePenalties[i % this.maxFinalLeapSizePenalties.length];
                const maxFinalLeapArr = this.maxFinalLeapSizes[i % this.maxFinalLeapSizes.length];
                const finalLeapCost = finalLeapSizePenaltyArr[harmonyIndex % finalLeapSizePenaltyArr.length] * this.getlargeLeapPenaltyCount(prevAbsNote, curAbsNote, maxFinalLeapArr[harmonyIndex % maxFinalLeapArr.length]);
                stepCost += finalLeapCost;
    //            logit("final leap cost " + finalLeapCost + " " + i + " " + maxFinalLeapArr);
            }
            const lineSuspensions = this.suspensions[i % this.suspensions.length];
            if (lineSuspensions[(harmonyIndex - 1) % lineSuspensions.length]) {

                // Check if the current suspension is consonant or dissonant
                const prevPitchClass = prevAbsNote % 12;
                const consonantSusp = arrayContains(chordPitchClasses, prevPitchClass);

                if (consonantSusp) {
                    // No penalty here?
                } else {
                    const suspensionLeapPenaltyArr = this.suspensionLeapPenalties[i % this.suspensionLeapPenalties.length];
                    stepCost += suspensionLeapPenaltyArr[harmonyIndex % suspensionLeapPenaltyArr.length] * this.getLeapRangePenaltyCount(prevAbsNote, curAbsNote, -2, -1);
                }
            }
            if (prevIsSus) {
                // Resolve the sus
                const unresolvedSusChordPenaltyArr = this.unresolvedSusChordPenalties[i % this.unresolvedSusChordPenalties.length];
                stepCost += unresolvedSusChordPenaltyArr[harmonyIndex % unresolvedSusChordPenaltyArr.length] *
                    this.getLeapRangeFromPitchClassPenaltyCount(prevAbsNote, curAbsNote, -2, -1, prevSusPitchClass);
            }
            if (isSus) {
                // Try not to leap into the sus note
                const unpreparedSusChordPenaltyArr = this.unpreparedSusChordPenalties[i % this.unpreparedSusChordPenalties.length];
                const prepareSusFactor = unpreparedSusChordPenaltyArr[harmonyIndex % unpreparedSusChordPenaltyArr.length];
                stepCost += prepareSusFactor * this.getlargeLeapToPitchClassPenaltyCount(prevAbsNote, curAbsNote, 1, susPitchClass);
            }
        }

        return stepCost;
    }

    getZeroStepCost(harmonyIndex, stateIndex, verbose) {
        let stepCost = 0;

        const absoluteNotes = this.possibleAbsoluteNoteTuples[harmonyIndex][stateIndex];

        for (let i=0; i<this.zeroStepConstraints[harmonyIndex].length; i++) {
            const cstr = this.zeroStepConstraints[harmonyIndex][i];
            stepCost += cstr.zeroStepCost(harmonyIndex, stateIndex, this);
        }

        // Check spacing penalty
        for (let i=0; i<absoluteNotes.length; i++) {
            if (i > 0) {
                let dist = Math.abs(absoluteNotes[i] - absoluteNotes[i-1]);
                const spacingsArr = this.penaltyMaxSpacings[i % this.penaltyMaxSpacings.length];

                const penaltyMaxSpacing = spacingsArr[harmonyIndex % spacingsArr.length];

                //            logitRnd("pms: " + penaltyMaxSpacing + " dist: " + dist + " <br />", 0.01);
                if (dist > penaltyMaxSpacing) {
                    let wrongCount = dist - penaltyMaxSpacing;
                    const arr = this.spacingPenalties[i % this.spacingPenalties.length];
                    stepCost += wrongCount * arr[harmonyIndex % arr.length];
                }
                //            if (verbose && isNaN(stepCost)) {
                //                logit(["stepCost:", "dist:", dist, "penaltyArr:", penaltyArr,   "<br />"].join(""));
                //            }
            }
        }

        // Check note range penalty
        for (let i=0; i<absoluteNotes.length; i++) {
            let note = absoluteNotes[i];
            const penaltyRange = this.penaltyAbsoluteNoteRanges[i][harmonyIndex];
            let wrongCount = 0;
            if (note < penaltyRange[0]) {
                wrongCount = penaltyRange[0] - note;
            } else if (note > penaltyRange[1]) {
                wrongCount = note - penaltyRange[1];
            }
            let penaltyArr = this.noteRangePenalties[i % this.noteRangePenalties.length];
            stepCost += penaltyArr[harmonyIndex % penaltyArr.length] * wrongCount;
        }



        // Check note hint penalty
        for (let i=0; i<absoluteNotes.length; i++) {
            let note = absoluteNotes[i];
            const hintDistance = this.penaltyMaxAbsoluteHintDistances[i][harmonyIndex];
            const hint = this.absoluteNoteHints[i][harmonyIndex];

            if (hint === null) {
                continue;
            }
            let dist = Math.abs(hint - note);

            let wrongCount = 0;
            if (dist > hintDistance) {
                wrongCount = dist - hintDistance;
            }
            let penaltyArr = this.hintDistancePenalties[i % this.hintDistancePenalties.length];
            const penalty = penaltyArr[harmonyIndex % penaltyArr.length] * wrongCount;
            stepCost += penalty;

    //        if (i == 0) {
    //            logit("hint: " + hint + " note: " + note + " wrongCount: " + wrongCount + " dist: " + dist + " penalty: " + penalty)
    //        }
        }

        const pitchClassMap = this.getPitchClassMap(absoluteNotes);

        const harmonyElement = this.harmony.get(harmonyIndex);
        const isSeventh = harmonyElement.isSeventh();

        const chordPitchClasses = this.chordPitchClassesArr[harmonyIndex];

        const leadingTonePitchClass = harmonyElement.getAbsoluteNoteFromScaleIndex(6) % 12;

        const rootPitchClass = chordPitchClasses[0];
        const thirdPitchClass = chordPitchClasses[1];
        const fifthPitchClass = chordPitchClasses[2];
        let seventhPitchClass = rootPitchClass;
        if (isSeventh) {
            seventhPitchClass = chordPitchClasses[3];
        }


        const missingRootPenalties = harmonyElement.chordInversions == 0 ? this.missingRootPenalties : this.invertedMissingRootPenalties;
        const missingThirdPenalties = harmonyElement.chordInversions == 0 ? this.missingThirdPenalties : this.invertedMissingThirdPenalties;
        const missingFifthPenalties = harmonyElement.chordInversions == 0 ? this.missingFifthPenalties : this.invertedMissingFifthPenalties;
        const missingSeventhPenalties = harmonyElement.chordInversions == 0 ? this.missingSeventhPenalties : this.invertedMissingSeventhPenalties;
        if (!pitchClassMap[rootPitchClass]) {
            // Missing root
            stepCost += missingRootPenalties[harmonyIndex % missingRootPenalties.length];
        }

        if (!pitchClassMap[thirdPitchClass]) {
            // Missing third
            stepCost += missingThirdPenalties[harmonyIndex % missingThirdPenalties.length];
        }
        if (!pitchClassMap[fifthPitchClass]) {
            // Missing fifth
            stepCost += missingFifthPenalties[harmonyIndex % missingFifthPenalties.length];
        }
        if (isSeventh && !pitchClassMap[seventhPitchClass]) {
            // Missing seventh
            stepCost += missingSeventhPenalties[harmonyIndex % missingSeventhPenalties.length];
        }

        // Chord doublings


        // Penalty for doubling third and fifth
        if (pitchClassMap[rootPitchClass] > 1) {
            // Doubled or tripled root
            stepCost += this.rootDoublingPenalties[harmonyIndex % this.rootDoublingPenalties.length] *
                (pitchClassMap[rootPitchClass] - 1);
        }
        if (pitchClassMap[thirdPitchClass] > 1) {
            // Doubled or tripled third
            stepCost += this.thirdDoublingPenalties[harmonyIndex % this.thirdDoublingPenalties.length] *
                (pitchClassMap[thirdPitchClass] - 1);
        }
        if (pitchClassMap[fifthPitchClass] > 1) {
            // Doubled or tripled fifth
            stepCost += this.fifthDoublingPenalties[harmonyIndex % this.fifthDoublingPenalties.length] *
                (pitchClassMap[fifthPitchClass] - 1);
        }
        if (isSeventh && pitchClassMap[seventhPitchClass] > 1) {
            // Doubled or tripled seventh
            stepCost += this.seventhDoublingPenalties[harmonyIndex % this.seventhDoublingPenalties.length] *
                (pitchClassMap[seventhPitchClass] - 1);
        }

        if (pitchClassMap[leadingTonePitchClass] > 1) {
            // Doubled or tripled leading tone
            stepCost += this.leadingToneDoublingPenalties[harmonyIndex % this.leadingToneDoublingPenalties.length] *
                (pitchClassMap[leadingTonePitchClass] - 1);
    //        logit("Doubled leading tone " + pitchClassMap[leadingTonePitchClass]);
        }

        return stepCost;
    }

    getPitchClassMap(absoluteNotes) {
        const pitchClassMap = {};
        for (let i=0; i<absoluteNotes.length; i++) {
            const absNote = absoluteNotes[i];
            const pitchClass = absNote % 12;
            let count = pitchClassMap[pitchClass];
            if (count) {
                count++;
            } else {
                count = 1;
            }
            pitchClassMap[pitchClass] = count;
        }
        return pitchClassMap;
    }

    getStepCost(node) {
        const index = node.searchDepth + node.resultIndex - 1;
        let stepCost = 0;
        const state = node.state;

        if (index > 0) {
            // We can look one step back
            const prevState = this.resultStates[index - 1];

            let oneStepCost = this.oneStepCosts[index][prevState.stateIndex][state.stateIndex];
            if (!oneStepCost) {
                oneStepCost = this.getOneStepCost(index, prevState.stateIndex, state.stateIndex);
                this.oneStepCosts[index][prevState.stateIndex][state.stateIndex] = oneStepCost;
            }
            stepCost += oneStepCost;

            if (index > 1) {
                // We can check two steps back
                const prevPrevState = this.resultStates[index - 2];
                stepCost += this.getTwoStepCost(index, prevPrevState.stateIndex, prevState.stateIndex, state.stateIndex);
            }
        }
        // logit("Step cost for " + node.state + " was " + stepCost);

        stepCost += this.zeroStepCosts[index][state.stateIndex];

    //    logit("___ zero step costs for state index " + state.stateIndex + ": " + JSON.stringify(this.zeroStepCosts[index]));

        return stepCost;
    }

    // Get scale index domains
    getStates(node) {
        const result = [];


        const index = node.searchDepth + node.resultIndex;


        const domainIndices = this.zeroStepDomainIndices[index];

    //    if (index > 0) {
    //        let domainLength = domainIndices.length;
    //
    //        let prevState = this.resultStates[index - 1];
    //        domainIndices = this.oneStepDomainIndices[index][prevState.stateIndex];
    //
    //        if (!domainIndices) {
    //            let that = this;
    //            // Create sorted domains for each possible previous state index
    //            let j = prevState.stateIndex;
    //            domainIndices = createFilledNumericIncArray(domainLength, 0, 1);
    //            this.oneStepDomainIndices[index][j] = domainIndices;
    //
    //            domainIndices.sort(function(a, b) {
    //                return (that.zeroStepCosts[index][a] + that.oneStepHeuristicCosts[index][j][a]) -
    //                    (that.zeroStepCosts[index][b] + that.oneStepHeuristicCosts[index][j][b]);
    //            });
    //        }
    //    }

        for (let i=0; i<domainIndices.length; i++) {
            const newState = new ClassicalVoiceLineState();
            newState.stateIndex = domainIndices[i];
            result.push(newState);

    //        if (newState.stateIndex > 49) {
    //            logit("state index " + newState.stateIndex);
    //        }
        }

    //    logit("Getting states at index " + index);
    //    logit("  Result: " + JSON.stringify(result));

        return result;
    }

    prepareBeforeSearch() {

        const harmonyElements = this.harmony.getConstantHarmonyElements();

        this.chordPitchClassesArr = [];
        this.scalePitchClassesArr = [];

        this.changedScaleArr = [];

        for (let i=0; i<harmonyElements.length; i++) {
            let harmonyElement = harmonyElements[i];

            this.zeroStepConstraints[i] = [];
            this.oneStepConstraints[i] = [];
            this.twoStepConstraints[i] = [];

            if (!this.constraints[i]) {
                this.constraints[i] = [];
            }
    
            addAll(this.constraints[i], harmonyElement.voiceLineConstraints);

            const chordPitchClasses = harmonyElement.getPitchClassesFromAbsoluteNotes(harmonyElement.getChordAbsoluteNotes());
            const scalePitchClasses = harmonyElement.getPitchClassesFromAbsoluteNotes(harmonyElement.getScaleAbsoluteNotes());
            this.chordPitchClassesArr.push(chordPitchClasses);
            this.scalePitchClassesArr.push(scalePitchClasses);

            let changedScale = false;
            if (i > 0) {
                const prevHarmonyElement = harmonyElements[i - 1];
                changedScale = (harmonyElement.baseNote != prevHarmonyElement.baseNote) ||
                    !arrayEquals(scalePitchClasses, this.scalePitchClassesArr[i - 1]);
            }
            this.changedScaleArr[i] = changedScale;

            //        logit("Chord pitch classes for harmony " + i + ": " + chordPitchClasses + "<br />");
        }


        for (let i=0; i<this.constraints.length; i++) {
            const constraintArr = this.constraints[i];
            for (let j=0; j<constraintArr.length; j++) {
                const constraint = constraintArr[j];
                const steps = constraint.getCheckCostSteps();
                for (let k=0; k<steps.length; k++) {
                    const step = steps[k];
                    let cArr = null;
                    switch (step) {
                        case 0:
                            cArr = this.zeroStepConstraints;
                            break;
                        case 1:
                            cArr = this.oneStepConstraints;
                            break;
                        case 2:
                            cArr = this.twoStepConstraints;
                            break;
                    }
                    if (cArr != null) {
                        cArr[i].push(constraint);
                        // logit(cArr);
                    }
                }
            }
        }


        for (let i=0; i<this.voiceCount; i++) {
            for (let j=i+1; j<this.voiceCount; j++) {
                this.allPairs.push([i, j]);
            }
        }

        for (let i=0; i<this.voiceCount-1; i++) {
            this.adjacentPairs.push([i, i+1]);
        }

        const absoluteNoteRanges = this.absoluteNoteRanges;
        const voiceCount = this.voiceCount;
        const maxSpacings = this.maxSpacings;
        const absoluteNoteHints = this.absoluteNoteHints;

    //    logit(JSON.stringify(absoluteNoteHints));

        const maxAbsoluteHintDistances = this.maxAbsoluteHintDistances;
        const chordRootPitchClassConstraints = this.chordRootPitchClassConstraints; // = getValueOrDefault(options, "chordRootPitchClassConstraints", [null, null, null, null]);
        const chordBassPitchClassConstraints = this.chordBassPitchClassConstraints; // = getValueOrDefault(options, "chordBassPitchClassConstraints", [null, null, null, [0]]);
        const chordPitchClassesArr = this.chordPitchClassesArr;
        const constants = this.constants;

        // Recursivly gather all combinations of scale indices and absolute notes
        function gatherDomain(harmonyIndex, voiceIndex,
                              previousAbsNote, previousScaleIndex, currentAbsTuple, currentScaleIndexTuple,
                              resultAbsoluteNoteTuples, resultScaleIndexTuples) {

            const constantsArr = constants[voiceIndex];

            const isConstant = constantsArr[harmonyIndex % constantsArr.length];

            const voiceAbsoluteRanges = absoluteNoteRanges[voiceIndex];
            let absRange = voiceAbsoluteRanges[harmonyIndex % voiceAbsoluteRanges.length];

            const harmonyElement = harmonyElements[harmonyIndex];

            const possibleScaleIndices = {};

            if (isConstant) {

                let scaleIndex = harmonyElement.getScaleIndexAndChromaticOffsetForAbsoluteNote(absRange[0])[0];
                possibleScaleIndices[scaleIndex] = absRange[0];

            } else {

                let chordPitchClasses = chordPitchClassesArr[harmonyIndex];

                let currentAbsNote = previousAbsNote;
                let currentScaleIndex = previousScaleIndex;

                if (!absRange) {
                    logit(`Could not find absolute note range for voice ${voiceIndex}<br />`);
                    absRange = [previousAbsNote, previousAbsNote + 12];
                }
                let currentLowerAbsNote = absRange[0];
                const currentUpperAbsNote = absRange[1];

                currentAbsNote = Math.min(currentUpperAbsNote, currentAbsNote);

                // Check the max spacing between current voice index and next
                if (voiceIndex > 0) {
                    const maxSpacingArr = maxSpacings[voiceIndex];
                    if (maxSpacingArr && maxSpacingArr.length > 0) {
                        currentLowerAbsNote = Math.max(currentLowerAbsNote, previousAbsNote - maxSpacingArr[harmonyIndex % maxSpacingArr.length]);
                    }
                }

                // Check hints for the current voice
                const hints = absoluteNoteHints[voiceIndex];
                const hintDistances = maxAbsoluteHintDistances[voiceIndex];
                if (hints && hintDistances && hints.length > 0 && hintDistances.length > 0) {
                    const hintMiddle = hints[harmonyIndex % hints.length];
                    if (hintMiddle === null) {
                    } else {
                        const hintDistance = hintDistances[harmonyIndex % hintDistances.length];
                        if (hintMiddle === null || hintDistance === null) {
                            // The hint was not valid
                        } else {
                            const upperHint = hintMiddle + hintDistance;
                            const lowerHint = hintMiddle - hintDistance;

                            currentAbsNote = Math.min(currentAbsNote, upperHint);
                            currentLowerAbsNote = Math.max(currentLowerAbsNote, lowerHint);
                        }
                    }
                }

                // Restrict chord pitch classes by using the chord root and chord bass constraints
                const chordBassConstraints = chordBassPitchClassConstraints[voiceIndex];
                if (chordBassConstraints && chordBassConstraints.length > 0) {
                    const bassIndices = chordBassConstraints[harmonyIndex % chordBassConstraints.length];
                    if (bassIndices && bassIndices.length > 0) {
                        chordPitchClasses = [];
                        for (let i=0; i<bassIndices.length; i++) {
                            let pitchClass = harmonyElement.getAbsoluteNoteFromChordBassIndex(bassIndices[i]) % 12;
                            chordPitchClasses.push(pitchClass);
                        }
                    }
                }

                const chordRootConstraints = chordRootPitchClassConstraints[voiceIndex];
                if (chordRootConstraints && chordRootConstraints.length > 0) {
                    const rootIndices = chordRootConstraints[harmonyIndex % chordRootConstraints.length];
                    if (rootIndices && rootIndices.length > 0) {
                        chordPitchClasses = [];
                        for (let i=0; i<rootIndices.length; i++) {
                            let pitchClass = harmonyElement.getAbsoluteNoteFromChordRootIndex(rootIndices[i]) % 12;
                            chordPitchClasses.push(pitchClass);
                            //                    logit("settign croot ppitch cklad " + pitchClass + "<br />");
                        }
                    }
                }


                while (currentAbsNote >= currentLowerAbsNote) {
                    if (arrayContains(chordPitchClasses, currentAbsNote % 12)) {
                        let currentScaleIndex = harmonyElement.getScaleIndexAndChromaticOffsetForAbsoluteNote(currentAbsNote)[0];
                        possibleScaleIndices[currentScaleIndex] = currentAbsNote;
                    }
                    //            currentScaleIndex--;
                    currentAbsNote--; // = harmonyElement.getAbsoluteNoteFromScaleIndex(currentScaleIndex);
                }
            }

            // Go through all the possible scale indices and gather domain recursively
            for (let scaleIndex in possibleScaleIndices) {
                const absTuple = arrayCopy(currentAbsTuple);
                const scaleIndexTuple = arrayCopy(currentScaleIndexTuple);

                const absNote = possibleScaleIndices[scaleIndex];

                absTuple[voiceIndex] = absNote;
                scaleIndexTuple[voiceIndex] = scaleIndex;

                if (voiceIndex < voiceCount - 1) {
                    gatherDomain(harmonyIndex, voiceIndex + 1,
                        absNote, scaleIndex,
                        absTuple, scaleIndexTuple,
                        resultAbsoluteNoteTuples, resultScaleIndexTuples)
                } else {
                    // Reached the final voice index
                    resultAbsoluteNoteTuples[harmonyIndex].push(absTuple);
                    resultScaleIndexTuples[harmonyIndex].push(scaleIndexTuple);
                }
            }
        }

        const resultAbsoluteNoteTuples = [];
        const resultScaleIndexTuples = [];


    //    voiceLeadingPrepareTimer.start();

        // Calculate all the possible state combinations without any concerns for
        // horizontal stuff like maximum leaps etc.

    //    logit("Calculating index ");
    //    let reusableIndex = JSON.stringify([absoluteNoteRanges, harmonyElements, voiceCount, maxSpacings, absoluteNoteHints, maxAbsoluteHintDistances,
    //        chordRootPitchClassConstraints, chordBassPitchClassConstraints, chordPitchClassesArr, constants]);
    ////    logit("Done Calculating index " + reusableIndex);
    //    let toReuse = this.reusables[reusableIndex];
    //    if (toReuse) {
    //        logit("REusing domain for voice leading");
    //        resultAbsoluteNoteTuples = copyValueDeep(toReuse[0]);
    //        resultScaleIndexTuples = copyValueDeep(toReuse[1]);
    //    } else {

        for (let i=0; i<harmonyElements.length; i++) {
            let harmonyElement = harmonyElements[i];
            const voiceAbsoluteRanges = this.absoluteNoteRanges[0];
            const upperMaxAbsNote = voiceAbsoluteRanges[i % voiceAbsoluteRanges.length][1];
            const upperMaxScaleIndex = harmonyElement.getScaleIndexAndChromaticOffsetForAbsoluteNote(upperMaxAbsNote)[0];
            resultAbsoluteNoteTuples[i] = [];
            resultScaleIndexTuples[i] = [];
            gatherDomain(i, 0, upperMaxAbsNote, upperMaxScaleIndex, [], [], resultAbsoluteNoteTuples, resultScaleIndexTuples);
            //        logit("Domain for harmony " + i + ": " + JSON.stringify(resultAbsoluteNoteTuples[i]) + "<br />");
        }
    //        this.reusables[reusableIndex] = copyValueDeep([resultAbsoluteNoteTuples, resultScaleIndexTuples]);
    //    }

    //    voiceLeadingPrepareTimer.pause();


        this.possibleAbsoluteNoteTuples = resultAbsoluteNoteTuples;
        this.possibleScaleIndexTuples = resultScaleIndexTuples;


        for (let i=0; i<harmonyElements.length; i++) {
            let domain = this.possibleAbsoluteNoteTuples[i];
            let scaleDomain = this.possibleScaleIndexTuples[i];
    //        logit(scaleDomain);
            for (let j=0; j<scaleDomain.length; j++) {
                for (let k=0; k<scaleDomain[j].length; k++) {
                    scaleDomain[j][k] = parseInt(scaleDomain[j][k]);
                }
            }
    //        logit(scaleDomain);
            // logit("Domain size for index " + i + ": " + domain.length + "<br />");
            //        logit("Domain for index " + i + ": " + domain.join(", ") + "<br />");
        }


        // Sort the domain increasingly according to the zero step cost
        // (spacing, doubling, hints, range, chord completeness)

        this.zeroStepCosts = [];
        this.oneStepCosts = [];

        this.zeroStepDomainIndices = [];
        this.oneStepDomainIndices = [];



        for (let i=0; i<harmonyElements.length; i++) {
            let domain = this.possibleAbsoluteNoteTuples[i];
            let scaleDomain = this.possibleScaleIndexTuples[i];


            const costs = createFilledArray(domain.length, 0);
            const zeroStepIndices = createFilledNumericIncArray(domain.length, 0, 1);


            for (let j=0; j<domain.length; j++) {
                costs[j] = this.getZeroStepCost(i, j);
                if (isNaN(costs[j])) {
                    logit(`NaN cost for domain ${domain[j].join(",")} verbose follows:<br />`);
                    this.getZeroStepCost(i, j, true);
                }
            }
            //        logit("costs for index " + i + ": " + costs.join(", ") + "<br />");

            zeroStepIndices.sort(function(a, b) {
                return costs[a] - costs[b];
            });



            const maxDomainSize = this.maxDomainSize;
            const newDomain = [];
            const newScaleDomain = [];
            const newCosts = [];
            for (let j=0; j<Math.min(maxDomainSize, zeroStepIndices.length); j++) {
                const index = zeroStepIndices[j];
                newDomain[j] = domain[index];
                newScaleDomain[j] = scaleDomain[index];
                newCosts[j] = costs[index];
            }
    //        logit(i + " Domain before " + domain.length + " Domain after: " + newDomain.length);

            // Reset the indices, the domain is now sorted
            this.zeroStepDomainIndices[i] = createFilledNumericIncArray(newDomain.length, 0, 1);

            this.zeroStepCosts[i] = newCosts;
            this.possibleAbsoluteNoteTuples[i] = newDomain;
            this.possibleScaleIndexTuples[i] = newScaleDomain;



    //        logit(i + " new scale domain " + JSON.stringify(newScaleDomain));
    //        logit(i + " new domain " + JSON.stringify(newDomain));
    //        logit(i + " new costs " + JSON.stringify(newCosts));
            if (i > 0) {
                this.oneStepCosts[i] = [];
                this.oneStepHeuristicCosts[i] = [];
                this.oneStepDomainIndices[i] = [];

                const prevDomain = this.possibleAbsoluteNoteTuples[i - 1];

                for (let j=0; j<prevDomain.length; j++) {
                    this.oneStepCosts[i][j] = [];
                    this.oneStepHeuristicCosts[i][j] = [];
    //                let fromAbsNotes = prevDomain[j];
    //                for (let k=0; k<newDomain.length; k++) {
    //                    let toAbsNotes = newDomain[k];
    //
    //                    let heurCost = 0;
    //                    for (let l=0; l<fromAbsNotes.length; l++) {
    //                        let from = fromAbsNotes[l];
    //                        let to = toAbsNotes[l];
    //                        heurCost += 0.25 * Math.abs(from - to);
    //                    }
    //                    this.oneStepHeuristicCosts[i][j][k] = heurCost; // this.getOneStepCost(i, j, k);
    //                }
                }

                //            let that = this;
                //            for (let j=0; j<prevDomain.length; j++) {
                //                this.oneStepDomainIndices[i][j] = createFilledNumericIncArray(domain.length, 0, 1);
                //
                //                this.oneStepDomainIndices[i][j].sort(function(a, b) {
                //                    return (that.zeroStepCosts[i][a] + that.oneStepCosts[i][j][a]) -
                //                    (that.zeroStepCosts[i][b] + that.oneStepCosts[i][j][b]);
                //                });
                //            }
            }


        }


    //    logit("maxSpacings: " + JSON.stringify(this.maxSpacings) + " <br />");
    //    logit("absoluteNoteRanges: " + JSON.stringify(this.absoluteNoteRanges) + " <br />");
    //    logit("penaltyMaxSpacings: " + JSON.stringify(this.penaltyMaxSpacings) + " <br />");
    //    logit("penaltyMaxAbsoluteHintDistances: " + JSON.stringify(this.penaltyMaxAbsoluteHintDistances) + " <br />");
    //    logit("penaltyAbsoluteNoteRanges: " + JSON.stringify(this.penaltyAbsoluteNoteRanges) + " <br />");
    //    logit("absoluteNoteHints: " + JSON.stringify(this.absoluteNoteHints) + " <br />");

    }

    createInitialState() {
        return new ClassicalVoiceLineState();
    }

    extractSolution(state, harmonyIndex) {
        const result = [];
        //    let absoluteNotes = this.possibleAbsoluteNoteTuples[harmonyIndex][state.stateIndex];
    //    logit("state index: " + state.stateIndex + " harmonyIndex: " + harmonyIndex);
        const scaleIndices = this.possibleScaleIndexTuples[harmonyIndex][state.stateIndex];
        for (let i=0; i<scaleIndices.length; i++) {
            let undef = false;
            if (this.undefines && this.undefines.length > 0) {
                const undefinesArr = this.undefines[i % this.undefines.length];
                if (undefinesArr.length > 0) {
                    undef = undefinesArr[harmonyIndex % undefinesArr.length];
                }
            }
            if (undef) {
                result.push(new UndefinedVoiceLineElement());
            } else {
                const vle = new ConstantVoiceLineElement();
                //            let theState = this.resultStates[harmonyIndex];
                //    let preCalcScaleIndexTuples = this.possibleScaleIndexTuples[index];
                vle.setIndexType(IndexType.SCALE);
                vle.setSnapType(SnapType.NONE);
                vle.setIndex(scaleIndices[i]);
                vle.suspend = this.suspensions[i][harmonyIndex];
                result.push(vle);
            }
        }
        return result;
    }
}

