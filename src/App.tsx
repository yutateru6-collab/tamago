import { MobileRuntime } from "./mobile";
import Prototype from "./Prototype";

export default function App() {
  return (
    <MobileRuntime fullscreen={new URLSearchParams(window.location.search).get("preview") !== "1"}>
      <Prototype />
    </MobileRuntime>
  );
}
