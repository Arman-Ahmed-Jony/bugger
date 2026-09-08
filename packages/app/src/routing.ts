export type AppRoute = "landing" | "play";

function stripBase(pathname: string): string {
  const base = import.meta.env.BASE_URL || "/";
  if (base === "/") {
    return pathname || "/";
  }

  const prefix = base.endsWith("/") ? base.slice(0, -1) : base;
  if (pathname === prefix || pathname === `${prefix}/`) {
    return "/";
  }
  if (pathname.startsWith(`${prefix}/`)) {
    return pathname.slice(prefix.length) || "/";
  }
  return pathname || "/";
}

export function getRoute(pathname = window.location.pathname): AppRoute {
  const path = stripBase(pathname).replace(/\/+$/, "") || "/";
  return path === "/play" ? "play" : "landing";
}

export function routeHref(route: AppRoute): string {
  const base = import.meta.env.BASE_URL || "/";
  if (route === "landing") {
    return base.endsWith("/") ? base : `${base}/`;
  }
  return base.endsWith("/") ? `${base}play` : `${base}/play`;
}

export function navigate(route: AppRoute): void {
  const href = routeHref(route);
  const current = `${window.location.pathname}${window.location.search}`;
  const normalizedCurrent = current.endsWith("/") && href.endsWith("/") === false
    ? current.replace(/\/+$/, "")
    : current;
  if (normalizedCurrent === href || current === href) return;
  window.history.pushState({}, "", href);
  window.dispatchEvent(new PopStateEvent("popstate"));
}
