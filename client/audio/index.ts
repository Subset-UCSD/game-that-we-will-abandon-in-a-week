// sounds effects and music

// AudioContext = new AudioContext();

const MUTE_STORAGE_KEY = "sound-muted";

// preload sound effects and handle sound playing
export class AudioManager {
    private context?: AudioContext;
    private masterGain?: GainNode;
    // preloaded sounds
    private buffers = new Map<string, AudioBuffer>();

    // sound controls
    private muted = localStorage.getItem(MUTE_STORAGE_KEY) === 'true';
    private volume = 0.7;

    private getContext(): AudioContext {
        if (this.context) return this.context;

        this.context = new AudioContext();
        this.masterGain = this.context.createGain();
        this.masterGain.connect(this.context.destination);
		this.updateMasterVolume();

        return this.context;
    }

    private updateMasterVolume() {
		if (!this.masterGain) return;
		this.masterGain.gain.value = this.muted ? 0 : this.volume;
	}

    // unlock sound on first user interaction
    async unlock() {
        const context = this.getContext();

        if (context.state === 'suspended') {
            await context.resume();
        }
    }

    unlockOnFirstInteraction() {
        // TODO: remove the event listeners
        const unlock = () => {
            void this.unlock();
        };

        // TODO: add event listeners
    }

    // fetch sounds to buffers
    async preload(sounds: Record<string, string>) {
        const context = this.getContext();

        for (const [name, url] of Object.entries(sounds)) {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await context.decodeAudioData(arrayBuffer);
            this.buffers.set(name, audioBuffer);
        }
    }

}