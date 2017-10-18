

class FiguratorState {
    constructor() {
        this.absoluteNote = 60;
        this.stepCost = 0;
    }

    toString() {
        return `FS{absNote:${this.absoluteNote}, stepCost:${this.stepCost}}`;
    }
}

const NonClassicalScaleFigurationMode = {
    TREAT_AS_CLASSICAL: 0,
    AUTO: 1
};

class Figurator extends DfsSolver {
    constructor(options) {
        super(options);
        this.module = getValueOrDefault(options, "module", null);
        this.verbose = getValueOrDefault(options, "verbose", false);
        this.seed = getValueOrDefault(options, "seed", 352435);
        this.cluster = getValueOrDefault(options, "cluster", []);
        this.harmonyIndices = getValueOrDefault(options, "harmonyIndices", [0]); // Also defines the voice line element indices
        this.harmony = getValueOrDefault(options, "harmony", null); // For the section. Use harmonyIndices as index.
        this.voiceLine = getValueOrDefault(options, "voiceLine", null); // For the section. Use harmonyIndices as index.
        this.previousNotes = getValueOrDefault(options, "previousNotes", null); // Voice elements
        this.nextNotes = getValueOrDefault(options, "nextNotes", null); // Voice elements
        this.absoluteNotes = getValueOrDefault(options, "absoluteNotes", null);

        // Likelihood multipliers for certain intervals
        this.diminishedFifthLikelihood = getValueOrDefault(options, "diminishedFifthLikelihood", 0.001);
        this.augmentedFourthLikelihood = getValueOrDefault(options, "augmentedFourthLikelihood", 0.001);
        this.augmentedSecondLikelihood = getValueOrDefault(options, "augmentedSecondLikelihood", 0.01);
        this.minorSeventhLikelihood = getValueOrDefault(options, "minorSeventhLikelihood", 1.0);
        this.majorSeventhLikelihood = getValueOrDefault(options, "majorSeventhLikelihood", 1.0);

    }

    setSeed(seed) {
        this.seed = seed;
        this.rnd = new MersenneTwister(this.seed);
    }

    extractStateResultData(state) {
        return state.absoluteNote;
    }

    isGoalNode(node) {
        if (node.depth >= this.cluster.length - 1) {
            return this.isGoalState(node.state);
        }
        return false;
    }

    isGoalState(state) {
        return true;
    }

    isInvalidState(state) {
        // Stuff that can be put here:
        // * Outlining dissonces
        // * Forbidden parallels
        return false;
    }

    getHorizontalOffsets(e, j, likelihoodArr) {
        let offsets = [];
        switch (e.horizontalDomainTypes[j]) {
            case AdaptiveHorizontalDomainType.ENUMERABLE:
                offsets = e.horizontalDomainOffsetElements[j];
                if (likelihoodArr) {
                    for (let i=0; i<offsets.length; i++) {
                        likelihoodArr[i] = e.horizontalDomainOffsetLikelihoods[j][i % e.horizontalDomainOffsetLikelihoods[j].length];
                    }
                }
                break;
            case AdaptiveHorizontalDomainType.RANGE:
                for (let i=e.horizontalDomainOffsetRanges[j][0]; i<= e.horizontalDomainOffsetRanges[j][1]; i++) {
                    offsets.push(i);
                    if (likelihoodArr) {
                        likelihoodArr.push(1);
                    }
                }
                break;
        }
        return offsets;
    }

    getVerticalOffsets(e, likelihoodArr) {
        let offsets = [];

        switch (e.verticalDomainType) {
            case AdaptiveVerticalDomainType.ENUMERABLE:
                offsets = e.verticalDomainOffsetElements;
                for (let i=0; i<offsets.length; i++) {
                    const l = e.verticalDomainOffsetElementLikelihoods[i % e.verticalDomainOffsetElementLikelihoods.length];
                    likelihoodArr.push(l);
                }
                break;
            case AdaptiveVerticalDomainType.RANGE:
                for (let i=e.verticalDomainOffsetRange[0]; i<= e.verticalDomainOffsetRange[1]; i++) {
                    offsets.push(i);
                    likelihoodArr.push(1);
                }
                break;
            case AdaptiveVerticalDomainType.CURVE:
                // logit("Adaptive curve offsets not supported yet...");
                const fraction = e.clusterPositionFraction;

                const curve = e.verticalDomainCurve;
                if (curve) {
                    const theCurve = this.module.getCurve(curve);
                    const offsetRange = e.verticalDomainCurveOffsetRange; // How far off the curve to go
                    const multiplier = e.verticalDomainCurveOffsetLikelihoodMultiplier; // What to multiply the likelihood when getting outside curve

                    let curveValue = theCurve.getValue(this.module, fraction);
                    curveValue = SnapMetrics.snap(curveValue, SnapMetrics.ROUND);
                    for (let i=offsetRange[0]; i<= offsetRange[1]; i++) {
                        offsets.push(curveValue + i);
                        let lik = 1;
                        if (i != 0) {
                            lik = Math.pow(multiplier, Math.abs(i));
                        }
                        likelihoodArr.push(lik);
                    }
                } else {
                    logit(`figurator could not find curve ${curve}<br />`);
                }
                break;
        }
        return offsets;
    }

    intersectDomainAndLikelihoodArrs(doms, liks) {
        let prevDom = doms[0];
        let prevLik = liks[0];
        let result = null;
        for (let i=1; i<doms.length; i++) {
            const dom = doms[i];
            const lik = liks[i];
            result = this.intersectDomainAndLikelihoods(prevDom, prevLik, dom, lik);
            prevDom = result[0];
            prevLik = result[1];
        }
        return result;
    }

    intersectDomainAndLikelihoods(dom1, dom2, lik1, lik2) {
        const resultDomain = {};
        const resultLikelihoods = {};

        for (const d in dom1) {
            if (dom2[d]) {
                resultDomain[d] = true;
                resultLikelihoods[d] = lik1[d] * lik2[d];
            }
        }
        return [resultDomain, resultLikelihoods];
    }

    adjustForMelodicIntervals(likelihoods, previousAbsNote, harmonyElement) {
        const prevScaleIndex = harmonyElement.getScaleIndexAndChromaticOffsetForAbsoluteNote(previousAbsNote)[0];
        for (let d in likelihoods) {
            let multiplier = 1.0;
            d = parseInt(d, 10);
            const scaleIndex = harmonyElement.getScaleIndexAndChromaticOffsetForAbsoluteNote(d)[0];
            const diff = Math.abs(prevScaleIndex - scaleIndex);
            const absDiff = Math.abs(previousAbsNote - d);
            if (absDiff == 6) {
                // Tritone
                if (diff == 3) {
                    // aug4
                    multiplier *= this.augmentedFourthLikelihood;
                } else if (diff == 4) {
                    // dim5
                    multiplier *= this.diminishedFifthLikelihood;
                } else {
                    logit(`Not a good sign absDiff == 6 and not an aug4 or dim5. diff: ${diff}  <br />`);
                    multiplier *= this.diminishedFifthLikelihood;
                }
            }
            if (diff == 1 && absDiff == 3) {
                // aug2
                multiplier *= this.augmentedSecondLikelihood;
            }
            likelihoods[d] = multiplier * likelihoods[d];
        }
    }

    // If index > 0, it must have a valid previousAbsNote
    getDomain(index, previousAbsNote, nextAbsNote, resultLikelihoods, node) {

        const harmonyIndex = this.harmonyIndices[index];
        const harmonyElement = this.harmony.get(harmonyIndex);
        const voiceLineElement = this.voiceLine.get(harmonyIndex);
        const currentElement = this.cluster[index];

        let nextElementHarmonyIndex = harmonyIndex;
        let nextElement = null;
        if (index < this.cluster.length - 1) {
            nextElementHarmonyIndex = this.harmonyIndices[index + 1];
            nextElement = this.cluster[index + 1];
        }
        const nextElementHarmonyElement = this.harmony.get(nextElementHarmonyIndex);
        const nextElementVoiceLineElement = this.voiceLine.get(nextElementHarmonyIndex);

        let prevElementHarmonyIndex = harmonyIndex;
        let prevElement = null;
        if (index > 0) {
            prevElementHarmonyIndex = this.harmonyIndices[index - 1];
            prevElement = this.cluster[index - 1];
        }
        let prevPrevElementHarmonyIndex = harmonyIndex;
        let prevPrevElement = null;
        if (index > 1) {
            prevPrevElementHarmonyIndex = this.harmonyIndices[index - 2];
            prevPrevElement = this.cluster[index - 2];
        }
        const prevElementHarmonyElement = this.harmony.get(prevElementHarmonyIndex);
        const prevPrevElementHarmonyElement = this.harmony.get(prevPrevElementHarmonyIndex);

        let nextHarmonyIndex = harmonyIndex;
        if (harmonyIndex < this.harmony.getCount() - 1) {
            nextHarmonyIndex += 1;
        }
        const nextHarmonyElement = this.harmony.get(nextHarmonyIndex);
        const nextVoiceLineElement = this.voiceLine.get(nextHarmonyIndex);

        if (!nextHarmonyElement) {
            logit(`Unable to get harmony element with index ${nextHarmonyIndex} from harmony ${this.harmony.toRomanString()}<br />`);
        }

        let prevHarmonyIndex = harmonyIndex;
        if (harmonyIndex > 0) {
            prevHarmonyIndex -= 1;
        }
        const prevHarmonyElement = this.harmony.get(prevHarmonyIndex);
        const prevVoiceLineElement = this.voiceLine.get(prevHarmonyIndex);


        let domain = null;
        let likelihoods = {};

        // ====================================================
        // Check any vertical constraints for the next element
        // ====================================================
        let verticalDomain = null;
        const verticalLikelihoods = {};

        let baseAbsNote = harmonyElement.getVerticalRelativeAbsoluteNote(currentElement.verticalRelativeType, voiceLineElement);

        if (currentElement.constantVerticalOffset) {
            baseAbsNote = harmonyElement.offset(baseAbsNote, currentElement.constantVerticalOffsetType,
                currentElement.constantVerticalOffset, harmonyElement);
        }

        const verticalLikelihoodArr = [];
        let offsets = this.getVerticalOffsets(currentElement, verticalLikelihoodArr);
        //        logit("Vertical Offsets: " + JSON.stringify(offsets) + "<br />");

        for (let i=0; i<offsets.length; i++) {
            const offset = offsets[i];
            let absNote = harmonyElement.offset(baseAbsNote, currentElement.verticalDomainOffsetType, offset, harmonyElement);

            if (verticalDomain == null) {
                verticalDomain = {};
            }
            if (absNote > 1 && absNote <= 127) {
                verticalDomain[absNote] = true;
                verticalLikelihoods[absNote] = verticalLikelihoodArr[i];
            }
        }

        if (verticalDomain != null) {
            domain = verticalDomain;
            likelihoods = verticalLikelihoods;
        }



        // ====================================================
        // Look backwards and check if the previous element refers to the current
        // ====================================================

        let prevToCurrentHorizontalDomain = null;
        const prevToCurrentHorizontalLikelihoods = {};
        if (prevElement) {
            for (let j=0; j<prevElement.horizontalRelativeTypes.length; j++) {
                let horizontalRelativeType = prevElement.horizontalRelativeTypes[j];
                switch (horizontalRelativeType) {
                    case HorizontalRelativeType.NEXT_NOTE:
                        // The current element refers forward and influences the possible successors

                        if (prevToCurrentHorizontalDomain == null) {
                            prevToCurrentHorizontalDomain = {};
                        }
                        let likelihoodArr = [];
                        let offsets = this.getHorizontalOffsets(prevElement, j, likelihoodArr);

                        for (let i=0; i<offsets.length; i++) {
                            let absNote = prevElementHarmonyElement.offset(previousAbsNote,
                                prevElement.horizontalDomainOffsetTypes[j], offsets[i], prevElementHarmonyElement);
                            // Reinterpret this absolute note in the current harmony
                            if (absNote > 1 && absNote < 127) {
                                const reinterpreted = harmonyElement.snap(absNote, SnapType.SCALE, harmonyElement);
                                if (reinterpreted > 1 && reinterpreted < 127) {
                                    prevToCurrentHorizontalDomain[reinterpreted] = true;
                                    const oldL = prevToCurrentHorizontalLikelihoods[reinterpreted];
                                    prevToCurrentHorizontalLikelihoods[reinterpreted] = oldL ? oldL * likelihoodArr[i] : likelihoodArr[i];
                                }
                            }
                        }
                        break;
                }
            }
        }
        if (prevToCurrentHorizontalDomain != null) {
            if (domain == null) {
                domain = prevToCurrentHorizontalDomain;
                likelihoods = prevToCurrentHorizontalLikelihoods;
            } else {
                let temp = this.intersectDomainAndLikelihoods(domain, prevToCurrentHorizontalDomain,
                    likelihoods, prevToCurrentHorizontalLikelihoods);
                domain = temp[0];
                likelihoods = temp[1];
            }
        }

        // ====================================================
        // The current element can refer back to the previous element or voice line element
        // ====================================================
        let currentToPreviousHorizontalDomain = null;
        const currentToPreviousHorizontalLikelihoods = {};

        for (let j=0; j<currentElement.horizontalRelativeTypes.length; j++) {
            let horizontalRelativeType = currentElement.horizontalRelativeTypes[j];
            switch (horizontalRelativeType) {
                case HorizontalRelativeType.PREVIOUS_NOTE:
                case HorizontalRelativeType.PREVIOUS_VOICE_LINE_ELEMENT:
                    // The current element refers backward and is influenced

                    if (currentToPreviousHorizontalDomain == null) {
                        currentToPreviousHorizontalDomain = {};
                    }
                    let likelihoodArr = [];
                    let offsets = this.getHorizontalOffsets(currentElement, j, likelihoodArr);
                    let referenceAbsNote = previousAbsNote;

                    if (referenceAbsNote == null &&
                        currentElement.horizontalRelativeTypes[j] == HorizontalRelativeType.PREVIOUS_NOTE) {
                        const previousNote = this.previousNotes.get(currentElement);
                        referenceAbsNote = this.absoluteNotes.get(previousNote);
                    }

                    if (referenceAbsNote == null ||
                        currentElement.horizontalRelativeTypes[j] == HorizontalRelativeType.PREVIOUS_VOICE_LINE_ELEMENT) {
                        referenceAbsNote = prevHarmonyElement.getAbsoluteNoteConstantVoiceLineElement(prevVoiceLineElement);
                    }

                    for (let i=0; i<offsets.length; i++) {
                        let absNote = harmonyElement.offset(referenceAbsNote,
                            currentElement.horizontalDomainOffsetTypes[j], offsets[i], harmonyElement);
                        //                        logit("______offset " + offsets[i] + " gave abs note " + absNote + "<br />");

                        if (absNote > 1 && absNote < 127) {
                            currentToPreviousHorizontalDomain[absNote] = true;
                            currentToPreviousHorizontalLikelihoods[absNote] = likelihoodArr[i];
                        }
                    }
                    break;
            }
        }

        // Set or intersect the domain
        if (currentToPreviousHorizontalDomain != null) {
            if (domain == null) {
                domain = currentToPreviousHorizontalDomain;
                likelihoods = currentToPreviousHorizontalLikelihoods;
            } else {
                let temp = this.intersectDomainAndLikelihoods(domain, currentToPreviousHorizontalDomain,
                    likelihoods, currentToPreviousHorizontalLikelihoods);
                domain = temp[0];
                likelihoods = temp[1];
            }
        }


        // ====================================================
        // The current element can refer to the next element or voice line element
        // If the current element is the last in the cluster, it may exist a next absolute note
        // ====================================================
        let currentToNextHorizontalDomain = null;
        const currentToNextHorizontalLikelihoods = {};

        for (let j=0; j<currentElement.horizontalRelativeTypes.length; j++) {
            let  horizontalRelativeType = currentElement.horizontalRelativeTypes[j];
            switch ( horizontalRelativeType) {
                case HorizontalRelativeType.NEXT_NOTE:
                case HorizontalRelativeType.NEXT_VOICE_LINE_ELEMENT:
                    // The next element refers forward

                    let likelihoodArr = [];
                    let offsets = this.getHorizontalOffsets(currentElement, j, likelihoodArr);
                    let referenceAbsNote = nextAbsNote;
                    if (currentElement.horizontalRelativeTypes[j] == HorizontalRelativeType.NEXT_VOICE_LINE_ELEMENT) {
                        referenceAbsNote = nextHarmonyElement.getAbsoluteNoteConstantVoiceLineElement(nextVoiceLineElement);
                        //                    logit("______getting abs note from previous voice line " + referenceAbsNote + "<br />");
                    }
                    if (currentElement.horizontalRelativeTypes[j] == HorizontalRelativeType.NEXT_NOTE) {
                        const nextNote = this.nextNotes.get(currentElement);
                        if (nextNote) {
                            referenceAbsNote = this.absoluteNotes.get(nextNote);
                        }
                        if (!referenceAbsNote && index == this.cluster.length - 1) {
                            referenceAbsNote = nextHarmonyElement.getAbsoluteNoteConstantVoiceLineElement(nextVoiceLineElement);
                        }
                    }
                    if (referenceAbsNote != null) {
                        if (currentToNextHorizontalDomain == null) {
                            currentToNextHorizontalDomain = {};
                        }
                        for (let i=0; i<offsets.length; i++) {
                            let absNote = harmonyElement.offset(referenceAbsNote,
                                currentElement.horizontalDomainOffsetTypes[j], offsets[i], harmonyElement);
                            //                        logit("______offset " + offsets[i] + " gave abs note " + absNote + "<br />");
                            if (absNote > 1 && absNote < 127) {
                                currentToNextHorizontalDomain[absNote] = true;
                                currentToNextHorizontalLikelihoods[absNote] = likelihoodArr[i];
                            }
                        }
                    }
                    break;
            }
        }

        // Set or intersect the domain
        if (currentToNextHorizontalDomain != null) {
            if (domain == null) {
                domain = currentToNextHorizontalDomain;
                likelihoods = currentToNextHorizontalLikelihoods;
            } else {
                let temp = this.intersectDomainAndLikelihoods(domain, currentToNextHorizontalDomain,
                    likelihoods, currentToNextHorizontalLikelihoods);
                domain = temp[0];
                likelihoods = temp[1];
            }
        }

        // Adjust likelihoods for certain ill-sounding melodic intervals



        const sameScale = harmonyElement.sameScale(prevElementHarmonyElement);
        if (sameScale) {
            this.adjustForMelodicIntervals(likelihoods, previousAbsNote, harmonyElement);
        }

        if (index > 0) {
            const scaleIndices = harmonyElement.getChordRootPositionScaleIndices();
            const pitchClasses = harmonyElement.getPitchClassesFromScaleIndices(scaleIndices);

            const prevScaleIndices = prevHarmonyElement.getChordRootPositionScaleIndices();
            const prevPitchClasses = prevHarmonyElement.getPitchClassesFromScaleIndices(prevScaleIndices);

            const prevWasHarmonic = arrayContains(prevPitchClasses, previousAbsNote % 12);

            let isSeventh = false;
            const isSeventhElement = harmonyElement.isSeventh();
            if (isSeventhElement) {
                let seventhPitchClass = harmonyElement.getAbsoluteNoteFromScaleIndex(scaleIndices[3]) % 12;
                isSeventh = seventhPitchClass == (previousAbsNote % 12);
            }

            let prevWasSeventh = false;
            const prevWasSeventhElement = prevHarmonyElement.isSeventh();
            if (prevWasSeventhElement) {
                const prevSeventhPitchClass = prevHarmonyElement.getAbsoluteNoteFromScaleIndex(prevScaleIndices[3]) % 12;
                prevWasSeventh = prevSeventhPitchClass == (previousAbsNote % 12);
            }

            let prevPrevWasHarmonic = true;

            let prevLeapSize = 0;
            let prevLeapDiff = 0;
            let prevPrevPitchClasses;

            if (index > 1) {
                const prevPrevScaleIndices = prevPrevElementHarmonyElement.getChordRootPositionScaleIndices();
                prevPrevPitchClasses = prevPrevElementHarmonyElement.getPitchClassesFromScaleIndices(prevPrevScaleIndices);
                const prevPrevAbsNote = node.previous.state.absoluteNote;
                prevPrevWasHarmonic = arrayContains(prevPrevPitchClasses, prevPrevAbsNote % 12);

                prevLeapDiff = previousAbsNote - prevPrevAbsNote;
                prevLeapSize = Math.abs(prevLeapDiff);
            }

            for (let d in likelihoods) {
                let lik = likelihoods[d];

                d = parseInt(d, 10);
                const leapDiff = d - previousAbsNote;
                const leapSize = Math.abs(leapDiff);
                if (leapSize > 2) {
                    const pitchClass = d % 12;
                    if (!arrayContains(pitchClasses, d) || (prevWasSeventh && pitchClass == seventhPitchClass)) {
                        // Punish leaps into non-harmony or sevenths
                        let multiplier = 1.0 / (1 + leapSize * 4);
                        lik = multiplier * lik;
                    }
                    if (!prevWasHarmonic || prevWasSeventh) {
                        // Punish leaps from non-harmony
                        let multiplier = 1.0 / (1 + leapSize);
                        lik = multiplier * lik;
                    }

                }
                if (!prevWasHarmonic && !prevPrevWasHarmonic && !arrayContains(prevPrevPitchClasses, d)) {
                    // Three non-harmonic notes in row, punish!!!
                    const threeNHInRowPenalty = 0.1;
                    lik = threeNHInRowPenalty * lik;
                }
                if (prevLeapSize > 5) { // Larger than perfect fourth
                    // Punish large leaps without change in direction using step
                    if ((leapDiff >= 0 && prevLeapDiff > 0) ||
                        (leapDiff <= 0 && prevLeapDiff < 0)) {
                        // Leaping in the same direction (or stays the same)
                        let prevLeapPenaltyCount = prevLeapSize - 5;
                        prevLeapPenaltyCount += leapSize;
                        let multiplier = 1.0 / (1 + prevLeapPenaltyCount);
    //                    lik = multiplier * lik;
                    }
                }

                likelihoods[d] = lik;
            }




        }



        for (let d in likelihoods) {
            resultLikelihoods[d] = likelihoods[d];
        }




        if (this.verbose) {
            logit(`In getDomain() for index ${index} previousAbsNote: ${previousAbsNote} nextAbsNote: ${nextAbsNote}<br />`);
            logit(`___ prev to current domain: ${JSON.stringify(prevToCurrentHorizontalDomain)}<br />`);
            logit(`___ prev to current likelihoods: ${JSON.stringify(prevToCurrentHorizontalLikelihoods)}<br />`);
            logit(`___ current to prev domain: ${JSON.stringify(currentToPreviousHorizontalDomain)}<br />`);
            logit(`___ current to prev likelihoods: ${JSON.stringify(currentToPreviousHorizontalLikelihoods)}<br />`);
            logit(`___ current to next domain: ${JSON.stringify(currentToNextHorizontalDomain)}<br />`);
            logit(`___ current to next likelihoods: ${JSON.stringify(currentToNextHorizontalLikelihoods)}<br />`);
            logit(`__ resulting domain: ${JSON.stringify(domain)}<br />`);
            logit(`__ resulting likelihoods: ${JSON.stringify(resultLikelihoods)}<br />`);
        }
        //    logit(
        //        "__ resulting domain: " + JSON.stringify(domain) + " " +
        //        "__ vertical domain: " + JSON.stringify(verticalDomain) + " " +
        //        "<br />");
        //    logit(
        //        "__ resulting likelihoods: " + JSON.stringify(resultLikelihoods) +  " " +
        //        "__ vertical likelihoods: " + JSON.stringify(verticalLikelihoods) +  " " +
        //        "<br />");
        return domain;
    }

    getSuccessorDomain(index, node, likelihoods) {
        const currentState = node.state;
        const currentAbsNote = currentState.absoluteNote;

        return this.getDomain(index + 1, currentAbsNote, null, likelihoods, node);
    }

    intersectDomains(dom1, dom2) {
        const result = {};
        for (const d in dom1) {
            if (dom2[d]) {
                result[d] = true;
            }
        }
        return result;
    }

    createStatesFromDomain(domain, domainLikelihoods, resultStates, resultLikelihoods) {
        for (const d in domain) {
            const state = new FiguratorState();
            state.absoluteNote = parseInt(d, 10);
            resultStates.push(state);
            let likelihood = domainLikelihoods[d];
            if (!likelihood) {
                likelihood = 1;
            }
            resultLikelihoods.push(likelihood);
        }
    }

    getSuccessorDomainStatesAndLikelihoods(index, node, resultStates, resultLikelihoods) {

        if (index >= this.cluster.length) {
            logit(`Index error in Figurator.prototype.getDomainStatesAndLikelihoods() ${index} ${this.cluster.length}<br />`);
            return;
        }

        const domainLikelihoods = {};
        const domain = this.getSuccessorDomain(index, node, domainLikelihoods);

        //    logit("____domain: " + JSON.stringify(domain) + " index: " + index + " <br />");
        //    logit("____domainLikelihoods: " + JSON.stringify(domainLikelihoods) + " index: " + index + " <br />");

        this.createStatesFromDomain(domain, domainLikelihoods, resultStates, resultLikelihoods);
    }

    getSuccessorDomainIteratorForElement(index, node) {
        const states = [];
        const likelihoods = [];
        this.getSuccessorDomainStatesAndLikelihoods(index, node, states, likelihoods);
        return new RandomDfsStateIterator(states, likelihoods, this.rnd);
    }

    getStartStateIterator() {

        const domainLikelihoods = {};
        const domain = this.getDomain(0, null, null, domainLikelihoods, null);

        const states = [];
        const likelihoods = [];
        this.createStatesFromDomain(domain, domainLikelihoods, states, likelihoods);

        return new RandomDfsStateIterator(states, likelihoods, this.rnd);
    }

    getSuccessorIterator(node) {
        return this.getSuccessorDomainIteratorForElement(node.depth, node);
    }

    prepareBeforeSearch() {
        figurationTimer.start();
    }

    searchDone() {
        figurationTimer.pause();
    }
}

