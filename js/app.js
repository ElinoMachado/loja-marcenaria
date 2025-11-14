import * as THREE from "https://unpkg.com/three@0.152.2/build/three.module.js";

// 👉 Coloque aqui o número do WhatsApp do marceneiro (apenas dígitos, com DDI).
const WHATSAPP_PHONE = "553498714567"; // TROCAR pelo número real

// Formatação de moeda
const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

// Portfólio (agora com id, medidas em cm e tipo)
const portfolioItems = [
  {
    id: "tv-panel-55",
    name: 'Painel para TV 55"',
    measures: "2,10m (L) x 1,80m (A) x 0,25m (P)",
    widthCm: 210,
    heightCm: 180,
    depthCm: 25,
    kind: "tv-panel",
    priceRef: 1494,
    environment: "Sala de estar",
    material: "MDF madeirado + nichos",
    // FOTO DE UM PAINEL DE TV
    img: "assets/portfolio/tv-panel-55.jpg",
  },
  {
    id: "wardrobe-couple",
    name: "Guarda-roupa casal",
    measures: "2,40m (L) x 2,60m (A) x 0,60m (P)",
    widthCm: 240,
    heightCm: 260,
    depthCm: 60,
    kind: "wardrobe",
    priceRef: 5920,
    environment: "Quarto",
    material: "MDF branco + portas de correr",
    // FOTO DE UM GUARDA-ROUPA
    img: "assets/portfolio/wardrobe-couple.jpg",
  },
  {
    id: "kitchen-cabinet",
    name: "Armário de cozinha planejado",
    measures: "3,20m (L) x 2,40m (A) x 0,60m (P)",
    widthCm: 320,
    heightCm: 240,
    depthCm: 60,
    kind: "wall-cabinet",
    priceRef: 7286,
    environment: "Cozinha",
    material: "MDF madeirado + nichos para forno/micro-ondas",
    // FOTO DE UMA COZINHA PLANEJADA
    img: "assets/portfolio/kitchen-cabinet.jpg",
  },
  {
    id: "desk-niches",
    name: "Escrivaninha com nichos",
    measures: "1,50m (L) x 0,78m (A) x 0,55m (P)",
    widthCm: 150,
    heightCm: 78,
    depthCm: 55,
    kind: "desk",
    priceRef: 1018,
    environment: "Escritório",
    material: "MDF branco fosco",
    // FOTO DE UMA ESCRIVANINHA/ESTAÇÃO DE TRABALHO
    img: "assets/portfolio/desk-niches.jpg",
  },
];

// Resumo / orçamento
let lastRequirementsText = "";
let lastEstimateValue = 0;

// Three.js
let scene, camera, renderer;
let boxMesh, floorMesh, hemiLight, dirLight;
let complexityGroup;
let personMesh;
let previewContainer = null;

// Portfólio modal
let currentPortfolioItem = null;
let modalEl,
  modalImg,
  modalTitle,
  modalInfo,
  modalUseBtn,
  modalCloseBtn,
  modalBackdrop;

const ROTATION_STEP = 0.15;

document.addEventListener("DOMContentLoaded", () => {
  renderPortfolio();
  initPortfolioModal();
  init3D();
  initFormLogic();
  initFooterYear();
  initFullscreenFeature();
  initKeyboardControls();
});

/* --------------------------------
 * Rodapé
 * --------------------------------*/
function initFooterYear() {
  const span = document.getElementById("yearSpan");
  if (span) span.textContent = new Date().getFullYear();
}

/* --------------------------------
 * Portfólio
 * --------------------------------*/
function renderPortfolio() {
  const grid = document.getElementById("portfolioGrid");
  if (!grid) return;

  grid.innerHTML = "";

  portfolioItems.forEach((item) => {
    const card = document.createElement("article");
    card.className = "portfolio-card";

    const img = document.createElement("img");
    img.className = "portfolio-img";
    img.src = item.img;
    img.alt = item.name;

    // Clique na imagem abre modal
    img.addEventListener("click", () => openPortfolioModal(item));

    const body = document.createElement("div");
    body.className = "portfolio-body";

    const title = document.createElement("h3");
    title.className = "portfolio-title";
    title.textContent = item.name;

    const meta = document.createElement("p");
    meta.className = "portfolio-meta";
    meta.textContent = `${item.measures} • ${item.environment}`;

    const material = document.createElement("p");
    material.className = "portfolio-meta";
    material.textContent = `Material: ${item.material}`;

    const price = document.createElement("p");
    price.className = "portfolio-price";
    price.textContent = `Ref.: ${currencyFormatter.format(item.priceRef)}`;

    const actions = document.createElement("div");
    actions.className = "portfolio-actions";

    const btnView = document.createElement("button");
    btnView.type = "button";
    btnView.className = "btn secondary";
    btnView.textContent = "Ver maior";
    btnView.addEventListener("click", () => openPortfolioModal(item));

    const btnUse = document.createElement("button");
    btnUse.type = "button";
    btnUse.className = "btn primary";
    btnUse.textContent = "Usar no meu pedido";
    btnUse.addEventListener("click", () => {
      usePortfolioItemAsBase(item);
    });

    actions.appendChild(btnView);
    actions.appendChild(btnUse);

    body.appendChild(title);
    body.appendChild(meta);
    body.appendChild(material);
    body.appendChild(price);
    body.appendChild(actions);

    card.appendChild(img);
    card.appendChild(body);
    grid.appendChild(card);
  });
}

/* --------------------------------
 * Modal de portfólio + zoom local
 * --------------------------------*/
function initPortfolioModal() {
  modalEl = document.getElementById("portfolioModal");
  if (!modalEl) return;

  modalImg = document.getElementById("portfolioModalImage");
  modalTitle = document.getElementById("portfolioModalTitle");
  modalInfo = document.getElementById("portfolioModalInfo");
  modalUseBtn = document.getElementById("btnUseFromModal");
  modalCloseBtn = document.getElementById("portfolioModalClose");
  modalBackdrop = modalEl.querySelector(".modal-backdrop");

  const close = () => {
    modalEl.classList.remove("show");
    modalEl.classList.add("hidden");
    currentPortfolioItem = null;
  };

  modalCloseBtn?.addEventListener("click", close);
  modalBackdrop?.addEventListener("click", close);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalEl.classList.contains("show")) {
      close();
    }
  });

  if (modalUseBtn) {
    modalUseBtn.addEventListener("click", () => {
      if (currentPortfolioItem) {
        usePortfolioItemAsBase(currentPortfolioItem);
        close();
      }
    });
  }

  if (modalImg) {
    modalImg.addEventListener("mousemove", handleModalImageZoom);
    modalImg.addEventListener("mouseleave", resetModalImageZoom);
  }
}

function openPortfolioModal(item) {
  if (!modalEl || !modalImg || !modalTitle || !modalInfo) return;

  currentPortfolioItem = item;
  modalImg.src = item.img;
  modalImg.alt = item.name;
  modalTitle.textContent = item.name;
  modalInfo.textContent = `${item.measures} • ${item.environment} • ${item.material}`;

  resetModalImageZoom();
  modalEl.classList.remove("hidden");
  modalEl.classList.add("show");
}

function handleModalImageZoom(e) {
  const img = e.currentTarget;
  const rect = img.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * 100;
  const y = ((e.clientY - rect.top) / rect.height) * 100;
  img.style.transformOrigin = `${x}% ${y}%`;
  img.style.transform = "scale(2)";
}

function resetModalImageZoom() {
  if (!modalImg) return;
  modalImg.style.transformOrigin = "center center";
  modalImg.style.transform = "scale(1)";
}

/* Usa um item do portfólio como base do pedido */
function usePortfolioItemAsBase(item) {
  const widthInput = document.getElementById("widthCm");
  const heightInput = document.getElementById("heightCm");
  const depthInput = document.getElementById("depthCm");

  if (widthInput && heightInput && depthInput) {
    if (item.widthCm) widthInput.value = String(item.widthCm);
    if (item.heightCm) heightInput.value = String(item.heightCm);
    if (item.depthCm) depthInput.value = String(item.depthCm);
  }

  // Ambiente (roomType) aproximado
  const roomTypeSel = document.getElementById("roomType");
  if (roomTypeSel && item.environment) {
    const envLower = item.environment.toLowerCase();
    for (const opt of roomTypeSel.options) {
      const txt = (opt.text || opt.value || "").toLowerCase();
      if (
        (envLower.includes("sala") && txt.includes("sala")) ||
        (envLower.includes("quarto") && txt.includes("quarto")) ||
        (envLower.includes("cozinha") && txt.includes("cozinha")) ||
        (envLower.includes("escrit") && txt.includes("escrit"))
      ) {
        roomTypeSel.value = opt.value;
        break;
      }
    }
  }

  // Tipo de móvel (pra topologia do 3D)
  setFurnitureSelectByKind(item.kind);

  // Observações
  let notes = document.getElementById("notes");
  notes.value = "";
  if (notes) {
    const baseText = `Baseado no modelo do portfólio: ${item.name} (Medidas: ${item.measures}, Ambiente: ${item.environment}, Material: ${item.material}).`;
    if (!notes.value.trim()) {
      notes.value = baseText;
    } else if (!notes.value.includes(item.name)) {
      notes.value = notes.value.trim() + "\n\n" + baseText;
    }
  }

  // Atualiza 3D/valor
  updateEstimateAnd3D();

  const formSection = document.getElementById("customFurniture");
  if (formSection) {
    formSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

/* --------------------------------
 * Three.js – preview 3D
 * --------------------------------*/
function init3D() {
  previewContainer = document.getElementById("preview3d");
  if (!previewContainer) return;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x020617);

  camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
  camera.position.set(2.5, 2.2, 3.5);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio || 1);

  previewContainer.innerHTML = "";
  previewContainer.appendChild(renderer.domElement);

  const size = getRendererSize();
  if (document.fullscreenElement === previewContainer) {
    previewContainer.style.height = "";
  } else {
    previewContainer.style.height = `${size.height}px`;
  }
  renderer.setSize(size.width, size.height);
  camera.aspect = size.width / size.height;
  camera.updateProjectionMatrix();

  // Luzes
  hemiLight = new THREE.HemisphereLight(0xffffff, 0x222222, 1.2);
  scene.add(hemiLight);

  dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
  dirLight.position.set(5, 10, 7.5);
  scene.add(dirLight);

  // Casco principal do móvel
  const bodyGeometry = new THREE.BoxGeometry(1, 1, 1);
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0xf9fafb,
    metalness: 0.08,
    roughness: 0.6,
  });
  boxMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
  scene.add(boxMesh);

  // Grupo de detalhes
  complexityGroup = new THREE.Group();
  boxMesh.add(complexityGroup);

  // Piso
  const planeGeom = new THREE.PlaneGeometry(6, 6);
  const planeMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 1,
  });
  floorMesh = new THREE.Mesh(planeGeom, planeMat);
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.position.y = -0.5;
  scene.add(floorMesh);

  // Pessoa 1,80m
  createPersonMesh();

  // Controles sobre o canvas
  create3DOverlayControls(previewContainer);

  // Rotação com mouse (eixo Y)
  let isDragging = false;
  const previousMousePosition = { x: 0, y: 0 };

  function getEventPos(e) {
    return { x: e.clientX, y: e.clientY };
  }

  renderer.domElement.addEventListener("pointerdown", (event) => {
    isDragging = true;
    const pos = getEventPos(event);
    previousMousePosition.x = pos.x;
    previousMousePosition.y = pos.y;
  });

  renderer.domElement.addEventListener("pointerup", () => {
    isDragging = false;
  });

  renderer.domElement.addEventListener("pointerleave", () => {
    isDragging = false;
  });

  renderer.domElement.addEventListener("pointermove", (event) => {
    if (!isDragging || !boxMesh) return;
    const pos = getEventPos(event);
    const deltaX = pos.x - previousMousePosition.x;
    const rotationSpeed = 0.003;
    boxMesh.rotation.y += deltaX * rotationSpeed;
    previousMousePosition.x = pos.x;
    previousMousePosition.y = pos.y;
  });

  // Zoom com scroll
  renderer.domElement.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      const delta = event.deltaY > 0 ? 1.1 : 0.9;
      const minDist = 1.5;
      const maxDist = 9;

      const v = camera.position.clone();
      let len = v.length() * delta;
      if (len < minDist) len = minDist;
      if (len > maxDist) len = maxDist;
      v.setLength(len);
      camera.position.copy(v);
      camera.lookAt(0, 0, 0);
    },
    { passive: false }
  );

  window.addEventListener("resize", onWindowResize3D);

  animate3D();

  // Tamanho/material padrão
  updateBoxFromMeasures(120, 200, 45);

  const materialEl = document.getElementById("material");
  const finishEl = document.getElementById("finish");
  const complexityEl = document.getElementById("complexity");
  updateMaterialAndComplexity(
    materialEl?.value || "mdf-branco",
    finishEl?.value || "fosco",
    complexityEl?.value || "medio"
  );
}

function getRendererSize() {
  if (!previewContainer) return { width: 320, height: 260 };

  if (document.fullscreenElement === previewContainer) {
    return { width: window.innerWidth, height: window.innerHeight };
  }

  const width = previewContainer.clientWidth || 320;
  const height = Math.max(Math.round(width * 0.62), 260);
  return { width, height };
}

function animate3D() {
  requestAnimationFrame(animate3D);
  if (renderer && scene && camera) renderer.render(scene, camera);
}

function onWindowResize3D() {
  if (!renderer || !camera || !previewContainer) return;

  const size = getRendererSize();
  if (document.fullscreenElement === previewContainer) {
    previewContainer.style.height = "";
  } else {
    previewContainer.style.height = `${size.height}px`;
  }

  camera.aspect = size.width / size.height;
  camera.updateProjectionMatrix();
  renderer.setSize(size.width, size.height);
}

/* Pessoa 1,80m */
function createPersonMesh() {
  const group = new THREE.Group();

  const bodyHeight = 1.4;
  const bodyGeom = new THREE.CylinderGeometry(0.18, 0.22, bodyHeight, 16);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.5,
    metalness: 0.2,
  });
  const body = new THREE.Mesh(bodyGeom, bodyMat);
  body.position.y = bodyHeight / 2;
  group.add(body);

  const headRadius = 0.2;
  const headGeom = new THREE.SphereGeometry(headRadius, 20, 20);
  const headMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    roughness: 0.4,
    metalness: 0.1,
  });
  const head = new THREE.Mesh(headGeom, headMat);
  head.position.y = bodyHeight + headRadius;
  group.add(head);

  personMesh = group;
  scene.add(personMesh);
  updatePersonPosition();
}

function updatePersonPosition() {
  if (!personMesh || !boxMesh) return;
  const w = boxMesh.scale.x || 1;
  personMesh.position.set(-(w / 2) - 0.8, -0.5, 0);
}

/* --------------------------------
 * Material / tipo / complexidade
 * --------------------------------*/
function updateBoxFromMeasures(widthCm, heightCm, depthCm) {
  if (!boxMesh) return;

  const scaleFactor = 1 / 100;
  const w = Math.max(widthCm * scaleFactor, 0.2);
  const h = Math.max(heightCm * scaleFactor, 0.3);
  const d = Math.max(depthCm * scaleFactor, 0.2);

  boxMesh.scale.set(w, h, d);
  updatePersonPosition();
}

function normalizeFurnitureType(raw) {
  if (!raw) return "wardrobe";
  const v = raw.toLowerCase();
  if (v.includes("tv") || v.includes("rack") || v.includes("painel"))
    return "tv-panel";
  if (v.includes("escrivan") || v.includes("mesa") || v.includes("bancada"))
    return "desk";
  if (v.includes("aéreo") || v.includes("aereo")) return "wall-cabinet";
  if (v.includes("cristaleira")) return "display-cabinet";
  if (v.includes("sapateira")) return "shoe-cabinet";
  if (
    v.includes("guarda") ||
    v.includes("roupeiro") ||
    v.includes("armario") ||
    v.includes("armário")
  )
    return "wardrobe";
  return "wardrobe";
}

// ajusta o select do tipo de móvel com base no "kind"
function setFurnitureSelectByKind(kind) {
  const sel = document.getElementById("furnitureType");
  if (!sel || !kind) return;

  const matchers = {
    "tv-panel": ["tv", "rack", "painel"],
    wardrobe: ["guarda", "roupeiro", "armário", "armario"],
    desk: ["escrivan", "mesa", "bancada"],
    "wall-cabinet": ["aéreo", "aereo", "superior"],
    "display-cabinet": ["cristaleira"],
  };
  const candidates = matchers[kind] || [];

  for (const opt of sel.options) {
    const text = (opt.text || opt.value || "").toLowerCase();
    if (candidates.some((c) => text.includes(c))) {
      sel.value = opt.value;
      break;
    }
  }
}

function updateMaterialAndComplexity(materialKey, finishKey, complexityKey) {
  if (!boxMesh || !floorMesh || !hemiLight || !dirLight || !scene) return;

  const materialConfigs = {
    "mdf-branco": { color: 0xf9fafb },
    "mdf-madeirado": { color: 0x8b5a2b },
    "madeira-macica": { color: 0x6b3a1a },
  };

  const finishConfigs = {
    fosco: { roughness: 0.9, metalness: 0.05 },
    "semi-brilho": { roughness: 0.5, metalness: 0.08 },
    "alto-brilho": { roughness: 0.2, metalness: 0.12 },
  };

  const matCfg = materialConfigs[materialKey] || materialConfigs["mdf-branco"];
  const finCfg = finishConfigs[finishKey] || finishConfigs["fosco"];

  const mat = boxMesh.material;
  mat.color.setHex(matCfg.color);
  mat.roughness = finCfg.roughness;
  mat.metalness = finCfg.metalness;
  mat.needsUpdate = true;

  floorMesh.material.color.setHex(0x111827);
  floorMesh.material.needsUpdate = true;
  hemiLight.color.setHex(0xffffff);
  dirLight.color.setHex(0xffffff);
  scene.background = new THREE.Color(0x020617);

  const furnitureRaw = document.getElementById("furnitureType")?.value || "";
  const kind = normalizeFurnitureType(furnitureRaw);
  rebuildFurnitureGeometry(kind, complexityKey);
}

// limpa e reconstrói detalhes conforme tipo + complexidade
function rebuildFurnitureGeometry(kind, level) {
  if (!complexityGroup) return;
  while (complexityGroup.children.length > 0) {
    const child = complexityGroup.children[0];
    complexityGroup.remove(child);
    if (child.geometry) child.geometry.dispose();
    if (child.material) child.material.dispose();
  }

  switch (kind) {
    case "tv-panel":
      buildTvPanel(level);
      break;
    case "desk":
      buildDesk(level);
      break;
    case "wall-cabinet":
      buildWallCabinet(level);
      break;
    default:
      buildWardrobe(level);
      break;
  }
}

/* ------- Modelos específicos (iguais ao que já tínhamos) ------- */
// guarda-roupa
function buildWardrobe(level) {
  const doorThickness = 0.04;
  const doorHeight = 0.7;
  const doorWidth = 0.46;
  const doorY = 0.15;
  const frontZ = 0.5 + doorThickness / 2;

  const doorMaterial = new THREE.MeshStandardMaterial({
    color: 0xf3f4f6,
    roughness: 0.5,
    metalness: 0.1,
  });

  const handleMaterial = new THREE.MeshStandardMaterial({
    color: 0x9ca3af,
    roughness: 0.3,
    metalness: 0.5,
  });

  const doorGeom = new THREE.BoxGeometry(doorWidth, doorHeight, doorThickness);
  const leftDoor = new THREE.Mesh(doorGeom, doorMaterial);
  leftDoor.position.set(-doorWidth / 2, doorY, frontZ);
  complexityGroup.add(leftDoor);

  const rightDoor = new THREE.Mesh(doorGeom.clone(), doorMaterial);
  rightDoor.position.set(doorWidth / 2, doorY, frontZ);
  complexityGroup.add(rightDoor);

  const handleGeom = new THREE.BoxGeometry(0.08, 0.02, 0.02);
  const leftHandle = new THREE.Mesh(handleGeom, handleMaterial);
  leftHandle.position.set(doorWidth / 2 - 0.12, 0, doorThickness / 2 + 0.02);
  leftDoor.add(leftHandle);

  const rightHandle = new THREE.Mesh(handleGeom, handleMaterial);
  rightHandle.position.set(
    -(doorWidth / 2 - 0.12),
    0,
    doorThickness / 2 + 0.02
  );
  rightDoor.add(rightHandle);

  if (level === "simples") return;

  const drawerHeight = 0.16;
  const drawerWidth = 0.42;
  const drawerDepth = 0.06;
  const drawerY = -0.45;

  const drawerMaterial = new THREE.MeshStandardMaterial({
    color: 0xe5e7eb,
    roughness: 0.55,
    metalness: 0.08,
  });

  const drawerGeom = new THREE.BoxGeometry(
    drawerWidth,
    drawerHeight,
    drawerDepth
  );
  const drawerLeft = new THREE.Mesh(drawerGeom, drawerMaterial);
  drawerLeft.position.set(-0.25, drawerY, frontZ);
  complexityGroup.add(drawerLeft);

  const drawerRight = new THREE.Mesh(drawerGeom.clone(), drawerMaterial);
  drawerRight.position.set(0.25, drawerY, frontZ);
  complexityGroup.add(drawerRight);

  const drawerHandleGeom = new THREE.BoxGeometry(0.16, 0.02, 0.02);
  const drawerHandleMat = new THREE.MeshStandardMaterial({
    color: 0x9ca3af,
    roughness: 0.3,
    metalness: 0.5,
  });

  const dlHandle = new THREE.Mesh(drawerHandleGeom, drawerHandleMat);
  dlHandle.position.set(0, 0.02, drawerDepth / 2 + 0.02);
  drawerLeft.add(dlHandle);

  const drHandle = new THREE.Mesh(drawerHandleGeom.clone(), drawerHandleMat);
  drHandle.position.set(0, 0.02, drawerDepth / 2 + 0.02);
  drawerRight.add(drHandle);

  if (level === "medio") return;

  const shelfGeom = new THREE.BoxGeometry(1.02, 0.06, 0.18);
  const shelfMat = new THREE.MeshStandardMaterial({
    color: 0xe5e7eb,
    roughness: 0.6,
    metalness: 0.05,
  });
  const shelf = new THREE.Mesh(shelfGeom, shelfMat);
  shelf.position.set(0, -0.1, frontZ - 0.05);
  complexityGroup.add(shelf);
}

// painel / rack tv
function buildTvPanel(level) {
  const frontZ = 0.5 + 0.04;

  const boardGeom = new THREE.BoxGeometry(1.3, 0.9, 0.06);
  const boardMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 0.8,
    metalness: 0.05,
  });
  const board = new THREE.Mesh(boardGeom, boardMat);
  board.position.set(0, 0.2, frontZ - 0.03);
  complexityGroup.add(board);

  const screenGeom = new THREE.BoxGeometry(0.8, 0.45, 0.02);
  const screenMat = new THREE.MeshStandardMaterial({
    color: 0x020617,
    roughness: 0.2,
    metalness: 0.3,
  });
  const screen = new THREE.Mesh(screenGeom, screenMat);
  screen.position.set(0, 0.25, frontZ);
  complexityGroup.add(screen);

  const soundGeom = new THREE.BoxGeometry(0.5, 0.05, 0.03);
  const soundMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.4,
    metalness: 0.4,
  });
  const soundbar = new THREE.Mesh(soundGeom, soundMat);
  soundbar.position.set(0, 0.03, frontZ);
  complexityGroup.add(soundbar);

  if (level === "simples") return;

  const baseGeom = new THREE.BoxGeometry(1.1, 0.28, 0.35);
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0xe5e7eb,
    roughness: 0.6,
    metalness: 0.05,
  });
  const base = new THREE.Mesh(baseGeom, baseMat);
  base.position.set(0, -0.45, frontZ - 0.09);
  complexityGroup.add(base);

  const nicheGeom = new THREE.BoxGeometry(0.5, 0.12, 0.38);
  const nicheMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.85,
    metalness: 0.03,
  });
  const niche = new THREE.Mesh(nicheGeom, nicheMat);
  niche.position.set(0, -0.44, frontZ - 0.12);
  complexityGroup.add(niche);

  if (level === "medio") return;

  const doorGeom = new THREE.BoxGeometry(0.25, 0.2, 0.04);
  const doorMat = new THREE.MeshStandardMaterial({
    color: 0xf3f4f6,
    roughness: 0.55,
    metalness: 0.08,
  });

  const leftDoor = new THREE.Mesh(doorGeom, doorMat);
  leftDoor.position.set(-0.4, -0.45, frontZ - 0.02);
  complexityGroup.add(leftDoor);

  const rightDoor = new THREE.Mesh(doorGeom.clone(), doorMat);
  rightDoor.position.set(0.4, -0.45, frontZ - 0.02);
  complexityGroup.add(rightDoor);
}

// escrivaninha
function buildDesk(level) {
  const frontZ = 0.5 + 0.02;

  const topGeom = new THREE.BoxGeometry(1.3, 0.08, 0.6);
  const topMat = new THREE.MeshStandardMaterial({
    color: 0xf3f4f6,
    roughness: 0.5,
    metalness: 0.08,
  });
  const top = new THREE.Mesh(topGeom, topMat);
  top.position.set(0, 0, frontZ - 0.2);
  complexityGroup.add(top);

  const legGeom = new THREE.BoxGeometry(0.08, 0.8, 0.06);
  const legMat = new THREE.MeshStandardMaterial({
    color: 0xe5e7eb,
    roughness: 0.6,
    metalness: 0.05,
  });

  const legFL = new THREE.Mesh(legGeom, legMat);
  legFL.position.set(-0.6, -0.44, 0.15);
  complexityGroup.add(legFL);

  const legFR = new THREE.Mesh(legGeom.clone(), legMat);
  legFR.position.set(0.6, -0.44, 0.15);
  complexityGroup.add(legFR);

  const legBL = new THREE.Mesh(legGeom.clone(), legMat);
  legBL.position.set(-0.6, -0.44, -0.45);
  complexityGroup.add(legBL);

  const legBR = new THREE.Mesh(legGeom.clone(), legMat);
  legBR.position.set(0.6, -0.44, -0.45);
  complexityGroup.add(legBR);

  if (level === "simples") return;

  const drawerBodyGeom = new THREE.BoxGeometry(0.35, 0.6, 0.5);
  const drawerBodyMat = new THREE.MeshStandardMaterial({
    color: 0xe5e7eb,
    roughness: 0.55,
    metalness: 0.06,
  });
  const drawerBody = new THREE.Mesh(drawerBodyGeom, drawerBodyMat);
  drawerBody.position.set(0.4, -0.35, -0.1);
  complexityGroup.add(drawerBody);

  const drawerFrontGeom = new THREE.BoxGeometry(0.33, 0.16, 0.06);
  const drawerFrontMat = new THREE.MeshStandardMaterial({
    color: 0xf9fafb,
    roughness: 0.6,
    metalness: 0.04,
  });

  const yBase = -0.2;
  const drawer1 = new THREE.Mesh(drawerFrontGeom, drawerFrontMat);
  drawer1.position.set(0.4, yBase, frontZ);
  complexityGroup.add(drawer1);

  const drawer2 = new THREE.Mesh(drawerFrontGeom.clone(), drawerFrontMat);
  drawer2.position.set(0.4, yBase - 0.22, frontZ);
  complexityGroup.add(drawer2);

  const drawer3 = new THREE.Mesh(drawerFrontGeom.clone(), drawerFrontMat);
  drawer3.position.set(0.4, yBase - 0.44, frontZ);
  complexityGroup.add(drawer3);

  if (level === "alto") {
    const handleGeom = new THREE.BoxGeometry(0.12, 0.02, 0.02);
    const handleMat = new THREE.MeshStandardMaterial({
      color: 0x9ca3af,
      roughness: 0.3,
      metalness: 0.5,
    });

    [drawer1, drawer2, drawer3].forEach((drawer) => {
      const h = new THREE.Mesh(handleGeom, handleMat);
      h.position.set(0, 0, 0.05);
      drawer.add(h);
    });
  }
}

// armário aéreo
function buildWallCabinet(level) {
  const depth = 0.35;
  const frontZ = 0.5 + 0.04;

  const bodyGeom = new THREE.BoxGeometry(1.1, 0.6, depth);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xf3f4f6,
    roughness: 0.55,
    metalness: 0.06,
  });
  const body = new THREE.Mesh(bodyGeom, bodyMat);
  body.position.set(0, 0.2, 0);
  complexityGroup.add(body);

  const doorGeom = new THREE.BoxGeometry(0.53, 0.55, 0.04);
  const doorMat = new THREE.MeshStandardMaterial({
    color: 0xe5e7eb,
    roughness: 0.6,
    metalness: 0.06,
  });

  const leftDoor = new THREE.Mesh(doorGeom, doorMat);
  leftDoor.position.set(-0.27, 0.2, frontZ);
  complexityGroup.add(leftDoor);

  const rightDoor = new THREE.Mesh(doorGeom.clone(), doorMat);
  rightDoor.position.set(0.27, 0.2, frontZ);
  complexityGroup.add(rightDoor);

  if (level === "simples") return;

  const handleGeom = new THREE.BoxGeometry(0.09, 0.02, 0.02);
  const handleMat = new THREE.MeshStandardMaterial({
    color: 0x9ca3af,
    roughness: 0.3,
    metalness: 0.4,
  });

  const lh = new THREE.Mesh(handleGeom, handleMat);
  lh.position.set(0.18, -0.05, 0.05);
  leftDoor.add(lh);

  const rh = new THREE.Mesh(handleGeom.clone(), handleMat);
  rh.position.set(-0.18, -0.05, 0.05);
  rightDoor.add(rh);

  if (level === "alto") {
    const shelfGeom = new THREE.BoxGeometry(1.05, 0.04, depth - 0.05);
    const shelfMat = new THREE.MeshStandardMaterial({
      color: 0xe5e7eb,
      roughness: 0.65,
      metalness: 0.05,
    });
    const shelf = new THREE.Mesh(shelfGeom, shelfMat);
    shelf.position.set(0, -0.1, 0.02);
    complexityGroup.add(shelf);
  }
}

/* --------------------------------
 * Controles sobre o canvas + teclado
 * --------------------------------*/
function create3DOverlayControls(container) {
  const controls = document.createElement("div");
  controls.className = "preview-3d-controls";
  controls.innerHTML = `
    <button type="button" data-action="rotate-left" title="Girar para a esquerda">⟲</button>
    <button type="button" data-action="rotate-right" title="Girar para a direita">⟳</button>
    <button type="button" data-action="rotate-up" title="Inclinar para cima">↑</button>
    <button type="button" data-action="rotate-down" title="Inclinar para baixo">↓</button>
    <button type="button" data-action="reset" title="Centralizar">⦿</button>
  `;
  container.appendChild(controls);

  controls.addEventListener("click", (event) => {
    const btn = event.target.closest("button[data-action]");
    if (!btn) return;
    applyRotationAction(btn.dataset.action);
  });
}

function applyRotationAction(action) {
  if (!boxMesh) return;
  switch (action) {
    case "rotate-left":
      boxMesh.rotation.y += ROTATION_STEP;
      break;
    case "rotate-right":
      boxMesh.rotation.y -= ROTATION_STEP;
      break;
    case "rotate-up":
      boxMesh.rotation.x -= ROTATION_STEP;
      break;
    case "rotate-down":
      boxMesh.rotation.x += ROTATION_STEP;
      break;
    case "reset":
      boxMesh.rotation.set(0, 0, 0);
      break;
  }
}

function initKeyboardControls() {
  document.addEventListener("keydown", (event) => {
    const tag = event.target && event.target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

    switch (event.key) {
      case "ArrowLeft":
        applyRotationAction("rotate-left");
        event.preventDefault();
        break;
      case "ArrowRight":
        applyRotationAction("rotate-right");
        event.preventDefault();
        break;
      case "ArrowUp":
        applyRotationAction("rotate-up");
        event.preventDefault();
        break;
      case "ArrowDown":
        applyRotationAction("rotate-down");
        event.preventDefault();
        break;
      default:
        break;
    }
  });
}

/* --------------------------------
 * Formulário + presets por tipo
 * --------------------------------*/
function initFormLogic() {
  const widthInput = document.getElementById("widthCm");
  const heightInput = document.getElementById("heightCm");
  const depthInput = document.getElementById("depthCm");
  const materialSel = document.getElementById("material");
  const complexitySel = document.getElementById("complexity");
  const finishSel = document.getElementById("finish");
  const furnitureSel = document.getElementById("furnitureType");

  const btnGenerateSummary = document.getElementById("btnGenerateSummary");
  const btnDownloadTxt = document.getElementById("btnDownloadTxt");
  const btnSendWhatsApp = document.getElementById("btnSendWhatsApp");

  const inputsForEstimate = [
    widthInput,
    heightInput,
    depthInput,
    materialSel,
    complexitySel,
    finishSel,
  ];

  inputsForEstimate.forEach((el) => {
    if (!el) return;
    el.addEventListener("input", () => {
      updateEstimateAnd3D();
    });
  });

  if (furnitureSel) {
    furnitureSel.addEventListener("change", () => {
      applyFurniturePreset(furnitureSel.value);
    });
    applyFurniturePreset(furnitureSel.value);
  } else {
    updateEstimateAnd3D();
  }

  if (btnGenerateSummary) {
    btnGenerateSummary.addEventListener("click", () => generateSummary());
  }
  if (btnDownloadTxt) {
    btnDownloadTxt.addEventListener("click", () => downloadRequirementsTxt());
  }
  if (btnSendWhatsApp) {
    btnSendWhatsApp.addEventListener("click", () => sendToWhatsApp());
  }
}

function applyFurniturePreset(rawType) {
  const kind = normalizeFurnitureType(rawType);

  let preset;
  switch (kind) {
    case "tv-panel":
      preset = { w: 180, h: 160, d: 40 };
      break;
    case "desk":
      preset = { w: 140, h: 75, d: 60 };
      break;
    case "wall-cabinet":
      preset = { w: 120, h: 80, d: 35 };
      break;
    case "display-cabinet":
      preset = { w: 100, h: 190, d: 40 };
      break;
    default:
      preset = { w: 240, h: 230, d: 60 };
      break;
  }

  setMeasureInputs(preset);
  updateEstimateAnd3D();
}

function setMeasureInputs(preset) {
  const widthInput = document.getElementById("widthCm");
  const heightInput = document.getElementById("heightCm");
  const depthInput = document.getElementById("depthCm");

  if (widthInput) widthInput.value = String(preset.w);
  if (heightInput) heightInput.value = String(preset.h);
  if (depthInput) depthInput.value = String(preset.d);
}

function updateEstimateAnd3D() {
  const width = parseFloat(document.getElementById("widthCm")?.value || "0");
  const height = parseFloat(document.getElementById("heightCm")?.value || "0");
  const depth = parseFloat(document.getElementById("depthCm")?.value || "0");
  const material = document.getElementById("material")?.value || "mdf-branco";
  const complexity = document.getElementById("complexity")?.value || "medio";
  const finish = document.getElementById("finish")?.value || "fosco";

  if (width > 0 && height > 0 && depth > 0) {
    updateBoxFromMeasures(width, height, depth);
  }

  updateMaterialAndComplexity(material, finish, complexity);

  const estimate = calculateEstimate(
    width,
    height,
    depth,
    material,
    complexity
  );
  lastEstimateValue = estimate;
  const estimateSpan = document.getElementById("estimateValue");
  if (estimateSpan) {
    estimateSpan.textContent = currencyFormatter.format(estimate);
  }
}

function calculateEstimate(widthCm, heightCm, depthCm, material, complexity) {
  if (!widthCm || !heightCm || !depthCm) return 0;

  const BASE_M2_PRICE = 550;

  const MATERIAL_FACTORS = {
    "mdf-branco": 1.0,
    "mdf-madeirado": 1.2,
    "madeira-macica": 1.6,
  };

  const COMPLEXITY_FACTORS = {
    simples: 1.0,
    medio: 1.15,
    alto: 1.3,
  };

  const materialFactor = MATERIAL_FACTORS[material] || 1.0;
  const complexityFactor = COMPLEXITY_FACTORS[complexity] || 1.0;

  const areaM2 = (widthCm * heightCm) / 10000;

  let depthFactor = depthCm / 40;
  depthFactor = Math.min(Math.max(depthFactor, 0.5), 1.5);

  let price =
    areaM2 * BASE_M2_PRICE * materialFactor * complexityFactor * depthFactor;

  if (price < 400) price = 400;

  return Math.round(price);
}

/* --------------------------------
 * Resumo / documento
 * --------------------------------*/
function generateSummary() {
  const clientName = document.getElementById("clientName")?.value.trim();
  const clientPhone = document.getElementById("clientPhone")?.value.trim();
  const clientAddress = document.getElementById("clientAddress")?.value.trim();

  const furnitureType = document.getElementById("furnitureType")?.value;
  const roomType = document.getElementById("roomType")?.value;
  const notes = document.getElementById("notes")?.value.trim();

  const width = document.getElementById("widthCm")?.value;
  const height = document.getElementById("heightCm")?.value;
  const depth = document.getElementById("depthCm")?.value;

  const material = document.getElementById("material")?.value;
  const finish = document.getElementById("finish")?.value;
  const complexity = document.getElementById("complexity")?.value;

  if (!clientName) {
    alert("Por favor, informe seu nome.");
    return;
  }

  if (!width || !height || !depth) {
    alert("Informe as medidas de largura, altura e profundidade.");
    return;
  }

  const estimateFormatted = currencyFormatter.format(lastEstimateValue || 0);

  const materialLabel =
    {
      "mdf-branco": "MDF branco",
      "mdf-madeirado": "MDF madeirado premium",
      "madeira-macica": "Madeira maciça",
    }[material] || material;

  const complexityLabel =
    {
      simples: "Simples",
      medio: "Médio",
      alto: "Alto",
    }[complexity] || complexity;

  const finishLabel =
    {
      fosco: "Fosco",
      "semi-brilho": "Semi-brilho",
      "alto-brilho": "Alto brilho",
    }[finish] || finish;

  const today = new Date().toLocaleDateString("pt-BR");

  const text = [
    "DOCUMENTO DE REQUISITOS - MÓVEL SOB MEDIDA",
    "--------------------------------------------",
    `Data do pedido: ${today}`,
    "",
    "DADOS DO CLIENTE",
    `Nome: ${clientName}`,
    clientPhone ? `Telefone/WhatsApp: ${clientPhone}` : "",
    clientAddress ? `Endereço: ${clientAddress}` : "",
    "",
    "DADOS DO MÓVEL",
    `Tipo de móvel: ${furnitureType}`,
    `Ambiente: ${roomType}`,
    `Medidas: ${width} cm (L) x ${height} cm (A) x ${depth} cm (P)`,
    `Material: ${materialLabel}`,
    `Acabamento: ${finishLabel}`,
    `Complexidade: ${complexityLabel}`,
    notes ? `Observações do cliente: ${notes}` : "",
    "",
    "VALOR DE REFERÊNCIA",
    `Valor estimado (aproximado): ${estimateFormatted}`,
    "",
    "OBSERVAÇÕES IMPORTANTES",
    "- O valor apresentado é uma referência aproximada, podendo variar conforme detalhes de execução,",
    "  ferragens utilizadas, prazos, condições de pagamento e visita técnica.",
    "- O orçamento final deverá ser confirmado diretamente com o marceneiro.",
  ]
    .filter(Boolean)
    .join("\n");

  lastRequirementsText = text;

  const summaryCard = document.getElementById("summaryCard");
  if (summaryCard) {
    summaryCard.classList.remove("summary-empty");
    summaryCard.textContent = text;
  }

  const btnDownloadTxt = document.getElementById("btnDownloadTxt");
  const btnSendWhatsApp = document.getElementById("btnSendWhatsApp");
  if (btnDownloadTxt) btnDownloadTxt.disabled = false;
  if (btnSendWhatsApp) btnSendWhatsApp.disabled = false;

  const summarySection = document.getElementById("summary");
  if (summarySection) {
    summarySection.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function downloadRequirementsTxt() {
  if (!lastRequirementsText) return;

  const blob = new Blob([lastRequirementsText], {
    type: "text/plain;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "requisitos-movel-sob-medida.txt";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}

/* --------------------------------
 * WhatsApp
 * --------------------------------*/
function sendToWhatsApp() {
  if (!lastRequirementsText) {
    alert("Gere primeiro o resumo do pedido.");
    return;
  }

  const clientName = document.getElementById("clientName")?.value.trim();
  const clientAddress = document.getElementById("clientAddress")?.value.trim();

  const baseMessage = [
    `Olá, meu nome é ${clientName || "cliente"}.`,
    "",
    "Tenho interesse neste móvel sob medida:",
    "",
    lastRequirementsText,
    "",
    "Endereço para referência:",
    clientAddress || "(não informado)",
    "",
    "Gostaria de confirmar o orçamento e alinhar os detalhes. 🙂",
  ]
    .filter(Boolean)
    .join("\n");

  const encoded = encodeURIComponent(baseMessage);

  if (!WHATSAPP_PHONE || WHATSAPP_PHONE.length < 10) {
    alert("Número de WhatsApp do marceneiro não configurado no sistema.");
    return;
  }

  const url = `https://wa.me/${WHATSAPP_PHONE}?text=${encoded}`;
  window.open(url, "_blank");
}

/* --------------------------------
 * Fullscreen
 * --------------------------------*/
function initFullscreenFeature() {
  const btn = document.getElementById("btnToggleFullscreen");
  const container = document.getElementById("preview3d");
  if (!btn || !container) return;

  btn.addEventListener("click", () => {
    if (!document.fullscreenElement) {
      if (container.requestFullscreen) container.requestFullscreen();
    } else if (document.fullscreenElement === container) {
      if (document.exitFullscreen) document.exitFullscreen();
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  });

  document.addEventListener("fullscreenchange", () => {
    const isFull = document.fullscreenElement === container;
    btn.textContent = isFull ? "Sair da tela cheia" : "Tela cheia";
    onWindowResize3D();
  });
}
