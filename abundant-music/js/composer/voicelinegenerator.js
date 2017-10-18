
class VoiceLineSearchNode {
    constructor(state, searchDepth, resultIndex) {
        this.state = state;
        this.searchDepth = searchDepth;
        this.resultIndex = resultIndex; // Where to write the result
        this.totalCost = 0;
    }

    toString() {
        return `VLSN {state: ${this.state}depth: ${this.depth}}`;
    }
}

class VoiceLineGenerator {
    constructor(options) {
        this.reusables = getValueOrDefault(options, "reusables", {});

        this.maxSearchDepth = getValueOrDefault(options, "maxSearchDepth", 3);
        this.maxSearchSteps = getValueOrDefault(options, "maxSearchSteps", 2000);
        this.harmony = getValueOrDefault(options,
            "harmony", new ConstantHarmonicRythm([new ConstantHarmonyElement().setChordRoot(0)]));
        this.checkParallelOctavesAndUnisons = getValueOrDefault(options, "checkParallelOctavesAndUnisons", true);
        this.parallelOctavesAndUnisonsPenalty = getValueOrDefault(options, "parallelOctavesAndUnisonsPenalty", 10);
        this.checkParallelFifths = getValueOrDefault(options, "checkParallelFifths", true);
        this.parallelFifthsPenalty = getValueOrDefault(options, "parallelFifthsPenalty", 10);
        this.checkLargeLeapReverseDirection = getValueOrDefault(options, "checkLargeLeapReverseDirection", true);
        this.largeLeapReverseDirectionPenaltyFactor = getValueOrDefault(options, "largeLeapReverseDirectionPenaltyFactor", 1);
        this.checkLeadingToneDoubling = getValueOrDefault(options, "checkLeadingToneDoubling", true); //
        this.leadingToneDoublingPenalty = getValueOrDefault(options, "leadingToneDoubling", 5); //

        this.bestSolutionCost = 99999999;
        this.resultStates = [];
        this.searchSteps = 0;
    }

    getlargeLeapToPitchClassPenaltyCount(prevAbsNote, curAbsNote, maxLeap, pitchClass) {
        if ((curAbsNote % 12) == pitchClass) {
            return this.getlargeLeapPenaltyCount(prevAbsNote, curAbsNote, maxLeap);
        } else {
            return 0;
        }
    }

    getlargeLeapFromPitchClassPenaltyCount(prevAbsNote, curAbsNote, maxLeap, pitchClass) {
        if ((prevAbsNote % 12) == pitchClass) {
            return this.getlargeLeapPenaltyCount(prevAbsNote, curAbsNote, maxLeap);
        } else {
            return 0;
        }
    }

    getLeapRangeFromPitchClassPenaltyCount(prevAbsNote, curAbsNote, lowerLeap, upperLeap, pitchClass) {
        if ((prevAbsNote % 12) == pitchClass) {
            return this.getLeapRangePenaltyCount(prevAbsNote, curAbsNote, lowerLeap, upperLeap);
        } else {
            return 0;
        }
    }

    getlargeLeapPenaltyCount(prevAbsNote, curAbsNote, maxLeap) {
        const leapSize = Math.abs(prevAbsNote - curAbsNote);
        if (leapSize > maxLeap) {
            return leapSize - maxLeap;
        } else {
            return 0;
        }
    }

    getLeapRangePenaltyCount(prevAbsNote, curAbsNote, lowerLeap, upperLeap) {
        const leapSize = curAbsNote - prevAbsNote;
        if (leapSize < lowerLeap) {
            return lowerLeap - leapSize;
        } else if (leapSize > upperLeap) {
            return leapSize - upperLeap;
        }
        return 0;
    }

    // Assumes that states have absoluteNote as a property
    getlargeLeapReverseDirectionPenaltyCount(prevPrevAbsNote, prevAbsNote, curAbsNote) {


        let step = prevAbsNote - prevPrevAbsNote;
        let afterStep = curAbsNote - prevAbsNote;

        // Always make the step positive
        if (step < 0) {
            step = -step;
            afterStep = -afterStep;
        }

        let count = 0;

        // Fourths and fifths give penalty when followed by a third or greater in the same direction
        //
        // Sixths give penalty when followed by a second or unison in the same direction
        //
        // The reverse direction is penalized when larger than a third

        if (step < 5) {
            // A small leap or just a step
        } else if (step < 8) {
            // A medium leap
            if (afterStep > 4) {
                // A third or greater after
                count += (afterStep - 4);
            }
            if (afterStep < -4) {
                // Reversing direction to much
                count += (-afterStep - 4);
            }
        } else {
            // A large leap
            if (afterStep > -1) {
                // Not reversing direction
                count += (afterStep + 1);
            }
            if (afterStep < -4) {
                // Reversing direction to much
                count += (-afterStep - 4);
            }
        }
        return count;
    }

    isParallelWithMod(prev1, cur1, prev2, cur2, mod) {
        if (prev1 == cur1 || prev2 == cur2) {
            // If any of the voices holds, it can not be parallel octaves
            return false;
        }
        const prevDiff = prev1 - prev2;
        const prevAbsDiff = Math.abs(prevDiff);
        if ((prevAbsDiff % 12) == mod) {
            // Previous was octave or unison
            const curDiff = cur1 - cur2;
            const curAbsDiff = Math.abs(curDiff);
            if ((curAbsDiff % 12) == mod) {
                // Current is also octave or unison
                return true;
            }
        }
    }

    isParallelOctavesOrUnisons(prev1, cur1, prev2, cur2) {
        return this.isParallelWithMod(prev1, cur1, prev2, cur2, 0);
    }

    isParallelPerfectFifths(prev1, cur1, prev2, cur2) {
        return this.isParallelWithMod(prev1, cur1, prev2, cur2, 7);
    }

    searchRecursive(node) {
        const index = node.searchDepth + node.resultIndex;

        if (node.searchDepth >= this.maxSearchDepth || index >= this.harmony.getCount()) {
            // Reached end of harmony or maximum search depth
            this.bestSolutionCost = Math.min(node.totalCost, this.bestSolutionCost);
            return node;
        }

        let minCost = 99999999;
        let bestNode = null; // Best goal node
        let bestState = null; // Best state at current index

        const states = this.getStates(node);
    //        logit("__Current search depth: " + node.searchDepth + "<br />");
        //    logit("____Domain: " + domain + "<br />");
        for (let i=0; i<states.length; i++) {

            this.searchSteps++;
            if (this.searchSteps > this.maxSearchSteps) {
                return bestNode;
            }

            const newState = states[i];
            const newNode = new VoiceLineSearchNode(newState, node.searchDepth + 1, node.resultIndex);
            const stepCost = this.getStepCost(newNode);

            const totalCost = stepCost + node.totalCost;
    //        logit("__ " + i + " step cost: " + stepCost + " total cost: " + totalCost + " best cost: " + this.bestSolutionCost);
            if (totalCost < this.bestSolutionCost) {
                newNode.totalCost = totalCost;
                this.resultStates[index] = newState; // Writing to result so the next search level has access to previous states
                const result = this.searchRecursive(newNode);
                if (result && result.totalCost < minCost) {
                    minCost = result.totalCost;
                    bestNode = result;
                    bestState = newState;
                }
            }
        }
        //    logit("____Best state at search depth " + node.searchDepth + ": " + bestState + "<br />");
        // Write the result state
        this.resultStates[index] = bestState;

        return bestNode;
    }

    search() {




        const result = [];

        this.bestSolutionCost = 99999999;
        this.resultStates = [];

        voiceLeadingPrepareTimer.start();

        this.prepareBeforeSearch();

        voiceLeadingPrepareTimer.pause();



        const harmonyElements = this.harmony.getConstantHarmonyElements();

    //    logit("Entering voice line search...");

        let totalSearchSteps = 0;
        let sortOfTotalCost = 0;
        const individualSearchSteps = [];
        for (let i=0; i<harmonyElements.length; i++) {
    //        logit("Searching step " + i + "<br />");
            this.bestSolutionCost = 99999999;
            this.searchSteps = 0;
            const emptyState = this.createInitialState();
            const node = new VoiceLineSearchNode(emptyState, 0, i);
            const solution = this.searchRecursive(node);
            if (solution) {
                const state = this.resultStates[i];
                const vle = this.extractSolution(state, i);

                for (let j=0; j<vle.length; j++) {
                    if (j >= result.length) {
                        result[j] = new ConstantVoiceLine();
                    }
                    result[j].addVoiceLineElement(vle[j]);
                }
                //            logit("_Step " + i + " result scale index: " + state.scaleIndex + "<br />");
            } else {
                this.failReason = "Failed to find solution";
                return null;
            }
            totalSearchSteps += this.searchSteps;
            sortOfTotalCost += this.bestSolutionCost;
            individualSearchSteps.push(this.searchSteps);
        }
    //    logit("search steps: " + totalSearchSteps + " individual steps: " + individualSearchSteps.join(",") + " sort of cost: " + sortOfTotalCost + "<br />");
    //    logit("Sort of cost: " + sortOfTotalCost);


        return result;
    }
}
