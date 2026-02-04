export class SoundManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.3; // Default volume
        this.masterGain.connect(this.ctx.destination);
    }

    playTone(freq, type, duration, startTime = 0) {
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + startTime);

        gain.gain.setValueAtTime(0.5, this.ctx.currentTime + startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + startTime + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(this.ctx.currentTime + startTime);
        osc.stop(this.ctx.currentTime + startTime + duration);
    }

    playClick() {
        this.playTone(800, 'sine', 0.1);
    }

    playReveal() {
        this.playTone(600, 'sine', 0.2);
    }

    playFlag() {
        this.playTone(300, 'square', 0.05);
    }

    playExplosion() {
        if (this.ctx.state === 'suspended') this.ctx.resume();

        // White Noise
        const bufferSize = this.ctx.sampleRate * 0.5; // 0.5 sec
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);

        noise.connect(gain);
        gain.connect(this.masterGain);
        noise.start();

        // Add Low Frequency Boom
        this.playTone(50, 'sawtooth', 0.8);
    }

    playWin() {
        const now = 0;
        // C Major Arpeggio
        this.playTone(523.25, 'sine', 0.2, now);       // C5
        this.playTone(659.25, 'sine', 0.2, now + 0.1); // E5
        this.playTone(783.99, 'sine', 0.2, now + 0.2); // G5
        this.playTone(1046.50, 'sine', 0.4, now + 0.3); // C6
    }

    playDrop() {
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.2);

        gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.2);
    }

    playEat() {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        this.playTone(600, 'sine', 0.1, 0);
        this.playTone(800, 'sine', 0.1, 0.1);
    }

    playTurn() {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        this.playTone(200, 'triangle', 0.05);
    }
}
