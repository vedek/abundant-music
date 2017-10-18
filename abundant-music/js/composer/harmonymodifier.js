

class HarmonyModifier {
    constructor() {
        this.id = "";
        this.active = true;
        this._constructorName = "HarmonyModifier";
    }

    modifyConstantHarmonyElements(elements, module) {
        return elements;
    }
}

// Adding voice line constraints where appropriate
// After the voice leading planning, it also sets suspend to true for the resulting elements that have obeyed
class SuspendHarmonyModifier extends HarmonyModifier {
    constructor() {
        super();
        this.seed = 12345;

        this.voiceLineOnPattern = [1];

        this.suspendProbabilities = [0.25];
        this.doubleSuspendProbabilities = [0.1];
        this.tripleSuspendProbabilities = [0.05];
        this._constructorName = "SuspendHarmonyModifier";
    }

    modifyConstantHarmonyElements(elements, module) {
        const result = copyValueDeep(elements);

        const active = getValueOrExpressionValue(this, "active", module);

        if (active && elements.length > 0) {


            const seed = getValueOrExpressionValue(this, "seed", module);
            let probs = getValueOrExpressionValue(this, "suspendProbabilities", module);

            const allowDissonantPreparation = false;

            const allowConsonantSuspension = false;
            const allowStartsWeak = false;

            const allowAnticipateResolution = false; // This translates into a non-doubling constraint
            const allowAnticipateResolutionWithBass = true;

            const minBeatLength = 2;

            const infos = [];

            let currentBeat = 0;
            const measureBeatLength = positionUnitToBeats(1, PositionUnit.MEASURES, elements[0].tsNumerator, elements[0].tsDenominator);

            const minSecondLength = 2;

            for (var i=0; i<result.length-1; i++) {

                var info = {};

                const first = result[i];
                const second = result[i+1];


                const firstLength = first.getBeatLength();
                const secondLength = second.getBeatLength();


                const firstScaleIndices = first.getChordScaleIndices();
                const firstAbsNotes = first.getAbsoluteNotesFromScaleIndices(firstScaleIndices);
                const firstPitchClasses = first.getPitchClassesFromAbsoluteNotes(firstAbsNotes);
                const secondScaleIndices = second.getChordScaleIndices();
                const secondAbsNotes = second.getAbsoluteNotesFromScaleIndices(secondScaleIndices);
                const secondPitchClasses = second.getPitchClassesFromAbsoluteNotes(secondAbsNotes);

                const allPairs = [];

                const beatLength = first.getBeatLength();
                const secondBeatLength = second.getBeatLength();

                let ok = !second.isSus();

                ok = ok && secondLength >= minSecondLength;

                // Do this in a better way with disallowed pairs or something...
                if (secondLength == 2 && (firstLength == 4 || firstLength == 6 || firstLength == 8)) {
                    ok = false;
                }

                const secondStartBeat = currentBeat + beatLength;
                const modulus = (secondStartBeat % measureBeatLength);
                if (modulus != 0 && modulus != 2) {
                    ok = ok && allowStartsWeak;
                }

                ok = ok && secondBeatLength >= minBeatLength;

                if (ok) {
                    // Add all pairs of notes
                    for (var j=0; j<firstPitchClasses.length; j++) {
                        const firstPc = firstPitchClasses[j];
                        const closestPc = first.getClosestNoteWithPitchClasses(firstPc + 24, secondPitchClasses) % 12;
                        if (closestPc == firstPc && !allowConsonantSuspension) {
                            // The note was part of the second chord and we do not allow consonant suspensions
                            continue;
                        }
                        for (let k=0; k<secondPitchClasses.length; k++) {
                            const secondPc = secondPitchClasses[k];

                            const distance = first.lowerPitchClassDistance(firstPc, secondPc);

                            if (firstPc == secondPc) {
                                logit(" bad closest? " + closestPc + " " + firstPc + " " + secondPc);
                                continue;
                            }

                            if (distance > 2) {
                                // Can not resolve normally
                                continue;
                            }

                            allPairs.push([firstPc, secondPc]);
                        }
                    }
                }
                info.pairs = allPairs;
                if (info.pairs.length > 0) {
                    info.text = first.toRomanString() + "->" + second.toRomanString();
                }
                infos.push(info);

                currentBeat += beatLength;
            }

    //        logit(this._constructorName + " seed " + seed);

            if (probs.length == 0) {
                probs = [0.2];
            }

            const rnd = new MersenneTwister(seed);
            for (var i=0; i<infos.length; i++) {
                var info = infos[i];
                if (rnd.random() < probs[i % probs.length]) {
                    let maxCount = 1;
                    if (rnd.random() < this.doubleSuspendProbabilities[i % this.doubleSuspendProbabilities.length]) {
                        maxCount = 2;
                    }
                    if (rnd.random() < this.tripleSuspendProbabilities[i % this.tripleSuspendProbabilities.length]) {
                        maxCount = 3;
                    }
                    const toSample = Math.min(info.pairs.length, maxCount);

                    const rndInfos = [];
                    for (var j=0; j<info.pairs.length; j++) {
                        rndInfos.push({data: j, likelihood: 1});
                    }
                    const indices = sampleNDataWithoutReplacement(rndInfos, toSample, rnd);

                    for (var j=0; j<indices.length; j++) {
                        const pair = info.pairs[indices[j]]; // info.pairs[Math.floor(rnd.random() * info.pairs.length)];
                        const constraint = new SuspendVoiceLinePlannerConstraint();
                        constraint.onPattern = copyValueDeep(this.voiceLineOnPattern);
                        constraint.suspendPitchClassPairs.push(pair);
                        result[i+1].voiceLineConstraints.push(constraint);

                        const sectionModifier = new ConditionalSuspendSectionModifier();
                        sectionModifier.harmonyIndex = i;
                        sectionModifier.suspendPitchClassPairs.push(pair);
                        result[i+1].sectionModifiers.push(sectionModifier);

    //                    logit(this._constructorName + " adding constraint at " + (i+1) + " pair: " + JSON.stringify(pair));
                    }
                }
    //            for (var j=0; j<info.pairs.length; j++) {
    //
    //            }
            }
    //        logit(this._constructorName + " " + JSON.stringify(infos));
        }

        return result;
    }
}

class RandomShortenHarmonyModifier extends HarmonyModifier {
    constructor() {
        super();
        this.totalBeats = [0];
        this.maxAttempts = 20;
        this.indexLikelihoods = [1];
        this.startIndexLikelihoods = [];
        this.endIndexLikelihoods = [];
        this.minElementLength = 1;
        this.minElementLengthUnit = PositionUnit.BEATS;
        this.seed = 12345;
        this._constructorName = "RandomShortenHarmonyModifier";
    }

    modifyConstantHarmonyElements(elements, module) {
        const result = copyValueDeep(elements);

        if (!this.active) {
            return result;
        }

        if (result.length > 0) {
            const likelihoods = [];
            for (var i=0; i<result.length; i++) {
                const likelihood = getItemFromArrayWithStartEndItems(1, this.indexLikelihoods, result.length, i,
                    this.startIndexLikelihoods, this.endIndexLikelihoods);
                likelihoods.push(likelihood);
            }

            const cumulative = getProbabilityDistribution(fixLikelihoods(likelihoods));

            const rnd = new MersenneTwister(this.seed);

            function getBadRepeatArray(elements) {
                const measureStarts = [];
                let currentBeat = 0;
                const harmony = new ConstantHarmonicRythm(elements);
                const measureLength = positionUnitToBeats2(1, PositionUnit.MEASURES, currentBeat, harmony);

                const crossesArr = [];

    //            var beatStarts = [];

                const numerator = elements[0].tsNumerator;
                const startBeatStrengths = HarmonyGenerator.prototype.getStartBeatStrengthsFromHarmonyElements(module, elements, 0, numerator);

                for (let i=0; i<elements.length; i++) {
    //                beatStarts[i] = currentBeat;
                    let cost = 0.0;
                    if (i < elements.length - 1) {
                        cost = HarmonyGenerator.prototype.calculateBeatStrengthRepetitionCost(elements[i], startBeatStrengths[i],
                            elements[i+1], startBeatStrengths[i+1]);
                    }
                    crossesArr[i] = cost > 0;

                    const beatLength = elements[i].getBeatLength();
                    const oldMeasureIndex = Math.floor(currentBeat / measureLength);
                    const newMeasureIndex = Math.floor((currentBeat + beatLength) / measureLength);
                    const newBeatStart = newMeasureIndex * measureLength;
                    const stepIntoNew = currentBeat + beatLength - newBeatStart;

                    crossesArr[i] = crossesArr[i] || (newMeasureIndex > oldMeasureIndex && stepIntoNew > 0.01);
                    currentBeat += beatLength;
                }

    //            logit(" crosses: " + crossesArr.join(", "));

                return crossesArr;
            }

            const crossBefore = getBadRepeatArray(result);

            for (let j=0; j<this.totalBeats.length; j++) {
                const beatsToTest = this.totalBeats[j];
                //            logit("Testing " + beatsToTest + " <br />");
                let success = false;
                for (var i=0; i<this.maxAttempts; i++) {
                    const index = sampleIndexIntegerDistribution(rnd, cumulative);

                    const toShorten = result[index];
                    const beatLength = toShorten.getBeatLength();

                    toShorten.length = beatLength;
                    toShorten.lengthUnit = PositionUnit.BEATS;

                    const minBeatLength = positionUnitToBeats(this.minElementLength, this.minElementLengthUnit,
                        toShorten.tsNumerator, toShorten.tsDenominator);

                    if (beatLength - beatsToTest >= minBeatLength) {
                        const oldLength = toShorten.length;
                        toShorten.length -= beatsToTest;

                        const crossAfter = getBadRepeatArray(result);
                        if (arrayEquals(crossBefore, crossAfter)) {
                            success = true;
                            break;
                        } else {
    //                        logit("Cross before: " + crossBefore.join(", "));
    //                        logit("Cross after:  " + crossAfter.join(", "));
                            toShorten.length = oldLength;
                        }
                    }
                }
                if (success) {
                    break;
                }
            }
        }
        return result;
    }
}

class MultiRandomShortenHarmonyModifier extends HarmonyModifier {
    constructor() {
        super();
        this.totalBeats = [[0]];
        this.maxAttempts = 20;
        this.indexLikelihoods = [[1]];
        this.startIndexLikelihoods = [];
        this.endIndexLikelihoods = [];
        this.minElementLengths = [1];
        this.minElementLengthUnit = PositionUnit.BEATS;
        this.seed = 12345;
        this._constructorName = "MultiRandomShortenHarmonyModifier";
    }

    modifyConstantHarmonyElements(elements, module) {

        if (!this.active) {
            return copyValueDeep(elements);
        }

        function getBeatLength(els) {
            let sum = 0;
            for (let j=0; j<els.length; j++) {
                sum += els[j].getBeatLength();
            }
            return sum;
        }
        const lengthBefore = getBeatLength(elements);

        for (let i=0; i<this.totalBeats.length; i++) {
            const beats = this.totalBeats[i];

            const modifier = new RandomShortenHarmonyModifier();
            modifier.totalBeats = beats;
            modifier.maxAttempts = this.maxAttempts;

            modifier.indexLikelihoods = this.indexLikelihoods.length > 0 ? this.indexLikelihoods[IndexBorderMode.getIndex(IndexBorderMode.CLAMP, this.indexLikelihoods.length, i)] : [1];
            modifier.startIndexLikelihoods = this.startIndexLikelihoods.length > 0 ? this.startIndexLikelihoods[IndexBorderMode.getIndex(IndexBorderMode.CLAMP, this.startIndexLikelihoods.length, i)] : [];
            modifier.endIndexLikelihoods = this.endIndexLikelihoods.length > 0 ? this.endIndexLikelihoods[IndexBorderMode.getIndex(IndexBorderMode.CLAMP, this.endIndexLikelihoods.length, i)] : [];
            modifier.minElementLength = this.minElementLengths.length > 0 ? this.minElementLengths[IndexBorderMode.getIndex(IndexBorderMode.CLAMP, this.minElementLengths.length, i)] : 1;
            modifier.minElementLengthUnit = this.minElementLengthUnit;
            modifier.seed = this.seed;

            const copy = copyValueDeep(elements);
            const result = modifier.modifyConstantHarmonyElements(copy, module);
            const lengthAfter = getBeatLength(result);
            // logit("length before: " + lengthBefore + " after: " + lengthAfter);
            if (beats == 0 || (lengthAfter < lengthBefore - 0.9 * beats)) {
                return result;
            }
        }

        return copyValueDeep(elements);
    }
}

class AppendHarmonyModifier extends HarmonyModifier {
    constructor() {
        super();
        this.elements = [];
        this._constructorName = "AppendHarmonyModifier";
    }

    modifyConstantHarmonyElements(elements, module) {
        const result = copyValueDeep(elements);
        if (!this.active) {
            return result;
        }
        for (let i=0; i<this.elements.length; i++) {
            const e = this.elements[i];
            const toAppend = e.getConstantHarmonyElements(module);
            addAll(result, toAppend);
        }
        return result;
    }
}

class PartialHarmonyModifier extends HarmonyModifier {
    constructor() {
        super();
        this._constructorName = "PartialHarmonyModifier";
    }

    getModifierIndexRanges(elements, module) {
        return [[0, elements.length - 1]];
    }

    modifyHarmonyElement(index, elements, module) {
    }

    modifyIndexRange(indexRange, elements, module) {
        for (let i=indexRange[0]; i<=indexRange[1]; i++) {
            this.modifyHarmonyElement(i, elements, module);
        }
    }

    modifyConstantHarmonyElements(elements, module) {
        const result = copyValueDeep(elements);

        if (!this.active) {
            return result;
        }

        const ranges = this.getModifierIndexRanges(elements, module);
        for (let i=0; i<ranges.length; i++) {
            const range = ranges[i];
            this.modifyIndexRange(range, result, module);
        }
        return result;
    }
}

class ModeMixtureHarmonyModifier extends HarmonyModifier {
    constructor() {
        super();
        this.majorRoots = [];
        this.majorFromRoots = [];
        this.majorNewScaleTypes = [ScaleType.NATURAL_MINOR];
        this.minorRoots = [4, 6];
        this.minorFromRoots = [];
        this.minorNewScaleTypes = [ScaleType.MELODIC_MINOR, ScaleType.HARMONIC_MINOR];
        this.indexRanges = [];
        this.modifyPattern = [1];
        this.startModifyPattern = [];
        this.endModifyPattern = [];
        this.addCrossRelationConstraint = true;
        this._constructorName = "ModeMixtureHarmonyModifier";
    }

    modify(index, elements, module, fromRoots, roots, scaleType) {
        const element = elements[index];
        const rootPitchClass = element.getAbsoluteNoteFromChordRootIndex(0) % 12;
        let ok = false;
        if (fromRoots.length == 0) {
            ok = true;
        }
        if (index > 0) {
            const prevElement = elements[index - 1];
            const prevRootPitchClass = prevElement.getAbsoluteNoteFromChordRootIndex(0) % 12;
            for (var i=0; i<fromRoots.length; i++) {
                var possiblePitchClass = prevElement.getAbsoluteNoteFromScaleIndex(fromRoots[i]) % 12;
                if (possiblePitchClass == prevRootPitchClass) {
                    ok = true;
                    break;
                }
            }
        }
        if (ok) {
            ok = false;
            for (var i=0; i<roots.length; i++) {
                var possiblePitchClass = element.getAbsoluteNoteFromScaleIndex(roots[i]) % 12;
                if (possiblePitchClass == rootPitchClass) {
                    ok = true;
                    break;
                }
            }
        }
        if (ok) {
            element.scaleType = scaleType;
        }
    }

    modifyHarmonyElement(index, elements, module) {
        const element = elements[index];

        switch (element.scaleType) {
            case ScaleType.MAJOR:
                this.modify(index, elements, module, this.majorFromRoots, this.majorRoots, this.majorNewScaleTypes[index % this.majorNewScaleTypes.length]);
                break;
            case ScaleType.NATURAL_MINOR:
                this.modify(index, elements, module, this.minorFromRoots, this.minorRoots, this.minorNewScaleTypes[index % this.minorNewScaleTypes.length]);
                break;
        }
    }

    modifyConstantHarmonyElements(elements, module) {
        const result = copyValueDeep(elements);

        const active = getValueOrExpressionValue(this, "active", module);
        if (!active) {
            return result;
        }

        const changedIndices = {};
        for (var i=0; i<this.indexRanges.length; i++) {
            if (!changedIndices[i]) {
                this.modifyHarmonyElement(i, result, module);
                changedIndices[i] = true;
            }
        }
        for (var i=0; i<elements.length; i++) {
            const modify = getItemFromArrayWithStartEndItems(0, this.modifyPattern, elements.length, i, this.startModifyPattern, this.endModifyPattern);
            if (modify != 0 && !changedIndices[i]) {
                this.modifyHarmonyElement(i, result, module);
                changedIndices[i] = true;
            }
        }
        return result;
    }
}





