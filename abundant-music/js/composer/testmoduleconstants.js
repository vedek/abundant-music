

const SongStructureType = {
    BUILD: 0,
    VERSE_CHORUS: 1,
    VERSE_CHORUS_BRIDGE: 2
};


const SimpleModuleGeneratorPhraseGroupType = {
    SINGLE_COMPLETE: 0,
    TONIC_PROLONG_PLUS_COMPLETE: 1,
    DECEPTIVE_PLUS_COMPLETE: 2,
    COMPLETE_PLUS_COMPLETE: 3,
    ANTECEDENT_CONSEQUENT: 4,
    TONIC_PROLONG_PLUS_DOMINANT_PROLONG_CADENCE: 5,
    TONIC_PROLONG_PLUS_DOMINANT_PROLONG_PLUS_TONIC_CADENCE_PROLONG: 6,
    TONIC_PROLONG_PLUS_DOMINANT_PROLONG_PLUS_COMPLETE: 7,
    TONICIZE_PLUS_COMPLETE: 8, // Returns immediately back in second phrase
    COMPLETE_PLUS_MODULATE: 9, // Can continue with new tonic but also return in next phrase group
    MODULATE_PLUS_MODULATE_BACK: 10,
    MODULATE_PLUS_COMPLETE: 11, // new tonic
    INCOMPLETE_PLUS_MODULATE: 12, //
    INCOMPLETE_SHORTER_PLUS_COMPLETE: 13, // Phrase elision
    INCOMPLETE_WEAK_PLUS_COMPLETE_WEAK_TONIC: 14, // Phrase extension
    COMPLETE_PLUS_COMPLETE_DIFFERENT_SCALE_TYPE: 15,
    SINGLE_INCOMPLETE: 16,
    SINGLE_TONIC_PROLONG: 17,
    INCOMPLETE_PLUS_COMPLETE: 18,
    ANTECEDENT_CONSEQUENT_SHORTEN: 19,
    COMPLETE_PLUS_PHRASE_MODULATE: 20,
    TONICIZE_PLUS_TONICIZE: 21,
    INCOMPLETE_INITIAL_PLUS_COMPLETE: 22,
    PHRASE_MODULATE: 23,
    TONIC_PROLONG_PLUS_DOMINANT_PROLONG: 24,
    INCOMPLETE_PLUS_DOMINANT_PROLONG: 25,
    INCOMPLETE_PLUS_DOMINANT_PROLONG_CADENCE: 26,
    SINGLE_COMPLETE_PLAGIAL: 27,
    SINGLE_SILENT: 28,
    COMPLETE_PLAGIAL_PLUS_COMPLETE: 29,
    COMPLETE_PLUS_COMPLETE_PLAGIAL: 30,
    CUSTOM: 31,
    SINGLE_CUSTOM_HARMONY: 32,
    DOUBLE_CUSTOM_HARMONY: 33,
    INCOMPLETE_PLUS_COMPLETE_IMPERFECT: 34,
    SINGLE_COMPLETE_IMPERFECT: 35,
    INCOMPLETE_PLUS_DECEPTIVE: 36,
    DECEPTIVE_PLUS_DECEPTIVE: 37,
    COMPLETE_IMPERFECT_PLUS_DECEPTIVE: 38,
    TONICIZE_PLUS_DECEPTIVE: 39,
    SINGLE_DECEPTIVE: 40,
    COMPLETE_IMPERFECT_PLUS_COMPLETE_LENGTHEN_DOMINANT: 41,
    COMPLETE_IMPERFECT_PLUS_COMPLETE_LENGTHEN_FINAL_TONIC: 42,
    INCOMPLETE_PLUS_COMPLETE_LENGTHEN_DOMINANT: 43,
    INCOMPLETE_PLUS_COMPLETE_LENGTHEN_FINAL_TONIC: 44,
    DECEPTIVE_PLUS_COMPLETE_LENGTHEN_DOMINANT: 45,
    DECEPTIVE_PLUS_COMPLETE_LENGTHEN_FINAL_TONIC: 46,
    MODULATE_PLUS_COMPLETE_LENGTHEN_DOMINANT: 47,
    MODULATE_PLUS_COMPLETE_LENGTHEN_FINAL_TONIC: 48,
    TONICIZE_PLUS_COMPLETE_LENGTHEN_DOMINANT: 49,
    TONICIZE_PLUS_COMPLETE_LENGTHEN_FINAL_TONIC: 50,
    INCOMPLETE_INITIAL_PLUS_COMPLETE_LENGTHEN_DOMINANT: 51,
    INCOMPLETE_INITIAL_PLUS_COMPLETE_LENGTHEN_FINAL_TONIC: 52,

    toString: function(type) {
        switch (type) {
            case SimpleModuleGeneratorPhraseGroupType.COMPLETE_IMPERFECT_PLUS_COMPLETE_LENGTHEN_DOMINANT:
                return "Complete imperfect + complete lengthen dominant";
            case SimpleModuleGeneratorPhraseGroupType.COMPLETE_IMPERFECT_PLUS_COMPLETE_LENGTHEN_FINAL_TONIC:
                return "Complete imperfect + complete lengthen final tonic";
            case SimpleModuleGeneratorPhraseGroupType.INCOMPLETE_PLUS_COMPLETE_LENGTHEN_DOMINANT:
                return "Incomplete + complete lengthen dominant";
            case SimpleModuleGeneratorPhraseGroupType.INCOMPLETE_PLUS_COMPLETE_LENGTHEN_FINAL_TONIC:
                return "Incomplete + complete lengthen final tonic";
            case SimpleModuleGeneratorPhraseGroupType.DECEPTIVE_PLUS_COMPLETE_LENGTHEN_DOMINANT:
                return "Deceptive + complete lengthen dominant";
            case SimpleModuleGeneratorPhraseGroupType.DECEPTIVE_PLUS_COMPLETE_LENGTHEN_FINAL_TONIC:
                return "Deceptive + complete lengthen final tonic";
            case SimpleModuleGeneratorPhraseGroupType.MODULATE_PLUS_COMPLETE_LENGTHEN_DOMINANT:
                return "Modulate + complete lengthen dominant";
            case SimpleModuleGeneratorPhraseGroupType.MODULATE_PLUS_COMPLETE_LENGTHEN_FINAL_TONIC:
                return "Modulate + complete lengthen final tonic";
            case SimpleModuleGeneratorPhraseGroupType.TONICIZE_PLUS_COMPLETE_LENGTHEN_DOMINANT:
                return "Tonicize + complete lengthen dominant";
            case SimpleModuleGeneratorPhraseGroupType.TONICIZE_PLUS_COMPLETE_LENGTHEN_FINAL_TONIC:
                return "Tonicize + complete lengthen final tonic";
            case SimpleModuleGeneratorPhraseGroupType.INCOMPLETE_INITIAL_PLUS_COMPLETE_LENGTHEN_DOMINANT:
                return "Incomplete initial + complete lengthen dominant";
            case SimpleModuleGeneratorPhraseGroupType.INCOMPLETE_INITIAL_PLUS_COMPLETE_LENGTHEN_FINAL_TONIC:
                return "Incomplete initial + complete lengthen final tonic";
            case SimpleModuleGeneratorPhraseGroupType.INCOMPLETE_PLUS_DECEPTIVE:
                return "Incomplete + deceptive";
            case SimpleModuleGeneratorPhraseGroupType.DECEPTIVE_PLUS_DECEPTIVE:
                return "Deceptive + deceptive";
            case SimpleModuleGeneratorPhraseGroupType.COMPLETE_IMPERFECT_PLUS_DECEPTIVE:
                return "Complete imperfect + deceptive";
            case SimpleModuleGeneratorPhraseGroupType.TONICIZE_PLUS_DECEPTIVE:
                return "Tonicize + deceptive";
            case SimpleModuleGeneratorPhraseGroupType.COMPLETE_PLAGIAL_PLUS_COMPLETE:
                return "Complete plagial + complete";
            case SimpleModuleGeneratorPhraseGroupType.COMPLETE_PLUS_COMPLETE_PLAGIAL:
                return "Complete + complete plagial";
            case SimpleModuleGeneratorPhraseGroupType.ANTECEDENT_CONSEQUENT:
                return "Antecedent consequent";
            case SimpleModuleGeneratorPhraseGroupType.SINGLE_SILENT:
                return "Single silent";
            case SimpleModuleGeneratorPhraseGroupType.SINGLE_DECEPTIVE:
                return "Single deceptive";
            case SimpleModuleGeneratorPhraseGroupType.SINGLE_COMPLETE_PLAGIAL:
                return "Single complete plagial";
            case SimpleModuleGeneratorPhraseGroupType.SINGLE_COMPLETE_IMPERFECT:
                return "Single complete imperfect";
            case SimpleModuleGeneratorPhraseGroupType.ANTECEDENT_CONSEQUENT_SHORTEN:
                return "Antecedent consequent shorten";
            case SimpleModuleGeneratorPhraseGroupType.COMPLETE_PLUS_COMPLETE:
                return "Complete + complete";
            case SimpleModuleGeneratorPhraseGroupType.INCOMPLETE_PLUS_COMPLETE_IMPERFECT:
                return "Complete + complete imperfect";
            case SimpleModuleGeneratorPhraseGroupType.COMPLETE_PLUS_COMPLETE_DIFFERENT_SCALE_TYPE:
                return "Complete + complete change scale type";
            case SimpleModuleGeneratorPhraseGroupType.COMPLETE_PLUS_MODULATE:
                return "Complete + modulate";
            case SimpleModuleGeneratorPhraseGroupType.COMPLETE_PLUS_PHRASE_MODULATE:
                return "Complete + phrase modulate";
            case SimpleModuleGeneratorPhraseGroupType.DECEPTIVE_PLUS_COMPLETE:
                return "Deceptive + complete";
            case SimpleModuleGeneratorPhraseGroupType.INCOMPLETE_INITIAL_PLUS_COMPLETE:
                return "Incomplete initial + complete";
            case SimpleModuleGeneratorPhraseGroupType.INCOMPLETE_PLUS_COMPLETE:
                return "Incomplete + complete";
            case SimpleModuleGeneratorPhraseGroupType.INCOMPLETE_PLUS_MODULATE:
                return "Incomplete + modulate";
            case SimpleModuleGeneratorPhraseGroupType.INCOMPLETE_PLUS_DOMINANT_PROLONG:
                return "Incomplete + dominant prolong";
            case SimpleModuleGeneratorPhraseGroupType.INCOMPLETE_PLUS_DOMINANT_PROLONG_CADENCE:
                return "Incomplete + dominant prolong cadence";
            case SimpleModuleGeneratorPhraseGroupType.INCOMPLETE_SHORTER_PLUS_COMPLETE:
                return "Incomplete shorter + complete";
            case SimpleModuleGeneratorPhraseGroupType.INCOMPLETE_WEAK_PLUS_COMPLETE_WEAK_TONIC:
                return "Incomplete weak + complete weak tonic";
            case SimpleModuleGeneratorPhraseGroupType.MODULATE_PLUS_COMPLETE:
                return "Modulate + complete";
            case SimpleModuleGeneratorPhraseGroupType.MODULATE_PLUS_MODULATE_BACK:
                return "Modulate + modulate back";
            case SimpleModuleGeneratorPhraseGroupType.PHRASE_MODULATE:
                return "Phrase modulate";
            case SimpleModuleGeneratorPhraseGroupType.SINGLE_COMPLETE:
                return "Single complete";
            case SimpleModuleGeneratorPhraseGroupType.SINGLE_INCOMPLETE:
                return "Single incomplete";
            case SimpleModuleGeneratorPhraseGroupType.SINGLE_TONIC_PROLONG:
                return "Single tonic prolong";
            case SimpleModuleGeneratorPhraseGroupType.TONIC_PROLONG_PLUS_COMPLETE:
                return "Tonic prolong + complete";
            case SimpleModuleGeneratorPhraseGroupType.TONIC_PROLONG_PLUS_DOMINANT_PROLONG_CADENCE:
                return "Tonic prolong + dominant prolong cadence";
            case SimpleModuleGeneratorPhraseGroupType.TONIC_PROLONG_PLUS_DOMINANT_PROLONG:
                return "Tonic prolong + dominant prolong";
            case SimpleModuleGeneratorPhraseGroupType.TONIC_PROLONG_PLUS_DOMINANT_PROLONG_PLUS_COMPLETE:
                return "Tonic prolong + dominaint prolong + complete";
            case SimpleModuleGeneratorPhraseGroupType.TONIC_PROLONG_PLUS_DOMINANT_PROLONG_PLUS_TONIC_CADENCE_PROLONG:
                return "Tonic prolong + dominant prolong + tonic cadence prolong";
            case SimpleModuleGeneratorPhraseGroupType.TONICIZE_PLUS_COMPLETE:
                return "Tonicize + complete";
            case SimpleModuleGeneratorPhraseGroupType.TONICIZE_PLUS_TONICIZE:
                return "Tonicize + tonicize";
            case SimpleModuleGeneratorPhraseGroupType.CUSTOM:
                return "Custom";
            case SimpleModuleGeneratorPhraseGroupType.SINGLE_CUSTOM_HARMONY:
                return "Single custom harmony";
            case SimpleModuleGeneratorPhraseGroupType.DOUBLE_CUSTOM_HARMONY:
                return "Double custom harmony";
        }
        return "Unknown phrase group type " + type;
    },

    tonicizeOrModulate: function(type) {
        switch (type) {
            case SimpleModuleGeneratorPhraseGroupType.COMPLETE_PLUS_MODULATE:
            case SimpleModuleGeneratorPhraseGroupType.COMPLETE_PLUS_PHRASE_MODULATE:
            case SimpleModuleGeneratorPhraseGroupType.INCOMPLETE_PLUS_MODULATE:
            case SimpleModuleGeneratorPhraseGroupType.MODULATE_PLUS_COMPLETE:
            case SimpleModuleGeneratorPhraseGroupType.MODULATE_PLUS_MODULATE_BACK:
            case SimpleModuleGeneratorPhraseGroupType.PHRASE_MODULATE:
            case SimpleModuleGeneratorPhraseGroupType.TONICIZE_PLUS_COMPLETE:
            case SimpleModuleGeneratorPhraseGroupType.TONICIZE_PLUS_TONICIZE:
            case SimpleModuleGeneratorPhraseGroupType.TONICIZE_PLUS_DECEPTIVE:
            case SimpleModuleGeneratorPhraseGroupType.TONICIZE_PLUS_COMPLETE_LENGTHEN_DOMINANT:
            case SimpleModuleGeneratorPhraseGroupType.TONICIZE_PLUS_COMPLETE_LENGTHEN_FINAL_TONIC:
            case SimpleModuleGeneratorPhraseGroupType.MODULATE_PLUS_COMPLETE_LENGTHEN_DOMINANT:
            case SimpleModuleGeneratorPhraseGroupType.MODULATE_PLUS_COMPLETE_LENGTHEN_FINAL_TONIC:
                return true;
        }
        return false;
    }
};
addPossibleValuesFunction(SimpleModuleGeneratorPhraseGroupType, SimpleModuleGeneratorPhraseGroupType.SINGLE_COMPLETE, SimpleModuleGeneratorPhraseGroupType.INCOMPLETE_INITIAL_PLUS_COMPLETE_LENGTHEN_FINAL_TONIC);



const SongPartType = {
    VERSE_1: 0,
    VERSE_2: 1,
    CHORUS_1: 2,
    CHORUS_2: 3,
    BRIDGE_1: 4,
    BRIDGE_2: 5,
    MISC_1: 6,
    MISC_2: 7,

    getIndex: function(type) {
        switch (type) {
            case SongPartType.VERSE_1:
            case SongPartType.BRIDGE_1:
            case SongPartType.CHORUS_1:
            case SongPartType.MISC_1:
                return 0;
            case SongPartType.VERSE_2:
            case SongPartType.BRIDGE_2:
            case SongPartType.CHORUS_2:
            case SongPartType.MISC_2:
                return 1;
        }
        return 0;
    },

    isVerse: function(type) {
        switch (type) {
            case SongPartType.VERSE_1:
            case SongPartType.VERSE_2:
                return true;
        }
        return false;
    },
    isChorus: function(type) {
        switch (type) {
            case SongPartType.CHORUS_1:
            case SongPartType.CHORUS_2:
                return true;
        }
        return false;
    },
    isBridge: function(type) {
        switch (type) {
            case SongPartType.BRIDGE_1:
            case SongPartType.BRIDGE_2:
                return true;
        }
        return false;
    },

    toIndicatorString: function(type) {
        switch (type) {
            case SongPartType.BRIDGE_1:
                return "bridge1";
            case SongPartType.BRIDGE_2:
                return "bridge2";
            case SongPartType.CHORUS_1:
                return "chorus1";
            case SongPartType.CHORUS_2:
                return "chorus2";
            case SongPartType.VERSE_1:
                return "verse1";
            case SongPartType.VERSE_2:
                return "verse2";
            case SongPartType.MISC_1:
                return "misc1";
            case SongPartType.MISC_2:
                return "misc2";
        }
        return "verse1";
    },

    toString: function(type) {
        switch (type) {
            case SongPartType.BRIDGE_1:
                return "Bridge 1";
            case SongPartType.BRIDGE_2:
                return "Bridge 2";
            case SongPartType.CHORUS_1:
                return "Chorus 1";
            case SongPartType.CHORUS_2:
                return "Chorus 2";
            case SongPartType.VERSE_1:
                return "Verse 1";
            case SongPartType.VERSE_2:
                return "Verse 2";
            case SongPartType.MISC_1:
                return "Misc 1";
            case SongPartType.MISC_2:
                return "Misc 2";
        }
        return "Unknown song part type " + type;
    }
};
addPossibleValuesFunction(SongPartType, SongPartType.VERSE_1, SongPartType.MISC_2);


class MotifRythmInfo {
    constructor (options) {
        this.noteCountRange = [0.25, 1.0]; // Notes per beat

        this.zone1Prob = 0.5;
        this.zone1TripletLikelihood = getValueOrDefault(options, "zone1TripletLikelihood", 0.5);
        this.zone1DotSecondLikelihood = getValueOrDefault(options, "zone1DotSecondLikelihood", 0.5);
        this.zone1DotFirstLikelihood = getValueOrDefault(options, "zone1DotFirstLikelihood", 2);
        this.zone1DotNormalDotLikelihood = getValueOrDefault(options, "zone1DotNormalDotLikelihood", 0.5);
        this.zone1NormalDotDotLikelihood = getValueOrDefault(options, "zone1NormalDotDotLikelihood", 0.5);
        this.zone1DotDotNormalLikelihood = getValueOrDefault(options, "zone1DotDotNormalLikelihood", 0.5);
        this.zone1StartPosRange = getValueOrDefault(options, "zone1StartPosRange", [0, 0]);
        this.zone1EndPosRange = getValueOrDefault(options, "zone1EndPosRange", [0.75, 0.75]);

        this._constructorName = "MotifRythmInfo";
    }
}


const MelodyOffsetLevel = {
    VERY_LOW: -2,
    LOW: -1,
    MIDDLE: 0,
    HIGH: 1,
    VERY_HIGH: 2,

    toString: function(t) {
        switch (t) {
            case MelodyOffsetLevel.HIGH:
                return "High";
            case MelodyOffsetLevel.LOW:
                return "Low";
            case MelodyOffsetLevel.MIDDLE:
                return "Middle";
            case MelodyOffsetLevel.VERY_HIGH:
                return "Very high";
            case MelodyOffsetLevel.VERY_LOW:
                return "Very low";
        }
        return "Unknown melody offset level " + t;
    }
};
addPossibleValuesFunction(MelodyOffsetLevel, MelodyOffsetLevel.VERY_LOW, MelodyOffsetLevel.VERY_HIGH);


class RenderAmountStrengthMap {
    constructor() {
        this.veryWeak = [0.02];
        this.weak = [0.15];
        this.medium = [0.4];
        this.strong = [0.7];
        this.veryStrong = [1.0];
        this._constructorName = "RenderAmountStrengthMap";
    }
}



class IndexPropertyIndex {
    constructor() {
        this.indexProperty = PhraseGroupIndexProperty.HARMONY_RYTHM;
        this.otherPartType = SongPartType.VERSE_1;
        this._constructorName = "IndexPropertyIndex";
    }
}




let PhraseGroupIndexProperty = {
    MELODY_SHAPE: 0,
    BASS_SHAPE: 1,
    HARMONY: 2,
    HARMONY_RYTHM: 3,
    SUSPEND: 4,
    MELODY_INSTRUMENT_DISTRIBUTION: 5,
    INNER_1_INSTRUMENT_DISTRIBUTION: 6,
    INNER_2_INSTRUMENT_DISTRIBUTION: 7,
    BASS_INSTRUMENT_DISTRIBUTION: 8,
    MELODY_MOTIF_DISTRIBUTION: 9,
    INNER_1_MOTIF_DISTRIBUTION: 10,
    INNER_2_MOTIF_DISTRIBUTION: 11,
    BASS_MOTIF_DISTRIBUTION: 12,
    HARMONY_CHARACTERISTIC: 13,
    PERCUSSION_MOTIF_DISTRIBUTION: 14,
    RENDER_AMOUNT: 15,
    TEMPO: 16,
    PERCUSSION_FILL_DISTRIBUTION: 17,
    TEMPO_CHANGE_1: 18,
    TEMPO_CHANGE_2: 19,
    MELODY_EFFECTS: 20,
    INNER_1_EFFECTS: 21,
    INNER_2_EFFECTS: 22,
    BASS_EFFECTS: 23,
    PERCUSSION_EFFECTS: 24,

    toString: function(type) {
        switch (type) {
            case PhraseGroupIndexProperty.BASS_EFFECTS:
               return "Bass Effects";
            case PhraseGroupIndexProperty.BASS_INSTRUMENT_DISTRIBUTION:
               return "Bass Instrument Distribution";
            case PhraseGroupIndexProperty.BASS_MOTIF_DISTRIBUTION:
               return "Bass Motif Distribution";
            case PhraseGroupIndexProperty.BASS_SHAPE:
               return "Bass Shape";
            case PhraseGroupIndexProperty.HARMONY:
               return "Harmony";
            case PhraseGroupIndexProperty.HARMONY_CHARACTERISTIC:
               return "Harmony Characteristic";
            case PhraseGroupIndexProperty.HARMONY_RYTHM:
               return "Harmony Rythm";
            case PhraseGroupIndexProperty.INNER_1_EFFECTS:
               return "Inner 1 Effects";
            case PhraseGroupIndexProperty.INNER_1_INSTRUMENT_DISTRIBUTION:
               return "Inner 1 Instrument Distribution";
            case PhraseGroupIndexProperty.INNER_1_MOTIF_DISTRIBUTION:
               return "Inner 1 Motif Distribution";
            case PhraseGroupIndexProperty.INNER_2_EFFECTS:
               return "Inner 2 Effects";
            case PhraseGroupIndexProperty.INNER_2_INSTRUMENT_DISTRIBUTION:
               return "Inner 2 Instrument Distribution";
            case PhraseGroupIndexProperty.INNER_2_MOTIF_DISTRIBUTION:
               return "Inner 2 Motif Distribution";
            case PhraseGroupIndexProperty.MELODY_EFFECTS:
               return "Melody Effects";
            case PhraseGroupIndexProperty.MELODY_INSTRUMENT_DISTRIBUTION:
               return "Melody Instrument Distribution";
            case PhraseGroupIndexProperty.MELODY_MOTIF_DISTRIBUTION:
               return "Melody Motif Distribution";
            case PhraseGroupIndexProperty.MELODY_SHAPE:
               return "Melody Shape";
            case PhraseGroupIndexProperty.PERCUSSION_EFFECTS:
               return "Percussion Effects";
            case PhraseGroupIndexProperty.PERCUSSION_FILL_DISTRIBUTION:
               return "Percussion Fill Distribution";
            case PhraseGroupIndexProperty.PERCUSSION_MOTIF_DISTRIBUTION:
               return "Percussion Motif Distribution";
            case PhraseGroupIndexProperty.RENDER_AMOUNT:
               return "Render Amount";
            case PhraseGroupIndexProperty.SUSPEND:
               return "Suspend";
            case PhraseGroupIndexProperty.TEMPO:
               return "Tempo";
            case PhraseGroupIndexProperty.TEMPO_CHANGE_1:
               return "Tempo Change 1";
            case PhraseGroupIndexProperty.TEMPO_CHANGE_2:
               return "Tempo Change 2";
        }
        return "Unknown phrase group index property";
    }

};
addPossibleValuesFunction(PhraseGroupIndexProperty, PhraseGroupIndexProperty.MELODY_SHAPE, PhraseGroupIndexProperty.PERCUSSION_EFFECTS);




//veryWeak: [0.02],
//    weak: [0.15],
//    medium: [0.4],
//    strong: [0.7],
//    veryStrong: [1.0]

const SongPartStrength = {
    DEFAULT: 0,
    VERY_WEAK: 1,
    WEAK: 2,
    MEDIUM: 3,
    STRONG: 4,
    VERY_STRONG: 5,

    toString: function(type) {
        switch (type) {
            case SongPartStrength.DEFAULT:
                return "Default";
            case SongPartStrength.MEDIUM:
                return "Medium";
            case SongPartStrength.STRONG:
                return "Strong";
            case SongPartStrength.VERY_STRONG:
                return "Very Strong";
            case SongPartStrength.VERY_WEAK:
                return "Very Weak";
            case SongPartStrength.WEAK:
                return "Weak";
        }
        return "Medium";
    },

    toIndicatorString: function(type) {
        switch (type) {
            case SongPartStrength.DEFAULT:
                return "";
            case SongPartStrength.MEDIUM:
                return "medium";
            case SongPartStrength.STRONG:
                return "strong";
            case SongPartStrength.VERY_STRONG:
                return "veryStrong";
            case SongPartStrength.VERY_WEAK:
                return "veryWeak";
            case SongPartStrength.WEAK:
                return "weak";
        }
        return "";
    }
};
addPossibleValuesFunction(SongPartStrength, SongPartStrength.DEFAULT, SongPartStrength.VERY_STRONG);


class AbstractSongPartStructureInfo {
    constructor() {
        this.partType = SongPartType.VERSE_1;

        this.harmonyRythmCountOverrides = [];
        this.harmonyTotalLengthOverrides = [];

        this.overridePhraseGroupType = false;
        this.phraseGroupType = SimpleModuleGeneratorPhraseGroupType.ANTECEDENT_CONSEQUENT_SHORTEN;
        this.overrideMajorModulationTarget = false;
        this.majorModulationTarget = DynamicHarmonyModulationTarget.DOMINANT;
        this.overrideMinorModulationTarget = false;
        this.minorModulationTarget = DynamicHarmonyModulationTarget.DOMINANT;

        this.overrideScaleBaseNote = false;
        this.scaleBaseNote = 60;
        this.overrideScaleType = false;
        this.scaleType = ScaleType.MAJOR;

        // For custom harmony
        this.harmonyElementIndices = [];

        // For custom melody and bass curves
        this.customMelodyCurveIndices = [];
        this.customBassCurveIndices = [];

        // For custom render elements
        this.extraMelodyRenderElementIndices = [];
        this.extraInner1RenderElementIndices = [];
        this.extraInner2RenderElementIndices = [];
        this.extraBassRenderElementIndices = [];
        this.extraPercussionRenderElementIndices = [];


        // Forcing indices
        this.melodyShapeIndexOverride = [];
        this.bassShapeIndexOverride = [];
        this.harmonyIndexOverride = [];
        this.harmonyRythmIndexOverride = [];
        this.suspendIndexOverride = [];
        this.melodyChannelDistributionIndexOverride = [];
        this.inner1ChannelDistributionIndexOverride = [];
        this.inner2ChannelDistributionIndexOverride = [];
        this.bassChannelDistributionIndexOverride = [];
        this.melodyMotifDistributionIndexOverride = [];
        this.inner1MotifDistributionIndexOverride = [];
        this.inner2MotifDistributionIndexOverride = [];
        this.bassMotifDistributionIndexOverride = [];
        this.percussionMotifDistributionIndexOverride = [];
        this.percussionFillMotifDistributionIndexOverride = [];
        this.harmonyExtraIndexOverride = [];


        this.renderAmountIndexOverride = [];
        this.tempoIndexOverride = [];
        this.sequentialTempoChangeIndexOverride = [];
        this.parallelTempoChangeIndexOverride = [];
        this.sequentialMelodyEffectChangeIndexOverride = [];
        this.sequentialInner1EffectChangeIndexOverride = [];
        this.sequentialInner2EffectChangeIndexOverride = [];
        this.sequentialBassEffectChangeIndexOverride = [];
        this.sequentialPercussionEffectChangeIndexOverride = [];

    }
}

class SongPartTypeOverrideInfo extends AbstractSongPartStructureInfo {
    constructor(options) {
        super(options);

        this.customPhraseTypes = [PhraseHarmonyElementType.INCOMPLETE, PhraseHarmonyElementType.COMPLETE];

        this.sameGroupIndexSames = getValueOrDefault(options, "sameGroupIndexSames", []); // Forcing some index properties to be same
        this.sameGroupIndexDifferents = getValueOrDefault(options, "sameGroupIndexDifferents", []); // Forcing some index properties to be different
        this.differentGroupIndexSameInfos = []; // IndexPropertyIndex
        this.differentGroupIndexDifferentInfos = []; // IndexPropertyIndex

        this._constructorName = "SongPartTypeOverrideInfo";
    }
}


class SongPartStructureInfo extends AbstractSongPartStructureInfo{
    constructor(options) {
        super(options)
        this.strength = getValueOrDefault(options, "strength", SongPartStrength.DEFAULT);

        this.prefixProbsOverride = getValueOrDefault(options, "prefixProbsOverride", []);
        this.postfixProbsOverride = getValueOrDefault(options, "postfixProbsOverride", []);

        this.majorGroupModulationTarget = getValueOrDefault(options, "majorGroupModulationTarget", -1);
        this.minorGroupModulationTarget = getValueOrDefault(options, "minorGroupModulationTarget", -1);

        this.melodyRenderAmountOverride = [];
        this.inner1RenderAmountOverride = [];
        this.inner2RenderAmountOverride = [];
        this.bassRenderAmountOverride = [];
        this.percussionRenderAmountOverride = [];

        this.prefixInfoOverrides = [];
        this.postfixInfoOverrides = [];

        this._constructorName = "SongPartStructureInfo";
    }
}
