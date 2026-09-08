import { useEffect, useState } from "react";
import { getRoute, type AppRoute } from "../routing";

export function useRoute(): AppRoute {
  const [route, setRoute] = useState<AppRoute>(() => getRoute());

  useEffect(() => {
    const onChange = () => setRoute(getRoute());
    window.addEventListener("popstate", onChange);
    return () => window.removeEventListener("popstate", onChange);
  }, []);

  return route;
}
