

class MotifRenderElement extends PositionedRenderElement {
    constructor() {
        super();
        this.motif = "";
        this.useVoiceLine = true;

        // relativeType, offset and offsetType are used when useVoiceLine is false
        this.relativeType = VerticalRelativeType.SCALE_BASE;
        this.offsets = [0];
        this.offsetType = OffsetType.SCALE;
        this.startOffsets = [];
        this.endOffsets = [];

        this.voiceLine = "";
        this.seed = 12345;

        this.figurationPlanner = "";

        // Strategies for overlapping harmony with render elements and notes
        this.splitNoteMinLength = 1.0;
        this.splitNoteMinLengthUnit = PositionUnit.BEAT_EIGHTHS;
        this.cutHarmonyMode = RenderElementCutHarmonyMode.STOP;
        this.noteOverlapHarmonyMode = NoteOverlapHarmonyMode.CONTINUE;
        this.noteOverlapSnapType = SnapType.SCALE;

        this._constructorName = "MotifRenderElement";
    }

    render(harmony, elements, theVoiceLine, noteAbsoluteNotes, state) {
        const he = harmony.get(0);
        const startBeatTime = positionUnitToBeats(this.startTime, this.startTimeUnit, he.tsNumerator, he.tsDenominator, harmony);

        let currentTime = startBeatTime;

        const harmonyBeatLength = harmony.getBeatLength();

    //    logit("  " + this._constructorName + " Rendering at time " + currentTime + " " + this.motif);
        for (let i=0; i<elements.length; i++) {
            const e = elements[i];

            const harmonyIndex = harmony.getHarmonyIndexAt(currentTime);
            const che = harmony.get(harmonyIndex);
            const voiceLineElement = theVoiceLine.get(harmonyIndex);

            const beatLength = e.getBeatLength(che.tsNumerator,
                che.tsDenominator);


            if (!e.rest) {
                const absoluteNote = noteAbsoluteNotes.get(e);


                if (absoluteNote && absoluteNote > 0 && absoluteNote < 128) {

                    let noteLength = beatLength;

                    const nextHarmonyIndex = harmony.getHarmonyIndexAt(currentTime + beatLength);
                    if (nextHarmonyIndex != harmonyIndex || currentTime + beatLength > harmonyBeatLength) {
                        // Cuts harmony border

                        //                    let startHarmonyBeat = harmony.getBeatLengthUntilIndex(harmonyIndex);
                        const endHarmonyBeat = harmony.getBeatLengthUntilIndex(harmonyIndex + 1);

                        const overlapBeats = currentTime + beatLength - endHarmonyBeat;

                        if (overlapBeats > 0) {
                            switch (this.noteOverlapHarmonyMode) {
                                case NoteOverlapHarmonyMode.CONTINUE:
                                    // Just let it continue
                                    break;
                                case NoteOverlapHarmonyMode.SPLIT_REMOVE:
                                    noteLength -= overlapBeats;
                                    break;
                                case NoteOverlapHarmonyMode.SPLIT_SNAP:
                                    noteLength -= overlapBeats;
                                    // Add notes and snap until the note is done or we have reached the end of complete harmony
                                    break;
                                case NoteOverlapHarmonyMode.CONTINUE_OR_SPLIT_SNAP:
                                    // Check if the snapped note is the same. In that case, just let it continue
                                    // until it reaches next harmony element. Continue with this until the note is
                                    // ended or reached end of complete harmony.
                                    break;
                            }
                        }
                    }

                    if (noteLength > 0.0) {

                        let renderChannel = state.renderChannel;
                        if (this.channel) {
                            renderChannel = state.module.getRenderChannel(this.channel);
                        }
                        if (e.channel) {
                            renderChannel = state.module.getRenderChannel(e.channel);
                        }

                        if (!renderChannel) {
                            renderChannel = state.renderChannel;
                        }
    //                    logit(" setting note channel to " + renderChannel + " <br />");



                        let noteOnEvent = new NoteOnEvent();
                        noteOnEvent.time = snapMidiTicks(currentTime + state.sectionTime, 192);
                        noteOnEvent.onVelocity = e.strength;
                        noteOnEvent.note = absoluteNote;
                        noteOnEvent.renderChannel = renderChannel;

                        let noteOffEvent = new NoteOffEvent();
                        noteOffEvent.time = snapMidiTicks(currentTime + noteLength * 0.99 + state.sectionTime, 192);
                        noteOffEvent.startTime = noteOnEvent.time;
                        noteOffEvent.offVelocity = e.strength;
                        noteOffEvent.note = noteOnEvent.note;
                        noteOffEvent.renderChannel = renderChannel;

    //                    logit("    start: " + noteOnEvent.time + " end: " + noteOffEvent.time);

                        state.data.addEvent(noteOnEvent);
                        state.data.addEvent(noteOffEvent);

                        // Add filler notes if available
                        if (e.fillers) {
                            const oldRenderChannel = renderChannel;
                            for (let j=0; j<e.fillers.length; j++) {
                                const filler = e.fillers[j];
                                const fillerAbsNote = filler.getAbsoluteNote(absoluteNote, che, voiceLineElement);
                                const fillerPosition = currentTime + state.sectionTime + positionUnitToBeats(filler.positionOffset, filler.positionOffsetUnit,
                                    che.tsNumerator, che.tsDenominator);
                                let fillerLength = positionUnitToBeats(filler.length, filler.lengthUnit,
                                    che.tsNumerator, che.tsDenominator);
                                switch (filler.lengthMode) {
                                    case FillerNoteLengthMode.INDEPENDENT:
                                        break;
                                    case FillerNoteLengthMode.MATCH:
                                        fillerLength = noteLength;
                                        break;
                                }

                                if (filler.channel) {
                                    renderChannel = state.module.getRenderChannel(filler.channel);
                                } else {
                                    renderChannel = oldRenderChannel;
                                }
                                if (!renderChannel) {
                                    renderChannel = state.renderChannel;
                                }

                                noteOnEvent = new NoteOnEvent();
                                noteOnEvent.time = snapMidiTicks(fillerPosition, 192);
                                noteOnEvent.onVelocity = filler.strength;
                                noteOnEvent.note = fillerAbsNote;
                                noteOnEvent.renderChannel = renderChannel;

                                noteOffEvent = new NoteOffEvent();
                                noteOffEvent.time = snapMidiTicks(fillerPosition + fillerLength * 0.99, 192);
                                noteOffEvent.offVelocity = filler.strength;
                                noteOffEvent.note = noteOnEvent.note;
                                noteOffEvent.renderChannel = renderChannel;
                                noteOffEvent.startTime = noteOnEvent.time;

                                state.data.addEvent(noteOnEvent);
                                state.data.addEvent(noteOffEvent);
                            }
                        }
                    }
                } else {
                    //                logit(
                    //                    "MotifRenderElement.prototype.renderBatch() missing absoluteNote for element with index " +
                    //                    i +
                    //                    "<br />");
                }
            }
            currentTime += beatLength;
        }
    //    logit("leaving renderLine<br />");

    }

    figurate(
        harmony,
        elements,
        noteAbsoluteNotes,
        voiceHarmonyElements,
        elementHarmonyIndices,
        previousVoiceElements,
        nextVoiceElements,
        theVoiceLine,
        theMotif,
        module,
        section
    ) {
        // The remaining notes need to be set using search/optimization
        // We need to find the clusters between the assigned notes and create a search/optimization problem for each
        const searchClusters = [];
        let currentCluster = [];

        for (let i = 0; i < elements.length; i++) {
            const ve = elements[i];
            if (!ve.rest) {
                //            logit("ve: " + ve + "<br />");
                const absNote = noteAbsoluteNotes.get(ve);
                const voiceLineElement = voiceHarmonyElements.get(ve);
                if (voiceLineElement && !absNote && ve instanceof AdaptiveMotifElement) {
                    currentCluster.push(ve);
                    ve.clusterId = searchClusters.length;
                    ve.clusterPositionIndex = currentCluster.length - 1;
                } else {
                    if (currentCluster.length > 0) {
                        searchClusters.push(currentCluster);
                        currentCluster = [];
                    }
                }
            }
        }
        // Finishing off the final cluster
        if (currentCluster.length > 0) {
            searchClusters.push(currentCluster);
        }
        // Set the position fraction for all clusters
        for (let i=0; i<searchClusters.length; i++) {
            let cluster = searchClusters[i];
            const clusterPosition = 0;
            const positions = [];
            for (let j=0; j<cluster.length; j++) {
                positions[j] = clusterPosition;
                // Need length of voice element here...
            }
            // clusterPosition now contains the length of the cluster
            let clusterLength = clusterPosition;
            if (clusterLength < 0.000001) {
                clusterLength = cluster.length; // Just use the index as fraction
            }
            for (let j=0; j<cluster.length; j++) {
                cluster[j].clusterPositionFraction = positions[j] / clusterLength;
            }
        }


        const theSeed = theMotif.useExternalSeed ? this.seed : theMotif.seed;
        const rnd = new MersenneTwister(theSeed);

        // Perform the search
        for (let i=0; i<searchClusters.length; i++) {
            let cluster = searchClusters[i];
            //        logit("Searching in cluster " + i + " " + cluster + " with size " + cluster.length + "<br />");

            const harmonyIndices = [];
            for (let j=0; j<cluster.length; j++) {
                harmonyIndices.push(elementHarmonyIndices.get(cluster[j]));
            }
            const defaultOptions = {
                seed: rnd.genrand_int32(),
                module: module,
                cluster: cluster,
                harmony: harmony,
                voiceLine: theVoiceLine,
                harmonyIndices: harmonyIndices,
                previousNotes: previousVoiceElements,
                nextNotes: nextVoiceElements,
                absoluteNotes: noteAbsoluteNotes,
                maxMLSolutions: 10
            };

            let figurator = null;

            let figuratorId = this.figurationPlanner;
            if (!figuratorId && section) {
                figuratorId = section.figurationPlanner;
            }

            if (figuratorId) {
                const planner = module.getFigurationPlanner(figuratorId);
                if (planner) {
                    figurator = planner.getFigurator(defaultOptions);
                }
            }

            if (!figurator) {
                // Use a default figurator
                figurator = new Figurator(defaultOptions);
            }
            //        figurator.maxMLSolutions = 10;
            const solution = figurator.searchML();
            if (solution != null) {
                if (solution.length != cluster.length) {
                    logit(`Mitchmatch between solution and cluster lengths ${solution.length} ${cluster.length}<br />`);
                }
                for (let j=0; j<cluster.length; j++) {
                    if (typeof(solution[j]) === 'string') {
                        logit("abs note is a string!!!");
                    }
                    noteAbsoluteNotes.put(cluster[j], solution[j]);
                }
            } else {
                logit(`Failed to find solution to figuration problem in cluster ${i}<br />`);
            }
        }

    }

    assignHorizontalRelativeMotifElements(
        harmony,
        elementHarmonyIndices,
        theVoiceLine,
        voiceElements,
        noteAbsoluteNotes
    ) {

        let horizontalChanged = true;
        while (horizontalChanged) {
            horizontalChanged = false;

            function propagate(i) {
                const vnme = voiceElements[i];
                if (vnme instanceof HorizontalRelativeMotifElement) {
                    const absNote = noteAbsoluteNotes.get(vnme);
                    if (!absNote) {
                        // Doesn't have any absolute note yet

                        let referenceAbsNote = null;

                        const harmonyCount = harmony.getCount();
                        const harmonyIndex = elementHarmonyIndices.get(vnme);
                        const currentHarmonyElement = harmony.get(harmonyIndex);
                        let referenceHarmonyElement = harmony.get(harmonyIndex);
                        let referenceVoiceLineElement = theVoiceLine.get(harmonyIndex);
                        switch (vnme.relativeType) {
                            case HorizontalRelativeType.NEXT_VOICE_LINE_ELEMENT:
                                if (harmonyIndex < harmonyCount - 1) {
                                    referenceVoiceLineElement = theVoiceLine.get(harmonyIndex + 1);
                                    referenceHarmonyElement = harmony.get(harmonyIndex + 1);
                                }
                                referenceAbsNote = referenceHarmonyElement.getAbsoluteNoteConstantVoiceLineElement(referenceVoiceLineElement);
                                break;
                            case HorizontalRelativeType.PREVIOUS_VOICE_LINE_ELEMENT:
                                if (harmonyIndex > 0) {
                                    referenceVoiceLineElement = theVoiceLine.get(harmonyIndex - 1);
                                    referenceHarmonyElement = harmony.get(harmonyIndex - 1);
                                }
                                referenceAbsNote = referenceHarmonyElement.getAbsoluteNoteConstantVoiceLineElement(referenceVoiceLineElement);
                                break;
                            case HorizontalRelativeType.NEXT_NOTE:
                                if (i < voiceElements.length - 1) {
                                    referenceAbsNote = noteAbsoluteNotes.get(voiceElements[i + 1]);
                                } else {
                                    // Is the last note, use the next voice line element instead
                                    if (harmonyIndex < harmonyCount - 1) {
                                        referenceVoiceLineElement = theVoiceLine.get(harmonyIndex + 1);
                                        referenceHarmonyElement = harmony.get(harmonyIndex + 1);
                                    }
                                    referenceAbsNote = referenceHarmonyElement.getAbsoluteNoteConstantVoiceLineElement(referenceVoiceLineElement);
                                }
                                break;
                            case HorizontalRelativeType.PREVIOUS_NOTE:
                                if (i > 0) {
                                    referenceAbsNote = noteAbsoluteNotes.get(voiceElements[i - 1]);
                                } else {
                                    // Is the first note, use the previous voice line element instead
                                    if (harmonyIndex > 0) {
                                        referenceVoiceLineElement = theVoiceLine.get(harmonyIndex - 1);
                                        referenceHarmonyElement = harmony.get(harmonyIndex - 1);
                                    }
                                    referenceAbsNote = referenceHarmonyElement.getAbsoluteNoteConstantVoiceLineElement(referenceVoiceLineElement);
                                }
                                break;
                        }

                        if (referenceAbsNote != null) {
                            const newAbsNote = currentHarmonyElement.snapOffsetSnap(referenceAbsNote,
                                vnme.beforeOffsetSnapType, vnme.offsetType, vnme.afterOffsetSnapType,
                                vnme.index, currentHarmonyElement);
                            noteAbsoluteNotes.put(vnme, newAbsNote);
                            horizontalChanged = true;
                        }
                    }
                }
            }

            // Propagate forward
            for (let i = 0; i < voiceElements.length; i++) {
                propagate(i);
            }
            // Propagate backward
            for (let i = voiceElements.length - 1; i>=0; i--) {
                propagate(i);
            }
        }

    }

    assignVerticalRelativeMotifElements(
        voiceElements,
        voiceHarmonyElements,
        voiceVoiceLineElements,
        noteAbsoluteNotes
    ) {
        for (let i = 0; i < voiceElements.length; i++) {
            const vnme = voiceElements[i];

            const harmonyElement = voiceHarmonyElements
                .get(vnme);
            const voiceLineElement = voiceVoiceLineElements
                .get(vnme);

            let absoluteNote = null;

            if (vnme instanceof VerticalRelativeMotifElement) {
                absoluteNote = harmonyElement.getVerticalRelativeAbsoluteNote(vnme.relativeType, voiceLineElement);
            }
            if (absoluteNote != null) {
                const absNote = harmonyElement.snapOffsetSnap(absoluteNote, vnme.beforeOffsetSnapType, vnme.offsetType, vnme.afterOffsetSnapType,
                    vnme.index, harmonyElement);
                noteAbsoluteNotes.put(vnme, absNote);
            }
        }

    }

    gatherVoiceAndHarmonyInfo(
        harmony,
        elements,
        theVoiceLine,
        elementHarmonyIndices,
        voiceHarmonyElements,
        voiceVoiceLineElements,
        voiceElements,
        previousVoiceElements,
        nextVoiceElements
    ) {

        const he = harmony.get(0);
        const startBeatTime = positionUnitToBeats(this.startTime, this.startTimeUnit, he.tsNumerator, he.tsDenominator, harmony);

        let currentTime = startBeatTime;

        const startHarmonyIndex = harmony.getHarmonyIndexAt(currentTime);

        for (let i=0; i<elements.length; i++) {
            const e = elements[i];
            let harmonyIndex = harmony.getHarmonyIndexAt(currentTime);

            let stop = false;
            switch (this.cutHarmonyMode) {
                case RenderElementCutHarmonyMode.STOP:
                    if (harmonyIndex != startHarmonyIndex) {
                        // Don't add any more elements since they overlap with next harmony
                        //                    logit("Stopping rendering for " + currentTime + " <br />");
                        stop = true;
                    }
                    break;
                case RenderElementCutHarmonyMode.CONTINUE_ADAPT:
                    // We don't have to do anything here since the harmony is automatically adapted
                    break;
                case RenderElementCutHarmonyMode.CONTINUE_SAME:
                    harmonyIndex = startHarmonyIndex;
                    break;
            }
            if (stop) {
                break;
            }
            elementHarmonyIndices.put(e, harmonyIndex);
            const che = harmony.get(harmonyIndex);
            const voiceElement = theVoiceLine
                .get(harmonyIndex);

            voiceHarmonyElements.put(e, che);
            voiceVoiceLineElements.put(e, voiceElement);
            if (!e.rest) {
                // Don't add rests
                voiceElements.push(e);
            }
            const beatLength = e.getBeatLength(che.tsNumerator,
                che.tsDenominator);

            currentTime += beatLength;
        }

        // Make sure that every voice element has a previous and next element
        // Create dummys for initial and final
        for (let i = 0; i < voiceElements.length; i++) {
            const vnme = voiceElements[i];
            let prev = null;
            if (i > 0) {
                prev = voiceElements[i - 1];
            } else {
                // Create dummy previous
            }
            let next = null;
            if (i < voiceElements.length - 1) {
                next = voiceElements[i + 1];
            } else {
                // Create dummy next
            }
            previousVoiceElements.put(vnme, prev);
            nextVoiceElements.put(vnme, next);
        }


    }

    getOrCreateVoiceLine(state, harmony) {
        let theVoiceLine = getObjectWithId(this.voiceLine,
            state.plannedVoiceLines);
        if (this.useVoiceLine) {
            if (!theVoiceLine) {
                logit(` could not find voice line ${this.voiceLine} in ${state.plannedVoiceLines}`);
                return;
            }
        } else {
            // Create dummy voice line

            const oldVoiceLine = theVoiceLine; // Get the referenced voice line if, for some reason, the relative type is along voice line
            theVoiceLine = new ConstantVoiceLine();
            for (let i=0; i<harmony.getCount(); i++) {
                const he = harmony.get(i);
                const cvle = new ConstantVoiceLineElement();

                let voiceLineElement = null;
                if (oldVoiceLine) {
                    voiceLineElement = oldVoiceLine.get(i);
                }

                let absNote = he.getVerticalRelativeAbsoluteNote(this.relativeType, voiceLineElement);

                const offset = getItemFromArrayWithStartEndItems(0, this.offsets, harmony.getCount(), i,
                    this.startOffsets, this.endOffsets);

                absNote = he.offset(absNote, this.offsetType, offset, he);
                //            this.relativeType = VerticalRelativeType.SCALE_BASE;
                //            this.offset = 0;
                //            this.offsetType = OffsetType.SCALE;
                cvle.index = absNote;
                cvle.indexType = IndexType.MIDI_NOTE;
                theVoiceLine.addVoiceLineElement(cvle);
            }
        }
        return theVoiceLine;
    }

    renderBatch(state) {

        const activated = getValueOrExpressionValue(this, "activated", state.module);
        if (!activated) {
            return;
        }

        const theMotif = state.module.getMotif(this.motif);
        if (!theMotif) {
            logit(`could not find motif ${this.motif}`);
            return;
        }


        let harmony = state.constantHarmony;

        const noteAbsoluteNotes = new Map(true);

        const voiceElements = [];

        const previousVoiceElements = new Map(true);
        const nextVoiceElements = new Map(true);
        const voiceHarmonyElements = new Map(true);
        const voiceVoiceLineElements = new Map(true);
        const elementHarmonyIndices = new Map(true);


        // The voice line can either be used or a dummy will be created
        const theVoiceLine = this.getOrCreateVoiceLine(state, harmony);

        const voiceLineHarmony = state.voiceLineHarmonies[theVoiceLine.id];
        if (voiceLineHarmony) {
            harmony = voiceLineHarmony;
        }

        const he = harmony.get(0);
        const startBeatTime = positionUnitToBeats(this.startTime, this.startTimeUnit, he.tsNumerator, he.tsDenominator, harmony);

        // Get the constant motif elements
        const elements = theMotif.getConstantMotifElements(state.module, harmony, startBeatTime);

        // Gather info about all elements, such as the harmony index for all elements etc.
        this.gatherVoiceAndHarmonyInfo(harmony, elements, theVoiceLine, elementHarmonyIndices, voiceHarmonyElements,
            voiceVoiceLineElements, voiceElements, previousVoiceElements, nextVoiceElements);

        // Assign scale indices to the VerticalRelativeMotifElements
        this.assignVerticalRelativeMotifElements(voiceElements, voiceHarmonyElements, voiceVoiceLineElements, noteAbsoluteNotes);

        // Set as many HorizontalRelativeMotifElements by propagation from the known notes
        this.assignHorizontalRelativeMotifElements(harmony, elementHarmonyIndices, theVoiceLine, voiceElements, noteAbsoluteNotes);

        // Figurate all the clusters with the figuration planner (if necessary)
        this.figurate(harmony, elements, noteAbsoluteNotes, voiceHarmonyElements, elementHarmonyIndices,
            previousVoiceElements, nextVoiceElements, theVoiceLine, theMotif, state.module, state.section);

        // Render all
        this.render(harmony, elements, theVoiceLine, noteAbsoluteNotes, state);

    }
}

