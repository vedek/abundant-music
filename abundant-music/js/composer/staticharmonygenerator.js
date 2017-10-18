

const StaticHarmonyMode = {
    BASE: 0,
    AUXILIARY: 1,
    BASE_NEIGHBOUR: 2,
    AUXILIARY_NEIGHBOUR: 3,
    PASSING_TOWARDS_BASE: 4,
    PASSING_TOWARDS_AUXILIARY: 5,
    ACCENTED_64_BASE: 6
};

class StaticHarmonyState {
    constructor() {
        this.harmony = null;
        this.targetHarmony = null; // Keep track of where to go next or towards (passing target or neighbour)
        this.mode = StaticHarmonyMode.BASE;
        this.auxiliaryRoot = 0;
        this.stepCost = 0;
    }

    toString() {
        return `SHS {harmony: ${this.harmony}mode: ${this.mode}stepCost: ${this.stepCost}${this.targetHarmony ? `targetHarmony: ${this.targetHarmony}` : ""}}`;
    }
}

class StaticHarmonyGenerator extends HarmonyGenerator {
    constructor(options) {
        super(options);
        this.scaleBaseNote = getValueOrDefault(options,
            "scaleBaseNote", 60);
        this.scaleType = getValueOrDefault(options,
            "scaleType", ScaleType.MAJOR);
        this.baseRoot = getValueOrDefault(options,
            "baseRoot", 0);
        this.baseHarmony = new ConstantHarmonyElement().setChordRoot(this.baseRoot).setBaseNote(this.scaleBaseNote).setScaleType(this.scaleType);

        this.baseToBaseLikelihood = getValueOrDefault(options,
            "baseToBaseLikelihood", 0.01);
        this.baseExpandedLikelihood = getValueOrDefault(options,
            "baseExpandedLikelihood", 1);
        this.baseToNeighbourLikelihood = getValueOrDefault(options,
            "baseToNeighbourLikelihood", 1);
        this.baseToPassingLikelihood = getValueOrDefault(options,
            "baseToPassingLikelihood", 1);
        this.baseToAuxiliaryLikelihood = getValueOrDefault(options,
            "baseToAuxiliaryLikelihood", 1);

        this.auxiliaryToAuxiliaryLikelihood = getValueOrDefault(options,
            "auxiliaryToAuxiliaryLikelihood", 0.01);
        this.auxiliaryExpandedLikelihood = getValueOrDefault(options,
            "auxiliaryExpandedLikelihood", 1);
        this.auxiliaryToBaseLikelihood = getValueOrDefault(options,
            "auxiliaryToBaseLikelihood", 1);
        this.auxiliaryToNeighbourLikelihood = getValueOrDefault(options,
            "auxiliaryToNeighbourLikelihood", 1);
        this.auxiliaryToPassingLikelihood = getValueOrDefault(options,
            "auxiliaryToPassingLikelihood", 1);


        this.baseToBaseCost = getValueOrDefault(options,
            "baseToBaseCost", 0);
        this.baseExpandedCost = getValueOrDefault(options,
            "baseExpandedCost", 0);
        this.baseToNeighbourCost = getValueOrDefault(options,
            "baseToNeighbourCost", 0);
        this.baseToPassingCost = getValueOrDefault(options,
            "baseToPassingCost", 0);
        this.baseToAuxiliaryCost = getValueOrDefault(options,
            "baseToAuxiliaryCost", 0);

        this.auxiliaryToAuxiliaryCost = getValueOrDefault(options,
            "auxiliaryToAuxiliaryCost", 0);
        this.auxiliaryExpandedCost = getValueOrDefault(options,
            "auxiliaryExpandedCost", 0);
        this.auxiliaryToBaseCost = getValueOrDefault(options,
            "auxiliaryToBaseCost", 0);
        this.auxiliaryToNeighbourCost = getValueOrDefault(options,
            "auxiliaryToNeighbourCost", 0);
        this.auxiliaryToPassingCost = getValueOrDefault(options,
            "auxiliaryToPassingCost", 0);


        this.auxiliaryChordRoots = getValueOrDefault(options,
            "auxiliaryChordRoots", [3, 4, 2, 5]);
        this.auxiliaryChordRootLikelihoods = getValueOrDefault(options,
            "auxiliaryChordRootLikelihoods", [1, 1, 0.2, 0.2]);
        this.auxiliaryChordRootCosts = getValueOrDefault(options,
            "auxiliaryChordRootCosts", [0, 0, 0, 0]);

        this.minorPassingChordRoots = getValueOrDefault(options,
            "minorPassingChordRoots", [0, 1, 2, 3, 4, 5, 6]);
        this.minorPassingChordInversions = getValueOrDefault(options,
            "minorPassingChordInversions", [[1], [1], [1], [1], [1], [1], [1]]);
        this.majorPassingChordRoots = getValueOrDefault(options,
            "majorPassingChordRoots", [0, 1, 2, 3, 4, 5, 6]);
        this.majorPassingChordInversions = getValueOrDefault(options,
            "majorPassingChordInversions", [[1], [1], [1], [1], [1], [1], [1]]);

        this.passingIncrements = getValueOrDefault(options,
            "passingIncrements", [-2, -1, 1, 2]);
        this.passingIncrementLikelihoods = getValueOrDefault(options,
            "passingIncrementLikelihoods", [0.25, 1, 1, 0.25]);
        this.passingIncrementCosts = getValueOrDefault(options,
            "passingIncrementCosts", [0, 0, 0, 0]);

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

        this.mixture = getValueOrDefault(options, "mixture", true);

        this.canEndWithBase = getValueOrDefault(options,
            "canEndWithBase", true);
        this.canEndWithAuxiliary = getValueOrDefault(options,
            "canEndWithAuxiliary", false);

        this.possibleAuxiliaryEndRoots = getValueOrDefault(options,
            "possibleAuxiliaryEndRoots", [3, 4, 2, 5]);
        this.possibleAuxiliaryEndInversions = getValueOrDefault(options,
            "possibleAuxiliaryEndInversions", [[0], [0], [0], [0]]);
        this.possiblePassingEndRoots = getValueOrDefault(options,
            "possiblePassingEndRoots", [0]);
        this.possiblePassingEndInversions = getValueOrDefault(options,
            "possiblePassingEndInversions", [[0, 1]]);
        this.possibleNeighbourEndRoots = getValueOrDefault(options,
            "possibleNeighbourEndRoots", [0]);
        this.possibleNeighbourEndInversions = getValueOrDefault(options,
            "possibleNeighbourEndInversions", [[0]]);

        this.baseSeventhLikelihoods = getValueOrDefault(options,
            "baseSeventhLikelihoods", [[1, 1, 1, 1, 1, 1, 1]]);
        this.baseSeventhCosts = getValueOrDefault(options,
            "baseSeventhCosts", [[0, 0, 0, 0, 0, 0, 0]]);
        this.baseTriadLikelihoods = getValueOrDefault(options,
            "baseTriadLikelihoods", [[1, 1, 1, 1, 1, 1, 1]]);
        this.baseTriadCosts = getValueOrDefault(options,
            "baseTraidCosts", [[0, 0, 0, 0, 0, 0, 0]]);

        this.auxiliarySeventhLikelihoods = getValueOrDefault(options,
            "auxiliarySeventhLikelihoods", [[1, 1, 1, 1, 1, 1, 1]]);
        this.auxiliaryTriadLikelihoods = getValueOrDefault(options,
            "auxiliaryTriadLikelihoods", [[1, 1, 1, 1, 1, 1, 1]]);
        this.passingSeventhLikelihoods = getValueOrDefault(options,
            "passingSeventhLikelihoods", [[1, 1, 1, 1, 1, 1, 1]]);
        this.passingTriadLikelihoods = getValueOrDefault(options,
            "passingTriadLikelihoods", [[1, 1, 1, 1, 1, 1, 1]]);
        this.neighbourSeventhLikelihoods = getValueOrDefault(options,
            "neighbourSeventhLikelihoods", [[1, 1, 1, 1, 1, 1, 1]]);
        this.neighbourTriadLikelihoods = getValueOrDefault(options,
            "neighbourTriadLikelihoods", [[1, 1, 1, 1, 1, 1, 1]]);

        this.simpleMixtureLikelihood = getValueOrDefault(options,
            "simpleMixtureLikelihood", 1);
        this.sus2Likelihood = getValueOrDefault(options,
            "sus2Likelihood", 1);
        this.sus4Likelihood = getValueOrDefault(options,
            "sus4Likelihood", 1);

        this.neighbourMixtureSeventhLikelihoods = getValueOrDefault(options,
            "neighbourMixtureSeventhLikelihoods", [[0, 0, 0, 0, 0, 0, 0]]);
        this.neighbourMixtureTriadLikelihoods = getValueOrDefault(options,
            "neighbourMixtureTriadLikelihoods", [[1, 1, 1, 1, 1, 1, 1]]);

        this.auxiliarySeventhCosts = getValueOrDefault(options,
            "auxiliarySeventhCosts", [[0, 0, 0, 0, 0, 0, 0]]);
        this.auxiliaryTriadCosts = getValueOrDefault(options,
            "auxiliaryTriadCosts", [[0, 0, 0, 0, 0, 0, 0]]);
        this.passingSeventhCosts = getValueOrDefault(options,
            "passingSeventhCosts", [[0, 0, 0, 0, 0, 0, 0]]);
        this.passingTriadCosts = getValueOrDefault(options,
            "passingTriadCosts", [[0, 0, 0, 0, 0, 0, 0]]);
        this.neighbourSeventhCosts = getValueOrDefault(options,
            "neighbourSeventhCosts", [[0, 0, 0, 0, 0, 0, 0]]);
        this.neighbourTriadCosts = getValueOrDefault(options,
            "neighbourTriadCosts", [[0, 0, 0, 0, 0, 0, 0]]);

        this.neighbourMixtureSeventhCosts = getValueOrDefault(options,
            "neighbourMixtureSeventhCosts", [[0, 0, 0, 0, 0, 0, 0]]);
        this.neighbourMixtureTriadCosts = getValueOrDefault(options,
            "neighbourMixtureTriadCosts", [[0, 0, 0, 0, 0, 0, 0]]);





        this.startWithAccented64Likelihood = getValueOrDefault(options,
            "startWithAccented64Likelihood", 110);
        this.startWithoutAccented64Likelihood = getValueOrDefault(options,
            "startWithoutAccented64Likelihood", 1);
        this.startWithAccented64Cost = getValueOrDefault(options,
            "startWithAccented64Cost", 10);
        this.startWithoutAccented64Cost = getValueOrDefault(options,
            "startWithoutAccented64Cost", 0);

    //    this. = getValueOrDefault(options, "", [1, 1]);
    }

    getStartStateIterator() {

        const states = [];
        const likelihoods = [];
        const costs = [];

        if (this.count > 1 && this.startWithAccented64Likelihood > 0) {
            const accState = new StaticHarmonyState();
            accState.harmony = this.baseHarmony.copy();
            accState.harmony.note = "S";
            accState.harmony.chordRoot = (accState.harmony.chordRoot + 3) % 7;
            accState.harmony.chordInversions = 2;
            accState.harmony.chordType = ChordType.TRIAD;
            accState.mode = StaticHarmonyMode.ACCENTED_64_BASE;
            states.push(accState);
            let likelihood = this.startWithAccented64Likelihood;
            let cost = this.startWithAccented64Cost;
            if (this.startBeatStrengths.length > 0) {
                const firstBeatStrength = this.startBeatStrengths[0];
                const secondBeatStrength = this.startBeatStrengths[1 % this.startBeatStrengths.length];
                if (secondBeatStrength > firstBeatStrength) {
                    likelihood *= 0.1;
                    cost += 10;
    //                logit("Should not start with 64 " + firstBeatStrength + " " + secondBeatStrength);
                } else {
    //                logit("Can start with 64 " + firstBeatStrength + " " + secondBeatStrength);
                }
            }
            likelihoods.push(likelihood);
            costs.push(cost);
        }
        const state = new StaticHarmonyState();
        state.harmony = this.baseHarmony.copy();
        state.harmony.note = "S";
        state.mode = StaticHarmonyMode.BASE;

        this.getChordsStuff(0, state,
            this.startWithoutAccented64Likelihood,
            this.startWithoutAccented64Cost,
            this.baseSeventhLikelihoods, this.baseTriadLikelihoods,
            this.baseSeventhCosts, this.baseTriadCosts,
            states, likelihoods, costs);

        //    logit("Returning start state: " + result + "<br />");
        return new RandomDfsStateIterator2(states, likelihoods, costs, this.rnd);
    }

    isGoalState(state) {
        //    logit("Checking if " + state + " is goal state: ");

        let result = true;
        switch (state.mode) {
            case StaticHarmonyMode.BASE:
                result = this.canEndWithBase;
                break;
            case StaticHarmonyMode.AUXILIARY:
                if (this.canEndWithAuxiliary) {
                    if (this.possibleAuxiliaryEndRoots.length > 0) {
                        const rootPitchClass =
                            state.harmony.getAbsoluteNoteFromScaleIndex(state.harmony.getChordRootScaleIndex()) % 12;
                        for (let i=0; i<this.possibleAuxiliaryEndRoots.length; i++) {
                            const pitchClass = state.harmony.getAbsoluteNoteFromScaleIndex(this.possibleAuxiliaryEndRoots[i]) % 12;
                            if (pitchClass == rootPitchClass) {
                                result = true;
                                break;
                            }
                        }
                        result = false;
                    }
                    result = true;
                } else {
                    result = false;
                }
                break;
            default:
                result = false;
                break;
        }
        //    if (result) {
        //        logit("__ found goal state " + state + "<br />");
        //    }
        return result;
    }

    isInvalidState(state) {
        return false;
    }

    getBaseState() {
        const state = new StaticHarmonyState();
        state.harmony = this.baseHarmony.copy();
        state.harmony.note = "S";
        state.mode = StaticHarmonyMode.BASE;
        return state;
    }

    getAuxiliaryHarmony(root) {
        const harmony = this.baseHarmony.copy();
        harmony.chordRoot = root;
        harmony.note = "S, A";
        return harmony;
    }

    getAuxiliaryState(root) {
        const state = new StaticHarmonyState();
        state.harmony = this.getAuxiliaryHarmony(root);
        state.mode = StaticHarmonyMode.AUXILIARY;
        return state;
    }

    getPassingTowardsTargetStatesAndLikelihoods(node, nextStates, nextLikelihoods, nextCosts) {

        const currentHarmony = node.state.harmony;
        const targetHarmony = node.state.targetHarmony;

        const currentBass = currentHarmony.getBassScaleIndex();
        const targetBass = targetHarmony.getBassScaleIndex();

        const towardsAux = node.state.mode == StaticHarmonyMode.PASSING_TOWARDS_AUXILIARY;
        const passingIncrements = this.passingIncrements;
        const passingIncrementLikelihoods = this.passingIncrementLikelihoods;
        const passingIncrementCosts = this.passingIncrementCosts;

        const likelihoods = [];
        const costs = [];
        const harmonies = [];
        const modes = [];

        const increments = passingIncrements;
        const absIncrements = [];
        const absLikelihoods = [];
        const absCosts = [];
        const diff = targetBass - currentBass;
        for (let i=0; i<increments.length; i++) {
            const inc = increments[i];
            const l = passingIncrementLikelihoods[i % passingIncrementLikelihoods.length];
            const c = passingIncrementCosts[i % passingIncrementCosts.length];
            if ((diff < 0 && inc < 0) || (diff > 0 && inc > 0)) {
                absIncrements.push(Math.abs(inc));
                absLikelihoods.push(l);
                absCosts.push(c);
            }
        }
        const absDiff = Math.abs(diff);

        let canMoveToTarget = false;
        let moveToTargetLikelihood = 0;
        let moveToTargetCost = 0;
        for (let k=0; k<absIncrements.length; k++) {
            if (absIncrements[k] == absDiff) {
                canMoveToTarget = true;
                moveToTargetLikelihood = Math.max(moveToTargetLikelihood, absLikelihoods[k]);
                moveToTargetCost = Math.max(moveToTargetCost, absCosts[k]);
            }
        }

        if (canMoveToTarget) {
            // Just add the target harmony
            const theTargetHarmony = targetHarmony.copy();
            harmonies.push(theTargetHarmony);
            theTargetHarmony.note = `S${towardsAux ? ", A" : ""}`;
            modes.push(towardsAux ? StaticHarmonyMode.AUXILIARY : StaticHarmonyMode.BASE);
            likelihoods.push(moveToTargetLikelihood);
            costs.push(moveToTargetCost);
        }

        const isMinor = false;
        const passingChordRoots = isMinor ? this.majorPassingChordRoots : this.minorPassingChordRoots;
        const passingChordInversions = isMinor ? this.majorPassingChordInversions : this.minorPassingChordInversions;


        // Continue passing motion for valid increments
        for (let k=0; k<absIncrements.length; k++) {
            const absIncrement = absIncrements[k];
            if (absIncrement < absDiff) {
                const incrementLikelihood = absLikelihoods[k];
                const incrementCost = absCosts[k];
                const passingChords = this.getBassPassingChords(currentHarmony.copy(), targetHarmony, absIncrement,
                    passingChordRoots, passingChordInversions);
    //            logit("Getting " + passingChords.length + " passing chords from " + currentHarmony.toRomanString() + " to " + targetHarmony.toRomanString());
                for (let j=0; j<passingChords.length; j++) {
                    const pc = passingChords[j];
                    harmonies.push(pc);
                    pc.note = `S, ${towardsAux ? "PA" : "PB"}`;
                    likelihoods.push(incrementLikelihood);
                    costs.push(incrementCost);
                    modes.push(towardsAux ? StaticHarmonyMode.PASSING_TOWARDS_AUXILIARY : StaticHarmonyMode.PASSING_TOWARDS_BASE);
                }
            }
        }

        const depth = node.depth;

    //    index, state, likelihood, seventhLikelihoodArr, triadLikelihoodArr,
    //        resultStates, resultLikelihoods

        for (let i=0; i<harmonies.length; i++) {
            const state = new StaticHarmonyState();
            state.harmony = harmonies[i];
            state.targetHarmony = targetHarmony; // Not used if mode is AUXILIARY
            state.mode = modes[i];

            this.getChordsStuff(depth, state, likelihoods[i], costs[i],
                this.passingSeventhLikelihoods, this.passingTriadLikelihoods,
                this.passingSeventhCosts, this.passingTriadCosts,
                nextStates, nextLikelihoods, nextCosts);
        }

    }

    getBaseStatesAndLikelihoods(node, nextStates, nextLikelihoods, nextCosts) {

        const currentHarmony = node.state.harmony;

        const isMinor = this.scaleType == ScaleType.MAJOR ? false : true;

        if (this.baseToBaseLikelihood > 0) {
            let baseState = this.getBaseState();
            nextStates.push(baseState);
            baseState.harmony.note = "S";
            nextLikelihoods.push(this.baseToBaseLikelihood);
            nextCosts.push(this.baseToBaseCost);
        }
        if (this.baseExpandedLikelihood > 0 && currentHarmony.chordInversions == 0) {
            let baseState = this.getBaseState();
            baseState.harmony.chordInversions = 1;
            nextStates.push(baseState);
            baseState.harmony.note = "S, BE";
            nextLikelihoods.push(this.baseExpandedLikelihood);
            nextCosts.push(this.baseExpandedCost);
        }

        const depth = node.depth;
        if (this.baseToAuxiliaryLikelihood > 0) {

            const auxLikelihoods = [];
            const auxCosts = [];
            const auxStates = [];
            for (let i=0; i<this.auxiliaryChordRoots.length; i++) {
                let auxRoot = this.auxiliaryChordRoots[i];
                let auxLikelihood = this.auxiliaryChordRootLikelihoods[i % this.auxiliaryChordRootLikelihoods.length];
                let auxCost = this.auxiliaryChordRootCosts[i % this.auxiliaryChordRootCosts.length];
                const auxState = this.getAuxiliaryState(auxRoot);

                this.getChordsStuff(depth, auxState, auxLikelihood, auxCost,
                    this.auxiliarySeventhLikelihoods, this.auxiliaryTriadLikelihoods,
                    this.auxiliarySeventhCosts, this.auxiliaryTriadCosts,
                    auxStates, auxLikelihoods, auxCosts);
            }
            if (auxLikelihoods.length > 0) {
                for (let i=0; i<auxLikelihoods.length; i++) {
                    nextStates.push(auxStates[i]);
                    auxStates[i].harmony.note = "S, A";
                    nextLikelihoods.push(this.baseToAuxiliaryLikelihood * auxLikelihoods[i]);
                    nextCosts.push(this.baseToAuxiliaryCost + auxCosts[i]);
                }
            }
        }
        if (this.baseToNeighbourLikelihood > 0 && currentHarmony.chordInversions == 0) {
            let likelihoods = [];
            let costs = [];
            let harmonies = [];

            //        let baseChordRoot = this.baseHarmony.chordRoot;

            let likelihood = this.baseToNeighbourLikelihood;

            const neighbourChordRoots = isMinor ? this.minorNeighbourChordRoots : this.majorNeighbourChordRoots;
            const neighbourChordInversions = isMinor ? this.minorNeighbourChordInversions : this.majorNeighbourChordInversions;
            const neighbourSusChordRoots = isMinor ? this.minorNeighbourSusChordRoots : this.majorNeighbourSusChordRoots;
            let neighbourMixtureChordRoots = isMinor ? this.minorNeighbourMixtureChordRoots : this.majorNeighbourMixtureChordRoots;

            if (!this.mixture) {
                neighbourMixtureChordRoots = [];
            }

            const neighbourChords = this.getBassNeighbourChords(this.baseHarmony, neighbourChordRoots, neighbourChordInversions, neighbourSusChordRoots, neighbourMixtureChordRoots);

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

                let state = new StaticHarmonyState();
                state.harmony = harmonies[i];
                state.harmony.note = "S, BN";


                if (this.baseHarmony.scaleType != state.harmony.scaleType) {
    //                logit(" Adding neighrour mixture!!");
                    state.harmony.note += "X";
                    likelihood *= this.simpleMixtureLikelihood;
    //                logit(likelihood);
                    neighbourSeventhLikelihoods = this.neighbourMixtureSeventhLikelihoods;
                    neighbourTriadLikelihoods = this.neighbourMixtureTriadLikelihoods;
                    neighbourSeventhCosts = this.neighbourMixtureSeventhCosts;
                    neighbourTriadCosts = this.neighbourMixtureTriadCosts;
                }

                state.mode = StaticHarmonyMode.BASE_NEIGHBOUR;
                this.getChordsStuff(depth, state, likelihood, this.baseToNeighbourCost,
                    neighbourSeventhLikelihoods, neighbourTriadLikelihoods,
                    neighbourSeventhCosts, neighbourTriadCosts,
                    nextStates, nextLikelihoods, nextCosts);
            }
        }
        if (this.baseToPassingLikelihood > 0) {

            // For generate all passing chords from all possible auxiliary chords
            let likelihoods = [];
            let costs = [];
            let harmonies = [];
            const targetHarmonies = [];

            const scale = node.state.harmony.getScale();
            for (let i=0; i<this.auxiliaryChordRoots.length; i++) {
                let auxRoot = this.auxiliaryChordRoots[i];
                let auxLikelihood = this.auxiliaryChordRootLikelihoods[i % this.auxiliaryChordRootLikelihoods.length];
                let auxCost = this.auxiliaryChordRootCosts[i % this.auxiliaryChordRootCosts.length];
                const increments = this.passingIncrements;
                for (let k=0; k<increments.length; k++) {
                    const incrementLikelihood = this.passingIncrementLikelihoods[k % this.passingIncrementLikelihoods.length];
                    const incrementCost = this.passingIncrementCosts[k % this.passingIncrementCosts.length];
                    const increment = increments[k];
                    let auxRootUp = auxRoot;
                    if (this.baseRoot > auxRoot) {
                        auxRootUp += 7;
                    }
                    const auxRootDown = auxRootUp - scale.length;
                    const auxHarmony = this.getAuxiliaryHarmony(increment > 0 ? auxRootUp : auxRootDown);

    //                logit("Passing from " + this.baseRoot + " to " + auxHarmony.chordRoot);
                    const passingChords = this.getBassPassingChords(this.baseHarmony.copy(), auxHarmony, Math.abs(increment),
                        this.majorPassingChordRoots, this.majorPassingChordInversions);
    //                logit("Found " + passingChords.length + " passing chords " + increment);
                    for (let j=0; j<passingChords.length; j++) {
                        const pc = passingChords[j];
    //                    logit("  " + pc.toRomanString() + " " + (incrementLikelihood * auxLikelihood));
                        harmonies.push(pc);
                        targetHarmonies.push(auxHarmony.copy());
                        likelihoods.push(auxLikelihood * incrementLikelihood);
                        costs.push(auxCost + incrementCost);
                    }
                }
            }

            const sizeBefore = nextStates.length;

            for (let i=0; i<harmonies.length; i++) {
                let state = new StaticHarmonyState();
                state.harmony = harmonies[i];
                state.harmony.note = "S, PA";
                state.targetHarmony = targetHarmonies[i];
                state.mode = StaticHarmonyMode.PASSING_TOWARDS_AUXILIARY;

    //            logit("Testing " + state.harmony.toRomanString() + " " + (this.baseToPassingLikelihood * likelihoods[i]));

                this.getChordsStuff(depth, state, this.baseToPassingLikelihood * likelihoods[i], this.baseToPassingCost + costs[i],
                    this.passingSeventhLikelihoods, this.passingTriadLikelihoods,
                    this.passingSeventhCosts, this.passingTriadCosts,
                    nextStates, nextLikelihoods, nextCosts);
            }

    //        logit("  Added " + (nextStates.length - sizeBefore) + " states");

        }


    }

    getAuxiliaryStatesAndLikelihoods(node, nextStates, nextLikelihoods, nextCosts) {
        const currentHarmony = node.state.harmony;

        if (this.auxiliaryToAuxiliaryLikelihood > 0) {
            let nextState = new StaticHarmonyState();
            nextState.harmony = node.state.harmony.copy();
            nextState.harmony.note = "S, A";
            nextState.mode = StaticHarmonyMode.AUXILIARY;
            nextStates.push(nextState);
            nextLikelihoods.push(this.auxiliaryToAuxiliaryLikelihood);
            nextCosts.push(this.auxiliaryToAuxiliaryCost);
        }
        if (this.auxiliaryExpandedLikelihood > 0 && currentHarmony.chordInversions == 0) {
            let nextState = new StaticHarmonyState();
            nextState.harmony = currentHarmony.copy();
            nextState.harmony.note = "S, AE";
            nextState.harmony.chordInversions = 1;
            nextState.mode = StaticHarmonyMode.AUXILIARY;
            nextStates.push(nextState);
            nextLikelihoods.push(this.auxiliaryExpandedLikelihood);
            nextCosts.push(this.auxiliaryExpandedCost);
        }
        if (this.auxiliaryToBaseLikelihood > 0) {
            let nextState = new StaticHarmonyState();
            nextState.harmony = this.baseHarmony.copy();
            nextState.harmony.note = "S";
            nextState.mode = StaticHarmonyMode.BASE;
            nextStates.push(nextState);
            nextLikelihoods.push(this.auxiliaryToBaseLikelihood);
            nextCosts.push(this.auxiliaryToBaseCost);
        }
        if (this.auxiliaryToNeighbourLikelihood > 0 && currentHarmony.chordInversions == 0) {

            const isMinor = currentHarmony.scaleType == ScaleType.NATURAL_MINOR;

            const neighbourChordRoots = isMinor ? this.minorNeighbourChordRoots : this.majorNeighbourChordRoots;
            const neighbourChordInversions = isMinor ? this.minorNeighbourChordInversions : this.majorNeighbourChordInversions;
            const neighbourSusChordRoots = isMinor ? this.minorNeighbourSusChordRoots : this.majorNeighbourSusChordRoots;
            let neighbourMixtureChordRoots = isMinor ? this.minorNeighbourMixtureChordRoots : this.majorNeighbourMixtureChordRoots;

            if (!this.mixture) {
                neighbourMixtureChordRoots = [];
            }

            const neighbours = this.getBassNeighbourChords(node.state.harmony.copy(), neighbourChordRoots, neighbourChordInversions, neighbourSusChordRoots, neighbourMixtureChordRoots);
            const likelihoods = [];
            const costs = [];
            for (let i=0; i<neighbours.length; i++) {
                likelihoods.push(1);
                costs.push(0);
            }

            for (let i=0; i<neighbours.length; i++) {
                const state = new StaticHarmonyState();
                state.harmony = neighbours[i];
                state.harmony.note = "S, AN";
                let likelihood = this.auxiliaryToNeighbourLikelihood * likelihoods[i];
                if (node.state.harmony.scaleType != state.harmony.scaleType) {
    //                logit(" Adding neighrour mixture!!");
                    state.harmony.note += "X";
                    likelihood *= this.simpleMixtureLikelihood;
                }
                state.mode = StaticHarmonyMode.AUXILIARY_NEIGHBOUR;
                state.auxiliaryRoot = node.state.harmony.chordRoot;
                nextStates.push(state);
                nextLikelihoods.push(likelihood);
                nextCosts.push(this.auxiliaryToNeighbourCost + costs[i]);
            }
        }
    }

    getSuccessorIterator(node) {
        let state = node.state;

        const possibleNextStates = [];
        const possibleNextStateLikelihoods = [];
        const possibleNextStateCosts = [];

        const chordsLeft = this.count - node.depth;

        switch (state.mode) {
            case StaticHarmonyMode.ACCENTED_64_BASE:
                let state = new StaticHarmonyState();
                state.harmony = this.baseHarmony.copy();
                state.mode = StaticHarmonyMode.BASE;
                possibleNextStates.push(state);
                possibleNextStateLikelihoods.push(1);
                possibleNextStateCosts.push(0);
                break;
            case StaticHarmonyMode.BASE:
                this.getBaseStatesAndLikelihoods(node, possibleNextStates, possibleNextStateLikelihoods, possibleNextStateCosts);
                break;
            case StaticHarmonyMode.AUXILIARY:
                this.getAuxiliaryStatesAndLikelihoods(node, possibleNextStates, possibleNextStateLikelihoods, possibleNextStateCosts);
                break;
            case StaticHarmonyMode.BASE_NEIGHBOUR:
                // Always goes back to base
                possibleNextStates.push(this.getBaseState());
                possibleNextStateLikelihoods.push(1.0);
                possibleNextStateCosts.push(0);
                break;
            case StaticHarmonyMode.AUXILIARY_NEIGHBOUR:
                // Always goes back to previous auxiliary
                possibleNextStates.push(this.getAuxiliaryState(node.state.auxiliaryRoot));
                possibleNextStateLikelihoods.push(1.0);
                possibleNextStateCosts.push(0);
                break;
            case StaticHarmonyMode.PASSING_TOWARDS_AUXILIARY:
                this.getPassingTowardsTargetStatesAndLikelihoods(node, possibleNextStates, possibleNextStateLikelihoods, possibleNextStateCosts);
                break;
            case StaticHarmonyMode.PASSING_TOWARDS_BASE:
                this.getPassingTowardsTargetStatesAndLikelihoods(node, possibleNextStates, possibleNextStateLikelihoods, possibleNextStateCosts);
                break;
        }
        //    logit("Iterator for " + node + " states:" + possibleNextStates + " likelihoods: " + possibleNextStateLikelihoods + "<br />");

        this.calculateBeatStrengthRepetitionCosts(node, possibleNextStates, possibleNextStateLikelihoods, possibleNextStateCosts);
        this.calculateSeventhToTriadCosts(node, possibleNextStates, possibleNextStateLikelihoods, possibleNextStateCosts);
        this.calculateSusCosts(node, possibleNextStates, possibleNextStateLikelihoods, possibleNextStateCosts, this.sus2Likelihood, this.sus4Likelihood);


        return new RandomDfsStateIterator2(possibleNextStates, possibleNextStateLikelihoods, possibleNextStateCosts, this.rnd);
    }
}

