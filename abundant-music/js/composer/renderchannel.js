
function RenderChannel() {
    this.id = "";
    this.percussion = false;
    this._constructorName = "RenderChannel";
}


class NamedNote {
    constructor() {
        this.id = "";
        this._constructorName = "NamedNote";
    }

    getNote() {
        return 60;
    }

    setId(n) {
        this.id = n;
        return this;
    }
}

class SimpleNamedNote extends NamedNote {
    constructor() {
        super();
        this.note = 60;
        this._constructorName = "SimpleNamedNote";
    }

    getNote() {
        return this.note;
    }

    setNote(n) {
        this.note = n;
        return this;
    }
}

class MidiDrumNamedNote extends NamedNote {
    constructor() {
        super();
        this.note = MidiDrum.BASS_DRUM_1;
        this._constructorName = "MidiDrumNamedNote";
    }

    getNote() {
        return this.note;
    }

    setNote(n) {
        this.note = n;
        return this;
    }
}


