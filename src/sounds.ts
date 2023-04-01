import * as Tone from "tone";

export const metronomeSynth = new Tone.DuoSynth().toDestination();
// const metronome = [{ time: "0:0" }]; // downbeat only

export const kickDrum = new Tone.MembraneSynth({
  volume: 6,
}).toDestination();
// kickDrum.triggerAttackRelease(
//     "C1",
//     "8n",
//     Tone.Time(note.time).toSeconds() + looptime
//   );

const lowPass = new Tone.Filter({
  frequency: 8000,
}).toDestination();

export const snareDrum = new Tone.NoiseSynth({
  volume: 5,
  noise: {
    type: "white",
    playbackRate: 3,
  },
  envelope: {
    attack: 0.001,
    decay: 0.2,
    sustain: 0.15,
    release: 0.03,
  },
}).connect(lowPass);

// snareDrum.triggerAttackRelease(
//   "4n",
//   Tone.Time(note.time).toSeconds() + looptime
// );
