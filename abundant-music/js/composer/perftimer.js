
class PerfTimer {
    constructor(name) {
        this.name = name;
        this.lastStartTime = 0;
        this.totalTime = 0;
        this.intervals = 0;
    }

    report() {
        console.log(`PerfTimer ${this.name} total time: ${this.totalTime} time per interval: ${this.totalTime / this.intervals} intervals: ${this.intervals}`);
    }

    start() {
        this.lastStartTime = Date.now();
    }

    pause() {
        const now = Date.now();
        const diff = now - this.lastStartTime;
        this.intervals++;
        this.totalTime += diff;
        this.lastStartTime = now;
    }
}



const moduleConstructTimer = new PerfTimer("module construct");
const composeTimer = new PerfTimer("compose");

const harmonyTimer = new PerfTimer("harmony");
const voiceLeadingTimer = new PerfTimer("voice leading");
const voiceLeadingPrepareTimer = new PerfTimer("voice leading prepare");
const figurationTimer = new PerfTimer("figuration");

const perfTimer1 = new PerfTimer("timer 1");
const perfTimer2 = new PerfTimer("timer 2");
const perfTimer3 = new PerfTimer("timer 3");



