class DfsSearchNode {
    constructor(state, previousNode, depth) {
        this.state = state;
        this.previous = previousNode;
        this.next = null;
        this.depth = depth;
        this.totalCost = 0;
    }

    toString() {
        return `DFSSN {state: ${this.state}depth: ${this.depth}totalCost: ${this.totalCost}}`;
    }
}

class RandomDfsStateIterator {
    constructor(elements, likelihoods, rnd, stepCostSetter) {
        this.elements = elements;
        this.likelihoods = likelihoods;
        this.rnd = rnd;
        if (stepCostSetter) {
            this.stepCosts = stepCostSetter(this.likelihoods);
        } else {
            this.stepCosts = this.getStepCosts(likelihoods);
        }
    //    logit("___ state step costs: " + this.stepCosts + "<br />");
    }

    getStepCosts(likelihoods) {
        const stepCosts = [];
        for (let i=0; i<likelihoods.length; i++) {
            const l = likelihoods[i];
            stepCosts[i] = l > 0.0 ? -Math.log(l) : 99999999999;
        }
        return stepCosts;
    }

    hasNext() {
        return this.elements.length > 0;
    }

    next() {
        let result = null;
        // Sample next element with the probability distribution
        if (this.elements.length > 0) {
            const probDist = getProbabilityDistribution(this.likelihoods);
            const index = sampleIndexIntegerDistribution(this.rnd, probDist);
            result = this.elements[index];
            result.stepCost = this.stepCosts[index];
            this.elements.splice(index, 1);
            this.likelihoods.splice(index, 1);
            this.stepCosts.splice(index, 1);
        } else if (this.elements.length == 1) {
            result = this.elements[0];
            result.stepCost = this.stepCosts[0];
            this.elements.length = 0;
        } else {
            logit("Can not get next from iterator. empty");
        }
        if (result.stepCost < 0) {
            logit(" stepcost less than 0...");
        }
        return result;
    }
}

class RandomDfsStateIterator2 {
    constructor(elements, likelihoods, costs, rnd) {
        this.elements = elements;
        this.likelihoods = likelihoods;
        this.rnd = rnd;
        this.stepCosts = costs;
    }

    hasNext() {
        return this.elements.length > 0;
    }

    next() {
        // Sample next element with the probability distribution
        if (this.elements.length > 0) {
            const probDist = getProbabilityDistribution(this.likelihoods);
            const index = sampleIndexIntegerDistribution(this.rnd, probDist);
            let result = this.elements[index];
            result.stepCost = this.stepCosts[index];
            this.elements.splice(index, 1);
            this.likelihoods.splice(index, 1);
            this.stepCosts.splice(index, 1);
            return result;
        } else if (this.elements.length == 1) {
            let result = this.elements[0];
            result.stepCost = this.stepCosts[0];
            this.elements.length = 0;
            return result;
        } else {
            logit("Can not get next from iterator. empty");
            return null;
        }
    }
}

class SimpleDfsStateIterator {
    constructor(elements) {
        this.elements = elements;
    }

    hasNext() {
        return this.elements.length > 0;
    }

    next() {
        if (this.elements.length > 0) {
            return this.shift();
        } else {
            logit("Can not get next from iterator. empty");
            return null;
        }
    }
}

class DfsSolver {
    constructor(options) {
        this.maxMLSolutions = getValueOrDefault(options, "maxMLSolutions", 10);
        this.maxSearchSteps = getValueOrDefault(options, "maxSearchSteps", 1000);
        this.steps = 0;
        this.mlSolutions = 0;
        this._constructorName = "DfsSolver";
    }

    getGoalLikelihood(node) {
        return 1;
    }

    extractStateResultData(state) {
        logit("DfsSolver need to implement extractStateResultData()");
    }

    getStartStateIterator() {
        logit("DfsSolver need to implement getStartStateIterator()<br />");
    }

    isGoalState(state) {
        logit("DfsSolver need to implement isGoalState()<br />");
        return true;
    }

    isInvalidState(state) {
        logit("DfsSolver need to implement isInvalidState()<br />");
        return false;
    }

    getSuccessorIterator(node) {
        logit("DfsSolver need to implement getSuccessorIterator()<br />");
    }

    isGoalNode(node) {
        logit("DfsSolver need to implement isGoalNode()<br />");
    }

    isMaxDepth(node) {
        return false;
    }

    searchRecursive(node) {
        // Do a depth-first search

        if (this.isGoalNode(node)) {
            return node;
        } else if (this.isMaxDepth(node)) {
            return null;
        }

        if (this.isInvalidState(node.state)) {
            return null;
        }

        const iterator = this.getSuccessorIterator(node);
        while (iterator.hasNext()) {
            this.steps++;
            if (this.steps > this.maxSearchSteps) {
                this.failReason = `Unable to find a solution within ${this.maxSearchSteps} search steps`;
                return null;
            //        } else {
            //            logit("steps: " + this.steps + " ");
            }
            const next = iterator.next();
            const newNode = new DfsSearchNode(next, node, node.depth + 1);
            if (this.searchRecursive(newNode)) {
                node.next = newNode;
                return node;
            }
        }
        this.failReason = "Unable to find a solution";
        return null;
    }

    search() {
        this.prepareBeforeSearch();
        
        if (this.seed && this.setSeed) {
            this.setSeed(this.seed);
        }
        this.steps = 0;
        const iterator = this.getStartStateIterator();
        while (iterator.hasNext()) {
            const startState = iterator.next();
            const node = new DfsSearchNode(startState, null, 0);

            const solution = this.searchRecursive(node);
            if (solution) {
                // Extract solution
                const result = [];
                let current = solution;
                do {
                    result.push(this.extractStateResultData(current.state));
                    current = current.next;
                } while (current);
                return result;
            }
        }
        return null;
    }

    searchMLRecursive(node) {
        if (this.isGoalNode(node)) {
            if (node.totalCost < 0.999999 * this.bestSolutionCost) {
                this.bestSolutionCost = Math.min(node.totalCost, this.bestSolutionCost);
                this.mlSolutions++;
    //                        logit(this._constructorName + " Found solution. solution count: " + this.mlSolutions + " this cost: " + node.totalCost + " best cost: " + this.bestSolutionCost + " steps: " + this.steps);
                //            let result = this.extractSolutionFromMLGoalNode(node);
                //            logit("___ The solution: " + result + "<br />");
                
                return node;
            } else {
                return null;
            }
        } else if (this.isMaxDepth(node)) {
            return null;
        }

        if (this.isInvalidState(node.state)) {
            return null;
        }

        const minCost = Number.MAX_VALUE;
        let bestNode = null; // Best goal node

        const iterator = this.getSuccessorIterator(node);
        while (iterator.hasNext()) {
            this.steps++;

            if (this.steps > this.maxSearchSteps) {
                if (this.mlSolutions == 0) {
                    this.failReason = `Unable to find a solution within ${this.maxSearchSteps} search steps`;
                }
                return bestNode;
            }

            const newState = iterator.next();


            const stepCost = newState.stepCost;
            const totalCost = stepCost + node.totalCost;

    //        logit("Checking state " + newState + "<br />");

            //        logit("Total cost " + totalCost + " on level " + node.depth + " stepCost: " + stepCost + " <br />");
            if (totalCost < this.bestSolutionCost) {
                const newNode = new DfsSearchNode(newState, node, node.depth + 1);
                newNode.totalCost = totalCost;
                const result = this.searchMLRecursive(newNode);
                if (result) {
                    node.next = newNode;
                    bestNode = result;
    //                logit("__Found best node " + bestNode + " on depth " + node.depth + "<br />");
                }
            } else {
            //            logit("Pruning because of cost " + totalCost + " " + this.bestSolutionCost + " steps: " + this.steps + "<br />");
            }
            if (this.mlSolutions >= this.maxMLSolutions) {
                break;
            }
        }
    //    logit("Returning best node " + bestNode + " on depth " + node.depth + "<br />");
        return bestNode;
    }

    prepareBeforeSearch() {
    }

    searchDone() {
    }

    searchML() {

        this.prepareBeforeSearch();

        this.bestSolutionCost = Number.MAX_VALUE;

        if (this.seed && this.setSeed) {
            this.setSeed(this.seed);
        }
        let bestSolution = null;

        this.steps = 0;
        const iterator = this.getStartStateIterator();
        while (iterator.hasNext()) {
            const startState = iterator.next();

            const node = new DfsSearchNode(startState, null, 0);
            node.totalCost = startState.stepCost;

    //        investigateObject(startState);

    //        logit("Starting ML search from " + startState + " <br />");

            const solution = this.searchMLRecursive(node);
            if (solution) {
                bestSolution = this.extractSolutionFromMLGoalNode(solution);
                const states = this.extractStatesFromMLGoalNode(solution);
    //                    logit("Solution states: " + states + "<br />");
            }
            if (this.mlSolutions >= this.maxMLSolutions) {
                break;
            }
        }
        this.searchDone();
        if (bestSolution != null) {
            //        logit("Returning result " + bestSolution + "<br />");
            return bestSolution;
        }
        logit(`Failed to find a solution in DfsSolver ${this.failReason}<br />`);
        return null;
    }

    extractPartialSolutionFromNode(node) {
        let currentNode = node;
        const solution = [];
        do {
            solution.unshift(currentNode.state.harmony);
            currentNode = currentNode.previous;
        } while (currentNode);
        return solution;
    }

    extractPartialSolutionStatesFromNode(node) {
        let currentNode = node;
        const states = [];
        do {
            states.unshift(currentNode.state);
            currentNode = currentNode.previous;
        } while (currentNode);
        return states;
    }

    extractSolutionFromStates(states) {
        const solution = [];
        for (let i=0; i<states.length; i++) {
            solution.push(this.extractStateResultData(states[i]));
        }
        return solution;
    }

    extractSolutionFromMLGoalNode(node) {
        const result = [];
        let current = node;
        while (current.previous) {
            current = current.previous;
        }
        while (current) {
            result.push(this.extractStateResultData(current.state));
            current = current.next;
        }
        return result;
    }

    extractStatesFromMLGoalNode(node) {
        const result = [];
        let current = node;
        while (current.previous) {
            current = current.previous;
        }
        while (current) {
            result.push(current.state);
            current = current.next;
        }
        return result;
    }
}