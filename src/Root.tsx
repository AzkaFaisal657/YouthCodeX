import { useState } from "react";
import Home from "./pages/Home";
import App from "./App";

export default function Root() {
  const [started, setStarted] = useState(false);
  return started ? <App /> : <Home onStart={() => setStarted(true)} />;
}