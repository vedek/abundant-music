class VoiceLinePlanner {
    constructor() {
        this.id = "";
        this.maxSearchStepsPerStep = 5000;
        this.constraintZones = [];
        this._constructorName = "VoiceLinePlanner";
    }

    planVoices(voiceLines, chr, module, result) {
        logit("A voice line planner must implement planVoices()<br />");
    }
}

class ClassicalVoiceLinePlanner extends VoiceLinePlanner {
    constructor() {
        super();
        this.defaultAbsoluteNoteRange = [20, 110];
        this.defaultMaxSpacing = 12;
        this.defaultHintDistance = 6;

        this._constructorName = "ClassicalVoiceLinePlanner";
    }

    planVoices(voiceLines, chr, module, result) {

        const constraints = [];
        for (let i=0; i<this.constraintZones.length; i++) {
            const zone = this.constraintZones[i];
            zone.applyZone(chr, constraints);
        }

        const absoluteNoteRanges = [];
        const penaltyAbsoluteNoteRanges = [];
        const constants = [];
        const undefines = [];
        const hints = [];
        const hintDistances = [];
        const penaltyHintDistances = [];
        const chordRootConstraints = [];
        const chordBassConstraints = [];
        const maxSpacings = [];
        const penaltyMaxSpacings = [];
        const suspensions = [];
        const anticipations = [];

        for (let i=0; i<voiceLines.length; i++) {
            const line = voiceLines[i];

            if (line instanceof DoubledVoiceLine) {
                // Doubled voice lines are dealt with after planning
                continue;
            }

            const lineElements = line.getSingleStepVoiceLineElements(chr, module);

            hints[i] = [];
            hintDistances[i] = [];
            penaltyHintDistances[i] = [];
            absoluteNoteRanges[i] = [];
            penaltyAbsoluteNoteRanges[i] = [];
            chordRootConstraints[i] = [];
            chordBassConstraints[i] = [];
            maxSpacings[i] = [];
            penaltyMaxSpacings[i] = [];

            constants[i] = [];
            undefines[i] = [];

            suspensions[i] = [];
            anticipations[i] = [];

            for (let j=0; j<lineElements.length; j++) {
                const element = lineElements[j];
                let absoluteNoteRange = arrayCopy(this.defaultAbsoluteNoteRange);
                let penaltyAbsoluteNoteRange = arrayCopy(this.defaultAbsoluteNoteRange);
                const harmonyElement = chr.get(j);
                let isConstant = false;
                let isUndefined = false;
                let hintAbsNote = null;
                let hintDistance = this.defaultHintDistance;
                let penaltyHintDistance = this.defaultHintDistance;
                let maxSpacing = this.defaultMaxSpacing;
                let penaltyMaxSpacing = this.defaultMaxSpacing;
                let chordBassConstraint = [];
                let chordRootConstraint = [];

                if (element instanceof ConstantVoiceLineElement) {
                    const absNote = harmonyElement.getAbsoluteNoteConstantVoiceLineElement(element);
                    absoluteNoteRange = [absNote, absNote];
                    isConstant = true;
                } else if (element instanceof ClassicalAdaptiveVoiceLineElement) {
                    if (element.range && element.range.length == 2) {
                        let lower = harmonyElement.getAbsoluteNoteWithIndexType(element.range[0], element.rangeIndexType);
                        let upper = harmonyElement.getAbsoluteNoteWithIndexType(element.range[1], element.rangeIndexType);
                        absoluteNoteRange = [lower, upper];
                    }
                    if (element.penaltyRange && element.penaltyRange.length == 2) {
                        let lower = harmonyElement.getAbsoluteNoteWithIndexType(element.penaltyRange[0], element.rangeIndexType);
                        let upper = harmonyElement.getAbsoluteNoteWithIndexType(element.penaltyRange[1], element.rangeIndexType);
                        penaltyAbsoluteNoteRange = [lower, upper];
                    }
                    if (element.hintIndex === null || element.maxHintDistance === null) {
                        // Not defined in the adaptive element. This signals the use of default value in planner
                    } else {
                        hintAbsNote = harmonyElement.getAbsoluteNoteWithIndexType(element.hintIndex, element.hintIndexType);
                        let upper = harmonyElement.offset(hintAbsNote, element.hintDistanceOffsetType, element.maxHintDistance, harmonyElement);
                        let lower = harmonyElement.offset(hintAbsNote, element.hintDistanceOffsetType, -element.maxHintDistance, harmonyElement);
                        hintDistance = Math.max(Math.abs(hintAbsNote - upper), Math.abs(hintAbsNote - lower));
                        const penaltyUpper = harmonyElement.offset(hintAbsNote, element.hintDistanceOffsetType, element.penaltyMaxHintDistance, harmonyElement);
                        const penaltyLower = harmonyElement.offset(hintAbsNote, element.hintDistanceOffsetType, -element.penaltyMaxHintDistance, harmonyElement);
                        penaltyHintDistance = Math.max(Math.abs(hintAbsNote - penaltyUpper), Math.abs(hintAbsNote - penaltyLower));
    //                    logit("Hinting " + hintAbsNote + " " + upper + " " + lower + " " + penaltyHintDistance);
                    }
                    if (element.chordBassPitchClassConstraint) {
                        chordBassConstraint = element.chordBassPitchClassConstraint;
                    }
                    if (element.chordRootPitchClassConstraint) {
                        chordRootConstraint = element.chordRootPitchClassConstraint;
                    }
                    if (element.maxSpacing === null) {
                    } else {
                        maxSpacing = element.maxSpacing;
                    }
                    if (element.penaltyMaxSpacing === null) {
                    } else {
                        penaltyMaxSpacing = element.penaltyMaxSpacing;
                    }
                } else if (element instanceof UndefinedVoiceLineElement) {
                    isUndefined = true;
                } else {
                    logit(this._constructorName + " can not handle " + element._constructorName + "<br />");
                }
                absoluteNoteRanges[i][j] = absoluteNoteRange;
                penaltyAbsoluteNoteRanges[i][j] = penaltyAbsoluteNoteRange;
                constants[i][j] = isConstant;
                undefines[i][j] = isUndefined;
                hints[i][j] = hintAbsNote;
                hintDistances[i][j] = hintDistance;
                penaltyHintDistances[i][j] = penaltyHintDistance;
                maxSpacings[i][j] = maxSpacing;
                penaltyMaxSpacings[i][j] = penaltyMaxSpacing;
                chordBassConstraints[i][j] = chordBassConstraint;
                chordRootConstraints[i][j] = chordRootConstraint;
                suspensions[i][j] = element.suspend;
                anticipations[i][j] = element.anticipate;
            }
        }

        //    logit("chord bass stuff: " + JSON.stringify(chordBassConstraints) + "<br />");

        const options = {
            voiceCount: voiceLines.length,
            harmony: chr,
            absoluteNoteRanges: absoluteNoteRanges,
            penaltyAbsoluteNoteRanges: penaltyAbsoluteNoteRanges,
            constants: constants,
            undefines: undefines,
            suspensions: suspensions,
            anticipations: anticipations,
            absoluteNoteHints: hints,
            maxAbsoluteHintDistances: hintDistances,
            penaltyMaxAbsoluteHintDistances: penaltyHintDistances,
            chordRootPitchClassConstraints: chordRootConstraints,
            chordBassPitchClassConstraints: chordBassConstraints,
            maxSpacings: maxSpacings,
            penaltyMaxSpacings: penaltyMaxSpacings,
            maxSearchSteps: this.maxSearchStepsPerStep
    //        reusables: module.reusables
        };

        const vg = new ClassicalVoiceLineGenerator(options);
        vg.constraints = constraints;

        voiceLeadingTimer.start();


        let plannedVoiceLines = null;
        const reusableIndex = JSON.stringify(vg);
        vg.reusables = module.reusables;
        const toReuse = module.reusables[reusableIndex];
        if (toReuse) {
    //        logit("Reusing voice leading solution!");
            plannedVoiceLines = copyValueDeep(toReuse);
        } else {
    //        logit("NOT Reusing voice leading solution!");
            plannedVoiceLines = vg.search();
            module.reusables[reusableIndex] = plannedVoiceLines;
        }

        voiceLeadingTimer.pause();


        if (plannedVoiceLines) {
            for (let i=0; i<plannedVoiceLines.length; i++) {
                plannedVoiceLines[i].id = voiceLines[i].id;
            }
        } else {
            logit("ClassicalVoicePlanner failed with options: " + JSON.stringify(options));
        }

        addAll(result, plannedVoiceLines);
    }
}

