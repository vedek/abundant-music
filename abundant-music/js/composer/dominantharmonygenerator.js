
class DominantHarmonyGenerator extends StaticHarmonyGenerator {
    constructor(options) {
        // Changing some options to make static harmony work for dominant
        options.baseRoot = 4;
        options.auxiliaryChordRoots = [0];
        options.auxiliaryChordRootLikelihoods = [1];
        super(options);
    }
}

