

class Motif {
    constructor() {
        this.id = "";
        this.motifElements = [];
        this.motifZones = [];
        this.modifiers = [];
        this.rythmBased = false;
        this.rythm = "";
        //    this.inherits = false;
        this.inheritedMotif = "";
        this.seed = 12345;
        this.useExternalSeed = false;

        this._constructorName = "Motif";
    }

    toString(options) {
        var result = "{";
        result += "" + $.map(this.motifElements, function(o, i) {
            return o.toString(options);
        });
        result += "}";
        return result;
    }

    getConstantMotifElements(module, harmony, harmonyBeatOffset, visitedMotifs) {
        if (!visitedMotifs) {
            visitedMotifs = new Map(true);
        }
        var result = [];

        if (this.inheritedMotif) {
            var motif = module.getMotif(this.inheritedMotif);
            if (motif) {
                if (visitedMotifs.get(this)) {
                    // Inherit loop...
                    logit("Motif detected inherit loop...");
                } else {
                    // Make sure that we add ourself to the visited motifs
                    visitedMotifs.put(this, this);
                    var list = motif
                        .getConstantMotifElements(module, harmony, harmonyBeatOffset, visitedMotifs);

                    addAll(result, list);
                }
            }
        } else if (this.rythmBased) {
            var theRythm = module.getRythm(this.rythm);
            if (theRythm) {
                // Getting the note rythm elements
                var startHarmonyIndex = harmony.getHarmonyIndexAt(harmonyBeatOffset);
                //            var startHarmonyElement = harmony.get(startHarmonyIndex);
                var noteRythmElements = theRythm.getNoteRythmElements(module, harmony, harmonyBeatOffset);

                noteRythmElements = arrayCopyWithCopy(noteRythmElements);

                //            logit("Got note rythm elements: " + noteRythmElements + "<br />");
                // Create clusters for the zone elements
                var elementZones = [];
                var zoneElements = [];
                var rangeZoneElements = [];

                var currentPosition = 0;
                for (var j=0; j<noteRythmElements.length; j++) {
                    var rythmElement = noteRythmElements[j];
                    var elementBeatLength = positionUnitToBeats2(rythmElement.length, rythmElement.lengthUnit, harmonyBeatOffset, harmony);
                    rythmElement.length = elementBeatLength; // Use beats to simplify the rest of the processing
                    rythmElement.lengthUnit = PositionUnit.BEATS;

                    elementZones[j] = -1;
                    var harmonyIndex = harmony.getHarmonyIndexAt(currentPosition + harmonyBeatOffset);
                    var harmonyElement = harmony.get(harmonyIndex);

                    for (var i=0; i<this.motifZones.length; i++) {
                        if (!zoneElements[i]) {
                            zoneElements[i] = [];
                        }
                        if (!rangeZoneElements[i]) {
                            rangeZoneElements[i] = [];
                        }
                        var zone = this.motifZones[i];
                        if (zone.intersectsRange([currentPosition, currentPosition + elementBeatLength], harmony, harmonyBeatOffset)) {
                            rangeZoneElements[i].push(j);
                        }
                    }
                    for (var i=0; i<this.motifZones.length; i++) {
                        var zone = this.motifZones[i];
                        if (zone.containsPosition(currentPosition, harmony, harmonyBeatOffset)) {
                            zoneElements[i].push(j);
                            elementZones[j] = i;
                            break; // Each rythm element can only be part of one zone
                        }
                    }
                    currentPosition += elementBeatLength;
                }

                // Check if the zone can't be empty
                for (var i=0; i<this.motifZones.length; i++) {
                    var zone = this.motifZones[i];
                    if (zone.useNoteRangeIfEmpty && zoneElements[i].length == 0) {
                        // Get the rythm elements that haven't been taken yet
                        for (var j=0; j<rangeZoneElements[i].length; j++) {
                            var index = rangeZoneElements[i][j];
                            if (elementZones[index] == -1) {
                                // Not taken yet...
                                zoneElements[i].push(index);
                                elementZones[index] = i;
                                // logit("Using range in motif.js " + zoneElements);
                            }
                        }
                    }
                }

                //            logit("zone elements: " + JSON.stringify(zoneElements) + "<br />");
                //            logit("element zones: " + JSON.stringify(elementZones) + "<br />");

                var appliedZones = {};
                for (var j=0; j<noteRythmElements.length; j++) {
                    var rythmElement = noteRythmElements[j];
                    if (rythmElement.rest || elementZones[j] == -1) {
                        // Elements that have no zones become rests
                        var rest = new ConstantMotifElement();
                        rest.rest = true;
                        rest.length = rythmElement.length;
                        rest.lengthUnit = rythmElement.lengthUnit;
                        result.push(rest);
                    } else {
                        // Element has a zone and is not a rest
                        var zoneIndex = elementZones[j];
                        if (!appliedZones[zoneIndex]) {
                            var zone = this.motifZones[elementZones[j]];


                            var elementIndices = zoneElements[elementZones[j]];
                            var elements = [];
                            for (var k=0; k<elementIndices.length; k++) {
                                elements[k] = noteRythmElements[elementIndices[k]];
                            }
                            var zoneResult = zone.applyMotifZone(elements, module);
                            //                        logit("Applying zone " + zoneResult + "<br />");
                            addAll(result, zoneResult);
                            appliedZones[zoneIndex] = true;
                        }
                    }
                }


                // The result array should now contain the constant motif elements given by the zones

            } else {
                logit(" could not find rythm " + this.rythm);
            }

        } else {
            for (var i=0; i<this.motifElements.length; i++) {
                var e = this.motifElements[i];
                var list = e.getConstantMotifElements(module, harmony, harmonyBeatOffset, visitedMotifs);
                addAll(result, list);
            }
        }

        // Apply the modifiers
        for (var i=0; i<this.modifiers.length; i++) {
            var m = this.modifiers[i];
            result = m.apply(module, result);
        }

        return result;
    }

    addMotifElement(element) {
        this.motifElements.push(element);
        return this;
    }
}

class MotifElement {
    constructor() {
        this.id = "";
        this.length = 1;
        this.lengthUnit = PositionUnit.BEATS;
        this.strength = 1.0;
        this._constructorName = "MotifElement";
    }

    getConstantMotifElements(module, harmony, harmonyBeatOffset, visitedMotifs) {
        return [this];
    }

    toString(options) {
        var showLength = getValueOrDefault(options, "showLength", false);
        var showLengthUnit = getValueOrDefault(options, "showLength", false);

        var result = "";
        if (showLength) {
            result += "len:" + this.length + " ";
        }
        if (showLengthUnit) {
            result += "lu:" + this.lengthUnit + " ";
        }
        return result;
    }

    setLength(length) {
        this.length = length;
        return this;
    }

    setLengthUnit(lengthUnit) {
        this.lengthUnit = lengthUnit;
        return this;
    }

    getLength() {
        return this.length;
    }

    getLengthUnit() {
        return this.lengthUnit;
    }

    set(e) {
        MotifElement.set.call(this, e);
        e.length = this.length;
        e.lengthUnit = this.lengthUnit;
        e.strength = this.strength;
    }
}

class SimpleSequenceMotifElement extends MotifElement {
    constructor() {
        super();

        this.verticalOffsetPattern = [0];
        this.verticalOffsetPatternBorderMode = IndexBorderMode.RESTART;
        this.verticalOffsetType = OffsetType.SCALE;
        this.verticalRelativeType = VerticalRelativeType.VOICE_LINE;

        this.elementLengthPattern = [1];
        this.elementLengthPatternUnit = PositionUnit.BEATS;
        this.elementLengthPatternBorderMode = IndexBorderMode.RESTART;

        this.elementStrengthPattern = [1.0];
        this.elementStrengthPatternBorderMode = IndexBorderMode.RESTART;

        this.restPattern = [0];
        this.restPatternBorderMode = IndexBorderMode.RESTART;

        this.cutLast = true;

        this.minElementLength = 0;
        this.minElementLengthUnit = PositionUnit.BEATS;

        this._constructorName = "SimpleSequenceMotifElement";
    }

    getConstantMotifElements(module, harmony, harmonyBeatOffset, visitedMotifs) {
        var result = [];

        if (this.elementLengthPattern.length == 0) {
            return result;
        }

        var harmonyElement = harmony.getHarmonyAt(harmonyBeatOffset);

        var totalLength = positionUnitToBeats(this.length, this.lengthUnit, harmonyElement.tsNumerator, harmonyElement.tsDenominator, harmony);

        var minBeatLength = positionUnitToBeats(this.minElementLength, this.minElementLengthUnit, harmonyElement.tsNumerator, harmonyElement.tsDenominator, harmony);

        var index = 0;
        var currentPosition = 0;
        while (currentPosition < totalLength) {
            var realElementIndex = IndexBorderMode.getIndex(this.elementLengthPatternBorderMode, this.elementLengthPattern.length, index);
            if (realElementIndex == -1) {
                break;
            }
            var elementLength = this.elementLengthPattern[realElementIndex];
            var beatLength = positionUnitToBeats(elementLength, this.elementLengthPatternUnit,
                harmonyElement.tsNumerator, harmonyElement.tsDenominator, harmony);

            var rest = false;
            if (this.restPattern.length > 0) {
                var realRestIndex = IndexBorderMode.getIndex(this.restPatternBorderMode, this.restPattern.length, index);
                if (realRestIndex >= 0) {
                    rest = this.restPattern[realRestIndex] != 0;
                }
            }

            var offset = 0;
            if (this.verticalOffsetPattern.length > 0) {
                var realOffsetIndex = IndexBorderMode.getIndex(this.verticalOffsetPatternBorderMode,
                    this.verticalOffsetPattern.length, index);
                if (realOffsetIndex >= 0) {
                    offset = this.verticalOffsetPattern[realOffsetIndex];
                }
            }

            var isLast = false;
            if (currentPosition + beatLength > totalLength) {
                // cut or stop
                isLast = true;
                if (this.cutLast) {
                    beatLength = totalLength - currentPosition;
                } else {
                    rest = true;
                }
            }
            if (!isLast || beatLength >= minBeatLength) {
                var motifElement = new VerticalRelativeMotifElement().setLength(beatLength).setLengthUnit(PositionUnit.BEATS);
                motifElement.rest = rest;
                motifElement.index = offset;
                motifElement.relativeType = this.verticalRelativeType;
                motifElement.offsetType = this.verticalOffsetType;
                result.push(motifElement);
            }

            if (isLast) {
                break;
            }
            index++;
            currentPosition += beatLength;
        }
        return result;
    }
}


var FillerNoteLengthMode = {
    INDEPENDENT: 0,
    MATCH: 1
};


class FillerNote extends MotifElement {
    constructor() {
        super();
        this.positionOffset = 0.0;
        this.positionOffsetUnit = PositionUnit.BEATS;
        this.relativeType = VerticalRelativeType.NOTE;
        this.offsetType = OffsetType.CHORD;
        this.offset = 1;
        this.snapType = SnapType.NONE;
        this.lengthMode = FillerNoteLengthMode.INDEPENDENT;
        this._constructorName = "FillerNote";
    }

    copy() {
        var result = new FillerNote();
        MotifElement.prototype.set(this, result);
        result.positionOffset = this.positionOffset;
        result.positionOffsetUnit = this.positionOffsetUnit;
        result.relativeType = this.relativeType;
        result.offsetType = this.offsetType;
        result.offset = this.offset;
        return result;
    }

    getAbsoluteNote(refAbsNote, harmonyElement, voiceLineElement) {
        if (this.relativeType == VerticalRelativeType.NOTE) {
            // Keep the refAbsNote
        } else {
            refAbsNote = harmonyElement.getVerticalRelativeAbsoluteNote(this.relativeType, voiceLineElement);
        }
        refAbsNote = harmonyElement.offset(refAbsNote, this.offsetType, this.offset, harmonyElement);
        return harmonyElement.snap(refAbsNote, this.snapType, harmonyElement);
    }
}

class ConstantMotifElement extends MotifElement {
    constructor() {
        super();
        this.rest = false;
        this.fillers = [];
        this._constructorName = "ConstantMotifElement";
    }

    addFiller(f) {
        this.fillers.push(f);
        return this;
    }

    toString(options) {
        var result = MotifElement.prototype.toString.call(this, options);
        var strs = [];
        var showVelocity = getValueOrDefault(options, "showVelocity", false);
        var showRest = getValueOrDefault(options, "showRest", true);
        if (this.rest && showRest) {
            strs.push("R");
        }
        if (showVelocity) {
            strs.push("vel:" + this.strength);
        }
        return result + " " + strs;
    }

    set(e) {
        super.set(e);
        e.rest = this.rest;
        e.fillers = [];
        for (var i=0; i<this.fillers.length; i++) {
            e.fillers.push(this.fillers[i].copy());
        }
    }

    setRest(r) {
        this.rest = r;
        return this;
    }

    getBeatLength(numerator, denominator) {
        //    logit("calling getBeatLength() in cme with " + [this.length, this.lengthUnit, numerator, denominator] + "<br />");
        return positionUnitToBeats(this.length, this.lengthUnit, numerator, denominator);
    }
}

class VerticalRelativeMotifElement extends ConstantMotifElement {
    constructor() {
        super();
        this.index = 0;
        this.relativeType = VerticalRelativeType.VOICE_LINE;
        this.offsetType = OffsetType.SCALE;
        this.beforeOffsetSnapType = SnapType.NONE;
        this.afterOffsetSnapType = SnapType.NONE;
        this._constructorName = "VerticalRelativeMotifElement";
    }

    toString(options) {
        var result = ConstantMotifElement.prototype.toString.call(this, options);
        var strs = [];
        var showIndex = getValueOrDefault(options, "showIndex", true);
        var showRelativeType = getValueOrDefault(options, "showRelativeType", false);
        var showOffsetType = getValueOrDefault(options, "showOffsetType", false);
        var showBeforeOffsetSnapType = getValueOrDefault(options, "showBeforeOffsetSnapType", false);
        var showAfterOffsetSnapType = getValueOrDefault(options, "showAfterOffsetSnapType", false);
        var showLength = getValueOrDefault(options, "showAfterOffsetSnapType", true);
        if (showIndex) {
            strs.push("ind:" + this.index);
        }
        if (showRelativeType) {
            strs.push("rt:" + VerticalRelativeType.toString(this.relativeType));
        }
        if (showOffsetType) {
            strs.push("ot:" + OffsetType.toString(this.offsetType));
        }
        if (showLength) {
            strs.push("len:" + this.length);
        }
        return result + " " + strs;
    }

    setIndex(index) {
        this.index = index;
        return this;
    }

    setRelativeType(relativeType) {
        this.relativeType = relativeType;
        return this;
    }

    setOffsetType(offsetType) {
        this.offsetType = offsetType;
        return this;
    }

    setBeforeOffsetSnapType(type) {
        this.beforeOffsetSnapType = type;
        return this;
    }

    setAfterOffsetSnapType(type) {
        this.afterOffsetSnapType = type;
        return this;
    }

    copy() {
        var result = new VerticalRelativeMotifElement();
        super.set(result);
        result.index = this.index;
        result.relativeType = this.relativeType;
        result.offsetType = this.offsetType;
        result.beforeOffsetSnapType = this.beforeOffsetSnapType;
        result.afterOffsetSnapType = this.afterOffsetSnapType;
        return result;
    }
}

class ClusterableMotifElement extends ConstantMotifElement {
    constructor() {
        super();
        this.clusterPositionIndex = 0; // Just counting notes
        this.clusterPositionFraction = 0; // Between 0 and 1. Uses beat position within cluster
        this.clusterId = 0;
        this._constructorName = "ClusterableMotifElement";
    }

    set(e) {
        super.set(e);
        e.clusterPositionIndex = this.clusterPositionIndex;
        e.clusterPositionFraction = this.clusterPositionFraction;
        e.clusterId = this.clusterId;
    }
}

class HorizontalRelativeMotifElement extends ClusterableMotifElement {
    constructor() {
        super();
        this.index = 0;
        this.relativeType = HorizontalRelativeType.PREVIOUS_NOTE;
        this.offsetType = OffsetType.SCALE;
        this.beforeOffsetSnapType = SnapType.NONE;
        this.afterOffsetSnapType = SnapType.NONE;
        this._constructorName = "HorizontalRelativeMotifElement";
    }

    setIndex(index) {
        this.index = index;
        return this;
    }

    setRelativeType(relativeType) {
        this.relativeType = relativeType;
        return this;
    }

    setOffsetType(offsetType) {
        this.offsetType = offsetType;
        return this;
    }

    setBeforeOffsetSnapType(type) {
        this.beforeOffsetSnapType = type;
        return this;
    }

    setAfterOffsetSnapType(type) {
        this.afterOffsetSnapType = type;
        return this;
    }

    copy() {
        var result = new HorizontalRelativeMotifElement();
        super.set(result);
        result.index = this.index;
        result.relativeType = this.relativeType;
        result.offsetType = this.offsetType;
        result.beforeOffsetSnapType = this.beforeOffsetSnapType;
        result.afterOffsetSnapType = this.afterOffsetSnapType;
        return result;
    }
}



var AdaptiveVerticalDomainType = {
    ENUMERABLE: 0,
    RANGE: 1,
    CURVE: 2,

    toString: function(type) {
        switch (type) {
            case AdaptiveVerticalDomainType.ENUMERABLE:
                return "Enumerable";
            case AdaptiveVerticalDomainType.RANGE:
                return "Range";
            case AdaptiveVerticalDomainType.CURVE:
                return "Curve";
        }
        return "Unknown ad. vert. dom. type " + type;
    }

};
addPossibleValuesFunction(AdaptiveVerticalDomainType, AdaptiveVerticalDomainType.ENUMERABLE, AdaptiveVerticalDomainType.CURVE);


var AdaptiveHorizontalDomainType = {
    ENUMERABLE: 0,
    RANGE: 1,

    toString: function(type) {
        switch (type) {
            case AdaptiveHorizontalDomainType.ENUMERABLE:
                return "Enumerable";
            case AdaptiveHorizontalDomainType.RANGE:
                return "Range";
        }
        return "Unknown ad. horiz. dom. type " + type;
    }
};
addPossibleValuesFunction(AdaptiveHorizontalDomainType, AdaptiveHorizontalDomainType.ENUMERABLE, AdaptiveHorizontalDomainType.RANGE);


class AdaptiveMotifElement extends ClusterableMotifElement {
    constructor() {
        super();

        this.verticalDomainType = AdaptiveVerticalDomainType.RANGE;
        this.verticalRelativeType = VerticalRelativeType.VOICE_LINE;

        this.constantVerticalOffset = 0;
        this.constantVerticalOffsetType = OffsetType.HALF_STEP;

        this.verticalDomainOffsetType = OffsetType.SCALE;
        this.verticalDomainOffsetRange = [-15, 15];
        this.verticalDomainOffsetElements = [-1, 0, 1];
        this.verticalDomainOffsetElementLikelihoods = [1, 1, 1];
        this.verticalDomainCurve = "";
        this.verticalDomainCurveOffsetRange = [-1, 1]; // How far off the curve to go
        this.verticalDomainCurveOffsetLikelihoodMultiplier = 0.1; // What to multiply the likelihood when getting outside curve

        this.horizontalDomainTypes = [AdaptiveHorizontalDomainType.RANGE];
        this.horizontalRelativeTypes = [HorizontalRelativeType.PREVIOUS_NOTE];
        this.horizontalDomainOffsetTypes = [OffsetType.SCALE];
        this.horizontalDomainOffsetRanges = [[-2, 2]];
        this.horizontalDomainOffsetElements = [[-1, 0, 1]];
        this.horizontalDomainOffsetLikelihoods = [[1, 1, 1]];

        this._constructorName = "AdaptiveMotifElement";
    }

    setVerticalDomainType(a) {
        this.verticalDomainType = a;
        return this;
    }

    setVerticalRelativeType(a) {
        this.verticalRelativeType = a;
        return this;
    }

    setVerticalDomainOffsetType(a) {
        this.verticalDomainOffsetType = a;
        return this;
    }

    setVerticalDomainOffsetRange(a) {
        this.verticalDomainOffsetRange = a;
        return this;
    }

    setVerticalDomainOffsetElements(a) {
        this.verticalDomainOffsetElements = a;
        return this;
    }

    setVerticalDomainOffsetCurve(a) {
        this.verticalDomainOffsetCurve = a;
        return this;
    }

    setHorizontalDomainTypes(a) {
        this.horizontalDomainTypes = a;
        return this;
    }

    setHorizontalRelativeTypes(a) {
        this.horizontalRelativeTypes = a;
        return this;
    }

    setHorizontalDomainOffsetTypes(a) {
        this.horizontalDomainOffsetTypes = a;
        return this;
    }

    setHorizontalDomainOffsetRanges(a) {
        this.horizontalDomainOffsetRanges = a;
        return this;
    }

    setHorizontalDomainOffsetElements(a) {
        this.horizontalDomainOffsetElements = a;
        return this;
    }

    setHorizontalDomainOffsetLikelihoods(a) {
        this.horizontalDomainOffsetLikelihoods = a;
        return this;
    }
}

