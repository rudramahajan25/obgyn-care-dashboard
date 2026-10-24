let audioCtx: AudioContext | null = null;

export function playAlarmTone(priority: "stat" | "urgent" | "routine" = "stat") {
  try {
    audioCtx ??= new AudioContext();
    const ctx = audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const bursts = priority === "stat" ? 3 : priority === "urgent" ? 2 : 1;
    const freq = priority === "stat" ? 880 : 660;

    osc.frequency.value = freq;
    osc.type = "square";
    gain.gain.value = 0.08;

    const now = ctx.currentTime;
    for (let i = 0; i < bursts; i++) {
      gain.gain.setValueAtTime(0.08, now + i * 0.35);
      gain.gain.setValueAtTime(0, now + i * 0.35 + 0.2);
    }

    osc.start(now);
    osc.stop(now + bursts * 0.35 + 0.1);
  } catch {
    /* Audio not available */
  }
}
