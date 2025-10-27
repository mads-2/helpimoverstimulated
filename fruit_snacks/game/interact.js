window.addEventListener("load", () => {
  const bowls = document.querySelectorAll(".bowl");
  const fruitContainer = document.querySelector(".fruits");
  const smiley = document.getElementById("smiley");

  const fruitNames = ["Strawberry", "Orange", "Banana", "Apple", "Blueberry", "Berry"];

  const colorMap = {
    Strawberry: "Red",
    Orange: "Orange",
    Banana: "Yellow",
    Apple: "Green",
    Blueberry: "Blue",
    Berry: "Purple",
  };

  const imageMap = {
    Strawberry: "../jpgs/gummy_strawberry.png",
    Orange: "../jpgs/gummy_orange.png",
    Banana: "../jpgs/gummy_banana.png",
    Apple: "../jpgs/gummy_apple.png",
    Blueberry: "../jpgs/gummy_blueberry.png",
    Berry: "../jpgs/gummy_berry.png",
  };

  let fruits = [];
  let selectedFruit = null;

  // 🧭 Prevent page movement on mobile while dragging
  document.body.addEventListener("touchmove", (e) => e.preventDefault(), { passive: false });

  // -----------------------
  // Geometry helpers
  // -----------------------
  const getCircle = (el) => {
    const rect = el.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      r: rect.height / 4,
    };
  };

  const circlesOverlap = (f, b) => {
    const dx = f.x - b.x;
    const dy = f.y - b.y;
    return Math.sqrt(dx * dx + dy * dy) < f.r + b.r;
  };

  // -----------------------
  // Plate smiley feedback
  // -----------------------
  const showPlateSmiley = (bowl) => {
    const rect = bowl.getBoundingClientRect();

    const plateSmiley = document.createElement("div");
    plateSmiley.textContent = ":)";
    plateSmiley.style.position = "fixed"; // use fixed for consistent mobile alignment
    plateSmiley.style.left = `${rect.left + rect.width / 2}px`;
    plateSmiley.style.top = `${rect.top + rect.height / 2}px`;
    plateSmiley.style.transform = "translate(-50%, -50%)";
    plateSmiley.style.fontFamily = "monospace";
    plateSmiley.style.color = "rgba(255,255,255,0.9)";
    plateSmiley.style.pointerEvents = "none";
    plateSmiley.style.zIndex = "5";
    plateSmiley.style.opacity = "0";

    // responsive font sizing
    const isMobile = window.innerWidth <= 700;
    plateSmiley.style.fontSize = isMobile ? "7vw" : "2vw";

    // fade in/out animation
    plateSmiley.style.transition = "opacity 0.3s ease-in-out";
    document.body.appendChild(plateSmiley);

    requestAnimationFrame(() => (plateSmiley.style.opacity = "1"));
    setTimeout(() => {
      plateSmiley.style.opacity = "0";
      setTimeout(() => plateSmiley.remove(), 300);
    }, 1000);
  };

  // -----------------------
  // Sorting logic
  // -----------------------
  const tryPlaceFruit = (ghost, realFruit, targetBowl = null) => {
    let matchedBowl = targetBowl;

    if (!matchedBowl) {
      const fruitCircle = getCircle(ghost);
      bowls.forEach((bowl) => {
        const bowlCircle = getCircle(bowl);
        if (circlesOverlap(fruitCircle, bowlCircle)) matchedBowl = bowl;
      });
    }

    if (matchedBowl) {
      const bowlColor = matchedBowl.alt.split(" ")[0];
      const expectedColor = colorMap[realFruit.alt];
      if (bowlColor === expectedColor) {
        showPlateSmiley(matchedBowl);
        dissolveFruit(realFruit);
      } else {
        resetFruit(realFruit);
      }
    } else {
      resetFruit(realFruit);
    }
  };

  // -----------------------
  // Fruit animations
  // -----------------------
  const dissolveFruit = (fruit) => {
    fruit.style.transition = "opacity 0.6s ease, transform 0.6s ease";
    fruit.style.opacity = 0;
    fruit.style.transform = "scale(0.5)";
    setTimeout(() => {
      fruit.remove();
      fruits = fruits.filter((f) => f !== fruit);
      checkAllSorted();
    }, 600);
  };

  const resetFruit = (fruit) => {
    fruit.style.opacity = 1;
  };

  const checkAllSorted = () => {
    if (fruits.length === 0) {
      smiley.style.opacity = 1;
      setTimeout(() => {
        smiley.style.opacity = 0;
        spawnFruits();
      }, 2000);
    }
  };

  // -----------------------
  // Fruit interaction logic
  // -----------------------
  const attachFruitEvents = (fruit) => {
    // Click-to-select (for click-to-sort)
    fruit.addEventListener("click", (e) => {
      e.stopPropagation();
      selectedFruit = selectedFruit === fruit ? null : fruit;
    });

    // Drag-to-sort
    fruit.addEventListener("mousedown", startDrag);
    fruit.addEventListener("touchstart", startDrag, { passive: false });
  };

  const startDrag = (e) => {
    e.preventDefault();
    const fruit = e.target;
    selectedFruit = null;

    const rect = fruit.getBoundingClientRect();
    const startX = e.touches ? e.touches[0].clientX : e.clientX;
    const startY = e.touches ? e.touches[0].clientY : e.clientY;
    const offsetX = startX - rect.left;
    const offsetY = startY - rect.top;

    fruit.style.opacity = 0;

    const ghost = fruit.cloneNode(true);
    Object.assign(ghost.style, {
      position: "fixed",
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      transform: "none",
      aspectRatio: "auto",
      objectFit: "contain",
      pointerEvents: "none",
      transition: "none",
      zIndex: 10,
      opacity: 0.9,
      filter: "drop-shadow(0 5px 8px rgba(0,0,0,0.4))",
    });
    document.body.appendChild(ghost);

    const move = (ev) => {
      const x = ev.touches ? ev.touches[0].clientX : ev.clientX;
      const y = ev.touches ? ev.touches[0].clientY : ev.clientY;
      ghost.style.left = `${x - offsetX}px`;
      ghost.style.top = `${y - offsetY}px`;
    };

    const end = () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", end);
      document.removeEventListener("touchmove", move);
      document.removeEventListener("touchend", end);
      tryPlaceFruit(ghost, fruit);
      ghost.remove();
    };

    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", end);
    document.addEventListener("touchmove", move, { passive: false });
    document.addEventListener("touchend", end);
  };

  // -----------------------
  // Bowl click for click-to-sort
  // -----------------------
  bowls.forEach((bowl) =>
    bowl.addEventListener("click", (e) => {
      e.stopPropagation();
      if (selectedFruit) {
        tryPlaceFruit(selectedFruit, selectedFruit, bowl);
        selectedFruit = null;
      }
    })
  );

  // -----------------------
  // Fruit spawner
  // -----------------------
  const spawnFruits = () => {
    fruitContainer.innerHTML = "";
    fruits = [];
    selectedFruit = null;

    const cols = 3;
    const rows = 2;
    const W = fruitContainer.clientWidth;
    const H = fruitContainer.clientHeight;
    const spacingX = W / cols;
    const spacingY = H / rows;

    const isMobile = window.innerWidth <= 700;
    const yAdjust = isMobile ? -15 : 20; // down on desktop, up on mobile
    const xAdjust = isMobile ? -0.05 * W : 0; // slight left shift on mobile

    for (let i = 0; i < 6; i++) {
      const name = fruitNames[Math.floor(Math.random() * fruitNames.length)];
      const img = document.createElement("img");
      img.src = imageMap[name];
      img.alt = name;
      img.className = "fruit";

      const col = i % cols;
      const row = Math.floor(i / cols);
      const left = col * spacingX + spacingX / 2 + xAdjust;
      const top = row * spacingY + spacingY / 2 + yAdjust;

      img.style.position = "absolute";
      img.style.left = `calc(${left}px - 7.5vw)`;
      img.style.top = `calc(${top}px - 7.5vw)`;
      img.style.transition = "opacity 0.6s ease";
      img.style.opacity = 0;

      fruitContainer.appendChild(img);
      attachFruitEvents(img);
      fruits.push(img);
      requestAnimationFrame(() => (img.style.opacity = 1));
    }
  };

  spawnFruits();
});

