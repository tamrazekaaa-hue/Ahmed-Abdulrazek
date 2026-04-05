export class AudioRecorder {
  private stream: MediaStream | null = null;
  private audioCtx: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;

  async start(onData: (base64: string) => void) {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioCtx = new AudioContext({ sampleRate: 16000 });
      this.source = this.audioCtx.createMediaStreamSource(this.stream);
      
      // 4096 buffer size, 1 input channel, 1 output channel
      this.processor = this.audioCtx.createScriptProcessor(4096, 1, 1);
      
      this.processor.onaudioprocess = (e) => {
        const channelData = e.inputBuffer.getChannelData(0);
        const pcm16 = new Int16Array(channelData.length);
        for (let i = 0; i < channelData.length; i++) {
          pcm16[i] = Math.max(-1, Math.min(1, channelData[i])) * 0x7FFF;
        }
        
        // Convert to base64
        const buffer = new ArrayBuffer(pcm16.length * 2);
        const view = new DataView(buffer);
        for (let i = 0; i < pcm16.length; i++) {
          view.setInt16(i * 2, pcm16[i], true); // little endian
        }
        
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);
        onData(base64);
      };

      this.source.connect(this.processor);
      this.processor.connect(this.audioCtx.destination);
    } catch (err) {
      console.error("Error starting audio recording:", err);
      throw err;
    }
  }

  stop() {
    if (this.processor && this.audioCtx) {
      this.processor.disconnect();
      this.source?.disconnect();
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close();
    }
    this.processor = null;
    this.source = null;
    this.stream = null;
    this.audioCtx = null;
  }
}

export class AudioPlayer {
  private audioCtx: AudioContext | null = null;
  private nextPlayTime: number = 0;

  init() {
    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      this.audioCtx = new AudioContext({ sampleRate: 24000 });
      this.nextPlayTime = this.audioCtx.currentTime;
    }
  }

  playBase64(base64: string) {
    if (!this.audioCtx) return;

    try {
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      
      const pcm16 = new Int16Array(bytes.buffer);
      const audioBuffer = this.audioCtx.createBuffer(1, pcm16.length, 24000);
      const channelData = audioBuffer.getChannelData(0);
      
      for (let i = 0; i < pcm16.length; i++) {
        channelData[i] = pcm16[i] / 0x7FFF;
      }

      const source = this.audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioCtx.destination);
      
      const startTime = Math.max(this.audioCtx.currentTime, this.nextPlayTime);
      source.start(startTime);
      this.nextPlayTime = startTime + audioBuffer.duration;
    } catch (err) {
      console.error("Error playing audio chunk:", err);
    }
  }

  stop() {
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close();
      this.audioCtx = null;
    }
  }
}
