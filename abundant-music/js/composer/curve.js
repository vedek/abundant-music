
class Curve {
    constructor() {
        this.id = "";
        this.evaluateExpressions = true;
        this._constructorName = "Curve";
    }

    setId(v) {
        this.id = v;
        return this;
    }

    getValue(module, x) {
        return 0;
    }
}


const PredefinedCurveType = {
    LINEAR: 0,
    EXP: 1,
    QUADRATIC: 2,
    CONSTANT: 3,
    SINE: 4,
    COSINE: 5,
    TRIANGLE: 6,
    SAW: 7,
    SQUARE: 8,
    WHITE_NOISE: 9,
    CONSTANT_NOISE: 10,
    LINEAR_NOISE: 11,
    QUADRATIC_NOISE: 12,
    CUBIC_NOISE: 13,
    PERLIN_NOISE: 14,

    toString: function(type) {
        switch (type) {
            case PredefinedCurveType.CONSTANT:
                return "Constant";
            case PredefinedCurveType.CONSTANT_NOISE:
                return "Constant noise";
            case PredefinedCurveType.COSINE:
                return "Cosine";
            case PredefinedCurveType.EXP:
                return "Exponential";
            case PredefinedCurveType.LINEAR:
                return "Linear";
            case PredefinedCurveType.LINEAR_NOISE:
                return "Linear noise";
            case PredefinedCurveType.QUADRATIC:
                return "Quadratic";
            case PredefinedCurveType.QUADRATIC_NOISE:
                return "Quadratic noise";
            case PredefinedCurveType.SAW:
                return "Saw";
            case PredefinedCurveType.SINE:
                return "Sine";
            case PredefinedCurveType.SQUARE:
                return "Square";
            case PredefinedCurveType.TRIANGLE:
                return "Triangle";
            case PredefinedCurveType.WHITE_NOISE:
                return "White noise";
            case PredefinedCurveType.CUBIC_NOISE:
                return "Cubic noise";
            case PredefinedCurveType.PERLIN_NOISE:
                return "Perlin noise";
        }
        return "Unknown type " + type;
    }

};
addPossibleValuesFunction(PredefinedCurveType, PredefinedCurveType.LINEAR, PredefinedCurveType.PERLIN_NOISE);



class PredefinedCurve extends Curve {
    constructor() {
        super();
        this.amplitude = 1.0;
        this.frequency = 1.0;
        this.phase = 0.0;
        this.bias = 0.0;
        this.clampUpper = false;
        this.upperClamp = 1.0;
        this.clampLower = false;
        this.lowerClamp = -1.0;
        this.seed = 12345;
        this.oldSeed = this.seed;
        this.type = PredefinedCurveType.CONSTANT;
        this.oldType = this.type;

        this.data = null; // Can be used to hold extra stuff

        this._constructorName = "PredefinedCurve";
    }

    setAmplitude(a) {
        this.amplitude = a;
        return this;
    }

    setBias(a) {
        this.bias = a;
        return this;
    }

    setFrequency(a) {
        this.frequency = a;
        return this;
    }

    setPhase(a) {
        this.phase = a;
        return this;
    }

    setType(a) {
        this.type = a;
        return this;
    }

    setSeed(a) {
        this.seed = a;
        return this;
    }

    getValue(module, x) {
        const theType = getValueOrExpressionValue(this, "type", module);
        const theAmp = getValueOrExpressionValue(this, "amplitude", module);
        const theFreq = getValueOrExpressionValue(this, "frequency", module);
        const thePhase = getValueOrExpressionValue(this, "phase", module);
        const theSeed = getValueOrExpressionValue(this, "seed", module);
        return this.getPredefinedValue(x, theType, theAmp, theFreq, thePhase, theSeed);
    }

    checkSeedOrTypeChange(seed, type) {
        if (this.oldSeed != seed || type != this.oldType) {
            this.oldSeed = seed;
            this.oldType = type;
            return true;
        }
        return false;
    }

    getPredefinedValue(x, type, amplitude, frequency, phase, seed) {
        let result = 0;

        switch (type) {
            case PredefinedCurveType.CONSTANT:
                result = amplitude;
                break;
            case PredefinedCurveType.SINE:
                result = amplitude
                    * Math.sin(Math.PI * 2.0 * frequency * (x - phase));
                break;
            case PredefinedCurveType.COSINE:
                result = amplitude
                    * Math.cos(Math.PI * 2.0 * frequency * (x - phase));
                break;
            case PredefinedCurveType.WHITE_NOISE:
                result = amplitude * (2.0 * Math.random() - 1);
                break;
            case PredefinedCurveType.CONSTANT_NOISE:
                // Use a simple lattice noise
                if (!this.data || this.checkSeedOrTypeChange(seed, type)) {
                    this.data = new LatticeNoise(new MersenneTwister(seed));
                }
                result = amplitude * this.data.whiteNoise1((x - phase) * frequency);
                break;
            case PredefinedCurveType.LINEAR_NOISE:
                if (!this.data || this.checkSeedOrTypeChange(seed, type)) {
                    this.data = new LatticeNoise(new MersenneTwister(seed));
                }
                result = amplitude * this.data.lerpNoise1((x - phase) * frequency);
                break;
            case PredefinedCurveType.QUADRATIC_NOISE:
                if (!this.data || this.checkSeedOrTypeChange(seed, type)) {
                    this.data = new LatticeNoise(new MersenneTwister(seed));
                }
                result = amplitude * this.data.quadraticNoise1((x - phase) * frequency);
                break;
            case PredefinedCurveType.CUBIC_NOISE:
                if (!this.data || this.checkSeedOrTypeChange(seed, type)) {
                    this.data = new LatticeNoise(new MersenneTwister(seed));
                }
                result = amplitude * this.data.cubicNoise1((x - phase) * frequency);
                break;
            case PredefinedCurveType.PERLIN_NOISE:
                break;
            case PredefinedCurveType.LINEAR:
                result = amplitude * (x - phase) * frequency;
                break;
            case PredefinedCurveType.QUADRATIC:
                result = amplitude * (x - phase) * (x - phase) * frequency;
                break;
            case PredefinedCurveType.EXP:
                result = amplitude * Math.exp((x - phase) * frequency);
                break;
            case PredefinedCurveType.SAW:
                result = amplitude * (2.0 * mod((x - phase) * frequency, 1) - 1);
                break;
            case PredefinedCurveType.SQUARE:
                var temp = mod((x - phase) * frequency, 1);
                if (temp < 0.5) {
                    result = amplitude;
                } else {
                    result = -amplitude;
                }
                break;
            case PredefinedCurveType.TRIANGLE:
                var temp = mod((x - phase) * frequency, 1);
                if (temp < 0.5) {
                    result = amplitude * (4.0 * temp - 1.0);
                } else {
                    result = amplitude * (3.0 - 4.0 * temp);
                }
                break;
        }
        result += this.bias;
        if (this.clampUpper) {
            result = Math.min(this.upperClamp, result);
        }
        if (this.clampLower) {
            result = Math.max(this.lowerClamp, result);
        }
        return result;
    }
}

class LinearInterpolationCurve extends Curve {
    constructor() {
        super();

        this.xValues = [0, 1];
        this.yValues = [0, 1];

        this.oldXValues = [];
        this.oldYValues = [];

        this.interpolator = null;
        this._constructorName = "LinearInterpolationCurve";
    }

    getValue(module, x) {
        let createNew = this.interpolator == null;
        let xValues = this.xValues;
        let yValues = this.yValues;

        if (this.evaluateExpressions) {
            xValues = getValueOrExpressionValue(this, "xValues", module);
            yValues = getValueOrExpressionValue(this, "yValues", module);
        }

        if (xValues.length != this.oldXValues.length || yValues.length != this.oldYValues.length) {
            createNew = true;
        } else {
            // Compare to the old values
            for (let i=0; i<xValues.length; i++) {
                if (xValues[i] != this.oldXValues[i]) {
                    createNew = true;
                    break;
                }
            }
        }
        if (createNew) {
            if (xValues.length < 2) {
                xValues = [0, 1];
            }
            if (yValues.length < 2) {
                yValues = [0, 1];
            }
            if (xValues.length != yValues.length) {
                yValues.length = xValues.length;
            }

            this.interpolator = new LinearInterpolator(xValues, yValues);
            this.oldXValues = copyValueDeep(xValues);
            this.oldYValues = copyValueDeep(yValues);
        }
        return this.interpolator.interpolate(x);
    }
}

class ExpressionCurve extends Curve {
    constructor() {
        super();
        this.valueExpression = "0.0";
        this.inputVariableName = "x";
        this._constructorName = "ExpressionCurve";
    }

    getValue(module, x) {
        const extraVars = {};
        extraVars[this.inputVariableName] = x;
        const result = getExpressionValue(this.valueExpression, module, extraVars);

    //    logit("ehh?");
        return result;
    }
}

class ComputationCurve extends Curve {
    constructor() {
        super();
        this.computation = new DelayCurveComputation();
        this._constructorName = "ComputationCurve";
    }

    setComputation(c) {
        this.computation = c;
        return this;
    }

    getValue(module, x) {
        return this.computation.getValue(module, x);
    }
}

class CurveComputation {
    constructor() {
        this.id = "";
        this.evaluateExpressions = true;
        this._constructorName = "CurveComputation";
    }

    getValue(module, x) {
        return 0;
    }

    getCurveOrConstantValue(module, x, curve, curveConstant) {
        if (curve) {
            return curve.getValue(module, x);
        } else {
            return curveConstant;
        }
    }

    getCurveReference(module, curve, curveId) {
        if (curveId) {
            // Check if we need to update the reference because the id has changed
            if (!curve || (curve.id != curveId)) {
                // Curve was null or id changed
                return module.getCurve(curveId);
            } else {
                // The current curve reference is the correct one
                return curve;
            }
        } else {
            return null;
        }
    }
}

class DelayCurveComputation extends CurveComputation {
    constructor() {
        super();
        this.inputCurve = "";
        this.delayConstant = 0;
        this.delayCurve = "";
        this.theInputCurve = null;
        this.theDelayCurve = null;
        this._constructorName = "DelayCurveComputation";
    }

    getValue(module, x) {
        this.theInputCurve = this.getCurveReference(module, this.theInputCurve, this.inputCurve);
        this.theDelayCurve = this.getCurveReference(module, this.theDelayCurve, this.delayCurve);

        const delay = this.getCurveOrConstantValue(module, x, this.theDelayCurve, this.delayConstant);

        return this.getCurveOrConstantValue(module, x + delay, this.theInputCurve, 0);
    }
}

class AbsCurveComputation extends CurveComputation {
    constructor() {
        super();
        this.inputCurve = "";
        this.theInputCurve = null;
        this._constructorName = "AbsCurveComputation";
    }

    getValue(module, x) {
        this.theInputCurve = this.getCurveReference(module, this.theInputCurve, this.inputCurve);

        return Math.abs(this.getCurveOrConstantValue(module, x, this.theInputCurve, 0));
    }
}

class RemapCurveComputation extends CurveComputation {
    constructor() {
        super();
        this.inputCurve = "";
        this.remapCurve = "";
        this.fromInterval = [0.0, 1.0];
        this.toInterval = [0.0, 1.0];
        this.clampResult = false;
        this.theInputCurve = null;
        this.remapCurve = null;
        this._constructorName = "RemapCurveComputation";
    }

    getValue(module, x) {
        this.theInputCurve = this.getCurveReference(module, this.theInputCurve, this.inputCurve);
        this.theRemapCurve = this.getCurveReference(module, this.theRemapCurve, this.remapCurve);

        const inputValue = this.getCurveOrConstantValue(module, x, this.theInputCurve, 0);

        const fromRange = this.fromInterval[1] - this.fromInterval[0];
        const toRange = this.fromInterval[1] - this.fromInterval[0];

        const fromFraction = (inputValue - this.fromInterval[0]) / fromRange;

        const remappedFraction = this.getCurveOrConstantValue(module, fromFraction, this.theRemapCurve, fromFraction);

        const result = this.toInterval[0] + toRange * remappedFraction;

        if (this.clampResult) {
            return Math.clamp(result, this.toInterval[0], this.toInterval[1]);
        } else {
            return result;
        }
    }
}

class ClampCurveComputation extends CurveComputation {
    constructor() {
        super();
        this.inputCurve = "";
        this.upperCurve = "";
        this.lowerCurve = "";
        this.upperLimit = 1.0;
        this.lowerLimit = -1.0;
        this.theInputCurve = null;
        this.theUpperCurve = null;
        this.theLowerCurve = null;
        this._constructorName = "ClampCurveComputation";
    }

    getValue(module, x) {
        this.theInputCurve = this.getCurveReference(module, this.theInputCurve, this.inputCurve);
        this.theUpperCurve = this.getCurveReference(module, this.theUpperCurve, this.upperCurve);
        this.theLowerCurve = this.getCurveReference(module, this.theLowerCurve, this.lowerCurve);

        const upper = this.getCurveOrConstantValue(module, x, this.theUpperCurve, this.upperLimit);
        const lower = this.getCurveOrConstantValue(module, x, this.theLowerCurve, this.lowerLimit);

        return clamp(this.getCurveOrConstantValue(module, x, this.theInputCurve, 0), lower, upper);
    }
}

class MirrorCurveComputation extends CurveComputation {
    constructor() {
        super();
        this.inputCurve = "";
        this.mirrorX = 0.0;

        this.theInputCurve = null;
        this._constructorName = "MirrorCurveComputation";
    }

    getValue(module, x) {
        this.theInputCurve = this.getCurveReference(module, this.theInputCurve, this.inputCurve);
        if (x > this.mirrorX) {
            x = 2 * this.mirrorX - x;
        }
        return this.getCurveOrConstantValue(module, x, this.theInputCurve, 0);
    }
}



const Mix1DType = {
    FUBAR: 0
//
};


class MixCurveComputation extends CurveComputation {
    constructor() {
        super();
        this.inputCurve1 = "";
        this.inputCurve2 = "";

        this.mixConstant = 0.5;
        this.mixCurve = "";

        this.mixType = Mix1DType.FUBAR;

        this.theInputCurve1 = null;
        this.theInputCurve2 = null;
        this.theMixCurve = null;
        this._constructorName = "MixCurveComputation";
    }

    getValue(module, x) {
        this.theInputCurve1 = this.getCurveReference(module, this.theInputCurve1, this.inputCurve1);
        this.theInputCurve2 = this.getCurveReference(module, this.theInputCurve2, this.inputCurve2);
        this.theMixCurve = this.getCurveReference(module, this.theMixCurve, this.mixCurve);

        const mixFraction = this.getCurveOrConstantValue(module, x, this.theMixCurve, this.mixConstant);

        const value1 = this.getCurveOrConstantValue(module, x, this.theInputCurve1, 0);
        const value2 = this.getCurveOrConstantValue(module, x, this.theInputCurve2, 0);

        return mixFraction * value1 + (1.0 - mixFraction) * value2;
    }
}

class PeriodicCurveComputation extends CurveComputation {
    constructor() {
        super();
        this.inputCurve = "";
        this.period = 1.0;
        this.theInputCurve = null;
        this._constructorName = "PeriodicCurveComputation";
    }

    getValue(module, x) {
        this.theInputCurve = this.getCurveReference(module, this.theInputCurve, this.inputCurve);
        let period = this.period;
        if (this.evaluateExpressions) {
            period = getValueOrExpressionValue(this, "period", module);
        }

        const result = this.getCurveOrConstantValue(module, mod(x, period), this.theInputCurve, 0);

    //    if (this.verbose) {
    //        logit(this._constructorName + " x: " + x + " period: " + period + " result: " + result);
    //    }

        return result;
    }
}

class SnapCurveComputation extends CurveComputation {
    constructor() {
        super();
        this.inputCurve = "";
        this.snapMetrics = SnapMetrics.ROUND;
        this.preMultiplier = 1.0;
        this.postMultiplier = 1.0;
        this.theInputCurve = null;
        this._constructorName = "SnapCurveComputation";
    }

    getValue(module, x) {
        this.theInputCurve = this.getCurveReference(module, this.theInputCurve, this.inputCurve);
        const value = this.getCurveOrConstantValue(module, x, this.theInputCurve, 0);
        return this.postMultiplier * SnapMetrics.snap(value * this.preMultiplier, this.snapMetrics);
    }
}



class CurveGroup {

    constructor() {
        this.curves = [];
    }
}

class CurveModifier {
}



class MultiInputCurveComputation extends CurveComputation {
    constructor() {
        super();
        this.inputCurves = [];
        this.theInputCurves = [];
        this._constructorName = "MultiInputCurveComputation";
    }

    setInputCurves(v) {
        this.inputCurves = v;
        return this;
    }

    updateReferences(module, referenceArr, nameArr) {
        for (let i=0; i<nameArr.length; i++) {
            const curve = referenceArr[i];
            const curveName = nameArr[i];
            referenceArr[i] = this.getCurveReference(module, curve, curveName);
        }
    }

    getValue(module, x) {
        this.updateReferences(module, this.theInputCurves, this.inputCurves);
        return this.getValueReferencesOk(module, x);
    }

    getValueReferencesOk(module, x) {
        return 0;
    }
}

class ExpressionCurveComputation extends MultiInputCurveComputation {
    constructor() {
        super();
        this.inputCurvePrefix = "input";
        this.inputVariableName = "x";
        this.valueExpression = "x";
        this._constructorName = "ExpressionCurveComputation";
    }

    createCurveFunction(module, curve) {
        const that = this;
        return function(input) {
            return that.getCurveOrConstantValue(module, input, curve, 0);
        };
    }

    getValueReferencesOk(module, x) {
        const refs = this.theInputCurves;

        const that = this;

        const extraVars = {};
        for (let i=0; i<refs.length; i++) {
            const curve = refs[i];
            // This is wasteful... Should be done differently... To many functions constructed...
            extraVars[this.inputCurvePrefix + "" + (i + 1)] = this.createCurveFunction(module, curve);
        }
        extraVars[this.inputVariableName] = x;
        const result = getExpressionValue(this.valueExpression, module, extraVars);
        return result;
    }
}

class OscillatorCurveComputation extends MultiInputCurveComputation {
    constructor() {
        super();
        this.count = 1;
        this.curveIndices = [0];
        this.baseFrequency = 1.0;
        this.curveAmplitudes = [1.0];
        this.curveFrequencyMultipliers = [1.0];
        this.curvePhases = [0.0];
        this._constructorName = "OscillatorCurveComputation";
    }

    getValueReferencesOk(module, x) {
        const refs = this.theInputCurves;
        let result = 0.0;
        for (let i=0; i<this.count; i++) {
            let curveIndex = 0;
            if (this.curveIndices.length > 0) {
                curveIndex = this.curveIndices[i % this.curveIndices.length];
            }
            const freq = this.baseFrequency;
            let amp = 1.0;
            if (this.curveAmplitudes.length > 0) {
                amp = this.curveAmplitudes[i % this.curveAmplitudes.length];
            }
            let freqMult = 1.0;
            if (this.curveFrequencyMultipliers.length > 0) {
                freqMult = this.curveFrequencyMultipliers[i % this.curveFrequencyMultipliers.length];
            }
            let phase = 0.0;
            if (this.curvePhases.length > 0) {
                phase = this.curvePhases[i % this.curvePhases.length];
            }
            let curveValue = 0.0;
            if (refs.length > 0) {
                const curve = refs[curveIndex % refs.length];
                curveValue = this.getCurveOrConstantValue(module, freq * freqMult * (x + phase), curve, 0);
            } else {
                curveValue = Math.sin(freq * freqMult * Math.PI * 2 * (x + phase))
            }
            const value = amp * curveValue;
            result += value;
        }
        return result;
    }
}

class AddCurveComputation extends MultiInputCurveComputation {
    constructor() {
        super();
        this._constructorName = "AddCurveComputation";
    }

    getValueReferencesOk(module, x) {
        const refs = this.theInputCurves;
        let result = 0.0;
        for (let i=0; i<refs.length; i++) {
            const curve = refs[i];
            result += this.getCurveOrConstantValue(module, x, curve, 0);
        }
        return result;
    }
}

class MultiplyCurveComputation extends MultiInputCurveComputation {
    constructor() {
        super();
        this._constructorName = "MultiplyCurveComputation";
    }

    getValueReferencesOk(module, x) {
        const refs = this.theInputCurves;
        let result = 1.0;
        for (let i=0; i<refs.length; i++) {
            const curve = refs[i];
            result *= this.getCurveOrConstantValue(module, x, curve, 1);
        }
        return result;
    }
}

class MinCurveComputation extends MultiInputCurveComputation {
    constructor() {
        super();
        this._constructorName = "MinCurveComputation";
    }

    getValueReferencesOk(module, x) {
        const refs = this.theInputCurves;
        let result = null;
        for (let i=0; i<refs.length; i++) {
            const curve = refs[i];

            const temp = this.getCurveOrConstantValue(module, x, curve, 1);
            if (result === null) {
                result = temp;
            } else {
                result = Math.min(temp, result);
            }
        }
        return result === null ? 0 : result;
    }
}

class MaxCurveComputation extends MultiInputCurveComputation {
    constructor() {
        super();
        this._constructorName = "MaxCurveComputation";
    }

    getValueReferencesOk(module, x) {
        const refs = this.theInputCurves;
        let result = null;
        for (let i=0; i<refs.length; i++) {
            const curve = refs[i];

            const temp = this.getCurveOrConstantValue(module, x, curve, 1);
            if (result === null) {
                result = temp;
            } else {
                result = Math.max(temp, result);
            }
        }
        return result === null ? 0 : result;
    }
}

