import {
  AbsoluteFill,
  Easing,
  Img,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Audio, Video } from "@remotion/media";

const ease = Easing.bezier(0.16, 1, 0.3, 1);
const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
  easing: ease,
};

const screen = (name: string) => staticFile(`real-screens/${name}.png`);

const fade = (frame: number, start: number, end: number) =>
  interpolate(frame, [start, end], [0, 1], clamp);

const between = (frame: number, start: number, end: number) => {
  const ramp = Math.min(14, Math.max(1, (end - start) / 2 - 0.1));
  return interpolate(
    frame,
    [start, start + ramp, end - ramp, end],
    [0, 1, 1, 0],
    clamp,
  );
};

const ImageLayer = ({
  name,
  opacity = 1,
  scale = 1,
  y = 0,
}: {
  name: string;
  opacity?: number;
  scale?: number;
  y?: number;
}) => (
  <AbsoluteFill
    style={{
      opacity,
      transform: `scale(${scale}) translateY(${y}px)`,
      transformOrigin: "center center",
      background: "#f7f8fb",
    }}
  >
    <Img
      src={screen(name)}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
      }}
    />
  </AbsoluteFill>
);

const RealScreens = ({ frame }: { frame: number }) => {
  const homeIn = fade(frame, 160, 176);
  const studentsIn = fade(frame, 455, 478);
  const tanIn = fade(frame, 700, 719);
  const profileIn = fade(frame, 940, 972);
  const profileTopOut = fade(frame, 1050, 1140);
  const profileMidIn = fade(frame, 1050, 1140);
  const profileMidOut = fade(frame, 1230, 1320);
  const profileLowIn = fade(frame, 1230, 1320);
  const profileTopY = interpolate(frame, [972, 1140], [0, -130], clamp);
  const profileMidY = interpolate(
    frame,
    [1050, 1140, 1230, 1320],
    [110, 0, 0, -120],
    clamp,
  );
  const profileLowY = interpolate(frame, [1230, 1320], [120, 0], clamp);

  return (
    <AbsoluteFill style={{ background: "#f7f8fb" }}>
      <ImageLayer name="welcome" />
      <ImageLayer name="home" opacity={homeIn * (1 - studentsIn)} />
      <ImageLayer name="students-top" opacity={studentsIn * (1 - tanIn)} />
      <ImageLayer name="students-tan-row" opacity={tanIn * (1 - profileIn)} />
      <AbsoluteFill
        style={{
          background: "#f7f8fb",
          opacity: profileIn,
        }}
      />
      <ImageLayer
        name="profile-top"
        opacity={profileIn * (1 - profileTopOut)}
        y={profileTopY}
      />
      <ImageLayer
        name="profile-mid"
        opacity={profileMidIn * (1 - profileMidOut)}
        y={profileMidY}
      />
      <ImageLayer name="profile-low" opacity={profileLowIn} y={profileLowY} />
      <SplashVideo frame={frame} />
      <ClickHighlight frame={frame} />
    </AbsoluteFill>
  );
};

const SplashVideo = ({ frame }: { frame: number }) => {
  const opacity = 1 - fade(frame, 160, 176);

  return (
    <div
      style={{
        position: "absolute",
        left: 832,
        top: 310,
        width: 256,
        height: 256,
        borderRadius: 16,
        overflow: "hidden",
        opacity,
      }}
    >
      <Video
        src={staticFile("video-onboarding.mp4")}
        muted
        loop
        objectFit="cover"
        style={{
          width: "100%",
          height: "100%",
        }}
      />
    </div>
  );
};

const ClickHighlight = ({ frame }: { frame: number }) => {
  const nav = between(frame, 440, 466);
  const row = between(frame, 700, 730);

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: 8,
          top: 100,
          width: 240,
          height: 36,
          borderRadius: 10,
          border: `3px solid rgba(50,109,245,${0.75 * nav})`,
          opacity: nav,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 254,
          right: 0,
          top: 879,
          height: 54,
          background: `rgba(50,109,245,${0.12 * row})`,
          borderTop: `2px solid rgba(50,109,245,${0.5 * row})`,
          borderBottom: `2px solid rgba(50,109,245,${0.5 * row})`,
          opacity: row,
        }}
      />
    </>
  );
};

const Cursor = ({ frame }: { frame: number }) => {
  const driftX = Math.sin(frame / 17) * 4 + Math.sin(frame / 43) * 2;
  const driftY = Math.cos(frame / 19) * 3;
  const x =
    interpolate(
      frame,
      [0, 110, 150, 290, 440, 460, 640, 710, 735, 1040, 1420],
      [960, 1135, 1114, 1000, 92, 92, 520, 390, 390, 1190, 1190],
      clamp,
    ) + driftX;
  const y =
    interpolate(
      frame,
      [0, 110, 150, 290, 440, 460, 640, 710, 735, 1040, 1420],
      [1034, 1038, 748, 745, 119, 119, 830, 905, 905, 930, 930],
      clamp,
    ) + driftY;
  const clickScale = Math.min(
    interpolate(frame, [140, 150, 160], [1, 0.82, 1], clamp),
    interpolate(frame, [440, 450, 460], [1, 0.82, 1], clamp),
    interpolate(frame, [700, 710, 720], [1, 0.82, 1], clamp),
  );
  const clickRing = Math.max(
    between(frame, 140, 166),
    between(frame, 440, 466),
    between(frame, 700, 728),
  );

  return (
    <div style={{ position: "absolute", left: x, top: y, zIndex: 40 }}>
      <div
        style={{
          position: "absolute",
          left: -18,
          top: -18,
          width: 42,
          height: 42,
          borderRadius: 999,
          border: `3px solid rgba(50,109,245,${0.55 * clickRing})`,
          opacity: clickRing,
          transform: `scale(${1 + clickRing * 1.1})`,
        }}
      />
      <div
        style={{
          width: 30,
          height: 42,
          transform: `scale(${clickScale}) rotate(-8deg)`,
          filter: "drop-shadow(0 6px 8px rgba(0,0,0,0.28))",
          clipPath:
            "polygon(0 0, 0 38px, 10px 29px, 17px 42px, 25px 38px, 18px 26px, 30px 26px)",
          background: "#111827",
          outline: "2px solid rgba(255,255,255,0.8)",
        }}
      />
    </div>
  );
};

const Caption = ({ frame }: { frame: number }) => {
  const items = [
    [
      0,
      176,
      "Welcome to Teacher Workspace. Start once, and get straight to the tools teachers need for the day.",
    ],
    [
      176,
      463,
      "On the home page, every school app sits in one clean shelf. Teachers can open the right tool quickly, without remembering different links or signing in again and again.",
    ],
    [
      463,
      719,
      "From the same sidebar, open Student Insights. This is where teachers can spot students who may need attention, without leaving the workspace.",
    ],
    [
      719,
      972,
      "Scroll through the class list and choose Tan Wei Jie. The row highlights naturally, just like a teacher selecting one student during follow-up.",
    ],
    [
      972,
      1265,
      "Now the student profile opens. As we scroll, the full picture is visible in one place: attendance, behaviour, wellbeing, academics, family context, and reports.",
    ],
    [
      1265,
      1517,
      "Instead of jumping between many systems, teachers can review what matters, understand the student faster, and decide the next step with confidence.",
    ],
  ] as const;
  const current = items.find(([start, end]) => frame >= start && frame <= end);
  if (!current) return null;
  const [start, end, text] = current;

  return (
    <div
      style={{
        position: "absolute",
        left: 110,
        bottom: 24,
        zIndex: 50,
        width: 1700,
        borderRadius: 22,
        background: "rgba(18,24,38,0.88)",
        color: "#fff",
        padding: "14px 22px",
        fontSize: 34,
        lineHeight: 1.25,
        textAlign: "center",
        boxShadow: "0 16px 40px rgba(0,0,0,0.26)",
        opacity: between(frame, start, end),
      }}
    >
      {text}
    </div>
  );
};

const Voiceover = () => {
  const segments = [
    [0, "voiceover/segment-1.wav"],
    [176, "voiceover/segment-2.wav"],
    [463, "voiceover/segment-3.wav"],
    [719, "voiceover/segment-4.wav"],
    [972, "voiceover/segment-5.wav"],
    [1265, "voiceover/segment-6.wav"],
  ] as const;

  return (
    <>
      {segments.map(([from, file]) => (
        <Sequence key={file} from={from}>
          <Audio src={staticFile(file)} />
        </Sequence>
      ))}
    </>
  );
};

export const TeacherWorkspaceVideo = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 30, durationInFrames - 1],
    [1, 0],
    clamp,
  );

  return (
    <AbsoluteFill style={{ opacity: fadeOut, background: "#f7f8fb" }}>
      <Voiceover />
      <RealScreens frame={frame} />
      <Cursor frame={frame} />
      <Caption frame={frame} />
    </AbsoluteFill>
  );
};
