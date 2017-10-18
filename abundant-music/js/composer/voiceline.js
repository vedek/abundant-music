
class VoiceLine {
    constructor() {
        this.id = "voiceLine";
        this.lineElements = [];
        this.modifiers = [];
        this._constructorName = "VoiceLine";
    }

    add(e) {
        this.lineElements.push(e);
        return this;
    }

    get(index) {
        return this.lineElements[index];
    }

    getVoiceLineElements() {
        return this.lineElements;
    }

    size() {
        return this.lineElements.length;
    }

    getCount() {
        return this.lineElements.length;
    }

    addVoiceLineElement(e) {
        this.lineElements.push(e);
        return this;
    }

    toString() {
        return this.lineElements.toString();
    }

    getSingleStepVoiceLineElements(harmony, module) {
        const result = [];
        let offset = 0;
        for (let i=0; i<this.lineElements.length; i++) {
            const le = this.lineElements[i];
            const singleSteps = le.getSingleStepVoiceLineElements(harmony, module, offset);
            addAll(result, singleSteps);
            offset += singleSteps.length;
        }
        return result;
    }
}

class DoubledVoiceLine extends VoiceLine {
    constructor() {
        super();
        this.octaves = 0;
        this.toDouble = "";
        this._constructorName = "DoubledVoiceLine";
    }

    doubleVoiceLine(constantLines) {
        let toDouble = null;
        for (var i=0; i<constantLines.length; i++) {
            const line = constantLines[i];
            if (line.id == this.toDouble) {
                toDouble = line;
                break;
            }
        }
        if (toDouble) {
            // All elements must be constant or undefined
            const elements = toDouble.getVoiceLineElements();

            const result = [];

            for (var i=0; i<elements.length; i++) {
                result[i] = elements[i].copy();
            }
            return result;
        } else {
            logit("Could not find voice line " + this.toDouble + "<br />");
            return null;
        }
    }
}

class SimpleBassVoiceLine extends VoiceLine {
    constructor() {
        super();
        this.octaves = -1;
        this.startOctaves = [];
        this.endOctaves = [];
        this._constructorName = "SimpleBassVoiceLine";
    }

    getSingleStepVoiceLineElements(harmony, module) {
        const result = [];
        for (let i=0; i<harmony.getCount(); i++) {
            const harmonyElement = harmony.get(i);
            const vle = new ConstantVoiceLineElement();

            let absNote = harmonyElement.getAbsoluteNoteFromChordBassIndex(0);

            const octave = getItemWithDefaultWithStartEndItems(this.octaves, harmony.getCount(), i,
                this.startOctaves, this.endOctaves);
            absNote += octave * 12;
            vle.index = harmonyElement.getScaleIndexAndChromaticOffsetForAbsoluteNote(absNote)[0];
            vle.indexType = IndexType.SCALE;
            vle.snapType = SnapType.CHORD;

            result.push(vle);
        }
        return result;
    }
}



function getClassicalAdaptiveVoiceLineElements(harmony, module, length, harmonyOffset) {
}


// Creates a complete voice line
// For an alternative when not all must be adaptive, use ClassicalAdaptiveSequenceVoiceLineElement instead
class ClassicalAdaptiveVoiceLine extends VoiceLine {
    constructor() {
        super();

        this.isUndefined = false;

        this.useHintCurve = false;
        this.hintCurve = "";
        this.hintCurveMultiplier = 1.0;
        this.hintCurveBias = 0.0;
        this.hintCurveSnapMetrics = SnapMetrics.ROUND;
        this.useHintCurveLengthFractionAmplitudeMultiplier = false;
        this.hintCurveReferenceCount = 8;
        this.hintCurveLengthFractionAmplitudeMultiplier = 0.5;

        this.hintIndices = [];
        this.hintIndexType = IndexType.SCALE;

        this.startHintIndices = [];
        this.endHintIndices = [];

        this.maxHintDistances = [12];
        this.startMaxHintDistances = [];
        this.endMaxHintDistances = [];
        this.penaltyMaxHintDistances = [3];
        this.startPenaltyMaxHintDistances = [];
        this.endPenaltyMaxHintDistances = [];
        this.hintDistanceOffsetType = OffsetType.HALF_STEP;



        this.chordRootPitchClassConstraints = [[]];
        this.chordBassPitchClassConstraints = [[]];

        this.suspendPattern = [0];
        this.startSuspendPattern = [];
        this.endSuspendPattern = [];
        this.suspendIndexRanges = []; // [[1, 3], [7, 8]] etc.
        this.suspendIndices = [];
        this.phraseSuspendPattern = [];
        this.startPhraseSuspendPattern = [];
        this.endPhraseSuspendPattern = [];


        this.anticipatePattern = [0];
        this.startAnticipatePattern = [];
        this.endAnticipatePattern = [];
        this.anticipateIndexRanges = []; // [[1, 3], [7, 8]] etc.
        this.anticipateIndices = [];

        // All of the start/end/chordpitch bla bla are int list 2ds such as [[]]
        this.startChordRootPitchClassConstraints = [];
        this.endChordRootPitchClassConstraints = [];

        this.startChordBassPitchClassConstraints = [];
        this.endChordBassPitchClassConstraints = [];

        this.maxSpacings = [24];
        this.startMaxSpacings = [];
        this.endMaxSpacings = [];
        this.penaltyMaxSpacings = [12];
        this.startPenaltyMaxSpacings = [];
        this.endPenaltyMaxSpacings = [];
        this.spacingOffsetType = OffsetType.HALF_STEP;

        this.ranges = [[30, 100]];
        this.startRanges = [];
        this.endRanges = [];
        this.penaltyRanges = [[30, 100]];
        this.startPenaltyRanges = [];
        this.endPenaltyRanges = [];
        this.rangeIndexType = IndexType.MIDI_NOTE;

        this.maxOverlaps = [0];
        this.overlapOffsetType = OffsetType.HALF_STEP;

        this.maxNoPenaltyLeaps = [12];
        this.leapOffsetType = OffsetType.HALF_STEP;

        // Insert penalties here...
        this._constructorName = "ClassicalAdaptiveVoiceLine";
    }

    getSingleStepVoiceLineElements(harmony, module) {
        const result = [];

        const harmonyLength = harmony.getCount();

        let theCurve = null;

        const useHintCurve = getValueOrExpressionValue(this, "useHintCurve", module);

        if (useHintCurve) {
    //        if (this.hintCurveExpression) {
    //            logit(this._constructorName + " evaluating " + this.hintCurveExpression);
    //        }

            const hintCurveId = getValueOrExpressionValue(this, "hintCurve", module);

    //        logit("Generating with hint curve " + hintCurveId);
    //        if (this.hintCurveExpression) {
    //            logit(this._constructorName + " result: " + hintCurveId);
    //        }
            theCurve = module.getCurve(hintCurveId);
            if (!theCurve) {
                logit(this._constructorName + " could not find curve " + hintCurveId + "<br />");
                theCurve = new PredefinedCurve();
            }
        }

        let hintCurveMultiplier = getValueOrExpressionValue(this, "hintCurveMultiplier", module);
        const hintCurveBias = getValueOrExpressionValue(this, "hintCurveBias", module);
        const hintIndices = getValueOrExpressionValue(this, "hintIndices", module);
        const startHintIndices = getValueOrExpressionValue(this, "startHintIndices", module);
        const endHintIndices = getValueOrExpressionValue(this, "endHintIndices", module);
        let suspendPattern = getValueOrExpressionValue(this, "suspendPattern", module);
        let startSuspendPattern = getValueOrExpressionValue(this, "startSuspendPattern", module);
        let endSuspendPattern = getValueOrExpressionValue(this, "endSuspendPattern", module);
        const phraseSuspendPattern = getValueOrExpressionValue(this, "phraseSuspendPattern", module);
        const startPhraseSuspendPattern = getValueOrExpressionValue(this, "startPhraseSuspendPattern", module);
        const endPhraseSuspendPattern = getValueOrExpressionValue(this, "endPhraseSuspendPattern", module);

        const chordBassPitchClassConstraints = getValueOrExpressionValue(this, "chordBassPitchClassConstraints", module);
        const startChordBassPitchClassConstraints = getValueOrExpressionValue(this, "startChordBassPitchClassConstraints", module);
        const endChordBassPitchClassConstraints = getValueOrExpressionValue(this, "endChordBassPitchClassConstraints", module);

        const useHintCurveLengthFractionAmplitudeMultiplier = getValueOrExpressionValue(this, "useHintCurveLengthFractionAmplitudeMultiplier", module);

        if (useHintCurveLengthFractionAmplitudeMultiplier) {
            const referenceFraction = harmonyLength / this.hintCurveReferenceCount;

            if (referenceFraction < 1) {
                // ax + b
                // a * 1 + b = 1
                // a * 0.5 + b = f
                // a = 1 - b
                // (1 - b) * 0.5 + b = f
                // 0.5 - 0.5b + b = f
                // 0.5 - 0.5b = f
                // b = -2f + 1
                //
                // (1 - b)x + b
                // (1 - 1 + 2f)x -2f + 1
                // 2fx - 2f + 1

                const ampMultiplier = Math.max(0, Math.min(1,
                    2 * this.hintCurveLengthFractionAmplitudeMultiplier * referenceFraction -
                        2 * this.hintCurveLengthFractionAmplitudeMultiplier + 1));

    //            logit("Amp multiplier " + ampMultiplier + " " + harmonyLength + " before: " + hintCurveMultiplier + " after: " + (hintCurveMultiplier * ampMultiplier));

                hintCurveMultiplier *= ampMultiplier;

            }

        }
        const fractionMultiplier = harmonyLength > 1 ? (1.0 / (harmonyLength - 1)) : 1.0;
        for (var i=0; i<harmonyLength; i++) {
            if (this.isUndefined) {
                var vle = new UndefinedVoiceLineElement();
                result.push(vle);
            } else {

                var vle = new ClassicalAdaptiveVoiceLineElement();

                let theHintIndex = null;

                const fraction = i * fractionMultiplier;
                if (theCurve) {
                    const valueBeforeSnap = hintCurveBias + hintCurveMultiplier * theCurve.getValue(module, fraction);
                    theHintIndex = SnapMetrics.snap(valueBeforeSnap, this.hintCurveSnapMetrics);
    //                logit(i + " The hint index " + theHintIndex +  " for fraction " + fraction + " bias: " + hintCurveBias + " mult: " + hintCurveMultiplier);
                } else {
                    theHintIndex = getItemFromArrayWithStartEndItems(theHintIndex, hintIndices, harmonyLength, i,
                        startHintIndices, endHintIndices);
                }

                const maxHintDistance = getItemFromArrayWithStartEndItems(6, this.maxHintDistances, harmonyLength, i,
                    this.startMaxHintDistances, this.endMaxHintDistances);

                const penaltyMaxHintDistance = getItemFromArrayWithStartEndItems(3, this.penaltyMaxHintDistances, harmonyLength, i,
                    this.startPenaltyMaxHintDistances, this.endPenaltyMaxHintDistances);

                const theChordBassConstraint = getItemFromArrayWithStartEndItems([], chordBassPitchClassConstraints, harmonyLength, i,
                    startChordBassPitchClassConstraints, endChordBassPitchClassConstraints);

                const theChordRootConstraint = getItemFromArrayWithStartEndItems([], this.chordRootPitchClassConstraints, harmonyLength, i,
                    this.startChordRootPitchClassConstraints, this.endChordRootPitchClassConstraints);

                const maxSpacing = getItemFromArrayWithStartEndItems([], this.maxSpacings, harmonyLength, i,
                    this.startMaxSpacings, this.endMaxSpacings);

                const penaltyMaxSpacing = getItemFromArrayWithStartEndItems([], this.penaltyMaxSpacings, harmonyLength, i,
                    this.startPenaltyMaxSpacings, this.endPenaltyMaxSpacings);

                var suspend = getItemFromArrayWithStartEndItems(0, suspendPattern, harmonyLength, i,
                    startSuspendPattern, endSuspendPattern);

                const anticipate = getItemFromArrayWithStartEndItems(0, this.anticipatePattern, harmonyLength, i,
                    this.startAnticipatePattern, this.endAnticipatePattern);

                const range = getItemFromArrayWithStartEndItems(0, this.ranges, harmonyLength, i,
                    this.startRanges, this.endRanges);
                const penaltyRange = getItemFromArrayWithStartEndItems(0, this.penaltyRanges, harmonyLength, i,
                    this.startPenaltyRanges, this.endPenaltyRanges);

                //        logit("Setting chord bass constraint to " + theChordBassConstraint + " default: " + [] +
                //            " items: " + this.chordBassPitchClassConstraints +
                //            " start: " + this.startChordBassPitchClassConstraints +
                //            " end: " + this.endChordBassPitchClassConstraints +
                //            "<br />");
                vle.suspend = !!suspend;
                vle.anticipate = !!anticipate;
                vle.chordBassPitchClassConstraint = theChordBassConstraint;
                vle.chordRootPitchClassConstraint = theChordRootConstraint;
                vle.hintIndex = theHintIndex;
                vle.hintIndexType = this.hintIndexType;
                vle.maxHintDistance = maxHintDistance;
                vle.penaltyMaxHintDistance = penaltyMaxHintDistance;
                vle.maxSpacing = maxSpacing;
                vle.penaltyMaxSpacing = penaltyMaxSpacing;
                vle.spacingOffsetType = this.spacingOffsetType;
                vle.range = range;
                vle.penaltyRange = penaltyRange;

                result.push(vle);
            }
        }


        if (!this.isUndefined) {
            if (phraseSuspendPattern.length > 0 || startPhraseSuspendPattern.length > 0 || endPhraseSuspendPattern.length > 0) {
                const phraseRanges = harmony.getPhraseRanges();
                for (var i=0; i<phraseRanges.length; i++) {
                    const phraseRange = phraseRanges[i];


                    suspendPattern = [];
                    if (phraseSuspendPattern.length > 0) {
                        suspendPattern = phraseSuspendPattern[i % phraseSuspendPattern.length];
                    }
                    startSuspendPattern = [];
                    if (startPhraseSuspendPattern.length > 0) {
                        startSuspendPattern = startPhraseSuspendPattern[i % startPhraseSuspendPattern.length];
                    }
                    endSuspendPattern = [];
                    if (endPhraseSuspendPattern.length > 0) {
                        endSuspendPattern = endPhraseSuspendPattern[i % endPhraseSuspendPattern.length];
                    }

    //            logit("Suspend stuff " + i + " " + [JSON.stringify(suspendPattern), JSON.stringify(startSuspendPattern), JSON.stringify(endSuspendPattern)].join(";;;") + "<br />");

                    for (let j=phraseRange[0]; j<=phraseRange[1]; j++) {
                        const phraseIndex = j - phraseRange[0];
                        var suspend = getItemFromArrayWithStartEndItems(0, suspendPattern, phraseRange[1] - phraseRange[0] + 1, phraseIndex,
                            startSuspendPattern, endSuspendPattern);
                        var vle = result[j];
                        vle.suspend = !!suspend;
    //                if (vle.suspend) {
    //                    logit("Setting suspend for index " + j + "<br />");
    //                }
                    }
                }
            }
        }
        return result;
    }
}

// Only allows ConstantVoiceLineElements and elements that directly create ConstantVoiceLineElements
class ConstantVoiceLine extends VoiceLine {
    constructor() {
        super();
        this._constructorName = "ConstantVoiceLine";
    }

    toString(options) {
        let result = "[";
        for (let i=0; i<this.lineElements.length; i++) {
            const e = this.lineElements[i];
            result += e.index;
            const innerStrs = [];
            if (options && options.showAbsoluteNote && options.harmony) {
                const he = options.harmony.get(i);
                const absNote = he.getAbsoluteNoteConstantVoiceLineElement(e);
                innerStrs.push("abs: " + absNote);
            }
            if (innerStrs.length > 0) {
                result += " (" + innerStrs + ")";
            }
            if (i < this.lineElements.length - 1) {
                result += ", ";
            }
        }
        result += "]";
        return result;
    }
}

const HarmonyStepLengthType = {
    HARMONY_STEPS: 0,
    HARMONY_LENGTH_PLUS_STEPS: 1,

    toString: function(type) {
        switch (type) {
            case HarmonyStepLengthType.HARMONY_STEPS:
                return "Harmony steps";
            case HarmonyStepLengthType.HARMONY_LENGTH_PLUS_STEPS:
                return "Harmony steps plus harmony length";
        }
        return "Unknown step length type " + type;
    },
    getStepLength: function(harmony, type, length) {
        switch (type) {
            case HarmonyStepLengthType.HARMONY_STEPS:
                return length;
            case HarmonyStepLengthType.HARMONY_LENGTH_PLUS_STEPS:
                return harmony.getCount() + length;
        }
        return length;
    }
};
addPossibleValuesFunction(HarmonyStepLengthType, HarmonyStepLengthType.HARMONY_STEPS, HarmonyStepLengthType.HARMONY_LENGTH_PLUS_STEPS);


class VoiceLineElement {
    constructor() {
        this.id = "";
        this.length = 1;
        this.lengthType = HarmonyStepLengthType.HARMONY_STEPS;
        this.modifiers = [];
        this._constructorName = "VoiceLineElement";
    }

    getLength(harmony) {
        return HarmonyStepLengthType.getStepLength(harmony, this.lengthType, this.length);
    }

    getSingleStepVoiceLineElements(harmony, module, harmonyOffset) {
        if (this instanceof SingleStepVoiceLineElement) {
            return [this];
        } else {
            logit("Missing getSingleStepVoiceLineElements() for non-SingleStepVoiceLineElement <br />");
            return null;
        }
    }
}

class ConstantSequenceVoiceLineElement extends VoiceLineElement {
    constructor() {
        super();
        this.indexBorderMode = IndexBorderMode.RESTART;
        this.octaves = [0];
        this.indices = [0];
        this.indexType = IndexType.SCALE;
        this.snapType = SnapType.CHORD;
        this._constructorName = "ConstantSequenceVoiceLineElement";
    }
}

//function ClassicalAdaptiveSequenceVoiceLineElement() {
//    VoiceLineElement.call(this);
//
//    addClassicalAdaptiveVoiceLineProperties.call(this);
//
//    this._constructorName = "ClassicalAdaptiveSequenceVoiceLineElement";
//}
//
//ClassicalAdaptiveSequenceVoiceLineElement.prototype = new VoiceLineElement();
//
//ClassicalAdaptiveSequenceVoiceLineElement.prototype.getSingleStepVoiceLineElements = function(harmony, module, harmonyOffset) {
//    return getClassicalAdaptiveVoiceLineElements.call(this, harmony, module, this.getLength(harmony), harmonyOffset);
//};

class SingleStepVoiceLineElement extends VoiceLineElement {
    constructor() {
        super();
        this.suspend = false;
        this.anticipate = false;
        this._constructorName = "SingleStepVoiceLineElement";
    }

    getSingleStepVoiceLineElements(harmony, module, harmonyOffset) {
        return [this];
    }
}

class UndefinedVoiceLineElement extends SingleStepVoiceLineElement {
    constructor() {
        super();
        this._constructorName = "UndefinedVoiceLineElement";
    }
}

class ConstantVoiceLineElement extends SingleStepVoiceLineElement {
    constructor() {
        super();
        this.octaves = 0;
        this.index = 0;
        this.indexType = IndexType.SCALE;
        this.snapType = SnapType.CHORD;
        this._constructorName = "ConstantVoiceLineElement";
    }

    setIndex(index) {
        this.index = index;
        return this;
    }

    setOctaves(octaves) {
        this.octaves = octaves;
        return this;
    }

    setIndexType(indexType) {
        this.indexType = indexType;
        return this;
    }

    setSnapType(snapType) {
        this.snapType = snapType;
        return this;
    }
}

class AdaptiveVoiceLineElement extends SingleStepVoiceLineElement {
    constructor() {
        super();
    }
}

class ClassicalAdaptiveVoiceLineElement extends AdaptiveVoiceLineElement {
    constructor(options) {
        super(options);

        this.hintIndex = 0;
        this.hintIndexType = IndexType.SCALE;
        this.maxHintDistance = 6;
        this.penaltyMaxHintDistance = 3;
        this.hintDistanceOffsetType = OffsetType.HALF_STEP;
        this.chordRootPitchClassConstraint = [];
        this.chordBassPitchClassConstraint = [];

        this.maxOverlap = 0;
        this.overlapOffsetType = OffsetType.HALF_STEP;

        this.maxSpacing = 24;
        this.penaltyMaxSpacing = 12;
        this.spacingOffsetType = OffsetType.HALF_STEP;

        this.maxNoPenaltyLeap = 12;
        this.leapOffsetType = OffsetType.HALF_STEP;

        this.range = [30, 100];
        this.penaltyRange = [30, 100];
        this.rangeIndexType = IndexType.MIDI_NOTE;

        // Insert penalties here...

        this._constructorName = "ClassicalAdaptiveVoiceLineElement";
    }
}

