
function applyHarmonyModifiers(elements, modifiers, module) {
    for (const modifier of modifiers) {
        elements = modifier.modifyConstantHarmonyElements(elements, module);
    }

    return elements;
}


class ConstantHarmonicRythm {
    constructor(harmonyElements) {
        this.harmonyElements = harmonyElements ? harmonyElements : [];
        this.modifiers = [];
        this._constructorName = "ConstantHarmonicRythm";
    }

    toRomanString() {
        let result = "[";
        let prevScaleBase = -1;
        let prevScaleType = -1;
        for (let i=0; i<this.harmonyElements.length; i++) {
            const e = this.harmonyElements[i];
            result += e.toRomanString();
            const baseNote = e.getBaseNote();
            const scaleType = e.getScaleType();
            if (baseNote != prevScaleBase || scaleType != prevScaleType) {
                result += `(${toPitchClassString(baseNote)} ${ScaleType.toString(scaleType)})`;
                prevScaleBase = baseNote;
                prevScaleType = scaleType;
            }
            if (i<this.harmonyElements.length - 1) {
                result += ", ";
            }
        }
        result += "]";
        return result;
    }

    getCount() {
        return this.harmonyElements.length;
    }

    get(index) {
        return this.harmonyElements[index];
    }

    getConstantHarmonyElements(module, beatOffset) {
        const result = [];

        for (const element of this.harmonyElements) {
            const list = element.getConstantHarmonyElements(module, beatOffset);
            addAll(result, list);
        }

        return applyHarmonyModifiers(result, this.modifiers, module);
    }

    getPhraseRanges() {
        const result = [];
        let prevStartIndex = 0;
        for (let i=0; i<this.getCount(); i++) {
            const he = this.get(i);
            if (he instanceof ConstantHarmonyElement) {
                if (he.startsPhrase && i > 0) {
                    result.push([prevStartIndex, i - 1]);
                    prevStartIndex = i;
                }
            }
        }
        result.push([prevStartIndex, this.getCount() - 1]);
        return result;
    }

    getPhraseRangeBeatLength(range) {
        let result = 0;
        for (let i=range[0]; i<=range[1]; i++) {
            const he = this.get(i);
            if (he instanceof ConstantHarmonyElement) {
                result += he.getBeatLength();
            } else {
                logit(`Please do not call getPhraseRangeBeatLength() on ${he._constructorName} <br />`);
            }
        }
        return result;
    }

    getPhraseRangeAt(beatTime) {
        const harmonyIndex = this.getHarmonyIndexAt(beatTime);
        const phraseRanges = this.getPhraseRanges();

        for (const range of phraseRanges) {
            if (range[0] <= harmonyIndex && harmonyIndex <= range[1]) {
                return [range[0], range[1]];
            }
        }

        return [0, this.getCount() - 1];
    }

    getHarmonyIndexAt(beatTime) {
        if (beatTime < 0.0) {
            return 0;
        }

        let result = this.harmonyElements.length - 1;
        let currentTime = 0.0;
        for (let i=0; i<this.harmonyElements.length; i++) {
            const e = this.harmonyElements[i];
            const beatLength = positionUnitToBeats(e.length, e.lengthUnit, e.tsNumerator, e.tsDenominator);

            if (beatTime >= currentTime && beatTime < currentTime + beatLength) {
                result = i;
                break;
            }
            currentTime += beatLength;
        }

        return result;
    }

    getHarmonyAt(beatTime) {
        return this.harmonyElements[this.getHarmonyIndexAt(beatTime)];
    }

    getBeatLengthUntilIndex(endIndex) {
        let result = 0.0;
        for (let i=0; i<Math.min(this.harmonyElements.length, endIndex); i++) {
            const e = this.harmonyElements[i];
            const beatLength = positionUnitToBeats(e.length, e.lengthUnit, e.tsNumerator, e.tsDenominator);
            result += beatLength;
        }
        return result;
    }

    getBeatLength() {
        let result = 0.0;

        for (const e of this.harmonyElements) {
            const beatLength = positionUnitToBeats(e.length, e.lengthUnit, e.tsNumerator, e.tsDenominator);
            result += beatLength;
        }

        return result;
    }
}


