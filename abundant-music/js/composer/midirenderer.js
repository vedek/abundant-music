

class MidiRenderer {
    constructor() {
        this.id = "";
        this.structure = "";

        this.channelMaps = [];
        this.controlChannelMaps = [];

        this._constructorName = "MidiRenderer";
    }

    getMidiData(renderData, module, options) {
        const result = {};

        if (!options) {
            options = {
                exportEffects: true,
                exportVolume: true
            };
        }


        result.fileFormat = 0;
        result.midiDivisions = 192;

        const tracks = [];
        const track = {};
        tracks.push(track);
        const trackEvents = [];
        track.trackEvents = trackEvents;


        let time = 0;
        const events = renderData.getEvents();

        const quarterTicks = 192;


        const emptyChannels = {};

        const controlChannelMaps = {};
        for (var i=0; i<this.controlChannelMaps.length; i++) {
            var map = this.controlChannelMaps[i];
            controlChannelMaps[map.controlChannel] = map;
    //        logit("Adding control channel map " + map.controlChannel);
        }
        const channelMaps = {};
        for (var i=0; i<this.channelMaps.length; i++) {
            var map = this.channelMaps[i];
            channelMaps[map.renderChannel] = map;
            emptyChannels[map.channel] = true;
        }

        // Avoid adding events to channels that have no notes
        for (var i=0; i<events.length; i++) {
            var event = events[i];
            if (event.type == "noteOn" || event.type == "noteOff") {
                var channelMap = channelMaps[event.renderChannel.id];
                if (channelMap) {
                    emptyChannels[channelMap.channel] = false;
                }
            }
        }

        const sentProgramChanges = {};

        // Set all initial programs
        for (var i=0; i<this.channelMaps.length; i++) {
            var map = this.channelMaps[i];
            if (!emptyChannels[map.channel]) {

                if (!sentProgramChanges[map.channel]) {
                    var trackEvent = {
                        eventTime: 0,
                        eventMessage: {
                            messageClass: "ProgramChangeMessage",
                            channel: map.channel,
                            program: map.program
                        }
                    };
                    trackEvents.push(trackEvent);
                    sentProgramChanges[map.channel] = true;
                }
                // Add some initial control values
                for (let j=0; j<map.initialControllerMessages.length; j++) {
                    const message = map.initialControllerMessages[j];

                    var controllerType = MidiControllerType.getValue(message.type);
                    if (options.exportEffects && message.type != MidiControllerType.VOLUME ||
                        options.exportVolume && message.type == MidiControllerType.VOLUME) {

                        trackEvent = {
                            eventTime: 0,
                            eventMessage: {
                                messageClass: "ChannelMessage",
                                channel: map.channel,
                                status: "CONTROL_CHANGE",
                                data1: controllerType,
                                data2: message.value
                            }
                        };
                        trackEvents.push(trackEvent);
    //                    logit("Adding ctrl change " + map.channel);
                    } else {
        //                logit("Not exporting " + controllerType);
                    }
                }
            } else {
    //            logit("Channel " + map.channel + " was empty");
            }
        }


        let ticks = 0;
        for (var i=0; i<events.length; i++) {
            var event = events[i];

            const deltaTime = event.time - time;

            const eventTime = Math.round(quarterTicks * deltaTime);

            ticks += eventTime;

            var trackEvent = null;
            if (event.type == "noteOn" || event.type == "noteOff") {
                var channelMap = channelMaps[event.renderChannel.id];
                if (!channelMap) {
                    channelMap = {
                        channel: 0
                    };
                    // logit(" could not find channel map for " + event.renderChannel.id + " all maps: " + JSON.stringify(channelMaps) + "<br />")
                }
                const isNoteOn = event.type == "noteOn";

    //            if (!isNoteOn) {
    //                if (event.startTime < 8) {
    //                    logit(" off at " + event.time + " started at " + event.startTime + " ticks: " + ticks + ", " + (ticks / quarterTicks));
    //                }
    //            }

                const status = isNoteOn ? "NOTE_ON" : "NOTE_OFF";
                const dVelocity = isNoteOn ? event.onVelocity : event.offVelocity;
                const velocity = Math.round(clamp(dVelocity * 127, 0, 127));
    //            logit("Writing note on " + event.note + " to " + channelMap.channel);
                trackEvent = {
                    eventTime: eventTime,
                    eventMessage: {
                        messageClass: "VoiceMessage",
                        status: status,
                        channel: channelMap.channel,
                        data1: event.note,
                        data2: velocity
                    }
                };
            } else if (event.type == "setControl") {

                const controlMap = controlChannelMaps[event.controlChannel.id];
                if (!controlMap) {
    //                controlMap = {
    //                    channel: 0,
    //                    controllerType: MidiControllerType.VOLUME
    //                };
    //                logit("Could not find control map for " + event.controlChannel.id);
                    continue;
                } else {
    //                logit("Found control map for " + event.controlChannel.id + " " + JSON.stringify(controlMap));
                }
                const ctrlData = clamp(Math.round(event.value * controlMap.amplitude + controlMap.bias), 0, 127);
                var controllerType = MidiControllerType.getValue(controlMap.controllerType);
    //            logit("Writing ctrlData " + ctrlData + " to " + controlMap.channel + " controllerType: " + controllerType);

                if (controlMap &&
                    (options.exportEffects && controlMap.controllerType != MidiControllerType.VOLUME ||
                    options.exportVolume && controlMap.controllerType == MidiControllerType.VOLUME)) {

                    if (controllerType == MidiControllerType.VOLUME) {
    //                    logit("Adding volume message");
                    }
                    if (!emptyChannels[controlMap.channel]) {
                        trackEvent = {
                            eventTime: eventTime,
                            eventMessage: {
                                messageClass: "ChannelMessage",
                                channel: controlMap.channel,
                                status: "CONTROL_CHANGE",
                                data1: controllerType,
                                data2: ctrlData
                            }
                        };
                    }
    //                logit("Adding ctrl change " + map.channel);
                } else {
    //                logit("Not adding " + controllerType);
                }
            } else if (event.type == "setTempo") {
                const microsPerMinute = 60000000;
                const microsPerQuarter = Math.round(microsPerMinute / event.bpm);
    //            logit("midi renderer Writing tempo " + microsPerQuarter);
                trackEvent = {
                    eventTime: eventTime,
                    eventMessage: {
                        messageClass: "SetTempoMessage",
                        microsPerQuarter: microsPerQuarter
                    }
                };
            } else {
                logit("Unknown event type " + event.type);
            }
            if (trackEvent) {
                trackEvents.push(trackEvent);
                time = event.time;
            }
        }

        // Add the end of track event
        trackEvents.push({
            eventTime: quarterTicks,
            eventMessage: {
                messageClass: "EndTrackMessage"
            }
        });

        result.midiTracks = tracks;

        return result;
    }
}

class MidiChannelMap {
    constructor() {
        this.id = "";
        this.renderChannel = "";
        this.program = MidiProgram.ACOUSTIC_GRAND_PIANO;
        this.channel = 0;
        this.initialControllerMessages = [];
        this._constructorName = "MidiChannelMap";
    }
}

class MidiControlChannelMap {
    constructor() {
        this.id = "";
        this.controlChannel = "";
        this.channel = 0;
        this.amplitude = 1.0;
        this.bias = 0.0;
        this.controllerType = MidiControllerType.VOLUME;
        this._constructorName = "MidiControlChannelMap";
    }
}


class InitialMidiControllerMessage {
    constructor() {
        this.id = "";
        this.type = MidiControllerType.VOLUME;
        this.value = 64;
        this._constructorName = "InitialMidiControllerMessage";
    }

    setType(v) {
        this.type = v;
        return this;
    }

    setValue(v) {
        this.value = v;
        return this;
    }
}
