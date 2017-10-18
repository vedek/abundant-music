
class HarmonyElement {
    constructor() {
        this.id = "";
        this.modifiers = [];
        this._constructorName = "HarmonyElement";
    }
    
    getLength() {
        return this.length;
    };
    
    getLengthUnit() {
        return this.lengthUnit;
    };
    
    
    setLengthUnit(u) {
        this.lengthUnit = u;
        return this;
    };
    
    setLength(l) {
        this.length = l;
        return this;
    };
    
    getConstantHarmonyElements (module, beatOffset) {
        return [this];
    };
    
    
    applyModifers(elements, module) {
    };
    
}


class HarmonyReferenceHarmonyElement extends HarmonyElement {
    constructor() {
        super();
        this.harmony = "";
        this._constructorName = "HarmonyReferenceHarmonyElement";
    }

    getConstantHarmonyElements(module, beatOffset) {
        const harmonyId = getValueOrExpressionValue(this, "harmony", module);
        const harmony = module.getHarmony(harmonyId);
        if (harmony) {
            return applyHarmonyModifiers(harmony.getConstantHarmonyElements(module), this.modifiers, module);
        } else {
            logit("Could not find harmony " + harmonyId + "<br />");
        }
        return [];
    };
}

class SwitchHarmonyElement extends HarmonyElement {
    constructor() {
        super();
        this.index = 0;
        this.indexedElements = [];
        this._constructorName = "SwitchHarmonyElement";
    }

    getConstantHarmonyElements(module, beatOffset) {
        const result = [];
        const index = getValueOrExpressionValue(this, "index", module);
        const indexedElements = this.indexedElements; // getValueOrExpressionValue(this, "indexedElements", module);
    
    //    if (this.indexExpression) {
    ////        console.log(this._constructorName + " using index " + index + " on " + indexedElements + " " + this.indexExpression);
    //        let v = module.getVariable(this.indexExpression);
    //        if (v) {
    //            logit("index let " + v.id + " " + v.value + " " + this.indexUseExpression + " " + index);
    //        }
    //    }
    
        if (indexedElements.length > 0) {
            const harmony = indexedElements[index % indexedElements.length];
            if (harmony) {
                return harmony.getConstantHarmonyElements(module);
            } else {
                console.log("harmony null in " + this._constructorName + " for index " + index);
            }
        } else {
            console.log("to few indexed elements in " + this._constructorName + " for index " + index);
        }
        result.push(new ConstantHarmonyElement());
    };
}

class ConstantHarmonyElement extends HarmonyElement {
    constructor() {
        super();

        this.length = 1.0;
        this.lengthUnit = PositionUnit.MEASURES;
        this.strength = 1.0;
        this.startBeatStrength = 1.0;

        this.scaleType = ScaleType.MAJOR;
        this.baseNote = 60; // Scale base absolute note

        this.chordType = ChordType.TRIAD;
        this.chordRoot = 0; // Scale index
        this.chordInversions = 0;

        this.scale = [0, 2, 4, 5, 7, 9, 11]; // Custom scale
        this.chord = [0, 2, 4]; // Custom chord scale indices when in root
        // position
        this.scaleMode = 0;

        // Time signature
        this.tsNumerator = 4;
        this.tsDenominator = 4;

        // Alterations
        this.alterations = [];

        // Voice line planner constraints
        this.voiceLineConstraints = [];

        this.sectionModifiers = [];

        this.startsPhrase = false;

        this.note = "";

        this._constructorName = "ConstantHarmonyElement";
    }

    getConstantHarmonyElements(module, beatOffset) {
        return applyHarmonyModifiers([this], this.modifiers, module);
    };
    
    
    getBeatLength() {
        return positionUnitToBeats(this.length, this.lengthUnit, this.tsNumerator, this.tsDenominator);
    };
    
    toString() {
        const scale = this.getScale();
        let result = "HarmonyElement {";
        result += " scale: " + scale;
        result += " chordRoot: " + this.chordRoot;
        result += " inversions: " + this.chordInversions;
        result += "}";
        return result;
    };
    
    sameScale(che) {
        if (che.baseNote == this.baseNote) {
            const otherScale = che.getScale();
            const thisScale = this.getScale();
            if (otherScale.length == thisScale.length) {
                for (let i=0; i<thisScale.length; i++) {
                    if (thisScale[i] != otherScale[i]) {
                        return false;
                    }
                }
                return true;
            }
        }
        return false;
    };
    
    toRomanString() {
        let result = "";
        const scale = this.getScale();
    
        const scaleDegree = positiveMod(this.chordRoot, scale.length);
        switch (scaleDegree) {
            case 0:
                result += "I";
                break;
            case 1:
                result += "II";
                break;
            case 2:
                result += "III";
                break;
            case 3:
                result += "IV";
                break;
            case 4:
                result += "V";
                break;
            case 5:
                result += "VI";
                break;
            case 6:
                result += "VII";
                break;
        }
    
        switch (this.chordType) {
            case ChordType.TRIAD:
                switch (this.chordInversions) {
                    case 0:
                        break;
                    case 1:
                        result += "6";
                        break;
                    case 2:
                        result += "64";
                        break;
                }
                break;
            case ChordType.NINTH:
                switch (this.chordInversions) {
                    case 0:
                        result += "9";
                        break;
                    default:
                        result += "9(" + this.chordInversions + ")";
                        break;
                }
                break;
            case ChordType.SEVENTH:
                switch (this.chordInversions) {
                    case 0:
                        result += "7";
                        break;
                    case 1:
                        result += "65";
                        break;
                    case 2:
                        result += "43";
                        break;
                    case 3:
                        result += "42";
                        break;
                }
                break;
            case ChordType.SUS2:
                switch (this.chordInversions) {
                    case 0:
                        result += "sus2";
                        break;
                    default:
                        result += "sus2(" + this.chordInversions + ")";
                        break;
                }
                break;
            case ChordType.SUS4:
                switch (this.chordInversions) {
                    case 0:
                        result += "sus4";
                        break;
                    default:
                        result += "sus4(" + this.chordInversions + ")";
                        break;
                }
                break;
            case ChordType.SUS2_SEVENTH:
                switch (this.chordInversions) {
                    case 0:
                        result += "sus2_7";
                        break;
                    default:
                        result += "sus2_7(" + this.chordInversions + ")";
                        break;
                }
                break;
            case ChordType.SUS4_SEVENTH:
                switch (this.chordInversions) {
                    case 0:
                        result += "sus4_7";
                        break;
                    default:
                        result += "sus4_7(" + this.chordInversions + ")";
                        break;
                }
                break;
        }
        if (this.note) {
            result += "(" + this.note + ")";
        }
        return result;
    };
    
    copy() {
        return copyObjectDeep(this);
    };
    
    // Get the harmony element that has its scale base at scaleIndex (in the current scale) and its
    // chord root at otherRootScaleIndex (in the new scale)
    getDerivedChord(scaleIndex, scaleType, otherRootScaleIndex) {
        const result = this.copy();
        const newScaleBase = this.getAbsoluteNoteFromScaleIndex(scaleIndex);
        result.baseNote = newScaleBase;
        result.chordRoot = otherRootScaleIndex;
        result.scaleType = scaleType;
        return result;
    };
    
    setTimeSignature(n, d) {
        this.tsNumerator = n;
        this.tsDenominator = d;
        return this;
    };
    
    setBaseNote(baseNote) {
        this.baseNote = baseNote;
        return this;
    };
    
    getBaseNote() {
        return this.baseNote;
    };
    
    
    getChordRootScaleIndex() {
    
        switch (this.chordType) {
            case ChordType.CUSTOM:
                return this.chord[0];
            default:
                return this.chordRoot;
        }
    };
    
    
    alterScaleCopy(scaleOffsets) {
        let result = scaleOffsets;
        if (this.alterations && this.alterations.length > 0) {
            const alterResult = arrayCopy(scaleOffsets);
            for (let i=0; i<this.alterations.length; i+=2) {
                if (i < this.alterations.length - 1) {
                    const scaleIndex = this.alterations[i];
                    const offset = this.alterations[i + 1];
                    alterResult[scaleIndex % alterResult.length] += offset;
                }
            }
            result = alterResult;
        }
        const scaleMode = clamp(this.scaleMode, -12, 12);
    
    //    if (scaleMode != 0) {
    //        logit("Scale before mode: " + result.join(",") + "  " + scaleMode);
    //    }
    
        const absScaleMode = Math.abs(scaleMode);
        for (let i=0; i<absScaleMode; i++) {
            const modeResult = arrayCopy(result);
            if (scaleMode > 0) {
                // Shift everything left
                const first = modeResult.shift(); // Remove first element
    //            if (first != 0) {
    //                logit("First scale offset not zero. This will not be pretty :) " + this._constructorName);
    //            }
                modeResult.push(12);
                const toSub = modeResult[0];
                for (let j=0; j<modeResult.length; j++) {
                    modeResult[j] = Math.abs(modeResult[j] - toSub);
                }
            } else {
                const last = modeResult.pop();
                const toAdd = 12 - last;
                for (let j=0; j<modeResult.length; j++) {
                    modeResult[j] = modeResult[j] + toAdd;
                }
                modeResult.unshift(0);
            }
            result = modeResult;
    
    
    //        if (scaleMode != 0) {
    //            logit("Scale after mode: " + result.join(",") + "  " + scaleMode + " iteration " + i);
    //        }
        }
        return result;
    };
    
    addAlteration(scaleIndex, offset) {
        this.alterations.push(scaleIndex);
        this.alterations.push(offset);
        return this;
    };
    
    clearAlterations() {
        this.alterations = [];
        return this;
    };
    
    getScale() {
        let result = ScaleType.MAJOR_SCALE_STEPS;
    
        switch (this.scaleType) {
            case ScaleType.CUSTOM:
                result = this.scale;
                break;
            default:
                result = ScaleType.getChromaticSteps(this.scaleType);
                break;
        }
        return this.alterScaleCopy(result);
    };
    
    getHarmonyElements() {
    
        const result = [];
        result.push(this);
        return result;
    };
    
    
    hasSeventh() {
        return this.isSeventh() || this.isNinth();
    };
    
    isNinth() {
        return this.chordType == ChordType.NINTH;
    };
    
    addSeventh() {
        switch (this.chordType) {
            case ChordType.SUS2:
                this.chordType = ChordType.SUS2_SEVENTH;
                break;
            case ChordType.SUS4:
                this.chordType = ChordType.SUS4_SEVENTH;
                break;
            case ChordType.TRIAD:
                this.chordType = ChordType.SEVENTH;
                break;
        }
        return this;
    };
    
    removeSeventh() {
        switch (this.chordType) {
            case ChordType.SUS2_SEVENTH:
                this.chordType = ChordType.SUS2;
                break;
            case ChordType.SUS4_SEVENTH:
                this.chordType = ChordType.SUS4;
                break;
            case ChordType.SEVENTH:
            case ChordType.NINTH:
                this.chordType = ChordType.TRIAD;
                break;
        }
        return this;
    };
    
    
    
    isSeventh() {
        switch (this.chordType) {
            case ChordType.SEVENTH:
            case ChordType.SUS2_SEVENTH:
            case ChordType.SUS4_SEVENTH:
                return true;
        }
        return false;
    };
    
    
    
    isSus() {
        switch (this.chordType) {
            case ChordType.SUS2:
            case ChordType.SUS4:
            case ChordType.SUS2_SEVENTH:
            case ChordType.SUS4_SEVENTH:
                return true;
        }
        return false;
    };
    isSus2() {
        switch (this.chordType) {
            case ChordType.SUS2:
            case ChordType.SUS2_SEVENTH:
                return true;
        }
        return false;
    };
    isSus4() {
        switch (this.chordType) {
            case ChordType.SUS4:
            case ChordType.SUS4_SEVENTH:
                return true;
        }
        return false;
    };
    
    isTriad() {
        switch (this.chordType) {
            case ChordType.SUS2:
            case ChordType.SUS4:
            case ChordType.TRIAD:
                return true;
        }
        return false;
    };
    
    is64Triad() {
        return this.chordType == ChordType.TRIAD && this.chordInversions == 2;
    };
    
    is63Triad() {
        return this.chordType == ChordType.TRIAD && this.chordInversions == 1;
    };
    
    is53Triad() {
        return this.chordType == ChordType.TRIAD && this.chordInversions == 0;
    };
    
    setChordRoot(chordRoot) {
        this.chordRoot = chordRoot;
        return this;
    };
    
    setChordType(t) {
        this.chordType = t;
        return this;
    };
    
    setScaleType(t) {
        this.scaleType = t;
        return this;
    };
    
    getScaleType() {
        return this.scaleType;
    };
    
    
    
    setChordInversions(chordInversions) {
        this.chordInversions = chordInversions;
        return this;
    };
    
    getChordInversions() {
        return this.chordInversions;
    };
    
    
    getChordScaleIndices() {
        const root = this.chordRoot;
        switch (this.chordType) {
            case ChordType.CUSTOM:
                return this.chord;
            case ChordType.SEVENTH:
                return [root, root + 2, root + 4, root + 6];
            case ChordType.NINTH:
                return [root, root + 2, root + 4, root + 6, root + 8];
            case ChordType.TRIAD:
                return [root, root + 2, root + 4];
            case ChordType.SUS2:
                return [root, root + 1, root + 4];
            case ChordType.SUS2_SEVENTH:
                return [root, root + 1, root + 4, root + 6];
            case ChordType.SUS4:
                return [root, root + 3, root + 4];
            case ChordType.SUS4_SEVENTH:
                return [root, root + 3, root + 4, root + 6];
        }
    //    logit("FAlling thoughlll " + this.chordType + " " + typeof(this.chordType));
        return this.chord;
    };
    
    getThirdScaleIndex() {
    
        switch (this.chordType) {
            case ChordType.SEVENTH:
            case ChordType.TRIAD:
            case ChordType.NINTH:
                return this.chordRoot + 2;
            case ChordType.SUS2:
            case ChordType.SUS2_SEVENTH:
                return this.chordRoot + 1;
            case ChordType.SUS4:
            case ChordType.SUS4_SEVENTH:
                return this.chordRoot + 3;
        }
        return this.chordRoot + 2;
    };
    
    getFifthScaleIndex() {
        switch (this.chordType) {
            case ChordType.SEVENTH:
            case ChordType.TRIAD:
            case ChordType.SUS2:
            case ChordType.SUS2_SEVENTH:
            case ChordType.SUS4:
            case ChordType.SUS4_SEVENTH:
            case ChordType.NINTH:
                return this.chordRoot + 4;
        }
        return this.chordRoot + 4;
    };
    
    
    getSeventhScaleIndex() {
    
        switch (this.chordType) {
            case ChordType.SUS2_SEVENTH:
            case ChordType.SUS4_SEVENTH:
            case ChordType.SEVENTH:
            case ChordType.NINTH:
                return this.chordRoot + 6;
        }
        return this.chordRoot + 7;
    };
    
    
    
    getBassScaleIndex() {
    
        switch (this.chordType) {
            case ChordType.SEVENTH:
            case ChordType.TRIAD:
            case ChordType.NINTH:
                return this.chordRoot + this.chordInversions * 2;
            case ChordType.SUS2:
            case ChordType.SUS2_SEVENTH:
                switch (this.chordInversions) {
                    case 0:
                        return this.chordRoot;
                    case 1:
                        return this.chordRoot + 1;
                    case 2:
                        return this.chordRoot + 4;
                    case 3:
                        return this.chordRoot + 6;
                }
                break;
            case ChordType.SUS4:
            case ChordType.SUS4_SEVENTH:
                switch (this.chordInversions) {
                    case 0:
                        return this.chordRoot;
                    case 1:
                        return this.chordRoot + 3;
                    case 2:
                        return this.chordRoot + 4;
                    case 3:
                        return this.chordRoot + 6;
                }
                break;
        }
        return this.chordRoot + this.chordInversions * 2;
    };
    
    getThirdAboveBassScaleIndex() {
        logit("getThirdAboveBassScaleIndex() not implemented yet... <br />");
        return this.getBassScaleIndex() + 2;
    };
    
    
    
    getChordRootPositionAbsoluteOffsets(maxCount) {
        const result = [];
        const scaleIndices = this.getChordRootPositionScaleIndices(maxCount);
        const scale = this.getScale();
        const first = scaleIndices[0];
        const firstAbsolute = this.getAbsoluteNote(this.baseNote, scale, first);
        const diff = firstAbsolute - this.baseNote;
        for (let i=0; i<scaleIndices.length; i++) {
            result[i] = this.getAbsoluteNote(this.baseNote, scale, scaleIndices[i]) - firstAbsolute + diff;
            //        result[i] = scale[positiveMod(scaleIndices[i], scale.length)];
            //        if (i > 0 && result[i] < result[i-1]) {
            //            result[i] += 12;
            //        }
        }
        return result;
    };
    
    getChordRootPositionScaleIndices(maxCount) {
        const chordRoot = this.chordRoot;
    
        let result = [chordRoot, chordRoot + 2, chordRoot + 4 ];
        switch (this.chordType) {
            case ChordType.CUSTOM:
                result = arrayCopy(this.chord);
                break;
            case ChordType.SEVENTH:
                result = [ chordRoot, chordRoot + 2, chordRoot + 4,
                    chordRoot + 6 ];
                break;
            case ChordType.NINTH:
                result = [ chordRoot, chordRoot + 2, chordRoot + 4,
                    chordRoot + 6, chordRoot + 8 ];
                break;
            case ChordType.TRIAD:
                result = [chordRoot, chordRoot + 2, chordRoot + 4 ];
                break;
            case ChordType.SUS2:
                result = [ chordRoot, chordRoot + 1, chordRoot + 4 ];
                break;
            case ChordType.SUS4:
                result = [ chordRoot, chordRoot + 3, chordRoot + 4 ];
                break;
            case ChordType.SUS2_SEVENTH:
                result = [ chordRoot, chordRoot + 1, chordRoot + 4, chordRoot + 6 ];
                break;
            case ChordType.SUS4_SEVENTH:
                result = [ chordRoot, chordRoot + 3, chordRoot + 4, chordRoot + 6 ];
                break;
        }
        if (maxCount) {
            result.length = maxCount;
        }
        return result;
    };
    
    
    getAbsoluteNoteFromChordBassIndex(index) {
        //    let theChord = this.getChordRootPositionScaleIndices();
        const chordOffsets = this.getChordRootPositionAbsoluteOffsets();
        const first = chordOffsets[0];
        for (let i=0; i<chordOffsets.length; i++) {
            chordOffsets[i] -= first;
        }
        //    logit("  Chord offsets: " + chordOffsets + " first: " + first + " baseNote: " + this.baseNote + " index: " + index + " inversions: " + this.chordInversions + "<br />");
        return this.getAbsoluteNote(this.baseNote + first, chordOffsets, index + this.chordInversions);
    };
    
    
    getAbsoluteNoteFromChordRootIndex(index, maxCount) {
        const chordOffsets = this.getChordRootPositionAbsoluteOffsets(maxCount);
        //let theChord = this.getChordRootPositionScaleIndices();
        const first = chordOffsets[0];
        for (let i=0; i<chordOffsets.length; i++) {
            chordOffsets[i] -= first;
        }
        return this.getAbsoluteNote(this.baseNote + first, chordOffsets, index);
    };
    
    getAbsoluteNoteFromScaleIndex(index) {
        const theScale = this.getScale();
        return this.getAbsoluteNote(this.baseNote, theScale, index);
    };
    
    getAbsoluteNotesFromScaleIndices(indices) {
        const theScale = this.getScale();
        const result = [];
        for (let i=0; i<indices.length; i++) {
            result.push(this.getAbsoluteNote(this.baseNote, theScale, indices[i]));
        }
        return result;
    };
    
    getChordAbsoluteNotes() {
        return this.getAbsoluteNotesFromScaleIndices(this.getChordScaleIndices());
    };
    
    getChordPitchClasses() {
        return this.getPitchClassesFromAbsoluteNotes(this.getAbsoluteNotesFromScaleIndices(this.getChordScaleIndices()));
    };
    
    
    getAbsoluteNote(absoluteBaseNote, offsets, index) {
        //    logit("Getting absolute note " + absoluteBaseNote + " " + offsets + " " + index + "<br>");
        let offsetIndex = 0;
        let octaveOffset = 0;
        offsetIndex = positiveMod(index, offsets.length);
        if (index >= 0) {
            octaveOffset = Math.floor(index / offsets.length);
        } else {
            octaveOffset = -Math.floor((-index + offsets.length - 1) / offsets.length);
        }
        return absoluteBaseNote + 12 * octaveOffset + offsets[offsetIndex];
    };
    
    getPitchClasses(baseNote, chordOffsets) {
        const result = [];
        for (let i = 0; i < chordOffsets.length; i++) {
            result[i] = (baseNote + chordOffsets[i]) % 12;
        }
        return result;
    };
    
    getPitchClassesFromAbsoluteNotes(absoluteNotes) {
        const result = [];
        for (let i = 0; i < absoluteNotes.length; i++) {
            result[i] = absoluteNotes[i] % 12;
        }
        return result;
    };
    
    getPitchClassesSetFromAbsoluteNotes(absoluteNotes) {
        const result = {};
        for (let i = 0; i < absoluteNotes.length; i++) {
            const pitchClass = absoluteNotes[i] % 12;
            result[pitchClass] = true;
        }
        return result;
    };
    
    getPitchClassesFromScaleIndices(scaleIndices) {
        const result = [];
        for (let i = 0; i < scaleIndices.length; i++) {
            result[i] = this.getAbsoluteNoteFromScaleIndex(scaleIndices[i]) % 12;
        }
        return result;
    };
    
    pitchClassDistance(c1, c2) {
    
        return Math.min(Math.abs(c1 - c2), 12 - Math.abs(c1 - c2));
    };
    
    
    // c2 must be "smaller" than c1
    lowerPitchClassDistance(c1, c2) {
        if (c2 <= c1) {
            return c1 - c2;
        } else {
            return c1 + 12 - c2;
        }
    };
    
    
    getClosestNoteWithPitchClasses(absoluteNote, pitchClasses, distanceFunc) {
    
        if (!distanceFunc) {
            distanceFunc = this.pitchClassDistance;
        }
    
        absoluteNote = Math.min(127, Math.max(1, absoluteNote));
    
        const notePitchClass = absoluteNote % 12;
        let minDistance = 99999;
        let closestPitchClass = 0;
        for (let i = 0; i < pitchClasses.length; i++) {
            const distance = distanceFunc(notePitchClass, pitchClasses[i]);
            if (distance < minDistance) {
                minDistance = distance;
                closestPitchClass = pitchClasses[i];
            }
        }
    
        const upperAbs = absoluteNote + minDistance;
        const lowerAbs = absoluteNote - minDistance;
    
        if (upperAbs <= 127 && (upperAbs % 12) == closestPitchClass) {
            return absoluteNote + minDistance;
        } else if (lowerAbs > 1 && (lowerAbs % 12) == closestPitchClass) {
            return absoluteNote - minDistance;
        } else {
            logit("Error in getClosestNotewithPitchClasses() input " + absoluteNote + " and " + pitchClasses + "<br />");
    //        logit(printStackTrace().join("<br />"));
            return Math.floor(absoluteNote / 12) * 12 + closestPitchClass;
        }
    };
    
    
    getChordRootIndexAndChromaticOffsetForAbsoluteNote(absoluteNote, maxCount) {
        const increments = this.getChordRootPositionAbsoluteOffsets(maxCount);
        let baseNote = this.getBaseNote();
        const firstInc = increments[0];
        baseNote += firstInc;
        for (let i=0; i<increments.length; i++) {
            increments[i] -= firstInc;
        }
        const result = this.getScaleIndexAndChromaticOffsetForAbsoluteNoteStatic(absoluteNote,
            baseNote, increments);
        //    logit("Getting chord root index from " + absoluteNote + " increments: " + increments + " result: " + result + "<br />");
        return result;
    };
    
    
    getScaleIndexAndChromaticOffsetForAbsoluteNote(absoluteNote) {
    
        return this.getScaleIndexAndChromaticOffsetForAbsoluteNoteStatic(absoluteNote,
            this.getBaseNote(), this.getScale());
    };
    
    getScaleIndexAndChromaticOffsetForAbsoluteNoteStatic(absoluteNote, theBaseNote, increments) {
    
        let chromaticOffset = 0;
        let resultIndex = 0;
    
        const absDiff = absoluteNote - theBaseNote;
    
        let diffOctave = 0;
    
        let normalizedNote = absDiff;
        while (normalizedNote < 0) {
            normalizedNote += 12;
            diffOctave--;
        }
        while (normalizedNote > 11) {
            normalizedNote -= 12;
            diffOctave++;
        }
        let shortestAbsDistance = 9999999;
        for (let i = 0; i < increments.length; i++) {
            if (increments[i] == normalizedNote) {
                resultIndex = i + diffOctave * increments.length;
                chromaticOffset = 0;
                break;
            } else {
                const diff = normalizedNote - increments[i];
                if (Math.abs(diff) < shortestAbsDistance) {
                    shortestAbsDistance = Math.abs(diff);
                    resultIndex = i + diffOctave * increments.length;
                    chromaticOffset = diff;
                }
            }
        }
        return [resultIndex, chromaticOffset];
    };
    
    getScaleAbsoluteNotes() {
        const result = [];
        const scale = this.getScale();
        for (let i=0; i<scale.length; i++) {
            const absNote = this.getAbsoluteNoteFromScaleIndex(i);
            result.push(absNote);
        }
        return result;
    };
    
    
    getVerticalRelativeAbsoluteNote(verticalRelativeType, voiceLineElement) {
        let absoluteNote = null;
        switch (verticalRelativeType) {
            case VerticalRelativeType.VOICE_LINE:
            case VerticalRelativeType.NOTE:
                if (voiceLineElement) {
                    absoluteNote = this.getAbsoluteNoteConstantVoiceLineElement(voiceLineElement);
                } else {
                    absoluteNote = this.getBaseNote();
                }
                break;
            case VerticalRelativeType.MIDI_ZERO:
                absoluteNote = 0;
                break;
            case VerticalRelativeType.SCALE_BASE:
                absoluteNote = this.getBaseNote();
                break;
            case VerticalRelativeType.CHORD_ROOT:
                absoluteNote = this.getAbsoluteNoteFromChordRootIndex(0);
                break;
            case VerticalRelativeType.CHORD_BASS:
                absoluteNote = this.getAbsoluteNoteFromChordBassIndex(0);
                break;
        }
        return absoluteNote;
    };
    
    getAbsoluteNoteWithIndexType(index, indexType) {
        let result = 0;
    
        switch (indexType) {
            case IndexType.SCALE:
                result = this.getAbsoluteNoteFromScaleIndex(index);
                break;
            case IndexType.CHORD_ROOT:
                result = this.getAbsoluteNoteFromChordRootIndex(index);
                break;
            case IndexType.CHORD_BASS:
                result = this.getAbsoluteNoteFromChordBassIndex(index);
                break;
            case IndexType.MIDI_NOTE:
                result = index;
                break;
        }
    
        return result;
    };
    
    
    getAbsoluteNoteConstantVoiceLineElement(e) {
    
        // public int getAbsoluteNote(ConstantVoiceLineElement e) {
        let result = this.getAbsoluteNoteWithIndexType(e.index, e.indexType);
    
        //    let beforeSnap = result;
        //    let beforeSnapPitchClass = beforeSnap % 12;
    
        result = this.snap(result, e.snapType, this);
    
        //    switch (e.snapType) {
        //        case SnapType.NONE:
        //            break;
        //        case SnapType.SCALE:
        //            let pitchClasses = this.getPitchClasses(this.baseNote, this.getScale());
        //            result = this.getClosestNoteWithPitchClasses(result, pitchClasses);
        //            break;
        //        case SnapType.CHORD:
        //            let scaleIndices = this.getChordRootPositionScaleIndices();
        //            let pitchClasses = this.getPitchClassesFromScaleIndices(scaleIndices);
        //            result = this.getClosestNoteWithPitchClasses(result, pitchClasses);
        //            break;
        //    }
    
        //    let scalePitchClasses = this.getPitchClassesFromAbsoluteNotes(this.getScaleAbsoluteNotes());
        //    let chordOffsets = this.getChordRootPositionScaleIndices();
        //    let chordAbsOffsets = this.getChordRootPositionAbsoluteOffsets();
        //    let chordPitchClasses = this.getPitchClasses(this.baseNote, chordAbsOffsets);
        //    let resultPitchClass = result % 12;
        //    logit("Getting VL absolute note. Index: " + e.index +
        //        " index type: " + e.indexType +
        //        " snap type: " + e.snapType +
        //        " before snap: " + beforeSnap +
        //        " before snap pitch class: " + beforeSnapPitchClass +
        //        " after snap: " + result +
        //        " after snap pitch class: " + resultPitchClass +
        //        " chord pitch classes: " + chordPitchClasses +
        //        " scale pitch classes: " + scalePitchClasses +
        //        "<br />");
    
        return result + 12 * e.octaves;
    };
    
    
    
    snap(absoluteNote, snapType, harmonyElement) {
        let result = Math.min(127, Math.max(1, absoluteNote));
        switch (snapType) {
            case SnapType.NONE:
                break;
            case SnapType.SCALE:
                let pitchClasses1 = harmonyElement.getPitchClasses(harmonyElement.baseNote, harmonyElement.getScale());
                result = harmonyElement.getClosestNoteWithPitchClasses(result, pitchClasses1);
                break;
            case SnapType.CHORD:
                const scaleIndices = harmonyElement.getChordRootPositionScaleIndices();
                let pitchClasses2 = harmonyElement.getPitchClassesFromScaleIndices(scaleIndices);
                result = harmonyElement.getClosestNoteWithPitchClasses(result, pitchClasses2);
                break;
        }
        return result;
    };
    
    offset(absoluteNote, offsetType, offset, harmonyElement) {
        let result = absoluteNote;
        let indexChr;

        switch (offsetType) {
            case OffsetType.SCALE:
                indexChr = harmonyElement
                    .getScaleIndexAndChromaticOffsetForAbsoluteNote(result);
                const scaleIndex = indexChr[0] + offset;
                // logit("Absolute note " + absoluteNote + " gives scale index: " + scaleIndex + "<br />");
                const absNote = harmonyElement.getAbsoluteNoteFromScaleIndex(scaleIndex);
                result = absNote;
                break;
            case OffsetType.HALF_STEP:
                result = absoluteNote + offset;
                break;
            case OffsetType.CHORD:
                indexChr = harmonyElement.getChordRootIndexAndChromaticOffsetForAbsoluteNote(result);
                result = harmonyElement.getAbsoluteNoteFromChordRootIndex(indexChr[0] + offset);
                break;
            case OffsetType.CHORD_TRIAD_ONLY:
                indexChr = harmonyElement.getChordRootIndexAndChromaticOffsetForAbsoluteNote(result, 3);
                result = harmonyElement.getAbsoluteNoteFromChordRootIndex(indexChr[0] + offset);
                break;
            case OffsetType.CHORD_SEVENTH_ONLY:
                indexChr = harmonyElement.getChordRootIndexAndChromaticOffsetForAbsoluteNote(result, 4);
                result = harmonyElement.getAbsoluteNoteFromChordRootIndex(indexChr[0] + offset);
                break;
            case OffsetType.OCTAVE:
                result = absoluteNote + offset * 12;
                break;
            default:
                logit(" offset type " + OffsetType.toString(offsetType)
                    + " not supported yet");
                break;
        }
        return result;
    };
    
    snapOffsetSnap(absoluteNote, beforeOffsetSnapType, offsetType, afterOffsetSnapType, offset, harmonyElement) {
    
        let result = absoluteNote;
        result = harmonyElement.snap(result, beforeOffsetSnapType, harmonyElement);
        result = harmonyElement.offset(result, offsetType, offset, harmonyElement);
        result = harmonyElement.snap(result, afterOffsetSnapType, harmonyElement);
    
        return result;
    };
}



const HarmonyLengthMode = {
    COUNT_AND_LENGTH_PATTERN: 0, // The count determines the number of elements. The length pattern is used for determining the length of the separate elements
    COUNT_AND_RYTHM: 1, // The count determines number of elements. The rythm determines the relative lengths. Total length is also used to scale the rythm
    RYTHM_ONLY: 2, // A rythm determines relative lenghts. Total length is used to scale it

    toString: function(type) {
        switch (type) {
            case HarmonyLengthMode.COUNT_AND_LENGTH_PATTERN:
                return "Count and length pattern";
            case HarmonyLengthMode.COUNT_AND_RYTHM:
                return "Count and rythm";
            case HarmonyLengthMode.RYTHM_ONLY:
                return "Rythm only";
        }
        return "Unknown length mode " + type;
    }
};
addPossibleValuesFunction(HarmonyLengthMode, HarmonyLengthMode.COUNT_AND_LENGTH_PATTERN, HarmonyLengthMode.RYTHM_ONLY);


class SequenceHarmonyElement extends HarmonyElement {
    constructor() {
        super();
        this.harmonyLengthMode = HarmonyLengthMode.RYTHM_ONLY;

        // Each lengths' element becomes a harmony element
        this.count = 1;
        this.lengthPattern = [1.0];
        this.startLengthPattern = [];
        this.endLengthPattern = [];
        this.lengthPatternUnit = PositionUnit.MEASURES;

        this.totalLength = 1.0; // Used when a lengthRythm is used
        this.totalLengthUnit = PositionUnit.MEASURES;
        this.setTotalLengthExternally = false;

        this.beatStrengths = [1, 0.8, 0.9, 0.6, 0.3, 0.4, 0.2];

        // For rythm-based harmony elements
        this.lengthRythm = "";
        this.rythmTsNumerator = 4;
        this.rythmTsDenominator = 4;
        this.setTsNumeratorExternally = false;

        this.useMaxElementLength = false;
        this.maxElementLength = 1;
        this.maxElementLengthUnit = PositionUnit.MEASURES;

        this.lengthRepeats = 0; // Repeats the lengths

        this.usePositionSnap = false;
        this.positionSnapPattern = [1.0];
        this.positionSnapUnit = PositionUnit.BEATS;
        this.positionSnapMetrics = SnapMetrics.ROUND;

        this.phraseStructureCounts = [];

        this.tsNumerators = [4];
        this.startTsNumerators = [];
        this.endTsNumerators = [];

        this.tsDenominators = [4];
        this.startTsDenominators = [];
        this.endTsDenominators = [];

        this._constructorName = "SequenceHarmonyElement";
    }
}

class SimpleSequenceHarmonyElement extends SequenceHarmonyElement {
    constructor() {
        super();

        this.scaleBaseNotes = [60];
        this.scaleBaseNoteIndices = [0];
        this.startScaleBaseNoteIndices = [];
        this.endScaleBaseNoteIndices = [];

        this.scaleTypes = [ScaleType.MAJOR];
        this.scaleTypeIndices = [0];
        this.startScaleTypeIndices = [];
        this.endScaleTypeIndices = [];

        this.scaleModes = [0];
        this.startScaleModes = [];
        this.endScaleModes = [];

        this.chordRoots = [0];
        this.startChordRoots = [];
        this.endChordRoots = [];

        this.chordInversions = [0];
        this.startChordInversions = [];
        this.endChordInversions = [];

        this.chordTypes = [ChordType.TRIAD];
        this.chordTypeIndices = [0];
        this.startChordTypeIndices = [];
        this.endChordTypeIndices = [];

        this.customScales = [[0, 2, 4, 5, 7, 9, 11]];
        this.customScaleIndices = [0];
        this.startCustomScaleIndices = [];
        this.endCustomScaleIndices = [];

        this.customChords = [[0, 2, 4]];
        this.customChordIndices = [0];
        this.startCustomChordIndices = [];
        this.endCustomChordIndices = [];

        this.voiceLineConstraints = [];
        this.voiceLineConstraintIndices = []; // 2d array
        this.startVoiceLineConstraintIndices = []; // 2d array
        this.endVoiceLineConstraintIndices = []; // 2d array


        this._constructorName = "SimpleSequenceHarmonyElement";
    }
}

SimpleSequenceHarmonyElement.prototype.voiceLineConstraints_allowedTypes = {"VoiceChordNotesVoiceLinePlannerConstraint": 1};




