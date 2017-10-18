
const SplitStrategy = {
    NEVER: 0,
    HALVE: 1,
    DOT_FIRST: 2,
    DOT_SECOND: 3,
    TRIPLET: 4,
    DOT_NORMAL_DOT: 5,
    NORMAL_DOT_DOT: 6,
    DOT_DOT_NORMAL: 7,
    toString: function(s) {
        switch (s) {
            case SplitStrategy.DOT_DOT_NORMAL:
                return "Dot dot normal";
            case SplitStrategy.DOT_FIRST:
                return "Dot first";
            case SplitStrategy.DOT_NORMAL_DOT:
                return "Dot normal dot";
            case SplitStrategy.DOT_SECOND:
                return "Dot second";
            case SplitStrategy.HALVE:
                return "Halve";
            case SplitStrategy.NEVER:
                return "Never";
            case SplitStrategy.NORMAL_DOT_DOT:
                return "Normal dot dot";
            case SplitStrategy.TRIPLET:
                return "Triplet";
        }
        return "Unknown strategy " + s;
    }
};
addPossibleValuesFunction(SplitStrategy, SplitStrategy.NEVER, SplitStrategy.DOT_DOT_NORMAL);

const DottedSplitStrategy = {
    NEVER: 0,
    LONGEST_FIRST: 1,
    LONGEST_LAST: 2,
    TWO_DOTTED: 3,

    toString: function(s) {
        switch (s) {
            case DottedSplitStrategy.LONGEST_FIRST:
                return "Longest first";
            case DottedSplitStrategy.LONGEST_LAST:
                return "Longest last";
            case DottedSplitStrategy.NEVER:
                return "Never";
            case DottedSplitStrategy.TWO_DOTTED:
                return "Two dotted";
        }
        return "Unknown strategy " + s;
    }
};
addPossibleValuesFunction(DottedSplitStrategy, DottedSplitStrategy.NEVER, DottedSplitStrategy.TWO_DOTTED);

const TripletSplitStrategy = {
    NEVER: 0,
    HALVE: 1,

    toString: function(s) {
        switch (s) {
            case TripletSplitStrategy.HALVE:
                return "Halve";
            case TripletSplitStrategy.NEVER:
                return "Never";
        }
        return "Unknown strategy " + s;
    }
};
addPossibleValuesFunction(TripletSplitStrategy, TripletSplitStrategy.NEVER, TripletSplitStrategy.HALVE);


class SplitZone {
    constructor() {
        this.id = "";
        this.noteLengthInterval = [0, 16];
        this.noteLengthIntervalUnit = PositionUnit.BEATS;
        this.splitStrategy = SplitStrategy.HALVE;
        this.dottedSplitStrategy = DottedSplitStrategy.LONGEST_FIRST;
        this.tripletSplitStrategy = TripletSplitStrategy.HALVE;
        this.velocityMultipliers = [1.0, 0.95];
        this.dottedVelocityMultipliers = [1.0, 0.95];
        this.tripletVelocityMultipliers = [1.0, 0.97, 0.95];
        this.likelihood = 1.0;
        this.iterationInterval = [0, 128]; // The algorithm's iteraton during splitting
        this.positionInterval = [0.0, 1.0];
        this.positionIntervalUnit = PositionUnit.MEASURES;
        this.noteCountInterval = [0, 128];
        this.keepPattern = [1];
        this.maxApplications = 128;
        this._constructorName = "SplitZone";
    }

    applicable(toSplit, beatIntensity, iteration, numerator, denominator, beatPosition) {
        const length = positionUnitToBeats(toSplit.length, toSplit.lengthUnit, numerator, denominator);

        const lowerLength = positionUnitToBeats(this.noteLengthInterval[0], this.noteLengthIntervalUnit, numerator, denominator);
        const upperLength = positionUnitToBeats(this.noteLengthInterval[1], this.noteLengthIntervalUnit, numerator, denominator);

        // Verifying note length
        let ok = length >= lowerLength && length <= upperLength;

        // Verifying note position
        if (ok) {
            const lowerPosition = positionUnitToBeats(this.positionInterval[0], this.positionIntervalUnit, numerator, denominator);
            const upperPosition = positionUnitToBeats(this.positionInterval[1], this.positionIntervalUnit, numerator, denominator);
            ok = beatPosition >= lowerPosition && beatPosition <= upperPosition;
        }

        if (ok) {
            // Verifying note count
            ok = beatIntensity >= this.noteCountInterval[0] && beatIntensity <= this.noteCountInterval[1];
        }
        if (ok) {
            // Verifying iteration
            ok = iteration >= this.iterationInterval[0] && iteration <= this.iterationInterval[1];
        }

        //    logit("Testing applicable pos: " + beatPosition +
        //        " ok: " + ok +
        //        " <br />");

        return ok;
    }

    setNoteLengthInterval(v) {
        this.noteLengthInterval = v;
        return this;
    }

    setNoteLengthIntervalUnit(v) {
        this.noteLengthIntervalUnit = v;
        return this;
    }

    setSplitStrategy(v) {
        this.splitStrategy = v;
        return this;
    }

    setDottedSplitStrategy(v) {
        this.dottedSplitStrategy = v;
        return this;
    }

    setTripletSplitStrategy(v) {
        this.tripletSplitStrategy = v;
        return this;
    }

    setPositionInterval(v) {
        this.positionInterval = v;
        return this;
    }

    setPositionIntervalUnit(v) {
        this.positionIntervalUnit = v;
        return this;
    }
}

class SplitZoneCollection {
    constructor() {
        this.id = "";
        this.minLength = 0.25;
        this.minLengthUnit = PositionUnit.BEATS;
        this.zones = [];
        this.defaultSplitStrategy = SplitStrategy.HALVE;
        this.defaultDottedSplitStrategy = DottedSplitStrategy.LONGEST_FIRST;
        this.defaultTripletSplitStrategy = TripletSplitStrategy.HALVE;

        this.defaultVelocityMultipliers = [1.0, 0.95];
        this.defaultDottedVelocityMultipliers = [1.0, 0.95];
        this.defaultTripletVelocityMultipliers = [1.0, 0.97, 0.95];

        this.tryHalveIfStrategyFails = true;
        this.seed = 12345;
        this._constructorName = "SplitZoneCollection";
    }

    addSplitZone(zone) {
        this.zones.push(zone);
        return this;
    }

    splitAndCopy(
        minLengthTicks,
        bestSplitIndex,
        current,
        velocityMultipliers,
        notes,
        numerator,
        denominator
    ) {
        for (var i = 0; i < notes.length; i++) {
            const ticks = positionUnitToBeats(notes[i].length, notes[i].lengthUnit, numerator, denominator);
            if (ticks < minLengthTicks) {
                return null;
            }
        }
        const result = [];

        for (var i = 0; i < current.length; i++) {
            const currentNote = current[i];
            const velocity = currentNote.strength;
            if (i == bestSplitIndex) {
                for (let j = 0; j < notes.length; j++) {
                    const nl = notes[j];
                    let velMult = 1.0;
                    if (velocityMultipliers
                        && velocityMultipliers.length > 0) {
                        velMult = velocityMultipliers[j
                        % velocityMultipliers.length];
                    }
                    nl.strength = velocity * velMult;

    //                logit("Setting strength to " + velocity + " * " + velMult);

                    result.push(nl);
                }
            } else {
                result.push(currentNote);
            }
        }
        return result;
    }

    split(
        splitStrategy,
        dottedSplitStrategy,
        tripletSplitStrategy,
        minLengthTicks,
        bestSplitIndex,
        input,
        velocityMultipliers,
        dottedVelocityMultipliers,
        tripletVelocityMultipliers,
        numerator,
        denominator
    ) {

        const note = input[bestSplitIndex];

        let newLengthMultipliers = [];
        let newLengthTypes = [NoteRythmElementLengthType.NORMAL];
        let theVelocityMultipliers = velocityMultipliers;

        switch (note.lengthType) {
            case NoteRythmElementLengthType.NORMAL:
                theVelocityMultipliers = velocityMultipliers;
                switch (splitStrategy) {
                    case SplitStrategy.HALVE:
                        newLengthMultipliers = [0.5, 0.5];
                        newLengthTypes = [NoteRythmElementLengthType.NORMAL];
                        break;
                    case SplitStrategy.DOT_FIRST:
                        newLengthMultipliers = [0.75, 0.25];
                        newLengthTypes = [NoteRythmElementLengthType.DOT, NoteRythmElementLengthType.NORMAL];
                        break;
                    case SplitStrategy.DOT_DOT_NORMAL:
                        newLengthMultipliers = [0.375, 0.375, 0.25];
                        newLengthTypes = [NoteRythmElementLengthType.DOT, NoteRythmElementLengthType.DOT, NoteRythmElementLengthType.NORMAL];
                        break;
                    case SplitStrategy.DOT_NORMAL_DOT:
                        newLengthMultipliers = [0.375, 0.25, 0.375];
                        newLengthTypes = [NoteRythmElementLengthType.DOT, NoteRythmElementLengthType.NORMAL, NoteRythmElementLengthType.DOT];
                        break;
                    case SplitStrategy.NORMAL_DOT_DOT:
                        newLengthMultipliers = [0.25, 0.375, 0.375];
                        newLengthTypes = [NoteRythmElementLengthType.NORMAL, NoteRythmElementLengthType.DOT, NoteRythmElementLengthType.DOT];
                        break;
                    case SplitStrategy.DOT_SECOND:
                        newLengthMultipliers = [0.25, 0.75];
                        newLengthTypes = [NoteRythmElementLengthType.NORMAL, NoteRythmElementLengthType.DOT];
                        break;
                    case SplitStrategy.TRIPLET:
                        newLengthMultipliers = [1/3.0, 1/3.0, 1/3.0];
                        newLengthTypes = [NoteRythmElementLengthType.TRIPLET, NoteRythmElementLengthType.TRIPLET, NoteRythmElementLengthType.TRIPLET];
                        break;
                    case SplitStrategy.NEVER:
                        return null;
                }
                break;
            case NoteRythmElementLengthType.TRIPLET:
                theVelocityMultipliers = tripletVelocityMultipliers;
                switch (tripletSplitStrategy) {
                    case TripletSplitStrategy.HALVE:
                        newLengthMultipliers = [0.5, 0.5];
                        newLengthTypes = [NoteRythmElementLengthType.TRIPLET, NoteRythmElementLengthType.TRIPLET];
                        break;
                    case TripletSplitStrategy.NEVER:
                        return null;
                }
                break;
            case NoteRythmElementLengthType.DOT:
                theVelocityMultipliers = dottedVelocityMultipliers;
                switch (dottedSplitStrategy) {
                    case DottedSplitStrategy.LONGEST_FIRST:
                        newLengthMultipliers = [2.0 / 3.0, 1.0 / 3.0];
                        newLengthTypes = [NoteRythmElementLengthType.NORMAL, NoteRythmElementLengthType.NORMAL];
                        break;
                    case DottedSplitStrategy.LONGEST_LAST:
                        newLengthMultipliers = [1.0 / 3.0, 2.0 / 3.0];
                        newLengthTypes = [NoteRythmElementLengthType.NORMAL, NoteRythmElementLengthType.NORMAL];
                        break;
                    case DottedSplitStrategy.TWO_DOTTED:
                        newLengthMultipliers = [0.5, 0.5];
                        newLengthTypes = [NoteRythmElementLengthType.DOT, NoteRythmElementLengthType.DOT];
                        break;
                    case DottedSplitStrategy.NEVER:
                        return null;
                }
                break;
        }

        const newNotes = [];
        for (let i=0; i<newLengthMultipliers.length; i++) {
            const mult = newLengthMultipliers[i];
            newNotes.push(note.copy().setLength(note.length * mult).setLengthType(newLengthTypes[i % newLengthTypes.length]));
        }
        return this.splitAndCopy(minLengthTicks, bestSplitIndex, input, theVelocityMultipliers,
            newNotes,
            numerator, denominator)
    }

    getSplitBeat(module, start, noteCount, density, numerator, denominator) {

        let currentBeat = start;
        let previousSize = start.length;
        if (start.length >= noteCount) {
            return currentBeat;
        }
        let iteration = 0;

        const applicationMap = new Map();
        while (true) {
            const next = this.singleSplit(module, density,
                currentBeat,
                noteCount, numerator, denominator, iteration, applicationMap);
            iteration++;
            // System.out.println("current beat: " + next);
            if (next == null) {
                break;
            } else {
                currentBeat = next;
                if (currentBeat.length >= noteCount
                    || currentBeat.length == previousSize) {
                    break;
                } else {
                    previousSize = currentBeat.length;
                }
            }
        }
        return currentBeat;
    }

    getBestSplitIndex(module, input, density, numerator, denominator) {

        const minLengthBeats = positionUnitToBeats(this.minLength, this.minLengthUnit, numerator, denominator);

    //    logit("Min length beats " + minLengthBeats + " minLength: " + this.minLength);

        const noteCount = input.length;
        // The intensity determines what is over and under 0.5 in the function

        // Mean note length = 1 / beatIntensity
        let totalTicksLength = 0.0;
        for (var i=0; i<input.length; i++) {
            const noteRythmElement = input[i];
            totalTicksLength += positionUnitToBeats(noteRythmElement.length, noteRythmElement.lengthUnit, numerator, denominator);
        }

        const meanNoteLength = totalTicksLength / noteCount;

        // When the function is 1.0, the note length should be half the size of
        // the meanNoteLength,
        // when the function is -1.0, the note length should be double the size
        // of meanNoteLength

        let minDecreaseFraction = 999999999.9;
        let bestIndex = 0;

        let currentPosition = 0;
        for (var i = 0; i < input.length; i++) {
            const note = input[i];
            const beatLength = positionUnitToBeats(note.length, note.lengthUnit, numerator, denominator);

            if (beatLength > minLengthBeats * 1.0001) {
                const fraction = currentPosition / totalTicksLength;
                const wantedDensityFactor = density
                .getValue(module, fraction);

                const wantedNoteLength = meanNoteLength
                / Math.pow(2.0, wantedDensityFactor);
                const decreaseFraction = wantedNoteLength / beatLength;
                if (decreaseFraction < minDecreaseFraction) {
                    minDecreaseFraction = decreaseFraction;
                    bestIndex = i;
                }
    //            logit("density factor " + wantedDensityFactor + " " + fraction + " <br />");
            }
            currentPosition += beatLength;
        }
        

        return bestIndex;
    }

    singleSplit(
        module,
        density,
        input,
        beatIntensity,
        numerator,
        denominator,
        iteration,
        applicationMap
    ) {
        let result = null;
        // int bestSplitIndex = currentNode.getBestSplitIndex(density,
        // min_length);
        const minLengthTicks = positionUnitToBeats(this.minLength, this.minLengthUnit, numerator, denominator);

        const bestSplitIndex = this.getBestSplitIndex(module, input, density);
        // Now we know which note to split
        const toSplit = input[bestSplitIndex];

        let beatPosition = 0.0;
        // We also want to know what tick that note is
        for (var i = 0; i < bestSplitIndex; i++) {
            beatPosition += positionUnitToBeats(input[i].length, input[i].lengthUnit, numerator, denominator);
        }
        // Use the center tick
        beatPosition += 0.5 * positionUnitToBeats(input[bestSplitIndex].length, input[bestSplitIndex].lengthUnit, numerator, denominator);

        const applicable = [];
        for (var i=0; i<this.zones.length; i++) {
            const z = this.zones[i];
            var applications = applicationMap.get(z);
            if (typeof(applications) === 'undefined') {
                applications = 0;
                applicationMap.put(z, applications);
            }
            const ok = applications < z.maxApplications;
    //        if (!ok) {
    //            logit(applications + ", " + z.maxApplications);
    //        }
            if (ok && z.applicable(toSplit, beatIntensity, iteration, numerator, denominator, beatPosition)) {
                applicable.push(z);
            }
        }

        if (applicable.length == 0) {
            // Use default strategy

            result = this.split(this.defaultSplitStrategy,
                this.defaultDottedSplitStrategy,
                this.defaultTripletSplitStrategy, minLengthTicks,
                bestSplitIndex, input,
                this.defaultVelocityMultipliers,
                this.defaultDottedVelocityMultipliers,
                this.defaultTripletVelocityMultipliers,
                numerator, denominator);
        } else {
            if (applicable.length > 0) {
                let zone = null;
                if (applicable.length > 1) {
                    const likelihoods = [];
                    for (var i = 0; i < likelihoods.length; i++) {
                        likelihoods[i] = applicable[i].likelihood;
                    }
                    if (this.rnd == null) {
                        this.rnd = new MersenneTwister(this.seed);
                    }
                    const index = sampleIndexIntegerDistribution(
                        this.rnd, getProbabilityDistribution(likelihoods));
                    zone = applicable[index];
                } else {
                    // No need to sample
                    zone = applicable[0];
                }
                var applications = applicationMap.get(zone);
                applications++;
                applicationMap.put(zone, applications);

                const splitStrategy = getValueOrExpressionValue(zone, "splitStrategy", module);

    //            function getBeatLengths(arr) {
    //                var result = [];
    //                for (var k =0; k<arr.length; k++) {
    //                    result[k] = arr[k].length;
    //                }
    //                return result;
    //            }

    //            if (zone.verbose) {
    //                logit(" split zone using " + splitStrategy + " on " + getBeatLengths(input).join(", "));
    //            }

                result = this.split(splitStrategy,
                    zone.dottedSplitStrategy,
                    zone.tripletSplitStrategy, minLengthTicks,
                    bestSplitIndex, input,
                    zone.velocityMultipliers,
                    zone.dottedVelocityMultipliers,
                    zone.tripletVelocityMultipliers,
                    numerator, denominator);
            } else {
                // Use default strategy
                result = this.split(
                    this.defaultSplitStrategy, this.defaultDottedSplitStrategy,
                    this.defaultTripletSplitStrategy, minLengthTicks,
                    bestSplitIndex, input,
                    this.defaultVelocityMultipliers,

                    numerator, denominator);
            }
        }

        if (result == null && this.tryHalveIfStrategyFails) {
            result = this.split(SplitStrategy.HALVE,
                DottedSplitStrategy.TWO_DOTTED,
                TripletSplitStrategy.HALVE, minLengthTicks,
                bestSplitIndex, input,
                this.defaultVelocityMultipliers,
                this.defaultDottedVelocityMultipliers,
                this.defaultTripletVelocityMultipliers,
                numerator, denominator);
        }

        return result;
    }
}

