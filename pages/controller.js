/* Controller (Gamepad API) helpers shared by the NES and SNES pages.
 * - shows whether a controller is connected (header pill + toast)
 * - lets a controller browse the game list (D-pad/stick, A = play,
 *   LB/RB = page up/down)
 * - hold Select + Start for 1.5s while playing to leave the game
 * In-game input itself is handled by EmulatorJS; this file never touches it.
 */
(function (global) {
  var BTN_A = 0, BTN_LB = 4, BTN_RB = 5, BTN_SELECT = 8, BTN_START = 9;
  var BTN_UP = 12, BTN_DOWN = 13;
  var EXIT_HOLD_MS = 1500;

  var selected = -1;
  var last = { up: false, down: false, a: false, lb: false, rb: false };
  var repeatAt = 0, exitSince = 0, raf = 0;

  function pads() {
    var list = navigator.getGamepads ? navigator.getGamepads() : [];
    var out = [];
    for (var i = 0; i < list.length; i++) if (list[i] && list[i].connected) out.push(list[i]);
    return out;
  }

  function shortName(id) {
    // "Xbox 360 Controller (STANDARD GAMEPAD Vendor: 045e Product: 028e)" -> "Xbox 360 Controller"
    return String(id || "Controller").replace(/\s*\(.*$/, "").replace(/\s*Vendor:.*$/i, "");
  }

  function toast(msg) {
    var el = document.getElementById("pad-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "pad-toast";
      el.className = "pad-toast";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toast.t);
    toast.t = setTimeout(function () { el.classList.remove("show"); }, 3000);
  }

  function updateStatus() {
    var list = pads();
    var pill = document.getElementById("pad-status");
    if (pill) {
      pill.classList.toggle("on", list.length > 0);
      pill.textContent = list.length
        ? "🎮 " + (list.length > 1 ? list.length + " controllers" : "Controller ready")
        : "🎮 No controller";
      pill.title = list.length ? list.map(function (g) { return shortName(g.id); }).join(", ")
                               : "Connect a controller and press any button";
    }
    var info = document.getElementById("pad-list");
    if (info) {
      info.textContent = list.length
        ? "Connected: " + list.map(function (g) { return shortName(g.id); }).join(", ")
        : "No controller detected. Connect one (USB or Bluetooth) and press any button.";
    }
    if (list.length && !raf) raf = requestAnimationFrame(tick);
  }

  function isPlaying() {
    var p = document.getElementById("player-container");
    return !!p && p.style.display === "block";
  }
  function isModalOpen() {
    return !!document.querySelector(".modal-overlay.active");
  }

  function rows() { return document.querySelectorAll("#game-list .game-row"); }

  function select(i) {
    var r = rows();
    if (!r.length) return;
    i = Math.max(0, Math.min(r.length - 1, i));
    var old = document.querySelector(".game-row.pad-selected");
    if (old) old.classList.remove("pad-selected");
    r[i].classList.add("pad-selected");
    r[i].scrollIntoView({ block: "center" });
    selected = i;
    // reveal more rows when nearing the end of the lazily-rendered list
    if (i >= r.length - 5 && typeof global.loadMoreGames === "function") global.loadMoreGames();
  }

  function navigate(g, now) {
    var up = !!(g.buttons[BTN_UP] && g.buttons[BTN_UP].pressed) || (g.axes[1] || 0) < -0.6;
    var down = !!(g.buttons[BTN_DOWN] && g.buttons[BTN_DOWN].pressed) || (g.axes[1] || 0) > 0.6;
    var a = !!(g.buttons[BTN_A] && g.buttons[BTN_A].pressed);
    var lb = !!(g.buttons[BTN_LB] && g.buttons[BTN_LB].pressed);
    var rb = !!(g.buttons[BTN_RB] && g.buttons[BTN_RB].pressed);

    var step = 0;
    if ((up || down) && (!(last.up || last.down) || now >= repeatAt)) {
      step = up ? -1 : 1;
      repeatAt = now + ((last.up || last.down) ? 90 : 350);
    }
    if (lb && !last.lb) step = -10;
    if (rb && !last.rb) step = 10;
    if (step) select(selected < 0 ? 0 : selected + step);

    if (a && !last.a && selected >= 0) {
      var r = rows();
      if (r[selected]) r[selected].click();
    }
    last = { up: up, down: down, a: a, lb: lb, rb: rb };
  }

  function tick(now) {
    raf = 0;
    var list = pads();
    if (!list.length) return;
    raf = requestAnimationFrame(tick);

    if (isPlaying()) {
      var held = list.some(function (g) {
        return g.buttons[BTN_SELECT] && g.buttons[BTN_SELECT].pressed &&
               g.buttons[BTN_START] && g.buttons[BTN_START].pressed;
      });
      if (!held) exitSince = 0;
      else if (!exitSince) exitSince = now;
      else if (now - exitSince >= EXIT_HOLD_MS) {
        exitSince = 0;
        if (typeof global.closePlayer === "function") global.closePlayer();
      }
      last = { up: false, down: false, a: true, lb: false, rb: false };
      return;
    }
    exitSince = 0;
    if (isModalOpen() || document.activeElement && document.activeElement.id === "search-bar") {
      // don't steal input while typing or remapping
      last.a = true;
      return;
    }
    navigate(list[0], now);
  }

  // EmulatorJS only assigns a pad to a player slot when it sees the
  // "connected" event after it has started. A pad that was already
  // connected on the game list (the usual case) is therefore ignored
  // in-game, so assign every known pad to a free slot ourselves.
  function syncEmulator() {
    var E = global.EJS_emulator;
    if (!E || !E.gamepad || !E.gamepadSelection) return;
    E.gamepad.gamepads.forEach(function (g) {
      if (!g) return;
      var id = g.id + "_" + g.index;
      if (E.gamepadSelection.indexOf(id) >= 0) return;
      var slot = E.gamepadSelection.indexOf("");
      if (slot >= 0) E.gamepadSelection[slot] = id;
    });
    if (E.updateGamepadLabels) E.updateGamepadLabels();
  }

  window.addEventListener("gamepadconnected", function (e) {
    updateStatus();
    if (isPlaying()) setTimeout(syncEmulator, 50);
    toast("🎮 " + shortName(e.gamepad.id) + " connected");
  });
  window.addEventListener("gamepaddisconnected", function (e) {
    updateStatus();
    toast("🎮 " + shortName(e.gamepad.id) + " disconnected");
  });
  document.addEventListener("DOMContentLoaded", updateStatus);
  // The row list is re-rendered on search; drop a stale selection.
  document.addEventListener("input", function (e) {
    if (e.target && e.target.id === "search-bar") selected = -1;
  });

  global.RetroPad = { update: updateStatus, syncEmulator: syncEmulator, toast: toast, pads: pads };
})(window);
