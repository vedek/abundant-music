
class AbstractSection {
    constructor() {
        this.id = "";
        this.active = true;
        this.modifiers = [];
        this._constructorName = "AbstractSection";
    }

    getConcreteSections(state) {
        logit(`Sections need to implement getConcreteSections() ${this._constructorName}<br />`);
        return [];
    }

    concretizeSections(sections, state) {
        // Make sure that we only return concrete sections
        let result = sections;
        let done = false;
        do {
            done = true;
            for (let i=0; i<result.length; i++) {
                if (!(result[i] instanceof Section)) {
                    done = false;
                }
            }
            if (!done) {
                const newResult = [];
                for (let i=0; i<result.length; i++) {
                    const list = result[i].getConcreteSections(state);
                    addAll(newResult, list);
                }
                result = newResult;
            }
        } while (!done);

        return result;
    }

    renderBatch(state) {
        const sections = this.getConcreteSections(state);

        for (let concreteSection of sections) {
            if (!(concreteSection instanceof Section)) {
                logit(`Failed to concretize section... ${concreteSection._constructorName} <br />`);
                continue;
            }

            for (let sm of this.modifiers) {
                concreteSection = sm.modifySection(concreteSection, state);
            }

            state.oldSectionTime = state.sectionTime;
            if (concreteSection.active) {
                concreteSection.renderBatch(state);
            }

            for (let sm of this.modifiers) {
                sm.beforeSectionFinalized(concreteSection, state);
            }

            for (let sm of this.modifiers) {
                sm.sectionRendered(concreteSection, state);
            }
        }
    }
}

class SectionReference extends AbstractSection {
    constructor(sectionId) {
        super();
        this.section = sectionId ? sectionId : "";
        this._constructorName = "SectionReference";
    }

    getConcreteSections(state) {
        const theSectionId = getValueOrExpressionValue(this, "section", state.module);

        const section = state.module.getSection(theSectionId);
        if (!section) {
            logit(`Could not find section ${theSectionId}<br />`);
            return [];
        }
        const result = this.concretizeSections([section], state);
        return result;
    }
}


const SectionTempoMode = {
    CONSTANT: 0,
    CHANGE_CONTROL_CHANNEL: 1,
    CONTROL_CHANNEL: 2
};


class Section extends AbstractSection {
    constructor() {
        super();
        this.harmonicRythm = "";
        this.voiceLinePlanner = "";
        this.figurationPlanner = "";
        this.tempoMode = SectionTempoMode.CONSTANT;
        this.tempo = 60.0;
        this.tempoChannel = "";
        this.voiceLines = [];
        this.renderLines = [];
        this.controlLines = [];
        this.suspAntStrategies = [];
        this._constructorName = "Section";
    }

    getConcreteSections(state) {
        return [this];
    }

    addVoiceLine(e) {
        this.voiceLines.push(e);
        return this;
    }

    addRenderLine(e) {
        this.renderLines.push(e);
        return this;
    }

    addControlLine(e) {
        this.controlLines.push(e);
        return this;
    }

    addModifier(e) {
        this.modifiers.push(e);
        return this;
    }

    getVoiceLine(id) {
        return getObjectWithId(id, this.voiceLines);
    }

    generateVoiceLineHarmonies(chr, voiceLines, module) {
        const result = {};

        for (const voiceLine of voiceLines) {
            let strategy = null;

            for (const s of this.suspAntStrategies) {
                if (arrayContains(s.voiceLines, voiceLine.id)) {
                    strategy = s;
                    break;
                }
            }

            if (strategy) {
                result[voiceLine.id] = strategy.createVoiceLineHarmony(voiceLine, chr, module);
                //            logit("voice line harmonies: " + valueToJson(result).join("") + "<br />");
            }
        }

        return result;
    }

    planVoices(chr, voiceLines, module) {
        const result = [];

        if (this.voiceLinePlanner) {

            const theVoiceLinePlannerId = getValueOrExpressionValue(this, "voiceLinePlanner", module);

            const planner = module.getVoiceLinePlanner(theVoiceLinePlannerId);

            if (!planner) {
                logit(`Could not find voice line planner '${theVoiceLinePlannerId}'<br />`);
            } else {
                planner.planVoices(voiceLines, chr, module, result);
            }

        } else {
            for (let line of voiceLines) {
                if (line instanceof DoubledVoiceLine) {
                    // Doubled voice lines are dealt with when there are only ConstantVoiceLineElements (and undefined) left
                    continue;
                }

                const lineElements = line.getSingleStepVoiceLineElements(chr, module);
                const newLine = new ConstantVoiceLine();
                newLine.id = line.id; // So we can find it later by using the same

                // original name
                for (const e of lineElements) {
                    if (e instanceof ConstantVoiceLineElement || e instanceof UndefinedVoiceLineElement) {
                        newLine.add(e);
                    } else {
                        logit("Only supports Constant voice line elements when no voice line planner is selected");
                    }
                }

                result.push(newLine);
            }
        }

        // After all the planning is done, take care of the voice lines that are derived from other lines
        for (let line of voiceLines) {
            if (line instanceof DoubledVoiceLine) {
                const doubled = line.doubleVoiceLine(result);
                if (doubled) {
                    result.add(doubled);
                }
            }
        }

        // logit("planned voices in section: " + result + "<br />");

        return result;
    }

    renderBatch(state) {
        if (!this.active) {
            return;
        }

        // Need a place to store modified sections
        state.section = this;

        state.oldSectionTime = state.sectionTime;

        for (let sm of this.modifiers) {
            state.section = sm.modifySection(state.section, state);
        }

        const harmonyId = getValueOrExpressionValue(state.section, "harmonicRythm", state.module);

        const harmony = state.module.getHarmony(harmonyId);
        if (harmony) {
            state.harmony = harmony;
            const theTempo = getValueOrExpressionValue(state.section, "tempo", state.module);
            const sectionTempoMode = this.tempoMode;

            const harmonyElements = harmony.getConstantHarmonyElements(state.module);

            const chr = new ConstantHarmonicRythm(harmonyElements);

            //        logit(" constant harmony in section: " + chr.get(0).tsNumerator);

            //        logit(harmonyElements);

            state.constantHarmony = chr;



            for (let sm of this.modifiers) {
                state.constantHarmony = sm.modifyConstantHarmony(state.constantHarmony, state);
            }

            // Modify the voice line before planning
            state.voiceLines = state.section.voiceLines;

            // Plan the voices
            state.plannedVoiceLines = this.planVoices(state.constantHarmony, state.voiceLines, state.module);

            for (let sm of this.modifiers) {
                state.plannedVoiceLines = sm.modifyPlannedVoiceLines(state.plannedVoiceLines, state);
            }

            let che;

            for (let i=0; i<state.constantHarmony.getCount(); i++) {
                che = state.constantHarmony.get(i);

                for (let sm of che.sectionModifiers) {
                    state.plannedVoiceLines = sm.modifyPlannedVoiceLines(state.plannedVoiceLines, state);
                }
            }

            // Generate voice line harmonies
            state.voiceLineHarmonies = this.generateVoiceLineHarmonies(state.constantHarmony, state.plannedVoiceLines, state.module);

            state.renderLines = state.section.renderLines;
            state.controlLines = state.section.controlLines;

            // Add section tempo
            // logit("Setting tempo event " + state.sectionTempo + " <br />");
            //            logit("Rendering line " + i);
            for (let line of state.renderLines) {
                line.renderBatch(state);
            }

            for (let sm of che.sectionModifiers) {
                sm.beforeControlRender(state);
            }

            perfTimer2.start();

            //        logit("fsdf " + state.controlLines.length);
            for (let line of state.controlLines) {
                line.renderBatch(state);
            }

            perfTimer2.pause();

            for (let sm of che.sectionModifiers) {
                sm.afterControlRender(state);
            }



            switch (sectionTempoMode) {
                case SectionTempoMode.CONSTANT:
                    state.data.addEvent(new SetTempoEvent(theTempo, state.sectionTime));
                    break;
                case SectionTempoMode.CHANGE_CONTROL_CHANNEL:
                case SectionTempoMode.CONTROL_CHANNEL:
                    const tempoCh = state.module.getControlChannel(this.tempoChannel);
                    if (tempoCh) {
                        let slotData = state.controlSlotDatas[tempoCh.id];
                        if (slotData) {
                            const sectionLength = state.constantHarmony.getBeatLength();
                            const slotBeatFraction = 1.0 / tempoCh.slotsPerBeat;
                            let oldTempo = 0;
                            for (let i=0; i<sectionLength; i++) {
                                for (let j=0; j<tempoCh.slotsPerBeat; j++) {
                                    const slot = i * tempoCh.slotsPerBeat + j;
                                    let tempoValue = tempoCh.readDouble(slot, slotData);
                                    const beat = i + slotBeatFraction * j;
                                    let newTempo = Math.round(theTempo * tempoValue);
                                    if (newTempo > 10 && newTempo != oldTempo) {
                                        state.data.addEvent(new SetTempoEvent(newTempo, state.sectionTime + beat));
    //                                    logit("Setting tempo to " + newTempo + " value: " + tempoValue + " slot: " + slot);
                                        oldTempo = newTempo;
                                    } else if (newTempo <= 10) {
                                        logit(`Tempo strange ${newTempo} tempoValue:${tempoValue} slot: ${slot}`);
                                    }
                                }
                            }
                        } else {
                            let tempoValue = tempoCh.readDouble(0);
                            let newTempo = Math.round(theTempo * tempoValue);
                            state.data.addEvent(new SetTempoEvent(newTempo, state.sectionTime));
    //                        logit("Could not find slot data for channel " + this.tempoChannel);
                        }
                    } else {
                        logit(`Could not find tempo channel ${tempoCh}`);
                        state.data.addEvent(new SetTempoEvent(theTempo, state.sectionTime));
                    }
                    break;
            }

            const beatLength = state.constantHarmony.getBeatLength();

            for (const ch of state.module.controlChannels) {
                let slotData = state.controlSlotDatas[ch.id];
                if (!slotData) {
    //                logit("Could not find any slot data for " + ch.id);
                    slotData = ch.createSlotData(beatLength);
                    state.controlSlotDatas[ch.id] = slotData;
                }
            }

            for (const ctrlCh in state.controlSlotDatas) {
                let slotData = state.controlSlotDatas[ctrlCh];
                const channel = state.module.getControlChannel(ctrlCh);
                const ctrlEvents = channel.getControlEvents(slotData, state.sectionTime);
    //            logit("Got " + ctrlEvents.length + " control events from " + ctrlCh);
                addAll(state.data.addEvents(ctrlEvents));
            }

            for (let sm of this.modifiers) {
                sm.beforeSectionFinalized(state.section, state);
            }

            for (let sm of this.modifiers) {
                sm.sectionRendered(state.section, state);
            }

            // Step forward the section time
            state.sectionTime += state.constantHarmony.getBeatLength();

            //        logit("SEction time: " + state.sectionTime + " " + state.constantHarmony.getBeatLength());
            state.controlSlotDatas = {};
        } else {
            logit(` could not find harmony ${harmonyId}`);
        }
    }
}




