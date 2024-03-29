import {
  Button,
  Group,
  Input,
  Select,
  Slider,
  Space,
  Stack,
  Text,
  useMantineTheme,
} from "@mantine/core";
import { useHotkeys } from "@mantine/hooks";
import _ from "lodash";
import { useCallback, useEffect, useState } from "react";
import { Layer, Line, Rect, Stage } from "react-konva";
import * as Tone from "tone";
import { Beats } from "./beats";

import closedHiHatMp3 from "./sounds/closed-hihat.mp3";
import kickMp3 from "./sounds/kick.mp3";
import openHiHatMp3 from "./sounds/open-hihat.mp3";
import snareMp3 from "./sounds/snare.mp3";

interface BeatGrid2DProps {}

const beatsPerLoop = 16;

const NUM_ROWS = 4;

const INITIAL_BEAT_GROUP = _.map(Array(NUM_ROWS), (r) =>
  Array(beatsPerLoop).fill(false)
);

const INITIAL_BPM = 100;

const kickDrumSampler = new Tone.Sampler({
  A1: kickMp3,
}).toDestination();

const snareDrumSampler = new Tone.Sampler({
  A1: snareMp3,
}).toDestination();

const openHiHatSampler = new Tone.Sampler({
  A1: openHiHatMp3,
}).toDestination();

const closedHiHatSampler = new Tone.Sampler({
  A1: closedHiHatMp3,
}).toDestination();

let currentBeatNum = 0;

// TODO: debugging
Tone.Transport.bpm.value = INITIAL_BPM;

// maybe we want to loop
Tone.Transport.loop = true;
Tone.Transport.loopEnd = "1m";

let voices = INITIAL_BEAT_GROUP;
// TODO: try via ref, sometime
Tone.Transport.scheduleRepeat((time) => {
  console.log({ time, transportPos: Tone.Transport.position.toString() });
  // Schedules notes for all voices, for a specific beat
  currentBeatNum = (currentBeatNum + 1) % beatsPerLoop;
  voices.forEach((bg, bgIdx) => {
    const isActive = bg[currentBeatNum];
    if (isActive) {
      if (bgIdx === 3) {
        kickDrumSampler.triggerAttackRelease("A1", "16n", time);
      }
      if (bgIdx === 2) {
        snareDrumSampler.triggerAttackRelease("A1", "16n", time);
      }
      if (bgIdx === 1) {
        closedHiHatSampler.triggerAttackRelease("A1", "16n", time);
      }
      if (bgIdx === 0) {
        openHiHatSampler.triggerAttackRelease("A1", "16n", time);
      }
    }
  });
}, "16n");

type Voices = boolean[][];

const transportPosToSixteenthNote = (transportPos: Tone.Unit.Time) => {
  const [, quarterNote, sixthteenthNote] = transportPos
    .toString()
    .split(":")
    .map(Number);
  return quarterNote * 4 + sixthteenthNote;
};

export default function BeatGrid2D(props: BeatGrid2DProps) {
  const theme = useMantineTheme();
  const beatColors = theme.colors.orange.slice(3, 7);

  const [userNotes, setUserNotes] = useState<Tone.Unit.Time[][]>(
    _.map(new Array(voices.length), () => [])
  );

  const [bpm, setBpm] = useState(INITIAL_BPM);
  const [playing, setPlaying] = useState(false);
  const [transportPos, setTransportPos] = useState<Tone.Unit.Time>(0);
  const [currentBeatUI, setCurrentBeatUI] = useState(-1);
  const [, setRefreshPlz] = useState(false);

  const [currentBeatName, setCurrentBeatName] =
    useState<keyof typeof Beats>("Saturday");

  useHotkeys([
    [
      "a",
      () => {
        handleUserNote(0);
      },
    ],
    [
      "s",
      () => {
        handleUserNote(1);
      },
    ],
    [
      "d",
      () => {
        handleUserNote(2);
      },
    ],
    [
      "f",
      () => {
        handleUserNote(3);
      },
    ],
  ]);

  const setVoices = useCallback((v: Voices) => {
    voices = v;
    setRefreshPlz((r) => !r);
  }, []);

  useEffect(() => {
    setVoices([
      Beats[currentBeatName].voices.open_hihat.map((v) => Boolean(v)),
      Beats[currentBeatName].voices.hihat.map((v) => Boolean(v)),
      Beats[currentBeatName].voices.snare.map((v) => Boolean(v)),
      Beats[currentBeatName].voices.kick.map((v) => Boolean(v)),
    ]);
  }, [currentBeatName, setVoices]);

  useEffect(() => {
    Tone.Transport.bpm.value = bpm;
  }, [bpm]);

  useEffect(() => {
    if (!playing) {
      currentBeatNum = -1;
      return;
    }
  }, [playing]);

  useEffect(() => {
    // also update display of transport pos
    Tone.Transport.scheduleRepeat((time) => {
      setTransportPos(Tone.Transport.position);
      setCurrentBeatUI(currentBeatNum);
    }, "256n");
  }, []);

  const beatWidth = 50;
  const xOffset = 0;
  const ySpacing = 1;
  const yOffset = 0;
  const yTotal = voices.length * beatWidth;

  const linePos = transportPosToSixteenthNote(transportPos);

  return (
    <>
      {/* <Player currentBeat={currentBeat} voices={voices}  /> */}
      <Group grow>
        <Button
          onClick={async () => {
            if (!playing) {
              await Tone.start(); // start audio context
              await Tone.Transport.start();
            } else {
              await Tone.Transport.stop();
              currentBeatNum = -1;
              setCurrentBeatUI(currentBeatNum);
            }
            setPlaying(!playing);
          }}
        >
          {playing ? "Stop" : "Play"}
        </Button>
        <Text>Position: {transportPos.toString()}</Text>
        <Text>Tone Context State: {Tone.context.state}</Text>
        <Select
          data={Object.keys(Beats)}
          onChange={(v) =>
            v &&
            (v === "Saturday" || v === "CupStacker") &&
            setCurrentBeatName(v)
          }
        />

        <Stack>
          <Input.Label>BPM</Input.Label>
          <Slider
            value={bpm}
            onChange={(value) => setBpm(value)}
            min={60}
            max={120}
          />
        </Stack>
      </Group>

      <Space h="xl" />
      <Stage width={800} height={yTotal + 10}>
        <Layer>
          {/* background */}
          <Rect
            x={yOffset * beatWidth}
            y={xOffset * beatWidth}
            width={16 * beatWidth}
            height={yTotal}
            fill="lightgray"
          />
          {_.range(16).map((n) => (
            <Line
              key={n}
              x={xOffset * beatWidth}
              y={yOffset * beatWidth}
              points={[n * beatWidth, 0, n * beatWidth, yTotal]}
              tension={0.5}
              closed
              stroke="black"
              fillLinearGradientStartPoint={{ x: -50, y: -50 }}
              fillLinearGradientEndPoint={{ x: 50, y: 50 }}
              fillLinearGradientColorStops={[0, "red", 1, "yellow"]}
            />
          ))}
          {_.range(voices.length + 1).map((n) => (
            <Line
              key={n}
              x={xOffset * beatWidth}
              y={yOffset * beatWidth}
              points={[
                0,
                (yOffset + n * ySpacing) * beatWidth,
                16 * beatWidth,
                (yOffset + n * ySpacing) * beatWidth,
              ]}
              tension={0.5}
              closed
              stroke="black"
              fillLinearGradientStartPoint={{ x: -50, y: -50 }}
              fillLinearGradientEndPoint={{ x: 50, y: 50 }}
              fillLinearGradientColorStops={[0, "red", 1, "yellow"]}
            />
          ))}
          {voices.map((beats, bgIdx) => {
            return beats.map((beat, bIdx) => {
              return (
                <Rect
                  key={`${bgIdx}-${bIdx}`}
                  x={(xOffset + bIdx) * beatWidth}
                  y={(yOffset + bgIdx * ySpacing) * beatWidth}
                  width={beatWidth}
                  height={beatWidth}
                  fill={
                    beat ? beatColors[bgIdx % beatColors.length] : undefined
                  }
                  stroke={bIdx === currentBeatUI ? "green" : "black"}
                  onClick={() => {
                    const newVoices = _.cloneDeep(voices);
                    newVoices[bgIdx][bIdx] = !newVoices[bgIdx][bIdx];
                    setVoices(newVoices);
                  }}
                />
              );
            });
          })}

          {/* User played notes */}
          {userNotes.map((userNoteVoice, bgIdx) => {
            return userNoteVoice.map((note, noteIdx) => {
              // https://github.com/Tonejs/Tone.js/wiki/Time
              const sixteenths = transportPosToSixteenthNote(note);
              return (
                <Rect
                  key={`${bgIdx}-${noteIdx}`}
                  x={(xOffset + sixteenths) * beatWidth}
                  y={(yOffset + bgIdx * ySpacing) * beatWidth}
                  width={noteIdx === 0 ? 4 : 2}
                  height={beatWidth}
                  fill={noteIdx === 0 ? "lime" : "blue"}
                  stroke={undefined}
                />
              );
            });
          })}

          {/* position */}
          <Line
            x={xOffset * beatWidth}
            y={yOffset * beatWidth}
            points={[linePos * beatWidth, 0, linePos * beatWidth, yTotal]}
            tension={0.5}
            closed
            stroke="white"
            fillLinearGradientStartPoint={{ x: -50, y: -50 }}
            fillLinearGradientEndPoint={{ x: 50, y: 50 }}
            fillLinearGradientColorStops={[0, "red", 1, "yellow"]}
          />
        </Layer>
      </Stage>
    </>
  );

  function handleUserNote(voiceIdx: number) {
    const newUserNotes = _.cloneDeep(userNotes);
    // limit to 10 user notes
    if (userNotes[voiceIdx].length >= 10) {
      userNotes[voiceIdx].pop();
    }
    console.log({ transportPos: Tone.Transport.position.toString() });
    newUserNotes[voiceIdx] = [Tone.Transport.position, ...userNotes[voiceIdx]];
    console.log({ newUserNotes });
    setUserNotes(newUserNotes);
  }
}
