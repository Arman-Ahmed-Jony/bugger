import type { CSSProperties } from "react";
import { useInView } from "../hooks/useInView";
import { navigate, routeHref } from "../routing";
import { HeroDemo } from "../components/landing/HeroDemo";

const FEATURES = [
  {
    title: "One session clock",
    body: "Video, network, console, and clicks share the same timeline — every event is timestamped from record start.",
  },
  {
    title: "Synced replay",
    body: "Scrub once. Panels filter to that moment. Click any request or log to seek the video instantly.",
  },
  {
    title: "Click + error markers",
    body: "See where users clicked and where network failures landed — marked on the scrubber, not buried in a dump.",
  },
  {
    title: "Playback speed control",
    body: "Slow-mo the weird frame or race through at 4×. Tail events after the video keep pace with your speed.",
  },
  {
    title: "Portable .bugger files",
    body: "Export a ZIP with manifest + WebM. Drop it into the player — no account, no upload pipeline.",
  },
  {
    title: "Network deep dive",
    body: "Filter, sort, and inspect headers and bodies when you need the full request story.",
  },
] as const;

const STEPS = [
  {
    n: "01",
    title: "Record the tab",
    body: "Load the Chrome extension, hit Record, reproduce the bug. CDP captures network and console while the tab is filmed.",
  },
  {
    n: "02",
    title: "Export .bugger",
    body: "Stop and download a single session file — video and events packed together.",
  },
  {
    n: "03",
    title: "Replay in sync",
    body: "Open the player, drop the file, and walk the failure frame-by-frame with every signal aligned.",
  },
] as const;

export function LandingPage() {
  const features = useInView<HTMLElement>();
  const steps = useInView<HTMLElement>();
  const closer = useInView<HTMLElement>();

  return (
    <div className="landing">
      <header className="landing-top">
        <a className="landing-brand" href={routeHref("landing")} onClick={(e) => e.preventDefault()}>
          Bugger
        </a>
        <nav className="landing-nav">
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <a
            href={routeHref("play")}
            onClick={(e) => {
              e.preventDefault();
              navigate("play");
            }}
          >
            Open player
          </a>
        </nav>
      </header>

      <section className="landing-hero">
        <div className="landing-hero__copy">
          <p className="landing-hero__brand reveal reveal--1">Bugger</p>
          <h1 className="reveal reveal--2">Catch the bug. Replay the moment.</h1>
          <p className="landing-hero__lede reveal reveal--3">
            Timestamp-synced tab video, network, console, and clicks — recorded in Chrome, replayed in the browser.
          </p>
          <div className="landing-hero__cta reveal reveal--4">
            <a
              className="landing-btn landing-btn--primary"
              href={routeHref("play")}
              onClick={(e) => {
                e.preventDefault();
                navigate("play");
              }}
            >
              Open replay player
            </a>
            <a
              className="landing-btn landing-btn--ghost"
              href="https://github.com/Arman-Ahmed-Jony/bugger"
              target="_blank"
              rel="noreferrer"
            >
              View on GitHub
            </a>
          </div>
        </div>

        <div className="landing-hero__visual reveal reveal--5">
          <HeroDemo />
        </div>
      </section>

      <section
        id="features"
        ref={features.ref}
        className={`landing-section ${features.inView ? "is-inview" : ""}`}
      >
        <p className="landing-kicker">Features</p>
        <h2>Everything you need to prove what happened</h2>
        <p className="landing-section__lede">
          Built for the gap between “it broke” and “here’s exactly when.”
        </p>

        <ul className="landing-features">
          {FEATURES.map((feature, index) => (
            <li key={feature.title} style={{ "--i": index } as CSSProperties}>
              <h3>{feature.title}</h3>
              <p>{feature.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section
        id="how"
        ref={steps.ref}
        className={`landing-section landing-section--steps ${steps.inView ? "is-inview" : ""}`}
      >
        <p className="landing-kicker">How it works</p>
        <h2>Three steps from flake to evidence</h2>

        <ol className="landing-steps">
          {STEPS.map((step, index) => (
            <li key={step.n} style={{ "--i": index } as CSSProperties}>
              <span>{step.n}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section
        ref={closer.ref}
        className={`landing-closer ${closer.inView ? "is-inview" : ""}`}
      >
        <h2>Load a session. Seek the truth.</h2>
        <p>Drop a `.bugger` file into the player — no signup, no cloud round-trip.</p>
        <a
          className="landing-btn landing-btn--primary"
          href={routeHref("play")}
          onClick={(e) => {
            e.preventDefault();
            navigate("play");
          }}
        >
          Open replay player
        </a>
      </section>

      <footer className="landing-footer">
        <span>Bugger v1</span>
        <a href="https://github.com/Arman-Ahmed-Jony/bugger" target="_blank" rel="noreferrer">
          GitHub
        </a>
      </footer>
    </div>
  );
}
