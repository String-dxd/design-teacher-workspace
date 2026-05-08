import "./index.css";
import { Composition } from "remotion";
import { TeacherWorkspaceVideo } from "./Composition";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="TeacherWorkspace"
        component={TeacherWorkspaceVideo}
        durationInFrames={1560}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
