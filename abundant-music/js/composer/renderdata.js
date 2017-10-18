
class RenderData {
    constructor() {
        this.events = [];
    }

    toNetJSON() {
        var resultArr = [];
        resultArr.push("{");

        var renderChannelIndices = {};
        var renderChannelNames = [];
        var controlChannelIndices = {};
        var controlChannelNames = [];
        for (var i=0; i<this.events.length; i++) {
            var e = this.events[i];
            if (e.renderChannel) {
                var index = renderChannelIndices[e.renderChannel.id];
                if (typeof(index) === 'undefined') {
                    renderChannelIndices[e.renderChannel.id] = renderChannelNames.length;
                    renderChannelNames.push(e.renderChannel.id);
                }
            }
            if (e.controlChannel) {
                var index = controlChannelIndices[e.controlChannel.id];
                if (typeof(index) === 'undefined') {
                    controlChannelIndices[e.controlChannel.id] = controlChannelNames.length;
                    controlChannelNames.push(e.controlChannel.id);
                }
            }
        }

        resultArr.push("\"renderChannelNames\": " + JSON.stringify(renderChannelNames) + ",");
        resultArr.push("\"controlChannelNames\": " + JSON.stringify(controlChannelNames) + ",");

        resultArr.push("\"events\": [");
        var resultArr2 = [];
        for (var i=0; i<this.events.length; i++) {
            resultArr2.push(this.events[i].toNetJSON(renderChannelIndices, controlChannelIndices));
        }
        resultArr.push(resultArr2.join(",\n"));
        resultArr.push("]}\n");
        return resultArr.join("");
    }

    sort() {
        this.events.sort(function(a, b) {
            var diff = a.time - b.time;
            return diff;
        });
    }

    addEvent(event) {
        this.events.push(event);
        return this;
    }

    addEvents(events) {
        addAll(this.events, events);
        return this;
    }

    getEvents() {
        return this.events;
    }

    getNonOverlappingDatas() {
        var result = [];
        
        return result;
    }

    getTimeLimits() {
        var minTime = this.events.length == 0 ? 0 : 99999999;
        var maxTime = this.events.length == 0 ? 0 : -99999999;
        for (var i = 0; i<this.events.length; i++) {
            var e = this.events[i];
            var t = e.getTime();
            minTime = Math.min(minTime, t);
            maxTime = Math.max(maxTime, t);
        }
        return [minTime, maxTime];
    }

    splitOnTime(time) {
        var before = new RenderData();
        var after = new RenderData();
            
        for (var i = 0; i<this.events.length; i++) {
            var e = this.events[i];
            if (e.getTime() >= time) {
                after.events.push(e);
            } else {
                before.events.push(e);
            }
        }
        var result = [before, after];
        return result;
    }
}

class RenderEvent {
    constructor(time) {
        this.time = time;
    }

    toNetJSON(renderChannelIndices, controlChannelIndices) {
        var resultArr = [];

        for (var prop in this.netJSONPropertiesMap) {
            var value = this[prop];
            var shortProp = this.netJSONPropertiesMap[prop];
            value = this.netJSONTransformProperty(prop, value, renderChannelIndices, controlChannelIndices);
            if (typeof(value) === 'string') {
                resultArr.push("\"" + shortProp + "\":\"" + value + "\"");
            } else {
                resultArr.push("\"" + shortProp + "\":" + value);
            }
        }

        return "{" + resultArr.join(",") + "}";
    }

    netJSONTransformProperty(name, value, renderChannelIndices, controlChannelIndices) {
        if (name == "type") {
            return this.netJSONType;
        }
        return value;
    }

    getTime() {
        return this.time;
    }
}

class NoteOnEvent extends RenderEvent {
    constructor(note, time, onVelocity, renderChannel) {
        super(time);
        this.type = "noteOn";
        this.note = note;
        this.onVelocity = onVelocity;
        this.renderChannel = renderChannel;
    }

    netJSONTransformProperty(name, value, renderChannelIndices, controlChannelIndices) {
        if (name == "renderChannel") {
            return renderChannelIndices[value.id];
        } else {
            return RenderEvent.prototype.netJSONTransformProperty.call(this, name, value, renderChannelIndices, controlChannelIndices);
        }
    }

    toString() {
        return "noteOn(" + this.note + ", " + this.time + ", " + this.onVelocity + ", " + this.renderChannel.id + ")";
    }
}


NoteOnEvent.prototype.netJSONPropertiesMap = {"time": "t", "type": "y", "note": "n", "onVelocity": "v", "renderChannel": "c"};

NoteOnEvent.prototype.netJSONType = "n";


class NoteOffEvent extends RenderEvent {
    constructor(note, time, offVelocity, renderChannel) {
        super(time);
        this.type = "noteOff";
        this.note = note;
        this.offVelocity = offVelocity;
        this.renderChannel = renderChannel;
    }

    netJSONTransformProperty(name, value, renderChannelIndices, controlChannelIndices) {
        if (name == "renderChannel") {
            return renderChannelIndices[value.id];
        } else {
            return RenderEvent.prototype.netJSONTransformProperty.call(this, name, value, renderChannelIndices, controlChannelIndices);
        }
    }

    toString() {
        return "noteOff(" + this.note + ", " + this.time + ", " + this.offVelocity + ", " + this.renderChannel.id + ")";
    }
}

NoteOffEvent.prototype.netJSONPropertiesMap = {"time": "t", "type": "y", "note": "n", "offVelocity": "v", "renderChannel": "c"};

NoteOffEvent.prototype.netJSONType = "f";

class SetControlEvent extends RenderEvent {
    constructor(value, time, controlChannel) {
        super(time);
        this.type = "setControl";
        this.value = value;
        this.controlChannel = controlChannel;
    }

    netJSONTransformProperty(name, value, renderChannelIndices, controlChannelIndices) {
        if (name == "controlChannel") {
            return controlChannelIndices[value.id];
        } else {
            return RenderEvent.prototype.netJSONTransformProperty.call(this, name, value, renderChannelIndices, controlChannelIndices);
        }
    }
}

SetControlEvent.prototype.netJSONPropertiesMap = {"time": "t", "type": "y", "value": "v", "controlChannel": "c"};

SetControlEvent.prototype.netJSONType = "c";

class SetTempoEvent extends RenderEvent {
    constructor(bpm, time) {
        super(time);
        this.type = "setTempo";
        this.bpm = bpm;
    }

    toString() {
        return "setTempo(" + this.bpm + ", " + this.time + ")";
    }
}

SetTempoEvent.prototype.netJSONPropertiesMap = {"time": "t", "type": "y", "bpm": "b"};

SetTempoEvent.prototype.netJSONType = "t";

