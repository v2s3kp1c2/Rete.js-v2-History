import { useRete } from "rete-react-plugin";
import { createEditor } from "./editor";

export default function App() {
  const [ref] = useRete(createEditor);

  return (
    <div className="App">
      <div
        style={{
          position: "fixed",
          textAlign: "center",
          width: "100%",
          padding: "1em"
        }}
      >
        Create node by clicking RMB on the area
        <br />
        Delete node by clicking RMB on the node
      </div>
      <div ref={ref} style={{ height: "100vh", width: "100vw" }}></div>
    </div>
  );
}
