export const CLICK_BINDING_NAME = "buggerRecordClick";

export const CLICK_CAPTURE_SCRIPT = `
(function() {
  if (window.__buggerClickListenerInstalled) return;
  window.__buggerClickListenerInstalled = true;

  function viewportSize() {
    var root = document.documentElement;
    var vv = window.visualViewport;
    return {
      width: vv ? vv.width : root.clientWidth,
      height: vv ? vv.height : root.clientHeight,
      offsetLeft: vv ? vv.offsetLeft : 0,
      offsetTop: vv ? vv.offsetTop : 0
    };
  }

  document.addEventListener("click", function(event) {
    try {
      var target = event.target;
      var tag = target && target.tagName ? target.tagName.toLowerCase() : "unknown";
      var id = target && target.id ? "#" + target.id : "";
      var cls = "";
      if (target && target.className && typeof target.className === "string") {
        var parts = target.className.split(" ").filter(Boolean).slice(0, 2);
        if (parts.length) cls = "." + parts.join(".");
      }
      var vp = viewportSize();
      ${CLICK_BINDING_NAME}(JSON.stringify({
        x: event.clientX - vp.offsetLeft,
        y: event.clientY - vp.offsetTop,
        viewportWidth: vp.width,
        viewportHeight: vp.height,
        tag: tag,
        selector: tag + id + cls,
        url: location.href
      }));
    } catch (error) {}
  }, true);
})();
`.trim();
