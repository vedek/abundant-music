
class ControlLine {
    constructor() {
        this.id = "";
        this._constructorName = "ControlLine";
    }

    copy() {
        return copyObjectDeep(this);
    }

    getPrimitiveControlLines(module, harmony) {
        return [this];
    }

    renderBatch(state) {
        const lines = this.getPrimitiveControlLines(state.module, state.constantHarmony);

        const allElements = [];
        const allChannels = [];


        for (const controlLine of lines) {
            const controlChannel = state.module.getControlChannel(controlLine.channel);
            if (!controlChannel) {
                logit(` could not find control channel ${controlLine.channel}`);
                continue;
            }
            const elements = controlLine.getPrimitiveControlElements(state.module, state.constantHarmony);
            for (let i=0; i<elements.length; i++) {
                allChannels.push(controlChannel);
            }

            addAll(allElements, elements);
        }

        const beatLength = state.constantHarmony.getBeatLength();

        for (let i=0; i<allElements.length; i++) {
            const e = allElements[i];
            state.controlChannel = allChannels[i];
            state.controlSlotData = state.controlSlotDatas[state.controlChannel.id];
            if (! state.controlSlotData) {
                state.controlSlotData = state.controlChannel.createSlotData(beatLength);
                state.controlSlotDatas[state.controlChannel.id] = state.controlSlotData;
            }
            e.renderBatch(state);
        }
    }
}

class PrimitiveControlLine extends ControlLine {
    constructor() {
        super();
        this.channel = "";
        this.controlElements = [];
        this._constructorName = "PrimitiveControlLine";
    }

    getPrimitiveControlElements(module, harmony) {
        const result = [];

        for (const e of this.controlElements) {
            addAll(result, e.getPrimitiveControlElements(module, harmony));
        }

        return result;
    }

    addControlElement(e) {
        this.controlElements.push(e);
        return this;
    }
}

class ControlElement {
    constructor() {
        this.id = "";
        this.active = true;

        this._constructorName = "ControlElement";
    }

    getPrimitiveControlElements(module, harmony) {
        return [this];
    }
}

class PositionedControlElement extends ControlElement {
    constructor() {
        super();
        this.startTime = 0;
        this.startTimeUnit = PositionUnit.BEATS;

        this.endTime = 1;
        this.endTimeUnit = PositionUnit.BEATS;

        this.controlOffset = 0; // An extra "write"-pointer offset
        this.controlOffsetUnit = PositionUnit.BEATS;
        this._constructorName = "PositionedControlElement";

    }
}

class MultiStepControlElement extends PositionedControlElement {
    constructor() {
        super();
        this.startIndices = [];
        this.indices = [];
        this.endIndices = [];

        this.elements = [];
        this._constructorName = "MultiStepControlElement";
    }

    getPrimitiveControlElements(module, harmony) {
        const result = [];

        const active = getValueOrExpressionValue(this, "active", module);
        if (!active) {
            return result;
        }

        let currentBeat = positionUnitToBeats2(this.startTime, this.startTimeUnit, 0, harmony);

        const harmonyBeatLength = harmony.getBeatLength();

        const startIndices = getValueOrExpressionValue(this, "startIndices", module);
        const indices = getValueOrExpressionValue(this, "indices", module);
        const endIndices = getValueOrExpressionValue(this, "endIndices", module);

    //    logit(startIndices + " " + indices + " " + endIndices);

        if (this.verbose) {
            logit(`${this._constructorName} ${startIndices} ${indices} ${endIndices} ${this.activeExpression} ${this.activeUseExpression}`);
        }

        const that = this;

        function getLength(testIndices, beatOffset, elements) {
            let result = 0;

            for (const index of testIndices) {
                if (index < elements.length) {
                    const element = elements[index];
                    const primitiveElements = element.getPrimitiveControlElements(module, harmony);

                    let maxEndBeat = 0;

                    for (const pElement of primitiveElements) {
                        const endBeat = positionUnitToBeats2(pElement.endTime, pElement.endTimeUnit, result, harmony);
                        //                    logit("   endBeat in getLength(): " + endBeat + " pElement.endTime: " + pElement.endTime + " pElement.endTimeUnit: " + pElement.endTimeUnit);
                        //                    logit("    " + JSON.stringify(pElement));
                        maxEndBeat = Math.max(maxEndBeat, endBeat);
                    }

                    result += maxEndBeat;
                }
            }

            return result;
        }

        function appendWithIndex(index, beatOffset, elements) {

            if (that.verbose) {
                logit(`  Rendering at index ${index} beat: ${beatOffset}`);
            }


            const beatStep = 1;
            if (index < elements.length) {
                let element = elements[index];
                element = copyObjectDeep(element);
                const primitiveElements = element.getPrimitiveControlElements(module, harmony);

                let maxEndBeat = 0;

                for (const pElement of primitiveElements) {
                    // Shift the position
                    const startBeat = positionUnitToBeats2(pElement.startTime, pElement.startTimeUnit, 0, harmony);
                    const endBeat = positionUnitToBeats2(pElement.endTime, pElement.endTimeUnit, 0, harmony);

                    pElement.startTime = startBeat + beatOffset;
                    pElement.startTimeUnit = PositionUnit.BEATS;
                    pElement.endTime = endBeat + beatOffset;
                    pElement.endTimeUnit = PositionUnit.BEATS;

                    result.push(pElement);

                    maxEndBeat = Math.max(maxEndBeat, endBeat);
                }

                return Math.max(1, maxEndBeat);
            }
            return beatStep;
        }

        let stepIndex = 0;
        while (currentBeat < harmonyBeatLength) {

            let beatStep = 1;

            // Check the length of the end
            const endLength = getLength(endIndices, currentBeat, this.elements);

            let renderEnd = false;

            if (stepIndex < startIndices.length) {
                let index = startIndices[stepIndex];
                beatStep = getLength([index], currentBeat, this.elements);
                if (currentBeat + beatStep + endLength <= harmonyBeatLength) {
                    beatStep = appendWithIndex(index, currentBeat, this.elements);
                } else {
                    renderEnd = true;
                }
            } else if (indices.length > 0) {
                let index = indices[positiveMod(stepIndex - startIndices.length, indices.length)];
                beatStep = getLength([index], currentBeat, this.elements);
                if (currentBeat + beatStep + endLength <= harmonyBeatLength) {
                    beatStep = appendWithIndex(index, currentBeat, this.elements);
                } else {
                    renderEnd = true;
                }
            } else if (currentBeat + beatStep + endLength > harmonyBeatLength) {
                renderEnd = true;
            }

            if (renderEnd) {
                beatStep = harmonyBeatLength - currentBeat;
                currentBeat = harmonyBeatLength - endLength;
                let totalBeatStep = 0;
                for (let i=0; i<endIndices.length; i++) {
                    totalBeatStep += appendWithIndex(endIndices[i], currentBeat, this.elements);
                }
                if (totalBeatStep > 0.01) {
                    beatStep = totalBeatStep;
                }
                break;
            }

            currentBeat += beatStep;
            stepIndex++;
        }

        return result;
    }
}

class MultiParallelControlElement extends PositionedControlElement {
    constructor() {
        super();
        this.indices = [];

        this.elements = [];
        this._constructorName = "MultiParallelControlElement";
    }

    getPrimitiveControlElements(module, harmony) {
        const result = [];

        const active = getValueOrExpressionValue(this, "active", module);
        if (!active) {
            return result;
        }

        const currentBeat = positionUnitToBeats2(this.startTime, this.startTimeUnit, 0, harmony);

        const indices = getValueOrExpressionValue(this, "indices", module);

    //    logit(startIndices + " " + indices + " " + endIndices);

        if (this.verbose) {
            logit(`${this._constructorName} ${indices} ${this.activeExpression} ${this.activeUseExpression}`);
        }

        const that = this;


        function appendWithIndex(index, beatOffset, elements) {
            if (that.verbose) {
                logit(`${that._constructorName} Rendering at index ${index} beat: ${beatOffset}`);
            }
            if (index < elements.length) {
                let element = elements[index];
                element = copyObjectDeep(element);
                const primitiveElements = element.getPrimitiveControlElements(module, harmony);

                for (const pElement of primitiveElements) {
                    // Shift the position
                    const startBeat = positionUnitToBeats2(pElement.startTime, pElement.startTimeUnit, 0, harmony);
                    const endBeat = positionUnitToBeats2(pElement.endTime, pElement.endTimeUnit, 0, harmony);

                    pElement.startTime = startBeat + beatOffset;
                    pElement.startTimeUnit = PositionUnit.BEATS;
                    pElement.endTime = endBeat + beatOffset;
                    pElement.endTimeUnit = PositionUnit.BEATS;

                    result.push(pElement);
                }
            }
        }

        for (let i=0; i<indices.length; i++) {
            appendWithIndex(indices[i], currentBeat, this.elements);
        }

        return result;
    }
}

class PrimitiveControlElement extends PositionedControlElement {
    constructor() {
        super();
        this.batched = false;

        this._constructorName = "PrimitiveControlElement";
    }

    renderBatch(state) {

        const active = getValueOrExpressionValue(this, "active", state.module);

        if (!active) {
            return;
        }

        const harmony = state.constantHarmony;

        const startBeatTime = positionUnitToBeats(this.startTime, this.startTimeUnit,
            harmony.tsNumerator, harmony.tsDenominator, harmony);
        const endBeatTime = positionUnitToBeats(this.endTime, this.endTimeUnit,
            harmony.tsNumerator, harmony.tsDenominator, harmony);

        const slotData = state.controlSlotData;
        const channel = state.controlChannel;

        const startSlot = channel.slotsPerBeat * startBeatTime;
        const endSlot = channel.slotsPerBeat * endBeatTime - 1;

        const slotCount = endSlot - startSlot + 1;

        if (this.batched) {
            const slotIndices = [];
            const slotFractions = [];
            for (let i=startSlot; i<=endSlot; i++) {
                let slotFraction = (i - startSlot) / slotCount;
                slotFractions.push(slotFraction);
                slotIndices.push(i);
            }
            this.renderAtSlots(slotIndices, startSlot, endSlot, slotFractions, startBeatTime, endBeatTime, state, slotData);
        } else {
            for (let i=startSlot; i<=endSlot; i++) {
                let slotFraction = (i - startSlot) / slotCount;
                this.renderAtSlot(i, startSlot, endSlot, slotFraction, startBeatTime, endBeatTime, state, slotData);
            }
        }
    }

    renderAtSlot(
        slotIndex,
        startSlot,
        endSlot,
        slotFraction,
        startBeatTime,
        endBeatTime,
        state,
        slotData
    ) {
    }

    renderAtSlots(
        slotIndices,
        startSlot,
        endSlot,
        slotFractions,
        startBeatTime,
        endBeatTime,
        state,
        slotData
    ) {
    }
}

class CurveControlElement extends PrimitiveControlElement {
    constructor() {
        super();
        this.curve = "";

        this.cycles = 1.0;
        this.cyclesUnit = CyclesUnit.CYCLES_PER_PERIOD;

        this.amplitude = 1.0;
        this.bias = 0.0;
        this.phase = 0.0;
        this.frequencyMultiplier = 1.0;

        this.constantValue = 0.0; // When no curve is selected or not found

        this.theCurve = null;
        this._constructorName = "CurveControlElement";
    }

    renderAtSlot(
        slotIndex,
        startSlot,
        endSlot,
        slotFraction,
        startBeatTime,
        endBeatTime,
        state,
        slotData
    ) {

        const x = slotFraction;

        this.theCurve = CurveComputation.prototype.getCurveReference(state.module, this.theCurve, this.curve);

        const rawValue = CurveComputation.prototype.getCurveOrConstantValue(state.module,
            this.frequencyMultiplier * (x + this.phase),
            this.theCurve, this.constantValue);
        const value = this.bias + this.amplitude * rawValue;

        if (this.verbose) {
            logit(`${this._constructorName} writing ${value} at ${slotIndex} rawValue: ${rawValue} amp: ${this.amplitude} bias: ${this.bias} slotFraction: ${slotFraction}`);
        }

        state.controlChannel.writeDouble(slotIndex, slotData, value);
    }
}

class NaturalTempoCurveControlElement extends PrimitiveControlElement {
    constructor() {
        super();
        this.baseTempo = 120.0;
        this.prevTempo = 120.0;
        this.currentTempo = 120.0;
        this.nextTempo = 120.0;

        // The default settings is to span a complete harmony
        this.startTime = 0;
        this.startTimeUnit = PositionUnit.HARMONY;
        this.endTime = 1;
        this.endTimeUnit = PositionUnit.HARMONY;


        this.batched = true; // so that renderAtSlots() is called

        this._constructorName = "NaturalTempoCurveControlElement";
    }

    renderAtSlots(
        slotIndices,
        startSlot,
        endSlot,
        slotFractions,
        startBeatTime,
        endBeatTime,
        state,
        slotData
    ) {

        const baseTempo = getValueOrExpressionValue(this, "baseTempo", state.module);
        const prevTempo = getValueOrExpressionValue(this, "prevTempo", state.module);
        const currentTempo = getValueOrExpressionValue(this, "currentTempo", state.module);
        const nextTempo = getValueOrExpressionValue(this, "nextTempo", state.module);

    //    logit(this._constructorName + " prev: " + prevTempo + " cur: " + currentTempo + " next: " + nextTempo);

        const largeFraction = 0.95;
        const smallFraction = 1.0 - largeFraction;

        const fractionAboveCurrent = currentTempo / baseTempo;
        const fractionAbovePrev = prevTempo / baseTempo;
        const fractionAboveNext = nextTempo / baseTempo;

        const halfPrev = 0.5 * (fractionAbovePrev + 1.0);
        const halfNext = 0.5 * (fractionAboveCurrent + 1.0);

        // End increase always ends with the current fraction
        // Start increase always starts with previous fraction
        // Start decrease always starts half between prev and base fraction
        // End decrease always ends with half between current and base fraction
        //

        const increaseXValues = [0, 1];
        const increaseYValues = [fractionAbovePrev, fractionAboveCurrent];

        const increaseDecreaseXValues = [0, largeFraction, 1];
        const increaseDecreaseYValues = [fractionAbovePrev, fractionAboveCurrent, halfNext];

        const decreaseIncreaseXValues = [0.0, smallFraction, 1];
        const decreaseIncreaseYValues = [halfPrev, 1.0, fractionAboveCurrent];

        const decreaseIncreaseDecreaseXValues = [0.0, smallFraction, largeFraction, 1];
        const decreaseIncreaseDecreaseYValues = [halfPrev, 1.0, fractionAboveCurrent, halfNext];

        let xValues = increaseXValues;
        let yValues = increaseYValues;
    //    logit("prev: " + prevTempo + " cur: " + currentTempo + " next: " + nextTempo);
        if (currentTempo < prevTempo) {
            if (nextTempo >= currentTempo) {
                xValues = decreaseIncreaseXValues;
                yValues = decreaseIncreaseYValues;
            } else {
                xValues = decreaseIncreaseDecreaseXValues;
                yValues = decreaseIncreaseDecreaseYValues;
            }
        } else if (currentTempo >= prevTempo) {
            // When the tempos are same, there should be an increase anyway
            if (nextTempo >= currentTempo) {
                xValues = increaseXValues;
                yValues = increaseYValues;
            } else {
                xValues = increaseDecreaseXValues;
                yValues = increaseDecreaseYValues;
            }
        }
        // Creating a new interpolator for each call, wasteful but maybe not that terrible...
        const func = new LinearInterpolator(xValues, yValues);


    //    logit("  xValues: " + xValues.join(", ") + " yValues: " + yValues.join(", "));

        for (let i=0; i<slotIndices.length; i++) {
            const x = slotFractions[i];
            const slotIndex = slotIndices[i];
            const value = func.interpolate(x);

            state.controlChannel.writeDouble(slotIndex, slotData, value);
        }

    //    state.controlChannel.writeDouble(slotIndex, slotData, value);
    }
}






