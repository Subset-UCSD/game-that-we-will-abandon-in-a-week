// sounds effects and music

// AudioContext = new AudioContext();

export type PlaySoundOptions = {
	volume?: number;       // 0 to 1
	pan?: number;          // -1 to 1
	playbackRate?: number;
};

const MUTE_STORAGE_KEY = "sound-muted";

// preload sound effects and handle sound playing
export class AudioManager {
    private context?: AudioContext;
    private masterGain?: GainNode;
    // preloaded sounds
    private buffers = new Map<string, AudioBuffer[]>();

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
        const unlock = () => {
            void this.unlock();

            removeEventListener("pointerdown", unlock);
            removeEventListener("keydown", unlock);
        };

        document.addEventListener("pointerdown", unlock);
		document.addEventListener("keydown", unlock);
    }

    // fetch sounds to buffers
    async preload(sounds: Record<string, string | string[]>) {
        const context = this.getContext();

        // fetch all sounds in parallel
        await Promise.all(
            Object.entries(sounds).map(async ([name, source]) => {
                const urls = Array.isArray(source) ? source : [source];

                // i love parallelization
                const buffers = await Promise.all(
                    urls.map(async (url) => {
                        const response = await fetch(url);

                        if (!response.ok) {
                            console.error(`Failed to load sound ${name} from ${url}`);
                        }

                        const arrayBuffer = await response.arrayBuffer();
                        const audioBuffer = await context.decodeAudioData(arrayBuffer);
                        return audioBuffer;
                    })
                );

                this.buffers.set(name, buffers);
            })
        );
    }

    play(name: string, options: PlaySoundOptions = {}) {
        // assume that PlaySoundOptions has valid values if provided, eg. panner is between -1 and 1
        const context = this.getContext();
        const variations = this.buffers.get(name);
        if (!variations?.length || context.state !== 'running') return;

        const buffer = variations[Math.floor(Math.random() * variations.length)];

        const source = context.createBufferSource();
        const gain = context.createGain();
        const panner = context.createStereoPanner();

        source.buffer = buffer;
        source.playbackRate.value = options.playbackRate ?? 1;
        gain.gain.value = options.volume ?? 1;
        panner.pan.value = options.pan ?? 0;

        source.connect(panner);
        panner.connect(gain);
        gain.connect(this.masterGain!);

        source.start();
    }

    setMuted(muted: boolean) {
        this.muted = muted;
        localStorage.setItem(MUTE_STORAGE_KEY, String(muted));
        this.updateMasterVolume();
    }

    // im imagining a button that toggles the muted state
    toggleMuted() {
        this.setMuted(!this.muted);
    }

    // for UI
    isMuted() {
        return this.muted;
    }

    setVolume(volume: number) {
        this.volume = Math.max(0, Math.min(1, volume));
        this.updateMasterVolume();
    }
}

export const audio = new AudioManager();