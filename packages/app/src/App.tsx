import { LandingPage } from "./pages/LandingPage";
import { ReplayPage } from "./pages/ReplayPage";
import { useRoute } from "./hooks/useRoute";

export default function App() {
  const route = useRoute();
  return route === "play" ? <ReplayPage /> : <LandingPage />;
}
