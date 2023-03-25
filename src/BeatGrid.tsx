import { Button, Group, Text, useMantineTheme } from "@mantine/core";
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

export default function BeatGrid2D(props: BeatGrid2DProps) {
  const theme = useMantineTheme();
  const beatColors = theme.colors.orange.slice(3, 7);

  const [playing, setPlaying] = useState(false);
  const [transportPos, setTransportPos] = useState<Tone.Unit.Time>(0);
  const [currentBeatUI, setCurrentBeatUI] = useState(-1);

  // const [isSamplerLoaded, setIsSamplerLoaded] = useState(false);
  // const sampler = useRef(null);

  // const loopDuration = "1m"; // 4 quarter notes?

  const [beatGroup, setBeatGroup] = useState<boolean[][]>(INITIAL_BEAT_GROUP);

  useEffect(() => {
    if (!playing) {
      currentBeat = -1;
      return;
    }

    const scheduled = Tone.Transport.scheduleRepeat((time) => {
      // increment the counter
      currentBeat = (currentBeat + 1) % beatsPerLoop;
      // console.log("repeat() .. currentBeat=", currentBeat);
      // console.log({ beatGroup });
      beatGroup.forEach((bg, bgIdx) => {
        // as the index increments we are moving *down* the rows
        // One note per row and one synth per note means that each row corresponds to a synth
        const synth = synths[bgIdx];
        // beat is used to keep track of what subdivision we are on
        // there are eight *beats* or subdivisions for this sequencer
        const isActive = bg[currentBeat];
        if (isActive) {
          console.log("-> active! bgIdx=", bgIdx);
          // triggerAttackRelease() plays a specific pitch for a specific duration
          // documentation can be found here:
          // https://tonejs.github.io/docs/14.7.77/Synth#triggerAttackRelease

          synth.triggerAttackRelease(notes[bgIdx], "16n", time);
        }
      });
    }, "16n");
    console.log("created:", scheduled);

    // cleanup callback
    // https://overreacted.io/a-complete-guide-to-useeffect/#so-what-about-cleanup
    return () => {
      console.log("cleanup callback, cancelling:", scheduled);
      Tone.Transport.clear(scheduled);
    };
  }, [beatGroup, playing]);

  useEffect(() => {
    // also update display of transport pos
    Tone.Transport.scheduleRepeat((time) => {
      setTransportPos(Tone.Transport.position);
      setCurrentBeatUI(currentBeat);
    }, "32n");
  }, []);

  // // initialize main Transport's loop
  // useEffect(() => {
  //   Tone.Transport.loop = true;
  //   Tone.Transport.loopStart = "0";
  //   Tone.Transport.loopEnd = loopDuration;
  //   Tone.Transport.context.debug = true;
  //   Tone.Transport.debug = true;
  // }, []);

  const beatWidth = 50;
  // TODO: solve left offset and veritical offset via CSS positioning of grid on the page
  const xOffset = 0;
  const ySpacing = 1;
  const yOffset = 0;
  const yTotal = beatsPerLoop * beatWidth;

  const linePos = 0;

  return (
    <>
      <Group>
        <Button
          onClick={async () => {
            if (!playing) {
              await Tone.Transport.start();
            } else {
              await Tone.Transport.stop();
            }
            setPlaying(!playing);
          }}
        >
          {playing ? "Stop" : "Play"}
        </Button>
        <Text>Position: {transportPos.toString()}</Text>
        <Text>Tone Context State: {Tone.context.state}</Text>
      </Group>
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

          {_.range(beatGroup.length + 1).map((n) => (
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

          {beatGroup.map((beats, bgIdx) => {
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
                      const newBeatGroup = _.cloneDeep(beatGroup);
                      newBeatGroup[bgIdx][bIdx] = !newBeatGroup[bgIdx][bIdx];
                      console.log({ beatGroup, newBeatGroup });
                      setBeatGroup(newBeatGroup);
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
