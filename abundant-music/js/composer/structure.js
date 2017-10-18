
class Structure {
    constructor() {
        this.id = "structure";
        this.references = [];
        this._constructorName = "Structure";
    }

    renderBatch(state, progressFunc) {

        composeTimer.start();
        for (let i=0; i<this.references.length; i++) {
            const ref = this.references[i];
            if (ref.active) {
                ref.renderBatch(state);
            }
            if (progressFunc) {
                let fraction = 1;
                if (this.references.length > 1) {
                    fraction = i / (this.references.length - 1);
                }
                progressFunc(fraction);
            }
        }
        composeTimer.pause();
    }

    renderSection(state, index) {
        const ref = this.references[index];
        if (ref) {
            ref.renderBatch(state);
        } else {
            logit(`${this._constructorName}: Could not find section with index ${index}`);
        }
    }
}


