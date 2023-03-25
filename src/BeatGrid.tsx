import { useMantineTheme } from "@mantine/core";
import _ from "lodash";
import { useState } from "react";
import { Layer, Line, Rect, Stage } from "react-konva";

interface BeatGrid2DProps {}

export default function BeatGrid2D(props: BeatGrid2DProps) {
  const theme = useMantineTheme();
  const beatColors = theme.colors.orange.slice(3, 7);

  const beatsPerLoop = 16;
  const [beatGroup, setBeatGroup] = useState([
    Array(beatsPerLoop).fill(false),
    Array(beatsPerLoop).fill(false),
    Array(beatsPerLoop).fill(false),
    Array(beatsPerLoop).fill(false),
  ]);

  const beatWidth = 50;
  // TODO: solve left offset and veritical offset via CSS positioning of grid on the page
  const xOffset = 0;
  const ySpacing = 1;
  const yOffset = 0;
  const yTotal = beatsPerLoop * beatWidth;

  const linePos = 0;

  return (
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
                  stroke={"black"}
                  onClick={() => {
                    console.log("click");
                    const newBeatGroup = _.cloneDeep(beatGroup);
                    newBeatGroup[bgIdx][bIdx] = !newBeatGroup[bgIdx][bIdx];
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
  );
}
