	/* ==========================================================
	   interact.js — Stable visible selection boxes that follow animation
	   ========================================================== */

	function initInteractivity() {
	  const aquarium = document.getElementById("aquarium");

	  // overlay above aquarium
	  const overlay = document.createElement("div");
	  Object.assign(overlay.style, {
	    position: "absolute",
	    left: 0,
	    top: 0,
	    width: "100%",
	    height: "100%",
	    zIndex: 9999,
	    pointerEvents: "none"
	  });
	  aquarium.appendChild(overlay);

	  const boxes = new Map();

	  // ---- create overlay box for every fish / object ----
	  function createBoxFor(el) {
	    const rect = el.getBoundingClientRect();
	    const aqRect = aquarium.getBoundingClientRect();
	    const box = document.createElement("div");
	    box.className = "select-box";
	    overlay.appendChild(box);

	    Object.assign(box.style, {
	      position: "absolute",
	      pointerEvents: "auto",
	      left: `${rect.left - aqRect.left}px`,
	      top: `${rect.top - aqRect.top}px`,
	      width: `${rect.width}px`,
	      height: `${rect.height}px`
	    });

	    box.addEventListener("click", (e) => {
	      e.stopPropagation();
	      box.classList.toggle("active");
	    });

	    boxes.set(el, box);
	  }

	  document.querySelectorAll(".fish, .bottom-object").forEach(createBoxFor);

	  // ---- adjust object-specific box size + position ----
	  function adjustBoxSizes() {
	    boxes.forEach((box, el) => {
	      const src = el.src || "";
	      let scale = 1.0;
	      let dx = -8, dy = 0; // baseline slight left

	      // === FISH ===
	      if (src.includes("fish_goldfish")) {
		scale = 0.55;
		dy = -20; // moved up
	      }
	      else if (src.includes("fish_seahorse")) {
		scale = 0.82;
		dy = 10;
	      }
	      else if (src.includes("fish_yellow_tang")) {
		scale = 0.45;
		dx = 15; // moved right (tail direction)
		dy = 15;
	      }
	      else if (src.includes("fish_blue_beta")) {
		scale = 0.45;
		dx = 15;
	      }
	      else if (src.includes("fish_red_beta")) {
		scale = 0.45;
	      }
	      else if (src.includes("fish_clown")) {
		scale = 0.35;
	      }
	      else if (src.includes("fish_jelly")) {
		scale = 0.4;
	      }

	      // === SEAWEED ===
	      else if (src.includes("bottom_seaweed")) {
		scale = 0.6; // taller
		dy = -10;
		dx = -40; // moved left
	      }

	      // === ANEMONES ===
	      else if (src.includes("bottom_anemone")) {
        scale = 0.7; // taller
        dy = 30;     // lower
        if (src.includes("left")) dx = 12;
        if (src.includes("right")) dx = -34;
      }

      // === CRAB ===
      else if (src.includes("bottom_crab")) {
        scale = 0.39;
      }

      // === SHELL ===
      else if (src.includes("bottom_shell")) {
        // Make it wider (horizontally) but not taller
        dx = 20; // keep slightly right
        dy = 0;
        box.style.transformOrigin = "center center";
        box.style.transform = `translate(${dx}px,${dy}px) scale(1, 0.3)`; // wider only
        return;
      }

      // default apply transform
      box.style.transformOrigin = "center center";
      box.style.transform = `translate(${dx}px,${dy}px) scale(${scale})`;
    });
  }

  adjustBoxSizes();

  // ---- keep fish boxes following animation ----
  function updateFishBoxes() {
    boxes.forEach((box, el) => {
      if (!el.classList.contains("fish")) return;
      const t = getComputedStyle(el).transform;
      if (!t || t === "none") return;
      const m = /matrix\([^,]+,[^,]+,[^,]+,[^,]+,\s*([-\d.]+),\s*([-\d.]+)\)/.exec(t);
      if (!m) return;
      const x = parseFloat(m[1]);
      const y = parseFloat(m[2]);
      const w = el.clientWidth;
      const h = el.clientHeight;
      box.style.left = `${x}px`;
      box.style.top = `${y}px`;
      box.style.width = `${w}px`;
      box.style.height = `${h}px`;
    });
    requestAnimationFrame(updateFishBoxes);
  }
  requestAnimationFrame(updateFishBoxes);

  // ---- resize handler for static objects ----
  window.addEventListener("resize", () => {
    boxes.forEach((box, el) => {
      if (el.classList.contains("fish")) return;
      const rect = el.getBoundingClientRect();
      const aqRect = aquarium.getBoundingClientRect();
      box.style.left = `${rect.left - aqRect.left}px`;
      box.style.top = `${rect.top - aqRect.top}px`;
      box.style.width = `${rect.width}px`;
      box.style.height = `${rect.height}px`;
    });
    adjustBoxSizes();
  });
}

