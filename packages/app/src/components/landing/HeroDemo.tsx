export function HeroDemo() {
  return (
    <div className="landing-hero-demo" aria-hidden="true">
      <div className="landing-hero-demo__chrome">
        <span />
        <span />
        <span />
        <p>checkout.example — session replay</p>
      </div>

      <div className="landing-hero-demo__stage">
        <div className="landing-hero-demo__video">
          <div className="landing-hero-demo__screen">
            <div className="landing-hero-demo__nav" />
            <div className="landing-hero-demo__form">
              <div className="landing-hero-demo__field" />
              <div className="landing-hero-demo__field landing-hero-demo__field--short" />
              <div className="landing-hero-demo__btn" />
            </div>
            <span className="landing-hero-demo__ripple" />
          </div>
          <div className="landing-hero-demo__playhead" />
        </div>

        <div className="landing-hero-demo__panels">
          <div className="landing-hero-demo__panel">
            <header>Network</header>
            <ul>
              <li className="is-ok">
                <span>GET</span> /api/cart
              </li>
              <li className="is-ok">
                <span>POST</span> /api/checkout
              </li>
              <li className="is-err is-pulse">
                <span>500</span> /api/pay
              </li>
            </ul>
          </div>
          <div className="landing-hero-demo__panel">
            <header>Console</header>
            <ul>
              <li className="is-warn">Payment provider timeout</li>
              <li className="is-err is-pulse">Uncaught TypeError: res.json</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="landing-hero-demo__timeline">
        <button type="button" tabIndex={-1}>
          Pause
        </button>
        <div className="landing-hero-demo__scrub">
          <i className="landing-hero-demo__progress" />
          <i className="landing-hero-demo__mark landing-hero-demo__mark--click" style={{ left: "28%" }} />
          <i className="landing-hero-demo__mark landing-hero-demo__mark--error" style={{ left: "72%" }} />
        </div>
        <span>0:12.840 / 0:18.200</span>
      </div>
    </div>
  );
}
