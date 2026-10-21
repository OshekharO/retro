/* Keyboard and controller control binding for the EmulatorJS-powered game players.
 * EmulatorJS matches keydown/keyup events by e.keyCode against a fixed
 * keyCode->name table, and resolves EJS_defaultControls "value" strings
 * against that same table (case-insensitive). KEY_CODE_MAP below is a
 * copy of that table so our remap UI stores/display names EmulatorJS
 * will actually recognize.
 */
(function (global) {
  var KEY_CODE_MAP = {
    8: "backspace", 9: "tab", 13: "enter", 16: "shift", 17: "ctrl", 18: "alt",
    19: "pause/break", 20: "caps lock", 27: "escape", 32: "space",
    33: "page up", 34: "page down", 35: "end", 36: "home",
    37: "left arrow", 38: "up arrow", 39: "right arrow", 40: "down arrow",
    45: "insert", 46: "delete",
    48: "0", 49: "1", 50: "2", 51: "3", 52: "4", 53: "5", 54: "6", 55: "7", 56: "8", 57: "9",
    65: "a", 66: "b", 67: "c", 68: "d", 69: "e", 70: "f", 71: "g", 72: "h", 73: "i", 74: "j",
    75: "k", 76: "l", 77: "m", 78: "n", 79: "o", 80: "p", 81: "q", 82: "r", 83: "s", 84: "t",
    85: "u", 86: "v", 87: "w", 88: "x", 89: "y", 90: "z",
    96: "numpad 0", 97: "numpad 1", 98: "numpad 2", 99: "numpad 3", 100: "numpad 4",
    101: "numpad 5", 102: "numpad 6", 103: "numpad 7", 104: "numpad 8", 105: "numpad 9",
    106: "multiply", 107: "add", 109: "subtract", 110: "decimal point", 111: "divide",
    112: "f1", 113: "f2", 114: "f3", 115: "f4", 116: "f5", 117: "f6",
    118: "f7", 119: "f8", 120: "f9", 121: "f10", 122: "f11", 123: "f12",
    144: "num lock", 145: "scroll lock",
    186: "semi-colon", 187: "equal sign", 188: "comma", 189: "dash", 190: "period",
    191: "forward slash", 192: "grave accent", 219: "open bracket", 220: "back slash",
    221: "close braket", 222: "single quote"
  };

  var DISPLAY_OVERRIDES = {
    "up arrow": "↑ Up", "down arrow": "↓ Down",
    "left arrow": "← Left", "right arrow": "→ Right",
    "enter": "↵ Enter", "shift": "⇧ Shift", "space": "Space",
    "escape": "Esc", "backspace": "⌫ Backspace", "tab": "⇥ Tab", "ctrl": "Ctrl"
  };

  // EmulatorJS button indices (standard across cores; unused buttons are
  // simply never overridden and keep EmulatorJS's own defaults/gamepad map).
  var BUTTONS = [
    { id: "up", index: 4, label: "D-Pad Up", consoles: ["nes", "snes"], defaultKey: "up arrow", defaultPad: "DPAD_UP" },
    { id: "down", index: 5, label: "D-Pad Down", consoles: ["nes", "snes"], defaultKey: "down arrow", defaultPad: "DPAD_DOWN" },
    { id: "left", index: 6, label: "D-Pad Left", consoles: ["nes", "snes"], defaultKey: "left arrow", defaultPad: "DPAD_LEFT" },
    { id: "right", index: 7, label: "D-Pad Right", consoles: ["nes", "snes"], defaultKey: "right arrow", defaultPad: "DPAD_RIGHT" },
    { id: "a", index: 8, label: "A Button", consoles: ["nes", "snes"], defaultKey: "z", defaultPad: "BUTTON_2" },
    { id: "b", index: 0, label: "B Button", consoles: ["nes", "snes"], defaultKey: "x", defaultPad: "BUTTON_1" },
    { id: "x", index: 9, label: "X Button", consoles: ["snes"], defaultKey: "a", defaultPad: "BUTTON_4" },
    { id: "y", index: 1, label: "Y Button", consoles: ["snes"], defaultKey: "s", defaultPad: "BUTTON_3" },
    { id: "l", index: 10, label: "L Shoulder", consoles: ["snes"], defaultKey: "q", defaultPad: "LEFT_TOP_SHOULDER" },
    { id: "r", index: 11, label: "R Shoulder", consoles: ["snes"], defaultKey: "e", defaultPad: "RIGHT_TOP_SHOULDER" },
    { id: "start", index: 3, label: "Start", consoles: ["nes", "snes"], defaultKey: "enter", defaultPad: "START" },
    { id: "select", index: 2, label: "Select", consoles: ["nes", "snes"], defaultKey: "v", defaultPad: "SELECT" }
  ];

  // Copy of EmulatorJS's built-in default table (player 1). Used as the
  // starting point so unmanaged buttons (sticks, extra keys) keep working.
  var EJS_BASE = [
    { value: "x", value2: "BUTTON_2" }, { value: "s", value2: "BUTTON_4" },
    { value: "v", value2: "SELECT" }, { value: "enter", value2: "START" },
    { value: "up arrow", value2: "DPAD_UP" }, { value: "down arrow", value2: "DPAD_DOWN" },
    { value: "left arrow", value2: "DPAD_LEFT" }, { value: "right arrow", value2: "DPAD_RIGHT" },
    { value: "z", value2: "BUTTON_1" }, { value: "a", value2: "BUTTON_3" },
    { value: "q", value2: "LEFT_TOP_SHOULDER" }, { value: "e", value2: "RIGHT_TOP_SHOULDER" },
    { value: "tab", value2: "LEFT_BOTTOM_SHOULDER" }, { value: "r", value2: "RIGHT_BOTTOM_SHOULDER" },
    { value: "", value2: "LEFT_STICK" }, { value: "", value2: "RIGHT_STICK" },
    { value: "h", value2: "LEFT_STICK_X:+1" }, { value: "f", value2: "LEFT_STICK_X:-1" },
    { value: "g", value2: "LEFT_STICK_Y:+1" }, { value: "t", value2: "LEFT_STICK_Y:-1" },
    { value: "l", value2: "RIGHT_STICK_X:+1" }, { value: "j", value2: "RIGHT_STICK_X:-1" },
    { value: "k", value2: "RIGHT_STICK_Y:+1" }, { value: "i", value2: "RIGHT_STICK_Y:-1" },
    { value: "1" }, { value: "2" }, { value: "3" }, {}, {}, {}
  ];

  function storageKey(consoleType) { return "retroKeyBinds_" + consoleType; }

  function buttonsFor(consoleType) {
    return BUTTONS.filter(function (b) { return b.consoles.indexOf(consoleType) !== -1; });
  }

  function loadKeyBinds(consoleType) {
    var defaults = {};
    buttonsFor(consoleType).forEach(function (b) { defaults[b.id] = b.defaultKey; });
    try {
      var saved = JSON.parse(localStorage.getItem(storageKey(consoleType)));
      return Object.assign({}, defaults, saved || {});
    } catch (e) {
      return defaults;
    }
  }

  function saveKeyBind(consoleType, id, keyName) {
    var binds = loadKeyBinds(consoleType);
    binds[id] = keyName;
    localStorage.setItem(storageKey(consoleType), JSON.stringify(binds));
  }

  function resetKeyBinds(consoleType) {
    localStorage.removeItem(storageKey(consoleType));
  }

  function keyNameFromEvent(e) {
    return KEY_CODE_MAP[e.keyCode] || null;
  }

  function displayName(keyName) {
    if (!keyName) return "—";
    return DISPLAY_OVERRIDES[keyName] || keyName.toUpperCase();
  }

  // ---- Controller (Gamepad API) bindings ----
  // Names are EmulatorJS's standard-mapping labels: index i of
  // navigator.getGamepads()[n].buttons maps to PAD_LABELS[i].
  var PAD_LABELS = [
    "BUTTON_1", "BUTTON_2", "BUTTON_3", "BUTTON_4",
    "LEFT_TOP_SHOULDER", "RIGHT_TOP_SHOULDER", "LEFT_BOTTOM_SHOULDER", "RIGHT_BOTTOM_SHOULDER",
    "SELECT", "START", "LEFT_STICK", "RIGHT_STICK",
    "DPAD_UP", "DPAD_DOWN", "DPAD_LEFT", "DPAD_RIGHT"
  ];
  var PAD_DISPLAY = {
    BUTTON_1: "A / Cross (bottom)", BUTTON_2: "B / Circle (right)",
    BUTTON_3: "X / Square (left)", BUTTON_4: "Y / Triangle (top)",
    LEFT_TOP_SHOULDER: "LB / L1", RIGHT_TOP_SHOULDER: "RB / R1",
    LEFT_BOTTOM_SHOULDER: "LT / L2", RIGHT_BOTTOM_SHOULDER: "RT / R2",
    SELECT: "Back / Select", START: "Start / Menu",
    LEFT_STICK: "Left stick click", RIGHT_STICK: "Right stick click",
    DPAD_UP: "D-Pad Up", DPAD_DOWN: "D-Pad Down", DPAD_LEFT: "D-Pad Left", DPAD_RIGHT: "D-Pad Right"
  };

  function padStorageKey(consoleType) { return "retroPadBinds_" + consoleType; }

  function loadPadBinds(consoleType) {
    var defaults = {};
    buttonsFor(consoleType).forEach(function (b) { defaults[b.id] = b.defaultPad; });
    try {
      var saved = JSON.parse(localStorage.getItem(padStorageKey(consoleType)));
      return Object.assign({}, defaults, saved || {});
    } catch (e) {
      return defaults;
    }
  }

  function savePadBind(consoleType, id, label) {
    var binds = loadPadBinds(consoleType);
    binds[id] = label;
    try { localStorage.setItem(padStorageKey(consoleType), JSON.stringify(binds)); } catch (e) {}
  }

  function resetPadBinds(consoleType) {
    try { localStorage.removeItem(padStorageKey(consoleType)); } catch (e) {}
  }

  function padDisplayName(label) {
    return label ? (PAD_DISPLAY[label] || label) : "—";
  }

  // Builds the object to assign to window.EJS_defaultControls before
  // launching a game. EmulatorJS REPLACES its whole built-in default
  // table with this object (it never merges), and its control menu reads
  // controls[0..3][0..29], so we must return the complete table for all
  // four players. Passing only player 0 makes EmulatorJS throw
  // "Cannot read properties of undefined (reading '0')" on desktop,
  // leaving a blank screen. Players 2-4 get the same controller layout
  // with no keyboard keys, so any additional pads work out of the box.
  function buildDefaultControls(consoleType) {
    var keys = loadKeyBinds(consoleType);
    var pads = loadPadBinds(consoleType);
    var managed = {};
    buttonsFor(consoleType).forEach(function (b) { managed[b.index] = b; });

    function table(withKeys) {
      var t = {};
      EJS_BASE.forEach(function (base, i) {
        var entry = {};
        var b = managed[i];
        var key = b ? keys[b.id] : base.value;
        var pad = b ? pads[b.id] : base.value2;
        if (withKeys && key) entry.value = key;
        if (pad) entry.value2 = pad;
        t[i] = entry;
      });
      return t;
    }
    return { 0: table(true), 1: table(false), 2: table(false), 3: table(false) };
  }

  // Renders remap rows into `container` (a DOM element) for the given
  // console type. Clicking a row's button starts listening for the next
  // keypress and saves it. Returns a cleanup function to stop listening
  // (call when the settings panel closes).
  function renderKeyBindUI(container, consoleType) {
    container.innerHTML = "";
    var listeningBtn = null, listeningId = null;

    function refreshLabel(btn, id) {
      btn.textContent = displayName(loadKeyBinds(consoleType)[id]);
    }

    function stopListening() {
      if (listeningBtn) {
        listeningBtn.classList.remove("listening");
        refreshLabel(listeningBtn, listeningId);
      }
      listeningBtn = null;
      listeningId = null;
    }

    buttonsFor(consoleType).forEach(function (b) {
      var row = document.createElement("div");
      row.className = "setting-row";
      var label = document.createElement("label");
      label.textContent = b.label;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "key-bind-btn";
      btn.textContent = displayName(loadKeyBinds(consoleType)[b.id]);
      btn.addEventListener("click", function () {
        stopListening();
        listeningBtn = btn;
        listeningId = b.id;
        btn.classList.add("listening");
        btn.textContent = "Press a key...";
      });
      row.appendChild(label);
      row.appendChild(btn);
      container.appendChild(row);
    });

    function onKeyDown(e) {
      if (!listeningBtn) return;
      e.preventDefault();
      e.stopPropagation();
      if (e.key === "Escape") { stopListening(); return; }
      var name = keyNameFromEvent(e);
      if (!name) return;
      saveKeyBind(consoleType, listeningId, name);
      var btn = listeningBtn, id = listeningId;
      listeningBtn = null;
      listeningId = null;
      btn.classList.remove("listening");
      refreshLabel(btn, id);
    }
    document.addEventListener("keydown", onKeyDown, true);

    return function cleanup() {
      stopListening();
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }

  // Controller remap rows. Click a row, then press the controller button
  // to assign. Polls the Gamepad API; returns a cleanup function.
  function renderPadBindUI(container, consoleType) {
    container.innerHTML = "";
    var listeningBtn = null, listeningId = null, raf = 0, armed = false;

    function refreshLabel(btn, id) {
      btn.textContent = padDisplayName(loadPadBinds(consoleType)[id]);
    }
    function stopListening() {
      if (listeningBtn) {
        listeningBtn.classList.remove("listening");
        refreshLabel(listeningBtn, listeningId);
      }
      listeningBtn = null; listeningId = null; armed = false;
    }
    function pressedLabel() {
      var pads = navigator.getGamepads ? navigator.getGamepads() : [];
      for (var i = 0; i < pads.length; i++) {
        var gp = pads[i];
        if (!gp) continue;
        for (var j = 0; j < PAD_LABELS.length && j < gp.buttons.length; j++) {
          if (gp.buttons[j].pressed) return PAD_LABELS[j];
        }
      }
      return null;
    }
    function poll() {
      raf = requestAnimationFrame(poll);
      if (!listeningBtn) return;
      var label = pressedLabel();
      // wait for all buttons to be released before accepting a press
      if (!armed) { if (!label) armed = true; return; }
      if (!label) return;
      savePadBind(consoleType, listeningId, label);
      var btn = listeningBtn, id = listeningId;
      listeningBtn = null; listeningId = null; armed = false;
      btn.classList.remove("listening");
      refreshLabel(btn, id);
    }

    buttonsFor(consoleType).forEach(function (b) {
      var row = document.createElement("div");
      row.className = "setting-row";
      var label = document.createElement("label");
      label.textContent = b.label;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "key-bind-btn";
      btn.textContent = padDisplayName(loadPadBinds(consoleType)[b.id]);
      btn.addEventListener("click", function () {
        stopListening();
        listeningBtn = btn; listeningId = b.id;
        btn.classList.add("listening");
        btn.textContent = "Press a controller button...";
      });
      row.appendChild(label);
      row.appendChild(btn);
      container.appendChild(row);
    });

    raf = requestAnimationFrame(poll);
    return function cleanup() {
      stopListening();
      cancelAnimationFrame(raf);
    };
  }

  global.RetroKeybinds = {
    buttonsFor: buttonsFor,
    loadKeyBinds: loadKeyBinds,
    saveKeyBind: saveKeyBind,
    resetKeyBinds: resetKeyBinds,
    buildDefaultControls: buildDefaultControls,
    renderKeyBindUI: renderKeyBindUI,
    renderPadBindUI: renderPadBindUI,
    resetPadBinds: resetPadBinds,
    padLabels: PAD_LABELS,
    padDisplayName: padDisplayName,
    displayName: displayName
  };
})(window);
