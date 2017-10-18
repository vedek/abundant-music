
class EditorFunctionOrVariable {
    constructor() {
        this.id = "";
        this._constructorName = "EditorFunctionOrVariable";
    }
}


const EnumType = {
    POSITION_UNIT: 0,
    CHORD_TYPE: 1,
    SCALE_TYPE: 2,
    INDEX_TYPE: 3,
    SNAP_TYPE: 4,
    SNAP_METRICS: 5,
    VERTICAL_RELATIVE_TYPE: 6,
    INDEX_BORDER_MODE: 7,
    HORIZONTAL_RELATIVE_TYPE: 8,
    OFFSET_TYPE: 9,
    COUNT_UNIT: 10,
    PREDEFINED_CURVE_TYPE: 11,

    toString(unit) {
        switch (unit) {
            case EnumType.CHORD_TYPE:
                return "ChordType";
            case EnumType.COUNT_UNIT:
                return "CountUnit";
            case EnumType.HORIZONTAL_RELATIVE_TYPE:
                return "HorizontalRelativeType";
            case EnumType.INDEX_BORDER_MODE:
                return "IndexBorderMode";
            case EnumType.INDEX_TYPE:
                return "IndexType";
            case EnumType.OFFSET_TYPE:
                return "OffsetType";
            case EnumType.POSITION_UNIT:
                return "PositionUnit";
            case EnumType.SCALE_TYPE:
                return "ScaleType";
            case EnumType.SNAP_METRICS:
                return "SnapMetrics";
            case EnumType.SNAP_TYPE:
                return "SnapType";
            case EnumType.VERTICAL_RELATIVE_TYPE:
                return "VerticalRelativeType";
            case EnumType.PREDEFINED_CURVE_TYPE:
                return "PredefinedCurveType";
        }
        return `Unknown enum type ${unit}`;
    }
};
addPossibleValuesFunction(EnumType, EnumType.POSITION_UNIT, EnumType.PREDEFINED_CURVE_TYPE);



class SimpleEnumEditorVariable extends EditorFunctionOrVariable {
    constructor() {
        super();
        this.enumType = EnumType.POSITION_UNIT;
        
        this.positionUnitValue = PositionUnit.BEATS;
        this.chordTypeValue = ChordType.TRIAD;
        this.scaleTypeValue = ScaleType.MAJOR;
        this.indexTypeValue = IndexType.SCALE;
        this.snapTypeValue = SnapType.NONE;
        this.snapMetricsValue = SnapMetrics.ROUND;
        this.verticalRelativeTypeValue = VerticalRelativeType.CHORD_ROOT;
        this.horizontalRelativeTypeValue = HorizontalRelativeType.NEXT_NOTE;
        this.indexBorderModeValue = IndexBorderMode.RESTART;
        this.offsetTypeValue = OffsetType.SCALE;
        this.countUnitValue = CountUnit.PLAIN;
        this.predefinedCurveTypeValue = PredefinedCurveType.CONSTANT;

        this._constructorName = "SimpleEnumEditorVariable";
    }

    getValue(module) {
        switch (this.enumType) {
            case EnumType.CHORD_TYPE:
                return this.chordTypeValue;
            case EnumType.COUNT_UNIT:
                return this.countUnitValue;
            case EnumType.HORIZONTAL_RELATIVE_TYPE:
                return this.horizontalRelativeTypeValue;
            case EnumType.INDEX_BORDER_MODE:
                return this.indexBorderModeValue;
            case EnumType.INDEX_TYPE:
                return this.indexTypeValue;
            case EnumType.OFFSET_TYPE:
                return this.offsetTypeValue;
            case EnumType.POSITION_UNIT:
                return this.positionUnitValue;
            case EnumType.PREDEFINED_CURVE_TYPE:
                return this.predefinedCurveTypeValue;
            case EnumType.SCALE_TYPE:
                return this.scaleTypeValue;
            case EnumType.SNAP_METRICS:
                return this.snapMetricsValue;
            case EnumType.SNAP_TYPE:
                return this.snapTypeValue;
            case EnumType.VERTICAL_RELATIVE_TYPE:
                return this.verticalRelativeTypeValue;
        }
        return 0;
    }
}

class BooleanEditorVariable extends EditorFunctionOrVariable {
    constructor() {
        super();
        this._constructorName = "BooleanEditorVariable";
    }
}

class SimpleBooleanEditorVariable extends BooleanEditorVariable {
    constructor() {
        super();
        this.value = false;

        this._constructorName = "SimpleBooleanEditorVariable";
    }

    getValue(module) {
        return this.value;
    }
}

class ObjectEditorVariable extends EditorFunctionOrVariable {
    constructor() {
        super();
        this._constructorName = "ObjectEditorVariable";
    }
}

class SimpleObjectEditorVariable extends ObjectEditorVariable {
    constructor() {
        super();

        this.value = {};

        this._constructorName = "SimpleObjectEditorVariable";
    }

    getValue(module) {
        return getValueOrExpressionValue(this, "value", module);
    }
}

class StringEditorVariable extends EditorFunctionOrVariable {
    constructor() {
        super();
        this._constructorName = "StringEditorVariable";
    }
}

class SimpleStringEditorVariable extends StringEditorVariable {
    constructor() {
        super();
        this.value = "";

        this._constructorName = "SimpleStringEditorVariable";
    }

    getValue(module) {
        return this.value;
    }
}




const EditorIdReferenceType = {

    STRUCTURE: 0,
    SECTION: 1,
    HARMONY: 2,
    MOTIF: 3,
    PERCUSSION_MOTIF: 4,
    RYTHM: 5,
    CURVE: 6,
    RENDER_CHANNEL: 7,
    CONTROL_CHANNEL: 8,
    NAMED_NOTE: 9,

    toString(unit) {
        switch (unit) {
            case EditorIdReferenceType.CONTROL_CHANNEL:
                return "Control channel";
            case EditorIdReferenceType.CURVE:
                return "Curve";
            case EditorIdReferenceType.HARMONY:
                return "Harmony";
            case EditorIdReferenceType.MOTIF:
                return "Motif";
            case EditorIdReferenceType.NAMED_NOTE:
                return "Named note";
            case EditorIdReferenceType.PERCUSSION_MOTIF:
                return "Percussion motif";
            case EditorIdReferenceType.RENDER_CHANNEL:
                return "Render channel";
            case EditorIdReferenceType.RYTHM:
                return "Rythm";
            case EditorIdReferenceType.SECTION:
                return "Section";
            case EditorIdReferenceType.STRUCTURE:
                return "Structure";
        }
        return `Unknown id reference type ${unit}`;
    }
};
addPossibleValuesFunction(EditorIdReferenceType, EditorIdReferenceType.HARMONY, EditorIdReferenceType.NAMED_NOTE);



class IdReferenceEditorVariable extends StringEditorVariable {
    constructor() {
        super();
        this.referenceType = EditorIdReferenceType.HARMONY;
        this.structure = "";
        this.section = "";
        this.harmony = "";
        this.motif = "";
        this.percussionMotif = "";
        this.rythm = "";
        this.curve = "";
        this.renderChannel = "";
        this.controlChannel = "";
        this.namedNote = "";

        this._constructorName = "IdReferenceEditorVariable";
    }

    getValue(module) {
        switch (this.referenceType) {
            case EditorIdReferenceType.CONTROL_CHANNEL:
                return this.controlChannel
            case EditorIdReferenceType.CURVE:
                return this.curve;
            case EditorIdReferenceType.HARMONY:
                return this.harmony;
            case EditorIdReferenceType.MOTIF:
                return this.motif;
            case EditorIdReferenceType.NAMED_NOTE:
                return this.namedNote;
            case EditorIdReferenceType.PERCUSSION_MOTIF:
                return this.percussionMotif;
            case EditorIdReferenceType.RENDER_CHANNEL:
                return this.renderChannel;
            case EditorIdReferenceType.RYTHM:
                return this.rythm;
            case EditorIdReferenceType.SECTION:
                return this.section;
            case EditorIdReferenceType.STRUCTURE:
                return this.structure;
        }
        return "";
    }
}

class DoubleEditorVariable extends EditorFunctionOrVariable {
    constructor() {
        super();
        this._constructorName = "DoubleEditorVariable";
    }
}

class SimpleDoubleEditorVariable extends DoubleEditorVariable {
    constructor() {
        super();
        this.value = 0.0;

        this._constructorName = "SimpleDoubleEditorVariable";
    }

    getValue(module) {
        return this.value;
    }
}

class IntegerEditorVariable extends EditorFunctionOrVariable {
    constructor() {
        super();
        this._constructorName = "IntegerEditorVariable";
    }
}

class SimpleIntegerEditorVariable extends IntegerEditorVariable {
    constructor() {
        super();
        this.value = 0;

        this._constructorName = "SimpleIntegerEditorVariable";
    }

    getValue(module) {
        return this.value;
    }
}

class DoubleArrayEditorVariable extends EditorFunctionOrVariable {
    constructor() {
        super();
        this._constructorName = "DoubleArrayEditorVariable";
    }

    getValue(module) {
        return [];
    }
}

class SimpleDoubleArrayEditorVariable extends DoubleArrayEditorVariable {
    constructor() {
        super();
        this.value = [];

        this._constructorName = "SimpleDoubleArrayEditorVariable";
    }

    getValue(module) {
        return this.value;
    }
}

class IntegerArrayEditorVariable extends EditorFunctionOrVariable {
    constructor() {
        super();
        this._constructorName = "IntegerArrayEditorVariable";
    }

    getValue(module) {
        return [];
    }
}

class IntegerArray2DEditorVariable extends EditorFunctionOrVariable {
    constructor() {
        super();
        this._constructorName = "IntegerArray2DEditorVariable";
    }

    getValue(module) {
        return [];
    }
}

class SimpleIntegerArray2DEditorVariable extends IntegerArray2DEditorVariable {
    constructor() {
        super();
        this.value = [];

        this._constructorName = "SimpleIntegerArray2DEditorVariable";
    }

    getValue(module) {
        return this.value;
    }
}

class SimpleRandomIntegerArrayEditorVariable extends IntegerArrayEditorVariable {
    constructor() {
        super();
        this.seed = 12345;
        this.count = 10;
        this.domain = [0, 1];
        this.domainLikelihoods = [1];

        this._constructorName = "SimpleRandomIntegerArrayEditorVariable";
    }

    getValue(module, params) {
        const theSeed = getValueOrDefault(params, "seed", this.seed);
        const theCount = getValueOrDefault(params, "count", this.count);
        const rnd = new MersenneTwister(theSeed);
        let theLikelihoods = this.domainLikelihoods;
        if (theLikelihoods.length == 0) {
            theLikelihoods = [1];
        }
        let theDomain = this.domain;
        if (theDomain.length == 0) {
            theDomain = [0];
        }
        const dist = getProbabilityDistribution(createFilledPatternArray(theCount, theLikelihoods));

        const result = [];
        for (let i=0; i<theCount; i++) {
            const index = sampleIndexIntegerDistribution(rnd, dist);
            const element = theDomain[index % theDomain.length];
            result.push(element)
        }
        return result;
    }
}

class MarkovRandomIntegerArrayEditorVariable extends IntegerArrayEditorVariable {
    constructor() {
        super();
        this.seed = 12345;
        this.count = 10;
        this.startStates = [0, 1];
        this.startStateLikelihoods = [1, 1];
        this.stateDomains = [[0], [1]];
        this.stateDomainLikelihoods = [[1], [1]];
        this.stateTransitionLikelihoods = [[1, 1], [1, 1]];

        this._constructorName = "MarkovRandomIntegerArrayEditorVariable";
    }

    getValue(module, params) {
        const theSeed = getValueOrDefault(params, "seed", this.seed);
        const theCount = getValueOrDefault(params, "count", this.count);
        const rnd = new MersenneTwister(theSeed);


        let theStartStates = this.startStates;
        if (theStartStates.length == 0) {
            theStartStates = [0];
        }
        let theStartStateLikelihoods = this.startStateLikelihoods;
        if (theStartStateLikelihoods.length == 0) {
            theStartStateLikelihoods = [1];
        }

        let theStateDomains = this.stateDomains;
        if (theStateDomains.length == 0) {
            theStateDomains = [[0]];
        }
        for (let i=0; i<theStateDomains.length; i++) {
            const dom = theStateDomains[i];
            if (dom.length == 0) {
                theStateDomains[i] = [0];
            }
        }

        const stateDomainDistributions = [];
        for (let i=0; i<this.stateDomainLikelihoods.length; i++) {
            let lik = this.stateDomainLikelihoods[i];
            let dist = getProbabilityDistribution(lik);
            stateDomainDistributions[i] = dist;
        }

        const stateTransitionDistributions = [];
        for (let i=0; i<this.stateTransitionLikelihoods.length; i++) {
            let lik = this.stateTransitionLikelihoods[i];
            let dist = getProbabilityDistribution(lik);
            stateTransitionDistributions[i] = dist;
        }

        const startStateDistribution = getProbabilityDistribution(createFilledPatternArray(theStartStates.length,
            this.startStateLikelihoods));

        let currentState = sampleIndexIntegerDistribution(rnd, startStateDistribution);

        const result = [];
        for (let i=0; i<theCount; i++) {
            // Sample from the domain
            const domain = theStateDomains[currentState % theStateDomains.length];

            const domainDistribution = stateDomainDistributions[currentState % stateDomainDistributions.length];

            const domainIndex = sampleIndexIntegerDistribution(rnd, domainDistribution);

            const element = domain[domainIndex % domain.length];
            
            result.push(element);

            const stateTransitionDistribution = stateTransitionDistributions[currentState % stateTransitionDistributions.length];

            currentState = sampleIndexIntegerDistribution(rnd, stateTransitionDistribution);
        }
        return result;
    }
}

class SimpleIntegerArrayEditorVariable extends IntegerArrayEditorVariable {
    constructor() {
        super();
        this.value = [];

        this._constructorName = "SimpleIntegerArrayEditorVariable";
    }

    getValue(module) {
        return this.value;
    }
}

class PatternIntegerArrayEditorVariable extends IntegerArrayEditorVariable {
    constructor() {
        super();
        this.count = 0;
        this.elements = [];
        this.startElements = [];
        this.endElements = [];

        this._constructorName = "PatternIntegerArrayEditorVariable";
    }

    getValue(module) {
        const result = [];
        for (let i=0; i<this.count; i++) {
            const value = getItemFromArrayWithStartEndItems(0, this.elements, this.count, i, this.startElements, this.endElements);
            result.push(value);
        }
        return result;
    }
}

class PatternDoubleArrayEditorVariable extends DoubleArrayEditorVariable {
    constructor() {
        super();
        this.count = 0;
        this.elements = [];
        this.startElements = [];
        this.endElements = [];

        this._constructorName = "PatternDoubleArrayEditorVariable";
    }

    getValue(module) {
        const result = [];
        for (let i=0; i<this.count; i++) {
            const value = getItemFromArrayWithStartEndItems(0, this.elements, this.count, i, this.startElements, this.endElements);
            result.push(value);
        }
        return result;
    }
}



