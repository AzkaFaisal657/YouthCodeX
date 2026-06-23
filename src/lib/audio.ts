type SoundType = "brown" | "pink" | "binaural";

class FocusAudioEngine {
  private ctx: AudioContext | null = null;
  private nodes: AudioNode[] = [];
  private gainNode: GainNode | null = null;

  private getCtx() {
    if (!this.ctx) this.ctx = new AudioContext();
    return this.ctx;
  }

  private makeBrownNoise(ctx: AudioContext) {
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5;
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    return src;
  }

  private makePinkNoise(ctx: AudioContext) {
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      b6 = white * 0.115926;
      data[i] *= 0.11;
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    return src;
  }

  private makeBinaural(ctx: AudioContext, baseFreq = 200, beatFreq = 10) {
    const merger = ctx.createChannelMerger(2);

    const left = ctx.createOscillator();
    left.frequency.value = baseFreq;
    const leftGain = ctx.createGain();
    leftGain.gain.value = 0.15;
    left.connect(leftGain).connect(merger, 0, 0);

    const right = ctx.createOscillator();
    right.frequency.value = baseFreq + beatFreq;
    const rightGain = ctx.createGain();
    rightGain.gain.value = 0.15;
    right.connect(rightGain).connect(merger, 0, 1);

    return { merger, oscillators: [left, right] };
  }

  start(type: SoundType, volume = 0.25) {
    this.stop();
    const ctx = this.getCtx();
    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = 0;
    this.gainNode.connect(ctx.destination);

    if (type === "brown" || type === "pink") {
      const src = type === "brown" ? this.makeBrownNoise(ctx) : this.makePinkNoise(ctx);
      src.connect(this.gainNode);
      src.start();
      this.nodes = [src];
    } else {
      const { merger, oscillators } = this.makeBinaural(ctx);
      merger.connect(this.gainNode);
      oscillators.forEach((o) => o.start());
      this.nodes = [merger, ...oscillators];
    }

    this.gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 1.5);
  }

  stop() {
    if (this.gainNode && this.ctx) {
      const ctx = this.ctx;
      this.gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);
      setTimeout(() => {
        this.nodes.forEach((n) => {
          if ("stop" in n && typeof (n as OscillatorNode).stop === "function") {
            (n as OscillatorNode).stop();
          }
        });
        this.nodes = [];
      }, 850);
    }
  }

  setVolume(volume: number) {
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + 0.2);
    }
  }
}

export const audioEngine = new FocusAudioEngine();