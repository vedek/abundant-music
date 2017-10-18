



const DynamicHarmonyMode = {
    ROOT: 0,
    NEIGHBOUR: 1,
    PASSING: 2,
    ROOT_MODULATION: 3,
    NEIGHBOUR_MODULATION: 4,
    PASSING_MODULATION: 5,
    ROOT_MIXTURE: 6,
    ROOT_MIXTURE_MODULATION: 7
};


class DynamicHarmonyState {
    constructor() {
        this.harmony = null;
        this.targetHarmony = null; // Keep track of where to go next or towards (passing target or neighbour)
        this.mode = DynamicHarmonyMode.ROOT;
        this.stepCost = 0;
        this._constructorName = "DynamicHarmonyState";
    }

    toString() {
        return "DHS {" +
            "harmony: " + this.harmony +
            "mode: " + this.mode +
            (this.targetHarmony ? "targetHarmony: " + this.targetHarmony : "") +
            "}";
    }

    copy() {
        return copyObjectDeep(this);
    //    let result = new DynamicHarmonyState();
    //    result.harmony = this.harmony ? this.harmony.copy() : null;
    //    result.targetHarmony = this.targetHarmony ? this.targetHarmony.copy() : null;
    //    result.mode = this.mode;
    //    return result;
    }
}

class DynamicHarmonyGenerator extends HarmonyGenerator {
    constructor(options) {
        super(options);
        this.scaleBaseNote = getValueOrDefault(options,
            "scaleBaseNote", 60);
        this.scaleType = getValueOrDefault(options,
            "scaleType", ScaleType.MAJOR);

        this.modulate = getValueOrDefault(options,
            "modulate", false);
        this.modulateInvertScaleType = getValueOrDefault(options,
            "modulateInvertScaleType", false);

        this.mixture = getValueOrDefault(options,
            "mixture", true);
        this.simpleMixtureLikelihood = getValueOrDefault(options,
            "simpleMixtureLikelihood", 1);
        this.sus2Likelihood = getValueOrDefault(options,
            "sus2Likelihood", 1);
        this.sus4Likelihood = getValueOrDefault(options,
            "sus4Likelihood", 1);

        this.majorMixtureChordTypes = getValueOrDefault(options,
            "majorMixtureChordTypes", [MajorMixtureChordType.I, MajorMixtureChordType.II6, MajorMixtureChordType.IV, MajorMixtureChordType.VI]);
        this.majorMixtureChordTypeLikelihoods = getValueOrDefault(options,
            "majorMixtureChordTypeLikelihoods", [1, 1, 1, 1]);
        this.majorMixtureChordTypeCosts = getValueOrDefault(options,
            "majorMixtureChordTypeCosts", [0, 0, 0, 0]);
        this.minorMixtureChordTypes = getValueOrDefault(options,
            "minorMixtureChordTypes", [MinorMixtureChordType.I]);
        this.minorMixtureChordTypeLikelihoods = getValueOrDefault(options,
            "minorMixtureChordTypeLikelihoods", [1]);
        this.minorMixtureChordTypeCosts = getValueOrDefault(options,
            "minorMixtureChordTypeCosts", [0]);

        this.startsOnStrong = getValueOrDefault(options,
            "startsOnStrong", [true]);

        this.majorModulationTarget = getValueOrDefault(options,
            "majorModulationTarget", DynamicHarmonyModulationTarget.DOMINANT);
        this.minorModulationTarget = getValueOrDefault(options,
            "minorModulationTarget", DynamicHarmonyModulationTarget.MEDIANT);
        this.majorStartRoots = getValueOrDefault(options,
            "majorStartRoots", [0]);
        this.majorStartRootLikelihoods = getValueOrDefault(options,
            "majorStartRootLikelihoods", [1]);
        this.majorStartRootCosts = getValueOrDefault(options,
            "majorStartRootCosts", [0]);
        this.minorStartRoots = getValueOrDefault(options,
            "minorStartRoots", [0]);
        this.minorStartRootLikelihoods = getValueOrDefault(options,
            "minorStartRootLikelihoods", [1]);
        this.minorStartRootCosts = getValueOrDefault(options,
            "minorStartRootCosts", [0]);
        this.startHarmony = getValueOrDefault(options,
            "startHarmony", new ConstantHarmonyElement().setChordRoot(this.majorStartRoots[0]).setBaseNote(this.scaleBaseNote).setScaleType(this.scaleType));

        this.useSus2 = getValueOrDefault(options, "useSus2", false);
        this.useSus4 = getValueOrDefault(options, "useSus4", true);
        this.canEndWithSus2 = getValueOrDefault(options, "canEndWithSus2", true);
        this.canEndWithSus4 = getValueOrDefault(options, "canEndWithSus4", true);


        this.majorScaleSeventhLikelihoods = getValueOrDefault(options,
            "majorScaleSeventhLikelihoods", [[0, 1, 0, 1, 0, 1, 1]]); // Should be an array3d since we want one likelihood for every inversion
        this.majorScaleTriadLikelihoods = getValueOrDefault(options,
            "majorScaleTriadLikelihoods", [[1, 1, 1, 1, 1, 1, 1]]);
        this.majorScaleSus2Likelihoods = getValueOrDefault(options,
            "majorScaleSus2Likelihoods", [[1, 1, 0, 1, 1, 1, 0]]);
        this.majorScaleSus4Likelihoods = getValueOrDefault(options,
            "majorScaleSus4Likelihoods", [[1, 1, 1, 0, 1, 1, 0]]);

        this.majorScaleSeventhCosts = getValueOrDefault(options,
            "majorScaleSeventhCosts", [[0, 0, 0, 0, 0, 0, 0]]);
        this.majorScaleTriadCosts = getValueOrDefault(options,
            "majorScaleTriadCosts", [[0, 0, 0, 0, 0, 0, 0]]);
        this.majorScaleSus2Costs = getValueOrDefault(options,
            "majorScaleSus2Costs", [[0, 0, 0, 0, 0, 0, 0]]);
        this.majorScaleSus4Costs = getValueOrDefault(options,
            "majorScaleSus4Costs", [[0, 0, 0, 0, 0, 0, 0]]);


        this.minorScaleSeventhLikelihoods = getValueOrDefault(options,
            "minorScaleSeventhLikelihoods", [[0, 1, 0, 1, 0, 1, 0]]);
        this.minorScaleTriadLikelihoods = getValueOrDefault(options,
            "minorScaleTriadLikelihoods", [[1, 1, 1, 1, 1, 1, 1]]);
        this.minorScaleSus2Likelihoods = getValueOrDefault(options,
            "minorScaleSus2Likelihoods", [[0, 1, 1, 1, 0, 1, 0]]);
        this.minorScaleSus4Likelihoods = getValueOrDefault(options,
            "minorScaleSus4Likelihoods", [[0, 1, 1, 1, 1, 0, 0]]);

        this.minorScaleSeventhCosts = getValueOrDefault(options,
            "minorScaleSeventhCosts", [[0, 0, 0, 0, 0, 0, 0]]);
        this.minorScaleTriadCosts = getValueOrDefault(options,
            "minorScaleTriadCosts", [[0, 0, 0, 0, 0, 0, 0]]);
        this.minorScaleSus2Costs = getValueOrDefault(options,
            "minorScaleSus2Costs", [[0, 0, 0, 0, 0, 0, 0]]);
        this.minorScaleSus4Costs = getValueOrDefault(options,
            "minorScaleSus4Costs", [[0, 0, 0, 0, 0, 0, 0]]);

        this.majorProgressionRoots = getValueOrDefault(options,
            "majorProgressionRoots", [[0, 1, 2, 3, 4, 5]]);
        this.majorProgressionRootLikelihoods = getValueOrDefault(options,
            "majorProgressionRootLikelihoods", [[1]]);
        this.minorProgressionRoots = getValueOrDefault(options,
            "minorProgressionRoots", [[0, 2, 3, 4, 5, 6]]);
        this.minorProgressionRootLikelihoods = getValueOrDefault(options,
            "minorProgressionRootLikelihoods", [[1]]);

        this.majorProgressionMovements = getValueOrDefault(options,
            "majorProgressionMovements", [[-4, -2, 1, -1, -3, 2]]);
        this.majorProgressionMovementLikelihoods = getValueOrDefault(options,
            "majorProgressionMovementLikelihoods", [[1, 1, 1, 0.2, 0.2, 0.2]]);
        this.majorProgressionMovementCosts = getValueOrDefault(options,
            "majorProgressionMovementCosts", [[0, 0, 0, 0, 0, 0]]);
        this.minorProgressionMovements = getValueOrDefault(options,
            "minorProgressionMovements", [[-4, -2, 1, -1, -3, 2]]);
        this.minorProgressionMovementLikelihoods = getValueOrDefault(options,
            "minorProgressionMovementLikelihoods", [[1, 1, 1, 0.2, 0.2, 0.2]]);
        this.minorProgressionMovementCosts = getValueOrDefault(options,
            "minorProgressionMovementCosts", [[0, 0, 0, 0, 0, 0]]);
        this.intoAppliedProgressionMovements = getValueOrDefault(options,
            "intoAppliedProgressionMovements", [[-4, -2, 1, 0, -1, -3, 2]]);
        this.intoAppliedProgressionMovementLikelihoods = getValueOrDefault(options,
            "intoAppliedProgressionMovementLikelihoods", [[1, 0.75, 0.5, 0.25, 0.1, 0.1, 0.1]]);
        this.intoAppliedProgressionMovementCosts = getValueOrDefault(options,
            "intoAppliedProgressionMovementCosts", [[0, 0, 0, 0, 0]]);
        this.intoMixtureProgressionMovements = getValueOrDefault(options,
            "intoMixtureProgressionMovements", [-4, -2, 1, 0, -1, -3, 2]);
        this.intoMixtureProgressionMovementLikelihoods = getValueOrDefault(options,
            "intoMixtureProgressionMovementLikelihoods", [1, 1, 1, 1, 1, 0.2, 0.2]);
        this.intoMixtureProgressionMovementCosts = getValueOrDefault(options,
            "intoMixtureProgressionMovementCosts", [0, 0, 0, 0, 0, 0, 0]);


        this.majorPossibleEndRoots = getValueOrDefault(options,
            "majorPossibleEndRoots", [1, 3, 5]);
        this.minorPossibleEndRoots = getValueOrDefault(options,
            "minorPossibleEndRoots", [3, 5]);
        this.majorPossibleEndSus2Roots = getValueOrDefault(options,
            "majorPossibleEndSus2Roots", []);
        this.minorPossibleEndSus2Roots = getValueOrDefault(options,
            "minorPossibleEndSus2Roots", []);
        this.majorPossibleEndSus4Roots = getValueOrDefault(options,
            "majorPossibleEndSus4Roots", []);
        this.minorPossibleEndSus4Roots = getValueOrDefault(options,
            "minorPossibleEndSus4Roots", []);
        this.majorPossibleEndInversions = getValueOrDefault(options,
            "majorPossibleEndInversions", [[0]]);
        this.minorPossibleEndInversions = getValueOrDefault(options,
            "minorPossibleEndInversions", [[0]]);


        this.majorModulationPossibleEndRoots = getValueOrDefault(options,
            "majorModulationPossibleEndRoots", [1, 3, 5]);
        this.minorModulationPossibleEndRoots = getValueOrDefault(options,
            "minorModulationPossibleEndRoots", [3, 5]);
        this.majorModulationPossibleEndSus2Roots = getValueOrDefault(options,
            "majorModulationPossibleEndSus2Roots", []);
        this.majorModulationPossibleEndSus4Roots = getValueOrDefault(options,
            "majorModulationPossibleEndSus4Roots", []);
        this.minorModulationPossibleEndSus2Roots = getValueOrDefault(options,
            "minorModulationPossibleEndSus2Roots", []);
        this.minorModulationPossibleEndSus4Roots = getValueOrDefault(options,
            "minorModulationPossibleEndSus4Roots", []);
        this.majorModulationPossibleEndInversions = getValueOrDefault(options,
            "majorModulationPossibleEndInversions", [[0]]);
        this.minorModulationPossibleEndInversions = getValueOrDefault(options,
            "minorModulationPossibleEndInversions", [[0]]);

        this.majorPassingRoots = getValueOrDefault(options,
            "majorPassingRoots", [0, 1, 2, 3, 4, 5, 6]);
        this.majorPassingRootLikelihoods = getValueOrDefault(options,
            "majorPassingRootLikelihoods", [1]);
        this.minorPassingRoots = getValueOrDefault(options,
            "minorPassingRoots", [0, 1, 2, 3, 4, 5, 6]);
        this.minorPassingRootLikelihoods = getValueOrDefault(options,
            "minorPassingRootLikelihoods", [1]);

        this.passingInversions = getValueOrDefault(options,
            "passingInversions", [1, 2]);
        this.passingInversionLikelihoods = getValueOrDefault(options,
            "passingInversionLikelihoods", [1, 0.5]);

        this.passingIncrements = getValueOrDefault(options,
            "passingIncrements", [-2, -1, 1, 2]);
        this.passingIncrementLikelihoods = getValueOrDefault(options,
            "passingIncrementLikelihoods", [0.5, 1, 1, 0.5]);

        this.majorNeighbourChordRoots = getValueOrDefault(options,
            "majorNeighbourChordRoots", [0, 1, 2, 3, 4, 5, 6]);
        this.majorNeighbourChordInversions = getValueOrDefault(options,
            "majorNeighbourChordInversions", [[1], [1], [1], [1], [1], [1], [1]]);
        this.minorNeighbourChordRoots = getValueOrDefault(options,
            "minorNeighbourChordRoots", [0, 1, 2, 3, 4, 5, 6]);
        this.minorNeighbourChordInversions = getValueOrDefault(options,
            "minorNeighbourChordInversions", [[1], [1], [1], [1], [1], [1], [1]]);
        this.majorNeighbourSusChordRoots = getValueOrDefault(options,
            "majorNeighbourSusChordRoots", [0, 1, 4, 5]);
        this.minorNeighbourSusChordRoots = getValueOrDefault(options,
            "minorNeighbourSusChordRoots", [0, 2, 3]);
        this.majorNeighbourMixtureChordRoots = getValueOrDefault(options,
            "majorNeighbourMixtureChordRoots", [0, 1, 2, 3, 4, 5, 6]);
        this.minorNeighbourMixtureChordRoots = getValueOrDefault(options,
            "minorNeighbourMixtureChordRoots", [0, 1, 2, 3, 4, 5, 6]);

        this.expansionRoots = getValueOrDefault(options,
            "expansionRoots", [0, 1, 2, 3, 4, 5, 6]);
        this.expansionInversions = getValueOrDefault(options,
            "expansionInversions", [[1]]);

        this.rootProgressionLikelihood = getValueOrDefault(options,
            "rootProgressionLikelihood", 1);
        this.rootProgressionCost = getValueOrDefault(options,
            "rootProgressionCost", 0);
        this.repeatRootLikelihood = getValueOrDefault(options,
            "repeatRootLikelihood", 0);
        this.repeatRootCost = getValueOrDefault(options,
            "repeatRootCost", 0);
        this.passingLikelihood = getValueOrDefault(options,
            "passingLikelihood", 1);
        this.passingCost = getValueOrDefault(options,
            "passingCost", 10);
        this.neighbourLikelihood = getValueOrDefault(options,
            "neighbourLikelihood", 1);
        this.neighbourCost = getValueOrDefault(options,
            "neighbourCost", 0);
        this.expansionLikelihood = getValueOrDefault(options,
            "expansionLikelihood", 1);
        this.expansionCost = getValueOrDefault(options,
            "expansionCost", 0);
        this.modulateLikelihoods = getValueOrDefault(options,
            "modulateLikelihoods", [0.2, 0.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]);
        this.modulateCosts = getValueOrDefault(options,
            "modulateCosts", [0]);

        this.neighbourSeventhLikelihoods = getValueOrDefault(options,
            "neighbourSeventhLikelihoods", [[1, 1, 1, 1, 1, 1, 1]]);
        this.neighbourTriadLikelihoods = getValueOrDefault(options,
            "neighbourTriadLikelihoods", [[1, 1, 1, 1, 1, 1, 1]]);

        this.neighbourSeventhCosts = getValueOrDefault(options,
            "neighbourSeventhCosts", [[0, 0, 0, 0, 0, 0, 0]]);
        this.neighbourTriadCosts = getValueOrDefault(options,
            "neighbourTriadCosts", [[0, 0, 0, 0, 0, 0, 0]]);

        this.neighbourMixtureSeventhLikelihoods = getValueOrDefault(options,
            "neighbourMixtureSeventhLikelihoods", [[0, 0, 0, 0, 0, 0, 0]]);
        this.neighbourMixtureTriadLikelihoods = getValueOrDefault(options,
            "neighbourMixtureTriadLikelihoods", [[1, 1, 1, 1, 1, 1, 1]]);

        this.neighbourMixtureSeventhCosts = getValueOrDefault(options,
            "neighbourMixtureSeventhCosts", [[0, 0, 0, 0, 0, 0, 0]]);
        this.neighbourMixtureTriadCosts = getValueOrDefault(options,
            "neighbourMixtureTriadCosts", [[0, 0, 0, 0, 0, 0, 0]]);

        this.mixtureSeventhLikelihoods = getValueOrDefault(options,
            "mixtureSeventhLikelihoods", [[0, 0, 0, 0, 0, 0, 0]]);
        this.mixtureTriadLikelihoods = getValueOrDefault(options,
            "mixtureTriadLikelihoods", [[1, 1, 1, 1, 1, 1, 1]]);

        this.mixtureSeventhCosts = getValueOrDefault(options,
            "mixtureSeventhCosts", [[0, 0, 0, 0, 0, 0, 0]]);
        this.mixtureTriadCosts = getValueOrDefault(options,
            "mixtureTriadCosts", [[0, 0, 0, 0, 0, 0, 0]]);

        this.majorAppliedChords = getValueOrDefault(options,
            "majorAppliedChords", [AppliedChordType.V6, AppliedChordType.V, AppliedChordType.V7, AppliedChordType.V65, AppliedChordType.V43, AppliedChordType.VII6]);
        this.majorAppliedChordLikelihoods = getValueOrDefault(options,
            "majorAppliedChordLikelihoods", [1, 1, 1, 1, 1, 1]);
        this.majorAppliedChordCosts = getValueOrDefault(options,
            "majorAppliedChordCosts", [0, 0, 0, 0, 0, 0]);
        this.minorAppliedChords = getValueOrDefault(options,
            "minorAppliedChords", [AppliedChordType.V6, AppliedChordType.V, AppliedChordType.V7, AppliedChordType.V65, AppliedChordType.V43, AppliedChordType.VII6]);
        this.minorAppliedChordLikelihoods = getValueOrDefault(options,
            "minorAppliedChordLikelihoods", [1, 1, 1, 1, 1, 1]);
        this.minorAppliedChordCosts = getValueOrDefault(options,
            "minorAppliedChordCosts", [0, 0, 0, 0, 0, 0]);

        this.addAllMovements = getValueOrDefault(options,
            "addAllMovements", true); // Adding all possible roots
        this.addAllStarts = getValueOrDefault(options,
            "addAllStarts", true);
    }

    getMinorSimpleMixtureChords(
        currentHarmony,
        majorMixtureChordTypes,
        majorMixtureChordTypeLikelihoods,
        majorMixtureChordTypeCosts,
        resultChords,
        resultLikelihoods,
        resultCosts
    ) {

    }

    getMajorSimpleMixtureChords(
        currentHarmony,
        majorMixtureChordTypes,
        majorMixtureChordTypeLikelihoods,
        majorMixtureChordTypeCosts,
        resultChords,
        resultLikelihoods,
        resultCosts
    ) {
        const secondPitchClass = currentHarmony.getAbsoluteNoteFromScaleIndex(1) % 12;
        const thirdPitchClass = currentHarmony.getAbsoluteNoteFromScaleIndex(2) % 12;
        const fifthPitchClass = currentHarmony.getAbsoluteNoteFromScaleIndex(4) % 12;
        const sixthPitchClass = currentHarmony.getAbsoluteNoteFromScaleIndex(5) % 12;

        const isSus = currentHarmony.isSus();

        const chordPitchClasses = currentHarmony.getChordPitchClasses();

        const bassPitchClass = currentHarmony.getAbsoluteNoteFromChordBassIndex(0) % 12;
        const bassIsSecond = bassPitchClass == secondPitchClass;
        const bassIsThird = bassPitchClass == thirdPitchClass;
        const bassIsFifth = bassPitchClass == fifthPitchClass;
        const bassIsSixth = bassPitchClass == sixthPitchClass;

        const hasSecond = arrayContains(chordPitchClasses, secondPitchClass);
        const hasThird = arrayContains(chordPitchClasses, thirdPitchClass);
        const hasFifth = arrayContains(chordPitchClasses, fifthPitchClass);
        const hasSixth = arrayContains(chordPitchClasses, sixthPitchClass);

        const intoMixtureRootMovements = this.intoMixtureProgressionMovementLikelihoods; // One array for each chord type
        const intoMixtureRootLikelihoods = this.intoMixtureProgressionMovementLikelihoods;
        const intoMixtureRootCosts = this.intoMixtureProgressionMovementCosts;


        const possibleChordRoots = [];
        for (let i=0; i<intoMixtureRootMovements.length; i++) {
            possibleChordRoots.push(positiveMod(currentHarmony.chordRoot + intoMixtureRootMovements[i], 7));
        }

        for (let i=0; i<majorMixtureChordTypes.length; i++) {

            const type = majorMixtureChordTypes[i];
            let chord = null;
            let ok;

            switch (type) {
                case MajorMixtureChordType.I:
                    // Lowering 3
                    let newChordRoot0 = 0;
                    ok = currentHarmony.chordRoot == newChordRoot0; // Always ok to move from same chord

                    if (!ok) {
                        // Need to have either 2 or 3 present at current harmony
                        ok = ((hasSecond && !bassIsSecond) || (hasThird && !bassIsThird)) && arrayContains(possibleChordRoots, newChordRoot0);
                    }
                    if (ok) {
                        chord = currentHarmony.copy();
                        chord.scaleType = ScaleType.HARMONIC_MINOR;
                        chord.chordType = ChordType.TRIAD;
                        chord.chordInversions = 0;
                        chord.chordRoot = 0;
                    }
                    break;
                case MajorMixtureChordType.IV:
                    // Lowering 3
                    let newChordRoot3 = 3;
                    ok = currentHarmony.chordRoot == newChordRoot3; // Always ok to move from same chord

                    if (!ok) {
                        // Need to have either 2 or 3 present at current harmony
                        ok = ((hasSecond && !bassIsSecond) || (hasThird && !bassIsThird)) && arrayContains(possibleChordRoots, newChordRoot3);
                    }
                    if (ok) {
                        chord = currentHarmony.copy();
                        chord.scaleType = ScaleType.HARMONIC_MINOR;
                        chord.chordType = ChordType.TRIAD;
                        chord.chordInversions = 0;
                        chord.chordRoot = 3;
    //                    logit(" ADding mixture chord IV from " + currentHarmony.toRomanString());
                    }
                    break;
                case MajorMixtureChordType.VI:
                    // Lowering both 3 and 6
                    // Need to have (2 or 3) and (5 or 6)
                    let newChordRoot5 = 5;
                    ok = currentHarmony.chordRoot == newChordRoot5; // Always ok to move from same chord


                    if (!ok) {
                        // Need to have either 2 or 3 present at current harmony
                        ok = ((hasSecond && !bassIsSecond) || (hasThird && !bassIsThird)) &&
                            ((hasFifth && !bassIsFifth) || (hasSixth && !bassIsSixth)) &&
                            arrayContains(possibleChordRoots, newChordRoot5);
                    }

                    if (ok) {
                        chord = currentHarmony.copy();
                        chord.scaleType = ScaleType.HARMONIC_MINOR;
                        chord.chordType = ChordType.TRIAD;
                        chord.chordInversions = 0;
                        chord.chordRoot = 5;
    //                    logit(" ADding mixture chord VI from " + currentHarmony.toRomanString());
                    }
                    break;
    //            case MajorMixtureChordType.II6:
    //                // Lowering 6
    //
    //                // Need to have either 5 or 6 at current harmony
    //                if (((hasFifth && bassPitchClass != fifthPitchClass) || (hasSixth && bassPitchClass != sixthPitchClass))  &&
    //                    arrayContains(possibleChordRoots, 1)) {
    //                    chord = currentHarmony.copy();
    //                    chord.scaleType = ScaleType.NATURAL_MINOR;
    //                    chord.chordRoot = 1;
    //                    chord.chordInversions = 1;
    //                }
    //                break;
            }
            if (chord) {
                resultChords.push(chord);
    //            logit(" adding mixutre chord " + chord.toRomanString());
                resultLikelihoods.push(majorMixtureChordTypeLikelihoods[i % majorMixtureChordTypeLikelihoods.length]);
                resultCosts.push(majorMixtureChordTypeCosts[i % majorMixtureChordTypeCosts.length]);
            }
        }

    }

    getMajorOutOfSimpleMixtureChords(currentHarmony, resultChords, resultLikelihoods, resultCosts) {
        const thirdPitchClass = currentHarmony.getAbsoluteNoteFromScaleIndex(2) % 12;
        const sixthPitchClass = currentHarmony.getAbsoluteNoteFromScaleIndex(5) % 12;

        const chordPitchClasses = currentHarmony.getChordPitchClasses();

        const rootPitchClass = chordPitchClasses[0];

        const bassPitchClass = currentHarmony.getAbsoluteNoteFromChordBassIndex(0) % 12;
        const bassIsThird = bassPitchClass == thirdPitchClass;
        const bassIsSixth = bassPitchClass == sixthPitchClass;

        const hasThird = arrayContains(chordPitchClasses, thirdPitchClass);
        const hasSixth = arrayContains(chordPitchClasses, sixthPitchClass);

        const outOfMixtureRootMovementsArr = [[0, -4, -2, 1, -1]];
        const outOfMixtureRootLikelihoodsArr = [[1, 1, 1, 1, 1]];
        const outOfMixtureRootCostArr = [[0, 0, 0, 0, 0]];

        const outOfMixtureRootMovements = outOfMixtureRootMovementsArr[0];
        const outOfMixtureRootLikelihoods = outOfMixtureRootLikelihoodsArr[0];
        const outOfMixtureRootCosts = outOfMixtureRootCostArr[0];

        const inversions = [0, 1];

        const outOfMixturePossibleRoots = [0, 1, 2, 3, 4, 5];

        for (let i=0; i<outOfMixtureRootMovements.length; i++) {
            for (let j=0; j<inversions.length; j++) {
                let ok = true;

                const nextHarmony = copyObjectDeep(currentHarmony);
                nextHarmony.scaleType = ScaleType.MAJOR;
                nextHarmony.chordRoot = positiveMod(nextHarmony.chordRoot + outOfMixtureRootMovements[i], 7);
                nextHarmony.chordInversions = inversions[j];

                if (!arrayContains(outOfMixturePossibleRoots, nextHarmony.chordRoot)) {
                    continue;
    //                ok = false;
                }

                const secondPitchClass = nextHarmony.getAbsoluteNoteFromScaleIndex(1) % 12;
                const fifthPitchClass = nextHarmony.getAbsoluteNoteFromScaleIndex(4) % 12;

                const nextBassPitchClass = nextHarmony.getAbsoluteNoteFromChordBassIndex(0) % 12;
                const nextBassIsSecond = secondPitchClass == nextBassPitchClass;
                const nextBassIsFifth = fifthPitchClass == nextBassPitchClass;
    //        logit(" testing out of mixture: " + nextHarmony.toRomanString());

                const nextChordPitchClasses = nextHarmony.getChordPitchClasses();

                if (hasThird) {
                    // Next chord must have a 2
                    const hasSecond = arrayContains(nextChordPitchClasses, secondPitchClass);
                    ok = ok && hasSecond && ((!bassIsThird && !nextBassIsSecond) || (bassIsThird && nextBassIsSecond));
                }

                if (hasSixth) {
                    // Next chord must have a 5
                    const hasFifth = arrayContains(nextChordPitchClasses, fifthPitchClass);
                    ok = ok && hasFifth && ((!bassIsSixth && !nextBassIsFifth) || (bassIsSixth && nextBassIsFifth));
                }

                if (ok) {
    //                logit(" Adding out of mixture chord " + nextHarmony.toRomanString());
                    resultChords.push(nextHarmony);
                    resultLikelihoods.push(outOfMixtureRootLikelihoods[i]);
                    resultCosts.push(outOfMixtureRootCosts[i]);
                } else {
    //                logit(" NOT Adding out of mixture chord " + nextHarmony.toRomanString() + " from " + currentHarmony.toRomanString());
                }
            }
        }
    }

    getMinorOutOfSimpleMixtureChords(currentHarmony, resultChords, resultLikelihoods, resultCosts) {
    }

    getStartStateIterator() {
        const result = [];
        const likelihoods = [];
        const costs = [];

        let isMinor = this.scaleType == ScaleType.NATURAL_MINOR;

        let startRoots = isMinor ? this.minorStartRoots : this.majorStartRoots;
        if (startRoots.length == 0) {
            startRoots = [0];
        }
        let startLikelihoods = isMinor ? this.minorStartRootLikelihoods : this.majorStartRootLikelihoods;
        if (startLikelihoods.length == 0) {
            startLikelihoods = [1];
        }
        let startCosts = isMinor ? this.minorStartRootCosts : this.majorStartRootCosts;
        if (startCosts.length == 0) {
            startCosts = [1];
        }

        const seventhLikelihoodArr = isMinor ? this.minorScaleSeventhLikelihoods : this.majorScaleSeventhLikelihoods;
        const triadLikelihoodArr = isMinor ? this.minorScaleTriadLikelihoods : this.majorScaleTriadLikelihoods;
        const seventhCostArr = isMinor ? this.minorScaleSeventhCosts : this.majorScaleSeventhCosts;
        const triadCostArr = isMinor ? this.minorScaleTriadCosts : this.majorScaleTriadCosts;

        let seventhLikelihoods = [0, 0, 0, 0, 0, 0, 0];
        if (seventhLikelihoodArr.length > 0) {
            seventhLikelihoods = seventhLikelihoodArr[0];
        }
        let triadLikelihoods = [1, 1, 1, 1, 1, 1, 1];
        if (triadLikelihoodArr.length > 0) {
            triadLikelihoods = triadLikelihoodArr[0];
        }
        let seventhCosts = [0, 0, 0, 0, 0, 0, 0];
        if (seventhCostArr.length > 0) {
            seventhCosts = seventhCostArr[0];
        }
        let triadCosts = [0, 0, 0, 0, 0, 0, 0];
        if (triadCostArr.length > 0) {
            triadCosts = triadCostArr[0];
        }

        for (let i=0; i<startRoots.length; i++) {
            const root = startRoots[i];
            const harmony = new ConstantHarmonyElement().setChordRoot(root);
            harmony.setBaseNote(this.scaleBaseNote).setScaleType(this.scaleType);

            const seventhLikelihood = seventhLikelihoods[root % seventhLikelihoods.length];
            const triadLikelihood = triadLikelihoods[root % triadLikelihoods.length];
            const seventhCost = seventhCosts[root % seventhCosts.length];
            const triadCost = triadCosts[root % triadCosts.length];

            if (seventhLikelihood > 0) {
                let state = new DynamicHarmonyState();
                state.mode = DynamicHarmonyMode.ROOT;
                state.harmony = copyObjectDeep(harmony);
                state.harmony.note = "D";
                state.harmony.chordType = ChordType.SEVENTH;

                result.push(state);
                likelihoods.push(startLikelihoods[i % startLikelihoods.length] * seventhLikelihood);
                costs.push(startCosts[i % startCosts.length] + seventhCost);
            }
            if (triadLikelihood > 0) {
                let state = new DynamicHarmonyState();
                state.mode = DynamicHarmonyMode.ROOT;
                state.harmony = copyObjectDeep(harmony);
                state.harmony.note = "D";
                state.harmony.chordType = ChordType.TRIAD;
                result.push(state);
                likelihoods.push(startLikelihoods[i % startLikelihoods.length] * triadLikelihood);
                costs.push(startCosts[i % startCosts.length] + triadCost);
            }
        }
        if (this.addAllStarts) {
            let progressionRoots = this.majorProgressionRoots;
            if (isMinor) {
                progressionRoots = this.minorProgressionRoots;
            }
            if (progressionRoots.length == 0) {
                progressionRoots = isMinor ? [[0, 2, 3, 4, 5, 6]] : [[0, 1, 2, 3, 4, 5]];
            }

            const lowLikelihood = 0.001;
            const highCost = 10;
            const veryHighCost = 100;
            const rootHarmony = new ConstantHarmonyElement().setChordRoot(0);
            rootHarmony.setBaseNote(this.scaleBaseNote).setScaleType(this.scaleType);
            for (let i=0; i<7; i++) {
                let state = new DynamicHarmonyState();
                if (!arrayContains(startRoots, i)) {
                    state.harmony = new ConstantHarmonyElement().setChordRoot(i);
                    state.harmony.setBaseNote(this.scaleBaseNote).setScaleType(this.scaleType);
                    state.harmony.note = "d";
                    state.mode = DynamicHarmonyMode.ROOT;
                    result.push(state);
                    const likelihoodMultiplier = 1.0;
                    let costMultiplier = 1.0;
                    // Make it extra costly to start with a bad progression root
                    if (!arrayContains(progressionRoots[0], i)) {
                        costMultiplier *= 10;
                    }
                    likelihoods.push(lowLikelihood);
                    costs.push(highCost * costMultiplier);
                }
            }
            if (this.modulate) {
                let isMinor = this.scaleType == ScaleType.NATURAL_MINOR;
                let endRoots = this.majorModulationPossibleEndRoots;
                if (isMinor) {
                    endRoots = this.minorModulationPossibleEndRoots;
                }
                let modulationTarget = this.majorModulationTarget;
                if (isMinor) {
                    modulationTarget = this.minorModulationTarget;
                }
                const modHarmony = new ConstantHarmonyElement();
                modHarmony.setScaleType(DynamicHarmonyModulationTarget.getScaleType(this.scaleType, modulationTarget, this.modulateInvertScaleType));
                const modScaleBaseNote = rootHarmony.getAbsoluteNoteFromScaleIndex(modulationTarget + 1);
                modHarmony.setBaseNote(modScaleBaseNote);

                // logit(" modScaleBase: " + modScaleBaseNote + "<br />");
                for (let i=0; i<endRoots.length; i++) {
                    const modState = new DynamicHarmonyState();
                    modState.harmony = copyObjectDeep(modHarmony).setChordRoot(endRoots[i]);
                    modState.harmony.note = "d, m";
                    modState.mode = DynamicHarmonyMode.ROOT_MODULATION;

                    result.push(modState);
                    likelihoods.push(lowLikelihood);
                    costs.push(veryHighCost);
                }
            }
        }
        //    logit("Possible start states: " + result + " " + likelihoods + "<br />");

        return new RandomDfsStateIterator2(result, likelihoods, costs, this.rnd);
    }

    isGoalState(state) {
        const isMinor = state.harmony.scaleType == ScaleType.NATURAL_MINOR;

        let endRoots;
        let endRootInversions;

        switch (state.mode) {
            case DynamicHarmonyMode.ROOT_MODULATION:
            case DynamicHarmonyMode.NEIGHBOUR_MODULATION:
            case DynamicHarmonyMode.PASSING_MODULATION:
                endRoots = isMinor ? this.minorModulationPossibleEndRoots : this.majorModulationPossibleEndRoots;
                endRootInversions = isMinor ? this.minorModulationPossibleEndInversions : this.majorModulationPossibleEndInversions;
                if (state.harmony.isSus2()) {
                    endRoots = isMinor ? this.minorModulationPossibleEndSus2Roots : this.majorModulationPossibleEndSus2Roots;
                }
                if (state.harmony.isSus4()) {
                    endRoots = isMinor ? this.minorModulationPossibleEndSus4Roots : this.majorModulationPossibleEndSus4Roots;
                }
                if (endRoots.length > 0) {
                    let rootPitchClass =
                        state.harmony.getAbsoluteNoteFromScaleIndex(state.harmony.getChordRootScaleIndex()) % 12;
                    for (let i=0; i<endRoots.length; i++) {
                        let inversions = state.harmony.chordInversions;
                        let pitchClass = state.harmony.getAbsoluteNoteFromScaleIndex(endRoots[i]) % 12;
                        if (pitchClass == rootPitchClass && arrayContains(endRootInversions[i % endRootInversions.length], inversions)) {
                            return true;
                        }
                    }
                    return false;
                }
                return false;
            case DynamicHarmonyMode.ROOT:
            case DynamicHarmonyMode.NEIGHBOUR:
            case DynamicHarmonyMode.PASSING:
                endRoots = isMinor ? this.minorPossibleEndRoots : this.majorPossibleEndRoots;
                endRootInversions = isMinor ? this.minorPossibleEndInversions : this.majorPossibleEndInversions;
                if (state.harmony.isSus2()) {
                    endRoots = isMinor ? this.minorPossibleEndSus2Roots : this.majorPossibleEndSus2Roots;
                }
                if (state.harmony.isSus4()) {
                    endRoots = isMinor ? this.minorPossibleEndSus4Roots : this.majorPossibleEndSus4Roots;
                }
                if (this.modulate) {
                    return false;
                }
                if (endRoots.length > 0) {
                    let rootPitchClass =
                        state.harmony.getAbsoluteNoteFromScaleIndex(state.harmony.getChordRootScaleIndex()) % 12;
                    for (let i=0; i<endRoots.length; i++) {
                        let inversions = state.harmony.chordInversions;
                        let pitchClass = state.harmony.getAbsoluteNoteFromScaleIndex(endRoots[i]) % 12;
                        if (pitchClass == rootPitchClass && arrayContains(endRootInversions[i % endRootInversions.length], inversions)) {
                            return true;
                        }
                    }
                    return false;
                }
                return false;
            default:
                return false;
        }
        return false;
    }

    isInvalidState(state) {
        return false;
    }

    getAppliedChordsAndLikelihoods(
        node,
        possiblePitchClasses,
        pitchClassLikelihoods,
        pitchClassCosts,
        scaleBaseNote,
        scaleType,
        states,
        likelihoods,
        costs
    ) {

        const isMinor = scaleType == ScaleType.NATURAL_MINOR;

        const appliedChordTypes = isMinor ? this.minorAppliedChords : this.majorAppliedChords;
        const appliedChordLikelihoods = isMinor ? this.minorAppliedChordLikelihoods : this.majorAppliedChordLikelihoods;
        const appliedChordCosts = isMinor ? this.minorAppliedChordCosts : this.majorAppliedChordCosts;

        const chordInfos = [];

        for (let i=0; i<appliedChordTypes.length; i++) {
            const type = appliedChordTypes[i];
            switch (type) {
                case AppliedChordType.V:
                    chordInfos.push({
                        root: 4,
                        inv: 0,
                        type: ChordType.TRIAD
                    });
                    break;
                case AppliedChordType.V6:
                    chordInfos.push({
                        root: 4,
                        inv: 1,
                        type: ChordType.TRIAD
                    });
                    break;
                case AppliedChordType.V7:
                    chordInfos.push({
                        root: 4,
                        inv: 0,
                        type: ChordType.SEVENTH
                    });
                    break;
                case AppliedChordType.V65:
                    chordInfos.push({
                        root: 4,
                        inv: 1,
                        type: ChordType.SEVENTH
                    });
                    break;
                case AppliedChordType.V43:
                    chordInfos.push({
                        root: 4,
                        inv: 2,
                        type: ChordType.SEVENTH
                    });
                    break;
                case AppliedChordType.VII:
                    chordInfos.push({
                        root: 6,
                        inv: 0,
                        type: ChordType.TRIAD
                    });
                    break;
                case AppliedChordType.VII6:
                    chordInfos.push({
                        root: 6,
                        inv: 1,
                        type: ChordType.TRIAD
                    });
                    break;
                default:
                    logit("Applied chord " + type + " not supported yet...");
                    chordInfos.push({
                        root: 4,
                        inv: 0,
                        type: ChordType.TRIAD
                    });
                    break;
            }
        }

        for (let i=0; i<chordInfos.length; i++) {
            const info = chordInfos[i];
            const modulateState = copyObjectDeep(node.state);
            const modulateHarmony = modulateState.harmony;
            modulateHarmony.setBaseNote(scaleBaseNote);
            modulateHarmony.setChordRoot(info.root);
            modulateHarmony.setChordType(info.type);
            modulateHarmony.setChordInversions(info.inv);
            modulateHarmony.setScaleType(scaleType);

            modulateState.harmony = modulateHarmony;
            modulateState.harmony.note = "D, M";
            modulateState.mode = DynamicHarmonyMode.ROOT_MODULATION;

            const newChordRootPitchClass = modulateHarmony.getAbsoluteNoteFromChordRootIndex(0) % 12;

            const pitchClassIndex = possiblePitchClasses.indexOf(newChordRootPitchClass);

    //        logit("  checking applied for root pc: "  + newChordRootPitchClass);
            if (pitchClassIndex >= 0) {

    //            logit("Found applied " + (new ConstantHarmonicRythm([modulateState.harmony]).toRomanString()))

                states.push(modulateState);
                likelihoods.push(appliedChordLikelihoods[i % appliedChordLikelihoods.length] * pitchClassLikelihoods[pitchClassIndex]);
                costs.push(appliedChordCosts[i % appliedChordCosts.length] + pitchClassCosts[pitchClassIndex]);
    //        } else if (this.addAllMovements) {
    //            states.push(modulateState);
    //            likelihoods.push(0.001);
            }
        }
    }

    addChordState(
        state,
        chordRoot,
        likelihood,
        cost,
        scale,
        states,
        likelihoods,
        costs,
        possiblePitchClasses,
        chordType,
        inversions,
        note
    ) {

        if (typeof(chordType) === 'undefined') {
            chordType = ChordType.TRIAD;
        }
        if (typeof(inversions) === 'undefined') {
            inversions = 0;
        }

        const movementState = state.copy();
        movementState.harmony.setChordRoot(positiveMod(chordRoot, scale.length));

        possiblePitchClasses.push(movementState.harmony.getAbsoluteNoteFromChordRootIndex(0) % 12);
        //            movementState.harmony.setChordType(ChordType.SEVENTH);
        movementState.harmony.setChordType(chordType);
        movementState.harmony.setChordInversions(inversions);

        movementState.harmony.note = note;

        likelihoods.push(likelihood);
        costs.push(cost);
        states.push(movementState);
    }

    getNeighbourStatesAndLikelihoods(node, nextStates, nextLikelihoods, nextCosts) {

        const targetHarmony = node.state.targetHarmony;

        const returnState = node.state.copy();
        returnState.harmony = copyObjectDeep(targetHarmony);
        returnState.mode = node.state.mode == DynamicHarmonyMode.NEIGHBOUR ? DynamicHarmonyMode.ROOT : DynamicHarmonyMode.ROOT_MODULATION;

    //    logit("Returning from neighbour to " + returnState.harmony.toRomanString() + " from " + node.state.harmony.toRomanString());

        nextStates.push(returnState);
        nextLikelihoods.push(1);
        nextCosts.push(0);
    }

    getMixtureStatesAndLikelihoods(node, nextStates, nextLikelihoods, nextCosts) {
        const harmony = node.state.harmony;

        const isMinor = harmony.scaleType == ScaleType.MAJOR ? false : true;

        const chords = [];
        const likelihoods = [];
        const costs = [];
        if (isMinor) {
            // Current harmony is minor because it is mixture, we will move to major
            this.getMajorOutOfSimpleMixtureChords(harmony, chords, likelihoods, costs);
        } else {
            this.getMinorOutOfSimpleMixtureChords(harmony, chords, likelihoods, costs);
        }

        for (let i=0; i<chords.length; i++) {
            const mixtureState = node.state.copy();
            mixtureState.harmony = chords[i];
            mixtureState.mode = node.state.mode == DynamicHarmonyMode.ROOT_MIXTURE ? DynamicHarmonyMode.ROOT : DynamicHarmonyMode.ROOT_MODULATION;
            mixtureState.harmony.note = "D" + (mixtureState.mode == DynamicHarmonyMode.ROOT ? "" : ", M");
            this.getChordsStuff(node.depth, mixtureState, 1, 0, this.mixtureSeventhLikelihoods, this.mixtureTriadLikelihoods,
                this.mixtureSeventhCosts, this.mixtureTriadCosts, nextStates, nextLikelihoods, nextCosts);
        }

        // It should be possible to stay in the other scale type also...

    }

    getRootStatesAndLikelihoods(node, nextStates, nextLikelihoods, nextCosts) {
        let state = node.state;
        const mode = state.mode;
        const atAnyRoot = (mode == DynamicHarmonyMode.ROOT || mode == DynamicHarmonyMode.ROOT_MODULATION);
        const atRoot = mode == DynamicHarmonyMode.ROOT;
        const atModulationRoot = mode == DynamicHarmonyMode.ROOT_MODULATION;
        if (atAnyRoot && this.repeatRootLikelihood > 0) {
            nextStates.push(node.state.copy());
            nextLikelihoods.push(this.repeatRootLikelihood);
            nextCosts.push(this.repeatRootCost);
        }
        const currentHarmony = node.state.harmony;
        const isMinor = currentHarmony.scaleType == ScaleType.NATURAL_MINOR;
        const scale = currentHarmony.getScale();

        const possiblePitchClasses = []; // Is this even used?


        if (this.expansionLikelihood > 0 && currentHarmony.chordInversions == 0) {
            const expandState = node.state.copy();
            expandState.harmony.chordInversions = 1;
            expandState.harmony.note = "D, " + (atRoot ? "E" : "ME");
            nextStates.push(expandState);
            nextLikelihoods.push(this.expansionLikelihood);
            nextCosts.push(this.expansionCost);
        }

        if (atAnyRoot &&
            this.rootProgressionLikelihood > 0) {

            const rootLikelihoods = [];
            const rootCosts = [];
            const rootStates = [];

            let currentChordRoot = currentHarmony.getChordRootScaleIndex();

            let rootsArr = isMinor ? this.minorProgressionRoots : this.majorProgressionRoots;
            let movementsArr = isMinor ? this.minorProgressionMovements : this.majorProgressionMovements;
            if (movementsArr.length == 0) {
                movementsArr = [[-4, -2, 1]];
            }
            if (rootsArr.length == 0) {
                rootsArr = isMinor ? [[0, 2, 3, 4, 5, 6]] : [[0, 1, 2, 3, 4, 5]];
            }
            const movements = movementsArr[node.depth % movementsArr.length];
            const roots = rootsArr[node.depth % rootsArr.length];

            let movementLikelihoods = isMinor ? this.minorProgressionMovementLikelihoods : this.majorProgressionMovementLikelihoods;
            if (movementLikelihoods.length == 0) {
                movementLikelihoods = [[1]];
            }
            let movementCosts = isMinor ? this.minorProgressionMovementCosts : this.majorProgressionMovementCosts;
            if (movementCosts.length == 0) {
                movementCosts = [[1]];
            }

            const seventhLikelihoodArr = isMinor ? this.minorScaleSeventhLikelihoods : this.majorScaleSeventhLikelihoods;
            const triadLikelihoodArr = isMinor ? this.minorScaleTriadLikelihoods: this.majorScaleTriadLikelihoods;
            const sus2LikelihoodArr = isMinor ? this.minorScaleSus2Likelihoods: this.majorScaleSus2Likelihoods;
            const sus4LikelihoodArr = isMinor ? this.minorScaleSus4Likelihoods: this.majorScaleSus4Likelihoods;

            const seventhCostArr = isMinor ? this.minorScaleSeventhCosts : this.majorScaleSeventhCosts;
            const triadCostArr = isMinor ? this.minorScaleTriadCosts: this.majorScaleTriadCosts;
            const sus2CostArr = isMinor ? this.minorScaleSus2Costs: this.majorScaleSus2Costs;
            const sus4CostArr = isMinor ? this.minorScaleSus4Costs: this.majorScaleSus4Costs;

            let seventhLikelihoods = [0, 0, 0, 0, 0, 0, 0];
            if (seventhLikelihoodArr.length > 0) {
                seventhLikelihoods = seventhLikelihoodArr[node.depth % seventhLikelihoodArr.length];
            }
            let triadLikelihoods = [1, 1, 1, 1, 1, 1, 1];
            if (triadLikelihoodArr.length > 0) {
                triadLikelihoods = triadLikelihoodArr[node.depth % triadLikelihoodArr.length];
            }
            let sus2Likelihoods = [1, 1, 1, 1, 1, 1, 1];
            if (sus2LikelihoodArr.length > 0) {
                sus2Likelihoods = sus2LikelihoodArr[node.depth % sus2LikelihoodArr.length];
            }
            let sus4Likelihoods = [1, 1, 1, 1, 1, 1, 1];
            if (sus4LikelihoodArr.length > 0) {
                sus4Likelihoods = sus4LikelihoodArr[node.depth % sus4LikelihoodArr.length];
            }

            let seventhCosts = [0, 0, 0, 0, 0, 0, 0];
            if (seventhCostArr.length > 0) {
                seventhCosts = seventhCostArr[node.depth % seventhCostArr.length];
            }
            let triadCosts = [0, 0, 0, 0, 0, 0, 0];
            if (triadCostArr.length > 0) {
                triadCosts = triadCostArr[node.depth % triadCostArr.length];
            }
            let sus2Costs = [0, 0, 0, 0, 0, 0, 0];
            if (sus2CostArr.length > 0) {
                sus2Costs = sus2CostArr[node.depth % sus2CostArr.length];
            }
            let sus4Costs = [0, 0, 0, 0, 0, 0, 0];
            if (sus4CostArr.length > 0) {
                sus4Costs = sus4CostArr[node.depth % sus4CostArr.length];
            }


            for (let i=0; i<movements.length; i++) {
                let newRoot = currentChordRoot + movements[i];
                let newRootMod = positiveMod(newRoot, 7);
                if (arrayContains(roots, newRootMod)) {
                    const liks = movementLikelihoods[node.depth % movementLikelihoods.length];
                    let costs = movementCosts[node.depth % movementCosts.length];

                    const lik = liks[i % liks.length];
                    const cost = costs[i % costs.length];

                    const seventhLikelihood = seventhLikelihoods[newRootMod % seventhLikelihoods.length];
                    const triadLikelihood = triadLikelihoods[newRootMod % triadLikelihoods.length];
                    const sus2Likelihood = sus2Likelihoods[newRootMod % sus2Likelihoods.length];
                    const sus4Likelihood = sus4Likelihoods[newRootMod % sus4Likelihoods.length];

                    if (seventhLikelihood > 0) {
                        const seventhCost = seventhCosts[newRootMod % seventhCosts.length];
                        this.addChordState(node.state, currentChordRoot + movements[i], lik * seventhLikelihood, cost + seventhCost,
                            scale, rootStates, rootLikelihoods, rootCosts, possiblePitchClasses, ChordType.SEVENTH, 0, atRoot ? "D" : "D, M");
                    }
                    if (triadLikelihood > 0) {
                        const triadCost = triadCosts[newRootMod % triadCosts.length];
                        this.addChordState(node.state, currentChordRoot + movements[i], lik * triadLikelihood, cost + triadCost,
                            scale, rootStates, rootLikelihoods, rootCosts, possiblePitchClasses, ChordType.TRIAD, 0, atRoot ? "D" : "D, M");
                    }
                    if (this.useSus2 && sus2Likelihood > 0) {
                        const sus2Cost = sus2Costs[newRootMod % sus2Costs.length];
                        this.addChordState(node.state, currentChordRoot + movements[i], lik * sus2Likelihood, cost + sus2Cost,
                            scale, rootStates, rootLikelihoods, rootCosts, possiblePitchClasses, ChordType.SUS2, 0, atRoot ? "D" : "D, M");
                    }
                    if (this.useSus4 && sus4Likelihood > 0) {
                        const sus4Cost = sus4Costs[newRootMod % sus4Costs.length];
                        this.addChordState(node.state, currentChordRoot + movements[i], lik * sus4Likelihood, cost + sus4Cost,
                            scale, rootStates, rootLikelihoods, rootCosts, possiblePitchClasses, ChordType.SUS4, 0, atRoot ? "D" : "D, M");
                    }

                } else {
                    // logit("avoiding newRoot: " + newRootMod + " : " + JSON.stringify(roots) + " isMinor: " + isMinor + "<br />");
                }
            }

            if (this.addAllMovements) {
                // For increasing the probability of success, we add all movements
                const allMovements = [0, 1, 2, 3, 4, 5, 6];
                const allModes = [node.state.mode];
                if (this.modulate && node.state.mode != DynamicHarmonyMode.ROOT_MODULATION) {
                    allModes.push(DynamicHarmonyMode.ROOT_MODULATION);
                }
                //            for (let i=0; i<movements.length; i++) {
                //                arrayDelete(allMovements, movements[i]);
                //                arrayDelete(allMovements, movements[i] - 7);
                //            }
                const oldMode = node.state.mode;
                for (let i=0; i<allMovements.length; i++) {
                    for (let j=0; j<allModes.length; j++) {
                        let state = node.state.copy();
                        state.mode = allModes[j];
                        if (state.mode == DynamicHarmonyMode.ROOT_MODULATION) {
                            let modulationTarget = this.majorModulationTarget;
                            if (isMinor) {
                                modulationTarget = this.minorModulationTarget;
                            }
                            if (oldMode != DynamicHarmonyMode.ROOT_MODULATION) {
                                const modScaleBaseNote = state.harmony.getAbsoluteNoteFromScaleIndex(modulationTarget + 1);
                                state.harmony.setBaseNote(modScaleBaseNote);
                                state.harmony.note = "d, m";
                                // logit(" modScaleBase: " + modScaleBaseNote + " target: " + (modulationTarget+1) + "<br />");
                                state.harmony.setScaleType(DynamicHarmonyModulationTarget.getScaleType(this.scaleType, modulationTarget, this.modulateInvertScaleType));
                            }
                            this.addChordState(state, currentChordRoot + allMovements[i], 0.00001, 100,
                                scale, rootStates, rootLikelihoods, rootCosts, [], ChordType.TRIAD, 0, "d, m");
                        } else {
                            this.addChordState(state, currentChordRoot + allMovements[i], 0.0001, 100,
                                scale, rootStates, rootLikelihoods, rootCosts, [], ChordType.TRIAD, 0, "d");
                        }
                    }
                }
            }

            if (rootLikelihoods.length > 0) {

                for (let i=0; i<rootLikelihoods.length; i++) {
                    nextStates.push(rootStates[i]);
                    nextLikelihoods.push(this.rootProgressionLikelihood * rootLikelihoods[i]);
                    nextCosts.push(this.rootProgressionCost + rootCosts[i]);
                }
            }
        }

        const modulateLikelihood = this.modulateLikelihoods[node.depth % this.modulateLikelihoods.length];
        const modulateCost = this.modulateCosts[node.depth % this.modulateCosts.length];

        if (atRoot && this.modulate && modulateLikelihood > 0) {
            const appliedStates = [];
            const appliedLikelihoods = [];
            const appliedCosts = [];

            const intoAppliedMovements = this.intoAppliedProgressionMovements[node.depth % this.intoAppliedProgressionMovements.length];
            const intoAppliedLikelihoods = this.intoAppliedProgressionMovementLikelihoods[node.depth % this.intoAppliedProgressionMovementLikelihoods.length];
            const intoAppliedCosts = this.intoAppliedProgressionMovementCosts[node.depth % this.intoAppliedProgressionMovementCosts.length];

            let currentChordRoot = currentHarmony.getChordRootScaleIndex();

            const appliedPitchClasses = [];

            for (let i=0; i<intoAppliedMovements.length; i++) {
                let newRoot = currentChordRoot + intoAppliedMovements[i];
                let newRootMod = positiveMod(newRoot, 7);
                appliedPitchClasses.push(currentHarmony.getAbsoluteNoteFromScaleIndex(newRootMod) % 12);
            }

            const currentPitchClass = currentHarmony.getAbsoluteNoteFromScaleIndex(currentChordRoot) % 12;

    //        logit("current pc: " + currentPitchClass + " applied pc: " + appliedPitchClasses + " ");

            let modulationTarget = this.majorModulationTarget;
            if (isMinor) {
                modulationTarget = this.minorModulationTarget;
            }

            const offset = scale[modulationTarget + 1];

            const scaleType = DynamicHarmonyModulationTarget.getScaleType(node.state.harmony.scaleType, modulationTarget, this.modulateInvertScaleType);

            this.getAppliedChordsAndLikelihoods(node, appliedPitchClasses, intoAppliedLikelihoods, intoAppliedCosts,
                currentHarmony.baseNote + offset, scaleType,
                appliedStates, appliedLikelihoods, appliedCosts);

    //        let toRomans = "";
    //        for (let i=0; i<rootMovementForAppliedStates.length; i++) {
    //            toRomans += rootMovementForAppliedStates[i].harmony.toRomanString() + ":" + rootMovementForAppliedLikelihoods[i] + " ";
    //        }

            if (appliedLikelihoods.length > 0) {
                for (let i=0; i<appliedLikelihoods.length; i++) {
                    nextStates.push(appliedStates[i]);
                    nextLikelihoods.push(modulateLikelihood * appliedLikelihoods[i]);
                    nextCosts.push(modulateCost + appliedCosts[i]);
                }
    //            logit("Applied chords from " + node.state.harmony.toRomanString() + " toRomans: " + toRomans);
            } else {
    //            logit("No applied chords from " + node.state.harmony.toRomanString() + " toRomans: " + toRomans);
            }
        }


        if (this.neighbourLikelihood > 0 && currentHarmony.chordInversions == 0) {
            const likelihoods = [];
            let costs = [];
            const harmonies = [];

            let depth = node.depth;

            const neighbourChordRoots = isMinor ? this.minorNeighbourChordRoots : this.majorNeighbourChordRoots;
            const neighbourChordInversions = isMinor ? this.minorNeighbourChordInversions : this.majorNeighbourChordInversions;
            const neighbourSusChordRoots = isMinor ? this.minorNeighbourSusChordRoots : this.majorNeighbourSusChordRoots;
            let neighbourMixtureChordRoots = isMinor ? this.minorNeighbourMixtureChordRoots : this.majorNeighbourMixtureChordRoots;

            if (!this.mixture) {
                neighbourMixtureChordRoots = [];
            }

    //        logit(neighbourSusChordRoots);
            const neighbourChords = this.getBassNeighbourChords(currentHarmony, neighbourChordRoots, neighbourChordInversions, neighbourSusChordRoots, neighbourMixtureChordRoots);

            for (let i=0; i<neighbourChords.length; i++) {
                harmonies.push(neighbourChords[i]);
                likelihoods.push(1);
                costs.push(0);
            }

            for (let i=0; i<harmonies.length; i++) {
                let neighbourSeventhLikelihoods = this.neighbourSeventhLikelihoods;
                let neighbourTriadLikelihoods = this.neighbourTriadLikelihoods;
                let neighbourSeventhCosts = this.neighbourSeventhCosts;
                let neighbourTriadCosts = this.neighbourTriadCosts;

                let state = new DynamicHarmonyState();
                state.harmony = harmonies[i];
                state.harmony.note = "D, N" + (atRoot ? "" : "M");

                let likelihood = this.neighbourLikelihood;
                if (currentHarmony.scaleType != state.harmony.scaleType) {
    //                logit(" Adding neighrour mixture!!");
                    state.harmony.note += "X";
                    likelihood *= this.simpleMixtureLikelihood;
                    neighbourSeventhLikelihoods = this.neighbourMixtureSeventhLikelihoods;
                    neighbourTriadLikelihoods = this.neighbourMixtureTriadLikelihoods;
                    neighbourSeventhCosts = this.neighbourMixtureSeventhCosts;
                    neighbourTriadCosts = this.neighbourMixtureTriadCosts;
                }
                state.mode = atRoot ? DynamicHarmonyMode.NEIGHBOUR : DynamicHarmonyMode.NEIGHBOUR_MODULATION;
                state.targetHarmony = copyObjectDeep(currentHarmony);
    //            logit("Adding dynamic neighbour to " + currentHarmony.toRomanString() + " : " + state.harmony.toRomanString() + " " + nextStates.length);
                this.getChordsStuff(depth, state, likelihood, this.neighbourCost,
                    neighbourSeventhLikelihoods, neighbourTriadLikelihoods, neighbourSeventhCosts, neighbourSeventhCosts,
                    nextStates, nextLikelihoods, nextCosts);
    //            logit("  after length " + nextStates.length);
            }

        }

        if (atAnyRoot && this.mixture) {
            let depth = node.depth;
            const mixtureChords = [];
            const mixtureChordLikelihoods = [];
            const mixtureChordCosts = [];
            if (isMinor) {
                this.getMinorSimpleMixtureChords(currentHarmony, this.minorMixtureChordTypes, this.minorMixtureChordTypeLikelihoods, this.minorMixtureChordTypeCosts,
                    mixtureChords, mixtureChordLikelihoods, mixtureChordCosts);
            } else {
                this.getMajorSimpleMixtureChords(currentHarmony, this.majorMixtureChordTypes, this.majorMixtureChordTypeLikelihoods, this.majorMixtureChordTypeCosts,
                    mixtureChords, mixtureChordLikelihoods, mixtureChordCosts);
            }
    //        logit("Got some mixture chords : " + new ConstantHarmonicRythm(mixtureChords).toRomanString() + " " + isMinor);

            for (let i=0; i<mixtureChords.length; i++) {
                let state = new DynamicHarmonyState();
                state.harmony = mixtureChords[i];
                state.harmony.note = "D, X" + (atRoot ? "" : "M");
                state.mode = atRoot ? DynamicHarmonyMode.ROOT_MIXTURE : DynamicHarmonyMode.ROOT_MIXTURE_MODULATION;
                state.targetHarmony = copyObjectDeep(currentHarmony);
    //            logit("Adding dynamic neighbour to " + currentHarmony.toRomanString() + " : " + state.harmony.toRomanString() + " " + nextStates.length);
                this.getChordsStuff(depth, state,
                    this.simpleMixtureLikelihood * mixtureChordLikelihoods[i],
                    mixtureChordCosts[i],
                    this.mixtureSeventhLikelihoods, this.mixtureTriadLikelihoods,
                    this.mixtureSeventhCosts, this.mixtureTriadCosts,
                    nextStates, nextLikelihoods, nextCosts);
    //            logit("  after length " + nextStates.length);
            }
        }

        if (this.passingLikelihood > 0) {
            // Reuse stuff from harmony gen
        }
        if (this.expansionLikelihood > 0) {
            // Reuse stuff from harmony gen
        }

    //    logit("Possible successor states: " + nextStates + " " + nextLikelihoods + "<br />");



    //    logit("Returning " + nextStates + " <br />");
    }

    getSuccessorIterator(node) {
        const state = node.state;

        const possibleNextStates = [];
        const possibleNextStateLikelihoods = [];
        const possibleNextStateCosts = [];

        const chordsLeft = this.count - node.depth - 2;


        switch (state.mode) {
            case DynamicHarmonyMode.ROOT:
            case DynamicHarmonyMode.ROOT_MODULATION:
                this.getRootStatesAndLikelihoods(node, possibleNextStates, possibleNextStateLikelihoods, possibleNextStateCosts);
                //            logit("Iterator for " + node + " states:" + possibleNextStates + " likelihoods: " + possibleNextStateLikelihoods + "<br />");
                break;
            case DynamicHarmonyMode.PASSING:
            case DynamicHarmonyMode.PASSING_MODULATION:
                break;
            case DynamicHarmonyMode.NEIGHBOUR:
            case DynamicHarmonyMode.NEIGHBOUR_MODULATION:
    //            logit("fjksldf");
                this.getNeighbourStatesAndLikelihoods(node, possibleNextStates, possibleNextStateLikelihoods, possibleNextStateCosts);
                break;
            case DynamicHarmonyMode.ROOT_MIXTURE:
            case DynamicHarmonyMode.ROOT_MIXTURE_MODULATION:
                this.getMixtureStatesAndLikelihoods(node, possibleNextStates, possibleNextStateLikelihoods, possibleNextStateCosts);
                break;
        }
        //    logit("Iterator for " + node + " states:" + possibleNextStates + " likelihoods: " + possibleNextStateLikelihoods + "<br />");

        this.calculateBeatStrengthRepetitionCosts(node, possibleNextStates, possibleNextStateLikelihoods, possibleNextStateCosts);
        this.calculateSeventhToTriadCosts(node, possibleNextStates, possibleNextStateLikelihoods, possibleNextStateCosts);
        this.calculateSusCosts(node, possibleNextStates, possibleNextStateLikelihoods, possibleNextStateCosts, this.sus2Likelihood, this.sus4Likelihood);

        return new RandomDfsStateIterator2(possibleNextStates, possibleNextStateLikelihoods, possibleNextStateCosts, this.rnd);
    }
}

