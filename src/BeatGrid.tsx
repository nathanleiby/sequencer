import { Button, Group, Space, Text, useMantineTheme } from "@mantine/core";
import _ from "lodash";
import { useEffect, useState } from "react";
import { Layer, Line, Rect, Stage } from "react-konva";
import * as Tone from "tone";

interface BeatGrid2DProps {}

const beatsPerLoop = 16;

const NUM_ROWS = 4;

const INITIAL_BEAT_GROUP = _.map(Array(NUM_ROWS), (r) =>
  Array(beatsPerLoop).fill(false)
);

// setup synths
const synths: Tone.Synth[] = [
  new Tone.Synth(),
  new Tone.Synth(),
  new Tone.Synth(),
  new Tone.Synth(),
];
synths.forEach((s) => s.toDestination());

const notes: string[] = ["A4", "C5", "E5", "F#5"];

let currentBeat = 0;

// TODO: debugging
Tone.Transport.bpm.value = 60;

// maybe we want to loop
Tone.Transport.loop = true;
Tone.Transport.loopEnd = "1m";

let voices = INITIAL_BEAT_GROUP;
// TODO: try via ref, sometime
Tone.Transport.scheduleRepeat((time) => {
  console.log({ time, transportPos: Tone.Transport.position.toString() });
  // Schedules notes for all voices, for a specific beat
  currentBeat = (currentBeat + 1) % beatsPerLoop;
  voices.forEach((bg, bgIdx) => {
    const synth = synths[bgIdx];
    const isActive = bg[currentBeat];
    if (isActive) {
      synth.triggerAttackRelease(notes[bgIdx], "16n", time);
    }
  });
}, "16n");

type Voices = boolean[][];

export default function BeatGrid2D(props: BeatGrid2DProps) {
  const theme = useMantineTheme();
  const beatColors = theme.colors.orange.slice(3, 7);

  const [playing, setPlaying] = useState(false);
  const [transportPos, setTransportPos] = useState<Tone.Unit.Time>(0);
  const [currentBeatUI, setCurrentBeatUI] = useState(-1);
  const [refreshPlz, setRefreshPlz] = useState(false);

  const setVoices = (v: Voices) => {
    voices = v;
    setRefreshPlz(!refreshPlz);
  };

  useEffect(() => {
    if (!playing) {
      currentBeat = -1;
      return;
    }
  }, [playing]);

  useEffect(() => {
    // also update display of transport pos
    Tone.Transport.scheduleRepeat((time) => {
      setTransportPos(Tone.Transport.position);
      setCurrentBeatUI(currentBeat);
    }, "32n");
  }, []);

  const beatWidth = 50;
  const xOffset = 0;
  const ySpacing = 1;
  const yOffset = 0;
  const yTotal = voices.length * beatWidth;

  const linePos = 0;

  return (
    <>
      {/* <Player currentBeat={currentBeat} voices={voices}  /> */}
      <Group>
        <Button
          onClick={async () => {
            if (!playing) {
              await Tone.start(); // start audio context
              await Tone.Transport.start();
            } else {
              await Tone.Transport.stop();
              currentBeat = -1;
              setCurrentBeatUI(currentBeat);
            }
            setPlaying(!playing);
          }}
        >
          {playing ? "Stop" : "Play"}
        </Button>
        <Text>Position: {transportPos.toString()}</Text>
        <Text>Tone Context State: {Tone.context.state}</Text>
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
                <>
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
                </>
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
}
