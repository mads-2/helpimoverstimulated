/* ==========================================================
   animation.js — Mobile-stable, no flicker, no disappear
   ========================================================== */

function initAnimation() {
  const aquarium = document.getElementById("aquarium");
  const rect = aquarium.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;

  // State keyed by element
  const fishByEl = new Map();

  const isMobile =
    /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (window.innerWidth < 900 && "ontouchstart" in window);

  // ---- helpers ------------------------------------------------

  function baseParamsFor(fishEl) {
    const src = fishEl.src || "";
    const isSpecial = src.includes("seahorse") || src.includes("jelly");

    // Small, gentle vertical sway for all; longer period for special
    const amplitude = isSpecial ? height * 0.005 : height * 0.0025;
    const wavesPerSecond = isSpecial ? 0.28 : 0.9;
    const phaseSpeed = 2 * Math.PI * wavesPerSecond;
    const phaseOffset = Math.random() * 2 * Math.PI;

    // Slower on mobile to hide timer jitter
    const baseSpeed = isMobile ? 24 : 45;
    const speed = baseSpeed * (0.9 + Math.random() * 0.2);

    // Start somewhere sensible
    const baseY = Math.random() * height * 0.6 + height * 0.2;
    const x = Math.random() * width;

    // Read original layer once; never accumulate!
    const computed = getComputedStyle(fishEl);
    const baseLayer = parseInt(computed.zIndex || "5", 10);

    // Direction from class
    const direction = fishEl.classList.contains("left") ? -1 : 1;

    // Cache size once the image has a layout box
    let w = fishEl.clientWidth || 60;
    let h = fishEl.clientHeight || 40;
    if (!w || !h) {
      // try again right after paint
      requestAnimationFrame(() => {
        const _w = fishEl.clientWidth;
        const _h = fishEl.clientHeight;
        if (_w) fishByEl.get(fishEl).w = _w;
        if (_h) fishByEl.get(fishEl).h = _h;
      });
    }

    // GPU hint
    fishEl.style.willChange = "transform";

    return {
      fish: fishEl,
      direction,
      x,
      baseY,
      amplitude,
      phaseSpeed,
      phaseOffset,
      speed,
      smoothY: baseY,
      baseLayer,
      w, h
    };
  }

  function addFishEl(fishEl) {
    if (fishByEl.has(fishEl)) return;
    fishEl.style.position = "absolute";
    fishEl.style.top = "0";
    fishEl.style.left = "0";
    const data = baseParamsFor(fishEl);
    fishByEl.set(fishEl, data);
  }

  function removeFishEl(fishEl) {
    fishByEl.delete(fishEl);
  }

  function respawnFish(f) {
    // Flip direction & facing
    f.direction *= -1;
    f.fish.classList.toggle("left", f.direction === -1);

    // Re-enter from opposite side
    f.x = f.direction === 1 ? -150 : width + 150;

    // New vertical baseline + sine phase
    f.baseY = Math.random() * height * 0.6 + height * 0.2;
    f.phaseOffset = Math.random() * 2 * Math.PI;
    f.smoothY = f.baseY;

    // Reset to original layer (no accumulation)
    f.fish.style.zIndex = String(f.baseLayer);
  }

  // ---- seed current fish -------------------------------------

  Array.from(document.querySelectorAll(".fish")).forEach(addFishEl);

  // ---- observe future fish from the spawner -------------------

  const mo = new MutationObserver(muts => {
    for (const m of muts) {
      m.addedNodes.forEach(n => {
        if (n.nodeType === 1 && n.classList && n.classList.contains("fish")) {
          addFishEl(n);
        }
      });
      m.removedNodes.forEach(n => {
        if (n.nodeType === 1 && n.classList && n.classList.contains("fish")) {
          removeFishEl(n);
        }
      });
    }
  });
  mo.observe(aquarium, { childList: true });

  // ---- subtle seaweed sway (very light) -----------------------

  const seaweeds = Array.from(
    document.querySelectorAll('img[src*="bottom_seaweed"]')
  );
  let seaweedPhase = 0;

  function swaySeaweed(dt) {
    seaweedPhase += dt * 0.4;
    for (let i = 0; i < seaweeds.length; i++) {
      const sw = seaweeds[i];
      const angle = Math.sin(seaweedPhase + i * 0.7) * 0.8; // tiny, calm
      sw.style.transform = `rotate(${angle}deg)`;
    }
  }

  // ---- animation loop ----------------------------------------

  let lastTime = performance.now();

  function animate(now) {
    // Clamp dt to avoid big jumps when mobile tab throttles
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    swaySeaweed(dt);

    fishByEl.forEach(f => {
      // Horizontal drift
      f.x += f.speed * f.direction * dt;

      // Time-based sine (no dependence on pixel step)
      const phase = f.phaseOffset + now * 0.001 * f.phaseSpeed;
      const targetY = f.baseY + f.amplitude * Math.sin(phase);

      // Gentle low-pass for vertical glide (a bit stronger on mobile)
      const smoothing = isMobile ? 0.10 : 0.15;
      f.smoothY += (targetY - f.smoothY) * smoothing;

      // Use cached dimensions (fallback to current if missing)
      const w = f.w || (f.w = f.fish.clientWidth || 60);
      const h = f.h || (f.h = f.fish.clientHeight || 40);

      const xPos = f.x - w / 2;
      const yPos = f.smoothY - h / 2;

      // Use 2D translate (iOS is happier than with translate3d)
      f.fish.style.transform = `translate(${xPos}px, ${yPos}px) scaleX(${f.direction})`;

      // Off-screen respawn
      if (f.direction === 1 && xPos > width + 120) respawnFish(f);
      if (f.direction === -1 && xPos < -width - 120) respawnFish(f);
    });

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}

