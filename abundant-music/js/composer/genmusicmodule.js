

class GenMusicModule {
    constructor() {
        this.id = "module1";
        this.renderers = [];
        this.structures = [];
        this.sections = [];
        this.harmony = [];
        this.percussionMotifs = [];
        this.motifs = [];
        this.motifGroups = [];
        this.rythms = [];
        this.rythmGroups = [];
        this.curves = [];
        this.curveGroups = [];
        this.parameters = [];
        this.renderChannels = [];
        this.namedNotes = [];
        this.controlChannels = [];
        this.voiceLinePlanners = [];
        this.figurationPlanners = [];
        this._variables = [];
        this._variablesHash = {};
        this.procedures = [];

        // Stuff that are normally somewhere else but can be named and reused

        // Voice lines are normally part of a section, but can be named and used for harmony generation.
        // Good for using an existing melody/bass and harmonize it
        this.voiceLines = []; 
        this.idCounters = {};

        this.reusables = {};

        this._constructorName = "GenMusicModule";
    }

    getUniqueId(prefix, testArr) {
        let counter = this.idCounters[prefix];
        for (let j=0; j<100; j++) {
            if (counter) {
                counter++;
            } else {
                counter = 1;
                this.idCounters[prefix] = counter;
            }
            const str = prefix + "" + counter;
            let found = false;
            for (let i=0; i<testArr.length; i++) {
                if (str == testArr[i].id) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                return str;
            }
        }
        logit("failed to find unique id with prefix " + prefix + " and arr " + testArr + "<br />");
    }

    deleteRythm(r) {
        arrayDelete(this.rythms, r);
        return this;
    }

    setRythms(r) {
        this.rythms = r;
        return this;
    }

    getRythms() {
        return this.rythms;
    }

    getMotifs() {
        return this.motifs;
    }

    getCurves() {
        return this.curves;
    }

    getHarmonies() {
        return this.harmony;
    }

    getSections() {
        return this.sections;
    }

    getStructures() {
        return this.structures;
    }

    addRenderer(s) {
        this.renderers.push(s);
        return this;
    }

    addStructure(s) {
        this.structures.push(s);
        return this;
    }

    addSection(s) {
        this.sections.push(s);
        return this;
    }

    addHarmony(s) {
        this.harmony.push(s);
        return this;
    }

    addMotif(m) {
        this.motifs.push(m);
        return this;
    }

    addMotifGroup(s) {
        this.motifGroups.push(s);
        return this;
    }

    addRythm(s) {
        this.rythms.push(s);
        return this;
    }

    addRythmGroup(s) {
        this.rythmGroups.push(s);
        return this;
    }

    addCurve(s) {
        this.curves.push(s);
        return this;
    }

    addCurveGroup(s) {
        this.curveGroups.push(s);
        return this;
    }

    addParameter(s) {
        this.parameters.push(s);
        return this;
    }

    addRenderChannel(s) {
        this.renderChannels.push(s);
        return this;
    }

    addControlChannel(s) {
        this.controlChannels.push(s);
        return this;
    }

    addVoiceLinePlanner(s) {
        this.voiceLinePlanners.push(s);
        return this;
    }

    addVariable(s) {
        this._variables.push(s);
        this._variablesHash[s.id] = s;
        return this;
    }

    getVariables() {
        return this._variables;
    }

    getRythm(id) {
        return getObjectWithId(id, this.rythms);
    }

    getVariable(id) {
        return this._variablesHash[id];
    }

    getRythmGroup(id) {
        return getObjectWithId(id, this.rythmGroups);
    }

    getCurve(id) {
        return getObjectWithId(id, this.curves);
    }

    getCurveGroup(id) {
        return getObjectWithId(id, this.curveGroups);
    }

    getParameter(id) {
        return getObjectWithId(id, this.parameters);
    }

    getSynthRenderer(id) {
        return getObjectWithId(id, this.renderers);
    }

    getRenderer(id) {
        return getObjectWithId(id, this.renderers);
    }

    getStructure(id) {
        return getObjectWithId(id, this.structures);
    }

    getSection(id) {
        return getObjectWithId(id, this.sections);
    }

    getHarmony(id) {
        return getObjectWithId(id, this.harmony);
    }

    getMotif(id) {
        return getObjectWithId(id, this.motifs);
    }

    getNamedNote(id) {
        return getObjectWithId(id, this.namedNotes);
    }

    getPercussionMotif(id) {
        return getObjectWithId(id, this.percussionMotifs);
    }

    getMotifGroup(id) {
        return getObjectWithId(id, this.motifGroups);
    }

    getControlChannel(id) {
        return getObjectWithId(id, this.controlChannels);
    }

    getRenderChannel(id) {
        return getObjectWithId(id, this.renderChannels);
    }

    getVoiceLinePlanner(id) {
        return getObjectWithId(id, this.voiceLinePlanners);
    }

    getFigurationPlanner(id) {
        return getObjectWithId(id, this.figurationPlanners);
    }

    renderBatch(structureId) {

        const result = new RenderData();
        const structure = this.getStructure(structureId);
        if (structure) {
            const state = new RenderState(this, result);
            //        logit("Rendering structure from module ");

            structure.renderBatch(state);
        } else {
            logit( " could not find structure "
                + structureId);
        }
        return result;
    }

    toJSON() {
        // Create a pure JSON
        }
}


function createGenMusicModuleFromJson(options) {
    
    // Options can be all JSON but can also contain "real" objects without a "jsonType" property
    // In such cases, when a jsonType is necessary for knowing which constructor to use, JSON2
    // is called on the object first which must then provide a correct object with the jsonType
    // property set.

    const moduleOptions = {
        motifs: [
        {
            id: "motif",
            motifElements: [
            {
                jsonType: "VerticalRelativeMotifElement",
                length: 1,
                index: 2
            }
            ]
        }
        ],
        sections: [
        {
            voiceLines: [
            {
                id: "voiceLine",
                jsonType: "ConstantVoiceLine",
                lineElements: []
            }
            ],
            renderLines: [
            {
                id: "renderLine",
                channel: "renderChannel",
                renderElements: [
                {
                    jsonType: "MotifRenderElement",
                    motif: "motif",
                    voiceLine: "voiceLine"
                }
                ]
            }
            ]
        }
        ],
        structures: [],
        harmony: []
    };

}



