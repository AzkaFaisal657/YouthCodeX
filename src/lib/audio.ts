type SoundType = "brown" | "pink" | "binaural";

class FocusAudioEngine {
  private ctx: AudioContext | null = null;
  private nodes: AudioNode[] = [];
  private gainNode: GainNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private cleanupTimer: ReturnType<typeof setTimeout> | null = null;

  private async getCtx() {
    if (!this.ctx) this.ctx = new AudioContext();
    if (this.ctx.state === "suspended") {
      await this.ctx.resume();
    }
    return this.ctx;
     }
  getAnalyser(): AnalyserNode | null {
    return this.analyserNode;
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
      data[i] *= 0.2;
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    return src;
  }

  private makeBinaural(ctx: AudioContext, baseFreq = 440, beatFreq = 10) {
    const bus = ctx.createGain();

    const left = ctx.createOscillator();
    left.type = "sine";
    left.frequency.value = baseFreq;
    const leftGain = ctx.createGain();
    leftGain.gain.value = 0.3;
    const leftPan = ctx.createStereoPanner();
    leftPan.pan.value = -1;
    left.connect(leftGain).connect(leftPan).connect(bus);

    const right = ctx.createOscillator();
    right.type = "sine";
    right.frequency.value = baseFreq + beatFreq;
    const rightGain = ctx.createGain();
    rightGain.gain.value = 0.3;
    const rightPan = ctx.createStereoPanner();
    rightPan.pan.value = 1;
    right.connect(rightGain).connect(rightPan).connect(bus);

    return { bus, oscillators: [left, right] };
  }

  private clearNodes() {
    if (this.cleanupTimer) {
      clearTimeout(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.nodes.forEach((n) => {
      if ("stop" in n && typeof (n as OscillatorNode).stop === "function") {
        try {
          (n as OscillatorNode).stop();
        } catch {
          /* already stopped */
        }
      }
    });
    this.nodes = [];
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(0, this.ctx.currentTime);
      this.gainNode.disconnect();
    }
     if (this.analyserNode) {
      try { this.analyserNode.disconnect(); } catch { /* ok */ }
    }
    this.gainNode = null;
    this.analyserNode = null;
  }

  async start(type: SoundType, volume = 0.4) {
    this.stop(false);
    const ctx = await this.getCtx();

    this.gainNode = ctx.createGain();
    this.gainNode.gain.setValueAtTime(0, ctx.currentTime);

    this.analyserNode = ctx.createAnalyser();
    this.analyserNode.fftSize = 2048;
    this.analyserNode.smoothingTimeConstant = 0.85;
    this.gainNode.connect(this.analyserNode);
    this.analyserNode.connect(ctx.destination);
    if (type === "brown" || type === "pink") {
      const src = type === "brown" ? this.makeBrownNoise(ctx) : this.makePinkNoise(ctx);
      src.connect(this.gainNode);
      src.start();
      this.nodes = [src];
    } else {
      const { bus, oscillators } = this.makeBinaural(ctx);
      bus.connect(this.gainNode);
      oscillators.forEach((o) => o.start());
      this.nodes = [bus, ...oscillators];
    }

    const targetVolume = Math.min(volume, 0.7);
    this.gainNode.gain.linearRampToValueAtTime(targetVolume, ctx.currentTime + 1);
  }

  stop(fadeOut = true) {
    if (this.cleanupTimer) {
      clearTimeout(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    if (!this.gainNode || !this.ctx) {
      this.clearNodes();
      return;
    }

    const ctx = this.ctx;
    const gain = this.gainNode;

    if (fadeOut) {
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);
      this.cleanupTimer = setTimeout(() => this.clearNodes(), 850);
    } else {
      this.clearNodes();
    }
  }

  setVolume(volume: number) {
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + 0.2);
    }
  }
}

export const audioEngine = new FocusAudioEngine();
