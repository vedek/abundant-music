

class SuspAntStrategy {
    constructor() {
        this.id = "";
        this.voiceLines = [];
        
        this._constructorName = "SuspAntStrategy";
    }

    getNewLengthsSuspend(toIncreaseBeatLength, toDecreaseBeatLength, harmony, harmonyBeatOffset) {
        var newIncreasedBeatLength = toIncreaseBeatLength;
        var newDecreasedBeatLength = toDecreaseBeatLength;

        return [newIncreasedBeatLength, newDecreasedBeatLength];
    }

    getNewLengthsAnticipate(toIncreaseBeatLength, toDecreaseBeatLength, harmony, harmonyBeatOffset) {
        return this.getNewLengthsSuspend(toIncreaseBeatLength, toDecreaseBeatLength, harmony, harmonyBeatOffset);
    }

    changeLengths(incIndex, decIndex, suspend, harmony) {
        var toInc = harmony.get(incIndex);
        var toDec = harmony.get(decIndex);

        var incBeats = toInc.getBeatLength();
        var decBeats = toDec.getBeatLength();

        var newLengths = [];
        if (suspend) {
            newLengths = this.getNewLengthsSuspend(incBeats, decBeats, harmony, 0);
        } else {
            newLengths = this.getNewLengthsAnticipate(incBeats, decBeats, harmony, 0);
        }

        toInc.length = newLengths[0];
        toInc.lengthUnit = PositionUnit.BEATS;
        toDec.length = newLengths[1];
        toDec.lengthUnit = PositionUnit.BEATS;

    //    function strangeLength(l) {
    //        return l != 1 || l != 2 || l != 3 || l != 4 || l != 6 || l != 8;
    //    }
    //    if (strangeLength(toInc.length)) {
    //        logit("Strange length detected in toInc " + toInc.length);
    //    }
    //    if (strangeLength(toDec.length)) {
    //        logit("Strange length detected in toDec " + toDec.length);
    //    }

    }

    createVoiceLineHarmony(voiceLine, harmony, module) {
        //    logit("Entering voice line harmony " + voiceLine.size() + " <br />");
        for (var i=0; i<voiceLine.size(); i++) {
            var vle = voiceLine.get(i);
            if (vle.suspend) {
    //            logit("suspending " + i + ": " + arrayElementsPropertyToString(harmony.harmonyElements, "length").join(", ") + "<br /><br /><br />");
                harmony = this.suspend(i, harmony, module);
    //            logit("suspending result: " + arrayElementsPropertyToString(harmony.harmonyElements, "length").join(", ") + "<br /><br /><br />");
            } else if (vle.anticipate) {
                harmony = this.anticipate(i, harmony, module);
            }
        }
        return harmony;
    }

    suspend(index, harmony, module) {
        var result = harmony;

        // Can not suspend final harmony element
        if (index < result.getCount() - 1) {
            result = copyValueDeep(result);
            this.changeLengths(index, index + 1, true, result);
        }
        return result;
    }

    anticipate(index, harmony, module) {
        var result = harmony;

        // Can not anticipate the first harmony element
        if (index > 0) {
            result = copyValueDeep(result);
            this.changeLengths(index, index - 1, false, result);
        }
        return result;
    }
}

class SimpleSuspAntStrategy extends SuspAntStrategy {
    constructor() {
        super();
        this.possibleLengthIncrements = [1];
        this.possibleLengthIncrementUnit = PositionUnit.BEATS;

        this.possibleNewLengths = [1, 2, 3, 4, 6, 8];

        this.minLength = 1;
        this.minLengthUnit = PositionUnit.BEATS;

        this._constructorName = "SimpleSuspAntStrategy";
    }

    getNewLengthsSuspend(toIncreaseBeatLength, toDecreaseBeatLength, harmony, harmonyBeatOffset) {
        var newIncreasedBeatLength = toIncreaseBeatLength;
        var newDecreasedBeatLength = toDecreaseBeatLength;

        var minBeatLength = positionUnitToBeats2(this.minLength, this.minLengthUnit, harmonyBeatOffset, harmony);

        for (var i=0; i<this.possibleLengthIncrements.length; i++) {
            var testLength = this.possibleLengthIncrements[i];
            var testBeats = positionUnitToBeats2(testLength, this.possibleLengthIncrementUnit, harmonyBeatOffset, harmony);

            if (!arrayContains(this.possibleNewLengths, toDecreaseBeatLength - testBeats)) {
                continue;
            }
            if (!arrayContains(this.possibleNewLengths, toIncreaseBeatLength + testBeats)) {
                continue;
            }

            if (toDecreaseBeatLength - testBeats >= minBeatLength) {
                newDecreasedBeatLength -= testBeats;
                newIncreasedBeatLength += testBeats;
                break;
            }

        }
        return [newIncreasedBeatLength, newDecreasedBeatLength];
    }
}
