

class RenderLine {
    constructor() {
        this.id = "renderLine";
        this.activated = true;
        this._constructorName = "RenderLine";
    }

    renderBatch(state) {
        const activated = getValueOrExpressionValue(this, "activated", state.module);
        if (activated) {
            const lines = this.getPrimitiveRenderLines(state.module, state.constantHarmony);

            // Insert render line planning here...

            const allElements = [];
            const allChannels = [];

            for (let j=0; j<lines.length; j++) {
                const renderLine = lines[j];
                const renderChannel = state.module.getRenderChannel(renderLine.channel);
                if (!renderChannel) {
                    logit(" could not find render channel " + renderLine.channel);
                    continue;
                }
                const elements = renderLine.getPositionedRenderElements(state.module, state.constantHarmony, 0, state);
                for (let i=0; i<elements.length; i++) {
                    allChannels.push(renderChannel);
                }
                addAll(allElements, elements);
            }

            // Insert render element planning here...

            for (let i=0; i<allElements.length; i++) {
                const e = allElements[i];
                state.renderChannel = allChannels[i];
                e.renderBatch(state);
            }
        }
    }

    getPrimitiveRenderLines(module, harmony) {
        return [this];
    }

    getPositionedRenderElements(module, harmony, beatOffset, state) {
        const result = [];
        const activated = getValueOrExpressionValue(this, "activated", module);
        if (activated) {
            const lines = this.getPrimitiveRenderLines(module, harmony);
            for (let j=0; j<lines.length; j++) {
                const elements = lines[j].renderElements;
                for (let i=0; i<elements.length; i++) {
                    const e = elements[i];
                    const pe = e.getPositionedRenderElements(module, harmony, beatOffset, state);
                    addAll(result, pe)
                }
            }
        }
        return result;
    }
}

class PrimitiveRenderLine extends RenderLine {
    constructor() {
        super();
        this.channel = "";
        this.renderElements = [];
        this._constructorName = "PrimitiveRenderLine";
    }

    addRenderElement(e) {
        this.renderElements.push(e);
        return this;
    }
}


const RenderElementCutHarmonyMode = {
    //
    STOP: 0, // Stop rendering
    CONTINUE_ADAPT: 1, // Continue rendering
    CONTINUE_SAME: 2, // Continue rendering with the same harmony as the start
    toString: function(type) {
        switch (type) {
            case RenderElementCutHarmonyMode.STOP:
                return "Stop";
            case RenderElementCutHarmonyMode.CONTINUE_ADAPT:
                return "Continue adapt";
            case RenderElementCutHarmonyMode.CONTINUE_SAME:
                return "Continue same";
        }
        return "Unknown cut mode " + type;
    }

};
addPossibleValuesFunction(RenderElementCutHarmonyMode, RenderElementCutHarmonyMode.STOP, RenderElementCutHarmonyMode.CONTINUE_SAME);


const NoteOverlapHarmonyMode = {
    //
    SPLIT_REMOVE: 0, // Make the note shorter
    CONTINUE: 1, // Continue the note unchanged
    SPLIT_SNAP: 2, // Split the note and snap the rest of the note
    CONTINUE_OR_SPLIT_SNAP: 3, // Continue if the note is the same as before the snap
    toString: function(type) {
        switch (type) {
            case NoteOverlapHarmonyMode.CONTINUE:
                return "Continue";
            case NoteOverlapHarmonyMode.SPLIT_REMOVE:
                return "Split Remove";
            case NoteOverlapHarmonyMode.SPLIT_SNAP:
                return "Split Snap";
            case NoteOverlapHarmonyMode.CONTINUE_OR_SPLIT_SNAP:
                return "Continue or split snap";
        }
        return "Unknown overlap mode " + type;
    }
};
addPossibleValuesFunction(NoteOverlapHarmonyMode, NoteOverlapHarmonyMode.SPLIT_REMOVE, NoteOverlapHarmonyMode.CONTINUE_OR_SPLIT_SNAP);



class RenderElement {
    constructor() {
        this.id = "";
        this.channel = "";
        this.activated = true;

        this._constructorName = "RenderElement";
    }

    copy() {
        return copyObjectDeep(this, null);
    }

    getPositionedRenderElements(module, harmony, beatOffset, state) {
        const activated = getValueOrExpressionValue(this, "activated", module);
        if (activated) {
            if (this instanceof PositionedRenderElement) {
                if (beatOffset != 0) {
                    const result = this.copy();
                    if (result._constructorName == this._constructorName) {
                        const he = harmony.get(0);
                        result.startTime = positionUnitToBeats(result.startTime, result.startTimeUnit,
                            he.tsNumerator, he.tsDenominator, harmony) + beatOffset;
                        result.startTimeUnit = PositionUnit.BEATS;
                        return [result];
                    } else {
                        logit("Probably missing copy() for " + this._constructorName + "<br />");
                    }
                }
                return [this];
            } else {
                logit("Forgot to implement getPositionedRenderElements() in render element?")
            }
        } else {
            return [];
        }
    }

    renderBatch(state) {
        logit("Forgot to implement renderBatch() in render element? " + this._constructorName);
    }
}

class PositionedRenderElement extends RenderElement {
    constructor() {
        super();
        this.startTime = 0;
        this.startTimeUnit = PositionUnit.BEATS;

        this.maxLength = 1024;
        this.maxLengthUnit = PositionUnit.BEATS;

        this.renderOffset = 0; // An extra "write"-pointer offset that does not influence the harmony
        this.renderOffsetUnit = PositionUnit.BEATS;

        this._constructorName = "PositionedRenderElement";
    }
}

class ZonesRenderElement extends PositionedRenderElement {
    constructor() {
        super();

        this.useDefaultIfNoneApplicable = true;
        this.defaultZoneIndices = [0];
        this.zones = [];
        this._constructorName = "ZonesRenderElement";
    }

    getPositionedRenderElements(module, harmony, beatOffset, state) {
        const result = [];

        const activated = getValueOrExpressionValue(this, "activated", module);

        if (activated) {

            // Three possible ways to select zone:
            // * sample
            // * most specific
            // * first match
            const renderedMutexes = {};

            let renderedSomething = false;
            for (let i=0; i<this.zones.length; i++) {
                let z = this.zones[i];
                const mut = renderedMutexes[z.mutexClassIndex];
                if (!mut && z.applicable(module, harmony)) {
                    let list = z.getPositionedRenderElements(module, harmony, beatOffset, state);
                    addAll(result, list);
                    renderedMutexes[z.mutexClassIndex] = true;
                    renderedSomething = true;
                    break;
                }
            }
            if (!renderedSomething && this.useDefaultIfNoneApplicable && this.zones.length > 0) {
                for (let i=0; i<this.defaultZoneIndices.length; i++) {
                    const defaultZoneIndex = this.defaultZoneIndices[i];
                    let z = this.zones[defaultZoneIndex % this.zones.length];
                    let list = z.getPositionedRenderElements(module, harmony, beatOffset, state);
                    addAll(result, list);
                }
            }
        }
        return result;
    }
}

class RenderElementZone {
    constructor() {
        this.id = "";
        this.mutexClassIndex = 0; // Possible with more zones
        this._constructorName = "RenderElementZone";
    }

    applicable(module, harmony) {
        return true;
    }
}

class HarmonyCountRenderElementZone extends RenderElementZone {
    constructor() {
        super();

        this.onePerHarmonyIndex = false;

        this.harmonyCounts = [];
        this.harmonyCountDividers = [];

        this.renderElements = [];

        this._constructorName = "HarmonyCountRenderElementZone";
    }

    applicable(module, harmony) {
        const harmonyCount = harmony.getCount();

        for (let i=0; i<this.harmonyCounts.length; i++) {
            const count = this.harmonyCounts[i];
            if (count == harmonyCount) {
                return true;
            }
        }

        for (let i=0; i<this.harmonyCountDividers.length; i++) {
            const divider = this.harmonyCountDividers[i];
            if ((harmonyCount % divider) == 0) {
                return true;
            }
        }

        return false;
    }

    getPositionedRenderElements(module, harmony, beatOffset, state) {
        const result = [];

        //    let startBeat = positionUnitToBeats(this.startTime, this.startTimeUnit, numerator, denominator, harmony);

        for (let i=0; i<this.renderElements.length; i++) {
            const re = this.renderElements[i];
            let currentBeat = beatOffset;
            if (this.onePerHarmonyIndex) {
                for (let j=0; j<harmony.getCount(); j++) {
                    let list = re.getPositionedRenderElements(module, harmony, currentBeat, state);
                    list = arrayCopyWithCopy(list);
                    addAll(result, list);
                    const he = harmony.get(j);
                    currentBeat += positionUnitToBeats(he.length, he.lengthUnit, he.tsNumerator, he.tsDenominator, harmony);
                }
            } else {
                let list = re.getPositionedRenderElements(module, harmony, currentBeat, state);
                list = arrayCopyWithCopy(list);
                addAll(result, list);
            }
        }
        return result;
    }
}

class PhraseStructureRenderElement extends PositionedRenderElement {
    constructor() {
        super();

        this.renderElements = [];
        this.startRenderElements = [];
        this.endRenderElements = [];
        this._constructorName = "PhraseStructureRenderElement";
    }

    getPositionedRenderElements(module, harmony, beatOffset, state) {
        const result = [];

        const phraseRanges = harmony.getPhraseRanges();

    //    if (this.verbose) {
    //        logit(this._constructorName + " " + harmony.get(0).tsNumerator + " " + state.constantHarmony.get(0).tsNumerator);
    //    }
        let currentBeat = beatOffset;
        // logit(this._constructorName + " Rending at phrase ranges " + JSON.stringify(phraseRanges) + " " + harmony.getBeatLength());
        for (let i=0; i<phraseRanges.length; i++) {
            const range = phraseRanges[i];

    //        if (this.verbose) {
    //            logit("Rending at phrase range " + JSON.stringify(range));
    //        }
            const renderElement = getItemFromArrayWithStartEndItems(null, this.renderElements, phraseRanges.length, i, this.startRenderElements, this.endRenderElements);

            const phraseBeatLength = harmony.getPhraseRangeBeatLength(range);

            if (renderElement != null) {
                const copy = copyObjectDeep(renderElement);
                copy.maxLength = phraseBeatLength;
                const tempResult = copy.getPositionedRenderElements(module, harmony, currentBeat, state);
                addAll(result, tempResult);
            }

            currentBeat += phraseBeatLength;
        }
        return result;
    }
}

// Renders a motif at every harmony element
class AbstractHarmonyIndexPatternMotifRenderElement extends PositionedRenderElement {
    constructor() {
        super();

        this.useVoiceLine = true;

        // relativeType, offset and offsetType are used when useVoiceLine is false
        this.relativeType = VerticalRelativeType.SCALE_BASE;
        this.offsets = [0];
        this.offsetType = OffsetType.SCALE;
        this.startOffsets = [];
        this.endOffsets = [];

        this.count = 1;
        this.countUnit = CountUnit.HARMONY_ELEMENT_COUNT;

        this.clampAtHarmonyEnd = true;
        this.clampAtPhraseEnd = false;

        this.voiceLine = "";

        this.seeds = [12345];
        this.startSeeds = [];
        this.endSeeds = [];

        this.cutHarmonyMode = RenderElementCutHarmonyMode.STOP;
        this.noteOverlapHarmonyMode = NoteOverlapHarmonyMode.SPLIT_REMOVE;
        this.noteOverlapSnapType = SnapType.SCALE;

        this._constructorName = "AbstractHarmonyIndexPatternMotifRenderElement";

    }

    getMotifIdsAtIndex(i, totalCount, harmonyIndex, harmonyCount, module) {
        logit("" + this._constructorName + " must implement getMotifIdAtIndex()");
        return [];
    }

    getRenderChannelIdsAtIndex(i, totalCount, harmonyIndex, harmonyCount, module) {
        return [];
    }

    getPositionedRenderElements(module, harmony, beatOffset, state) {
        const result = [];

        const activated = getValueOrExpressionValue(this, "activated", module);

        const voiceLineHarmony = state.voiceLineHarmonies[this.voiceLine];
        if (voiceLineHarmony) {
            harmony = voiceLineHarmony;
        }

        if (activated) {

            const harmonyCount = harmony.getCount();

            let currentBeat = beatOffset;

            const startIndex = harmony.getHarmonyIndexAt(currentBeat);

            const theCount = Math.round(CountUnit.getCount(this.count, this.countUnit, harmony, currentBeat));

            //        if (this.countUnit == CountUnit.PHRASE_ELEMENT_COUNT) {
            //            logit(this._constructorName +
            //                ": phrase count: " + theCount + " " +
            //                " <br />");
            //        }

            let endIndex = startIndex + theCount;

            if (this.clampAtHarmonyEnd) {
                endIndex = Math.min(endIndex, harmonyCount);
            }

    //        logit(this._constructorName + " " + startIndex + ", " + endIndex + " " + currentBeat);

            for (let i=startIndex; i<endIndex; i++) {
                const he = harmony.get(i);
    //            logit("  " + currentBeat);
                const motifs = this.getMotifIdsAtIndex(i - startIndex, endIndex - startIndex, i, harmonyCount, module);

                const renderChannelIds = this.getRenderChannelIdsAtIndex(i - startIndex, endIndex - startIndex, i, harmonyCount, module);

                for (let j=0; j<motifs.length; j++) {
                    const motif = motifs[j];
                    let renderChannelId = "";
                    if (renderChannelIds.length > 0) {
                        renderChannelId = renderChannelIds[j % renderChannelIds.length];
                    }
                    if (motif) {
                        const mre = new MotifRenderElement();
                        mre.channel = renderChannelId;
                        // logit(this._constructorName + " " + i + " " + j + " setting motif render channel to " + renderChannelId + " <br />");
                        mre.motif = motif;
                        mre.startTime = currentBeat;
                        mre.startTimeUnit = PositionUnit.BEATS;
                        mre.offsets = this.offsets;
                        mre.offsetType = this.offsetType;
                        mre.startOffsets = this.startOffsets;
                        mre.endOffsets = this.endOffsets;
                        mre.useVoiceLine = this.useVoiceLine;
                        mre.voiceLine = this.voiceLine;
                        mre.seed = getItemFromArrayWithStartEndItems(12345, this.seeds, harmonyCount, i, this.startSeeds, this.endSeeds);
                        mre.cutHarmonyMode = this.cutHarmonyMode;
                        mre.noteOverlapHarmonyMode = this.noteOverlapHarmonyMode;
                        mre.noteOverlapSnapType = this.noteOverlapSnapType;
                        result.push(mre);

                    } else {
                    }
                }
                const beatStep = positionUnitToBeats(he.length, he.lengthUnit, he.tsNumerator, he.tsDenominator, harmony);
                currentBeat += beatStep;
            }
        }
        return result;
    }
}

// Renders a motif at every harmony element
class HarmonyIndexPatternMotifRenderElement extends AbstractHarmonyIndexPatternMotifRenderElement {
    constructor() {
        super();

        this.motifs = [];
        this.startMotifs = [];
        this.endMotifs = [];

        this._constructorName = "HarmonyIndexPatternMotifRenderElement";
    }

    getMotifIdsAtIndex(i, totalCount, harmonyIndex, harmonyCount, module) {
        const motif = getItemFromArrayWithStartEndItems("", this.motifs, totalCount, i, this.startMotifs, this.endMotifs);
        return [motif];
    }
}

// Renders a motif at every harmony element
class HarmonyIndexIndexPatternMotifRenderElement extends AbstractHarmonyIndexPatternMotifRenderElement {
    constructor() {
        super();

        this.indices = [];
        this.startIndices = [];
        this.endIndices = [];
        this.motifs = [];

        this.channelIndices = [];
        this.startChannelIndices = [];
        this.endChannelIndices = [];
        this.channels = [];

        this._constructorName = "HarmonyIndexIndexPatternMotifRenderElement";
    }

    getMotifIdsAtIndex(i, totalCount, harmonyIndex, harmonyCount, module) {
        const theIndices = getValueOrExpressionValue(this, "indices", module);
        const theStartIndices = getValueOrExpressionValue(this, "startIndices", module);
        const theEndIndices = getValueOrExpressionValue(this, "endIndices", module);
        const indices = getItemFromArrayWithStartEndItems([], theIndices, totalCount, i, theStartIndices, theEndIndices);


        const result = [];
        for (let i=0; i<indices.length; i++) {
            const index = indices[i];
            if (index >= 0 && this.motifs.length > 0) {
                const motifId = this.motifs[index % this.motifs.length];
                result.push(motifId);
            }
    //        if (index < this.motifs.length) {
    //            result.push(this.motifs[index]);
    //        }
        }
    //    if (this.voiceLine == "bassVoiceLine") {
    //        logit([this._constructorName,
    //            " getMotifIdsAtIndex() ",
    //            " theIndices: " + theIndices + " ",
    //            " theStartIndices: " + theStartIndices + " ",
    //            " theEndIndices: " + theEndIndices + " ",
    //            " indices: " + indices + " ",
    //            " result: " + result.join(", ") + " ",
    //
    //            " <br />"].join("") );
    //    }
        return result;
    }

    getRenderChannelIdsAtIndex(i, totalCount, harmonyIndex, harmonyCount, module) {
        const theIndices = getValueOrExpressionValue(this, "channelIndices", module);
        const theStartIndices = getValueOrExpressionValue(this, "startChannelIndices", module);
        const theEndIndices = getValueOrExpressionValue(this, "endChannelIndices", module);
        const indices = getItemFromArrayWithStartEndItems([], theIndices, totalCount, i, theStartIndices, theEndIndices);


        const result = [];
        for (let i=0; i<indices.length; i++) {
            const index = indices[i];
            if (index >= 0 && this.channels.length > 0) {
                const channelId = this.channels[index % this.channels.length];
                result.push(channelId);
            }
        }

        // logit(this._constructorName + " render channels: " + result.join(", ") + "<br />");
        return result;
    }
}

// Renders motifs and steps forward with stepOffset each time
class MultiMotifRenderElement extends PositionedRenderElement {
    constructor() {
        super();

        this.count = 1;
        this.countUnit = CountUnit.HARMONY_MEASURES;
        this.motifs = [];
        this.startMotifs = [];
        this.endMotifs = [];

        this.stepOffset = 1;
        this.stepOffsetUnit = PositionUnit.MEASURES;

        this.useVoiceLine = true;

        // relativeType, offset and offsetType are used when useVoiceLine is false
        this.relativeType = VerticalRelativeType.SCALE_BASE;
        this.offsets = [0];
        this.offsetType = OffsetType.SCALE;
        this.startOffsets = [];
        this.endOffsets = [];

        this.voiceLine = "";

        this.seeds = [12345];
        this.startSeeds = [];
        this.endSeeds = [];

        this.cutHarmonyMode = RenderElementCutHarmonyMode.STOP;
        this.noteOverlapHarmonyMode = NoteOverlapHarmonyMode.CONTINUE;
        this.noteOverlapSnapType = SnapType.SCALE;

        this._constructorName = "MultiMotifRenderElement";
    }

    getPositionedRenderElements(module, harmony, beatOffset, state) {
        const result = [];


        const activated = getValueOrExpressionValue(this, "activated", module);

        if (activated) {
            let he = harmony.get(0);
            // This is a little stupid... Maybe
            const startBeatTime = positionUnitToBeats(this.startTime, this.startTimeUnit, he.tsNumerator, he.tsDenominator, harmony);

            let harmonyIndex = harmony.getHarmonyIndexAt(startBeatTime);

            const count = CountUnit.getCount(this.count, this.countUnit, harmony, startBeatTime);

            let currentBeat = startBeatTime + beatOffset;

            for (let i=0; i<count; i++) {
                const motif = getItemFromArrayWithStartEndItems("", this.motifs, count, i, this.startMotifs, this.endMotifs);
                if (motif) {
                    const mre = new MotifRenderElement();
                    mre.motif = motif;
                    mre.startTime = currentBeat;
                    mre.startTimeUnit = PositionUnit.BEATS;
                    mre.offsets = this.offsets;
                    mre.offsetType = this.offsetType;
                    mre.startOffsets = this.startOffsets;
                    mre.endOffsets = this.endOffsets;
                    mre.useVoiceLine = this.useVoiceLine;
                    mre.voiceLine = this.voiceLine;
                    mre.seed = getItemFromArrayWithStartEndItems(12345, this.seeds, count, i, this.startSeeds, this.endSeeds);
                    mre.cutHarmonyMode = this.cutHarmonyMode;
                    mre.noteOverlapHarmonyMode = this.noteOverlapHarmonyMode;
                    mre.noteOverlapSnapType = this.noteOverlapSnapType;
                    result.push(mre);
                }
                let harmonyIndex = harmony.getHarmonyIndexAt(currentBeat);
                let he = harmony.get(harmonyIndex);
                const stepBeats = positionUnitToBeats(this.stepOffset, this.stepOffsetUnit, he.tsNumerator, he.tsDenominator, harmony);
                currentBeat += stepBeats;
            }
        }
        return result;
    }
}

class AbstractPercussionMotifRenderElement extends PositionedRenderElement {
    constructor() {
        super();
    }

    renderPercussionMotif(motifId, beatOffset, harmony, harmonyElement, state) {
        const theMotif = state.module.getPercussionMotif(motifId);
        const elements = theMotif.getPrimitivePercussionMotifElements(state.module, harmony, beatOffset);
        for (let j=0; j<elements.length; j++) {
            this.renderPrimitivePercussionMotifElement(elements[j], beatOffset, harmony, harmonyElement, state);
        }
    }

    getPercussionMotifBeatLength(motifId, beatOffset, harmony, harmonyElement, state) {
        let result = 0;
        const theMotif = state.module.getPercussionMotif(motifId);
        const elements = theMotif.getPrimitivePercussionMotifElements(state.module, harmony, beatOffset);

        for (let j=0; j<elements.length; j++) {
            const element = elements[j];
            const elementBeatLength = positionUnitToBeats2(element.length, element.lengthUnit, beatOffset, harmony);
            const elementStartBeat = positionUnitToBeats2(element.startTime, element.startTimeUnit, beatOffset, harmony);
            const endBeat = elementStartBeat + elementBeatLength;
            result = Math.max(result, endBeat);
        }
        return result;
    }

    getPercussionMotifsBeatLength(motifIds, beatOffset, harmony, harmonyElement, state) {
        let result = 0;
        for (let i=0; i<motifIds.length; i++) {
            const beatLength = this.getPercussionMotifBeatLength(motifIds[i], beatOffset, harmony, harmonyElement, state);
            result += beatLength;
            beatOffset += beatLength;
        }
        return result;
    }

    renderPrimitivePercussionMotifElement(element, beatOffset, harmony, harmonyElement, state) {
        if (element.rest) {
            return;
        }


        let renderChannel = state.renderChannel;

        if (element.renderChannel) {
            renderChannel = state.module.getRenderChannel(element.renderChannel);
            if (!renderChannel) {
                renderChannel = state.renderChannel;
            }
        }
        const noteOnEvent = new NoteOnEvent();
        const elementStartBeatTime = positionUnitToBeats(element.startTime, element.startTimeUnit, harmonyElement.tsNumerator, harmonyElement.tsDenominator, harmony);
        noteOnEvent.time = snapMidiTicks(beatOffset + elementStartBeatTime + state.sectionTime, 192);
        noteOnEvent.onVelocity = element.strength;
        noteOnEvent.note = element.note;
        noteOnEvent.renderChannel = renderChannel;

        const elementEndBeatTime = elementStartBeatTime + positionUnitToBeats(element.length, element.lengthUnit, harmonyElement.tsNumerator, harmonyElement.tsDenominator, harmony);
        const noteOffEvent = new NoteOffEvent();
        noteOffEvent.time = snapMidiTicks(beatOffset + elementEndBeatTime * 0.99 + state.sectionTime, 192);
        noteOffEvent.offVelocity = element.strength;
        noteOffEvent.note = noteOnEvent.note;
        noteOffEvent.renderChannel = renderChannel;
        noteOffEvent.startTime = noteOnEvent.time;

        state.data.addEvent(noteOnEvent);
        state.data.addEvent(noteOffEvent);

        if (element.fillers) {
            for (let k=0; k<element.fillers.length; k++) {
                const filler = element.fillers[k];
                // continue here...
            }
        }
    }
}

class PercussionMotifRenderElement extends AbstractPercussionMotifRenderElement {
    constructor() {
        super();

        this.count = 1;
        this.countUnit = CountUnit.HARMONY_MEASURES;
        this.motifs = [];
        this.startMotifs = [];
        this.endMotifs = [];

        this.stepOffset = 1;
        this.stepOffsetUnit = PositionUnit.MEASURES;

        this.seeds = [12345];
        this.startSeeds = [];
        this.endSeeds = [];

        this._constructorName = "PercussionMotifRenderElement";
    }

    renderBatch(state) {

        const activated = getValueOrExpressionValue(this, "activated", state.module);

        if (activated) {
            const harmony = state.constantHarmony;

            let he = harmony.get(0);
            const startBeatTime = positionUnitToBeats(this.startTime, this.startTimeUnit, he.tsNumerator, he.tsDenominator, harmony);

            const count = CountUnit.getCount(this.count, this.countUnit, harmony, startBeatTime);

            let currentBeat = startBeatTime;

            for (let i=0; i<count; i++) {
                const percussionMotif = getItemFromArrayWithStartEndItems("", this.motifs, count, i, this.startMotifs, this.endMotifs);
                const harmonyIndex = harmony.getHarmonyIndexAt(currentBeat);
                let he = harmony.get(harmonyIndex);
                if (percussionMotif) {
                    this.renderPercussionMotif(percussionMotif, currentBeat, harmony, he, state);
                }
                const stepBeats = positionUnitToBeats(this.stepOffset, this.stepOffsetUnit, he.tsNumerator, he.tsDenominator, harmony);
                currentBeat += stepBeats;
            }
        }
    }
}

class FlexiblePercussionMotifRenderElement extends AbstractPercussionMotifRenderElement {
    constructor() {
        super();

        // When this is true, the motifIndices are used to index the indexedMotifs
        this.useIndexedMotifs = false;

        this.motifs = [];
        this.startMotifs = [];
        this.endMotifs = [];

        this.motifIndices = [];
        this.startMotifIndices = [];
        this.endMotifIndices = [];

        this.indexedMotifs = []; // ID ref list

        this.seeds = [12345];
        this.startSeeds = [];
        this.endSeeds = [];

        this._constructorName = "FlexiblePercussionMotifRenderElement";
    }

    snapBeat(beat) {
        return Math.round(beat);
    }

    renderBatch(state) {


        const activated = getValueOrExpressionValue(this, "activated", state.module);

        if (activated) {
            const harmony = state.constantHarmony;

            let he = harmony.get(0);

    //        if (this.verbose) {
    //            logit(this._constructorName + " " + he.tsNumerator);
    //        }
            const startBeatTime = positionUnitToBeats2(this.startTime, this.startTimeUnit, 0, harmony);
            const maxBeatLength = positionUnitToBeats2(this.maxLength, this.maxLengthUnit, 0, harmony);

            let currentBeat = startBeatTime;

            const harmonyBeatLength = Math.min(maxBeatLength + startBeatTime, harmony.getBeatLength());

            const clampCount = 64;

            const clampedMotifs = [];
            for (let i=0; i<this.startMotifs.length; i++) {
                let motifId = this.startMotifs[i];
                clampedMotifs.push(motifId);
            }
            if (this.motifs.length > 0) {
                for (let i=0; i<clampCount; i++) {
                    let motifId = this.motifs[i % this.motifs.length];
                    clampedMotifs.push(motifId);
                }
            }


            const theStartMotifIndices = getValueOrExpressionValue(this, "startMotifIndices", state.module);
            const theMotifIndices = getValueOrExpressionValue(this, "motifIndices", state.module);
            const theEndMotifIndices = getValueOrExpressionValue(this, "endMotifIndices", state.module);

            const clampedMotifIndices = [];
            for (let i=0; i<theStartMotifIndices.length; i++) {
                let motifIndex = theStartMotifIndices[i];
                clampedMotifIndices.push(motifIndex);
            }

            if (theMotifIndices.length > 0) {
                for (let i=0; i<clampCount; i++) {
                    let motifIndex = theMotifIndices[i % theMotifIndices.length];
                    clampedMotifIndices.push(motifIndex);
                }
            }

    //        if (this.verbose) {
    //            logit("Rendering " + this._constructorName + " at " + currentBeat + " with max beat length " + maxBeatLength + " motifIndices: " + theMotifIndices.join(", "));
    //            logit("clamped motif indices: " + clampedMotifIndices.join(", ") + " end motif indices: " + theEndMotifIndices.join(", "));
    //        }

    //        logit([theMotifIndices.join(", "), theEndMotifIndices.join(", ")].join("; ") + "<br />");

            let i = 0;
            while (currentBeat < harmonyBeatLength) {

                let theEndMotifs = this.endMotifs;
                if (this.useIndexedMotifs) {
                    theEndMotifs = [];
                    for (let j=0; j<theEndMotifIndices.length; j++) {
                        const endIndex = theEndMotifIndices[j];
                        const mId = this.indexedMotifs[endIndex];
                        if (mId) {
                            theEndMotifs.push(mId);
                        }
                    }
                }

                const endBeatLength = this.getPercussionMotifsBeatLength(theEndMotifs, currentBeat, harmony, he, state);

    //            logit("  currentBeat: " + currentBeat + " endBeatLength: " + endBeatLength + " " + theEndMotifs.join(", "));

                const initialIndicesLength = this.useIndexedMotifs ? clampedMotifIndices.length : clampedMotifs.length;
                let motifIndex = IndexBorderMode.getIndex(IndexBorderMode.CLAMP, initialIndicesLength, i);
                let percussionMotifId = clampedMotifs[motifIndex];

                if (this.useIndexedMotifs) {
                    const percussionMotifIndex = clampedMotifIndices[motifIndex];
                    percussionMotifId = this.indexedMotifs[percussionMotifIndex];
    //                logit("    Rendering " + percussionMotifId + " from index " + percussionMotifIndex + " from " + this.indexedMotifs.join(", "));
                }

                // logit(this._constructorName + " " + percussionMotifId);

                const harmonyIndex = harmony.getHarmonyIndexAt(currentBeat);
                he = harmony.get(harmonyIndex);

                let motifBeatLength = 1;
                let renderEnd = false;
                if (percussionMotifId) {
                    motifBeatLength = this.getPercussionMotifBeatLength(percussionMotifId, currentBeat, harmony, he, state);

    //                logit("    " + this._constructorName + " length: " + motifBeatLength);

                    if (motifBeatLength < 0.01) {
                        logit(this._constructorName + " found empty percussion motif...");
                        motifBeatLength = 1;
                    } else {
                        // Only render if we can fit the end motifs
                        if ((currentBeat + endBeatLength + motifBeatLength <= harmonyBeatLength)) {
                            this.renderPercussionMotif(percussionMotifId, currentBeat, harmony, he, state);
                        } else {
                            renderEnd = true;
                        }
                    }
                }
                // Check if we should render the end motifs

                if ((renderEnd || (currentBeat + endBeatLength + motifBeatLength > harmonyBeatLength))) {
                    // Render the end motifs and quit

                    const beatBefore = currentBeat;
                    currentBeat = this.snapBeat(harmonyBeatLength - endBeatLength);

    //                if (currentBeat < beatBefore) {
    //                    logit(" bad rendering end... " + beatBefore + " " + currentBeat);
    //                }
    //                logit("Rendering end " + theEndMotifIndices + " <br />");

                    if (this.useIndexedMotifs) {
                        let endMotifId = null;
                        for (let j=0; j<theEndMotifIndices.length; j++) {
                            const endMotifIndex = theEndMotifIndices[j];
                            let endMotifId = this.indexedMotifs[endMotifIndex];
                            this.renderPercussionMotif(endMotifId, currentBeat, harmony, he, state);
                            let tempLength = this.getPercussionMotifBeatLength(endMotifId, currentBeat, harmony, he, state);
                            if (tempLength < 0.01) {
                                tempLength = 1;
                            }
                            currentBeat += tempLength;
                            currentBeat = this.snapBeat(currentBeat);
                        }
                    } else {
                        for (let j=0; j<this.endMotifs.length; j++) {
                            let endMotifId = this.endMotifs[j];
                            this.renderPercussionMotif(endMotifId, currentBeat, harmony, he, state);
                            let tempLength = this.getPercussionMotifBeatLength(endMotifId, currentBeat, harmony, he, state);
                            if (tempLength < 0.01) {
                                tempLength = 1;
                            }
                            currentBeat += tempLength;
                            currentBeat = this.snapBeat(currentBeat);
                        }
                    }
                    break; // We are done!
                }

                const stepBeats = motifBeatLength;
                currentBeat += stepBeats;

                currentBeat = this.snapBeat(currentBeat);

                i++;
            }
        }
    }
}


