import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export const InteractiveChessScene: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    // 1. Scene, Camera & Renderer
    const scene = new THREE.Scene();
    const width = currentMount.clientWidth || 500;
    const height = currentMount.clientHeight || 450;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 14, 22);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    currentMount.appendChild(renderer.domElement);

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const goldLight = new THREE.PointLight(0xd4af37, 3.5, 50);
    goldLight.position.set(10, 18, 12);
    goldLight.castShadow = true;
    goldLight.shadow.mapSize.width = 1024;
    goldLight.shadow.mapSize.height = 1024;
    scene.add(goldLight);

    const blueLight = new THREE.PointLight(0x3b82f6, 2.5, 50);
    blueLight.position.set(-12, 10, -10);
    scene.add(blueLight);

    // 3. Chessboard Group
    const boardGroup = new THREE.Group();
    scene.add(boardGroup);

    // Board Base Frame (Dark obsidian wood with gold trim)
    const baseGeo = new THREE.BoxGeometry(14, 0.6, 14);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x0a0e17,
      roughness: 0.3,
      metalness: 0.8,
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = -0.3;
    baseMesh.receiveShadow = true;
    boardGroup.add(baseMesh);

    // Board Rim (Gold)
    const rimGeo = new THREE.BoxGeometry(14.3, 0.2, 14.3);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.2,
      metalness: 0.9,
    });
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    rimMesh.position.y = -0.2;
    boardGroup.add(rimMesh);

    // Squares (8x8)
    const lightSquareMat = new THREE.MeshStandardMaterial({
      color: 0xe2d6b5,
      roughness: 0.4,
      metalness: 0.1,
    });
    const darkSquareMat = new THREE.MeshStandardMaterial({
      color: 0x242e42,
      roughness: 0.5,
      metalness: 0.3,
    });

    const squareSize = 1.5;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const isLight = (r + c) % 2 === 0;
        const squareGeo = new THREE.BoxGeometry(squareSize, 0.05, squareSize);
        const squareMesh = new THREE.Mesh(squareGeo, isLight ? lightSquareMat : darkSquareMat);
        squareMesh.position.set((c - 3.5) * squareSize, 0.05, (r - 3.5) * squareSize);
        squareMesh.receiveShadow = true;
        boardGroup.add(squareMesh);
      }
    }

    // 4. Procedural Chess Pieces
    // Material 1: Polished Gold
    const goldPieceMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.9,
      roughness: 0.15,
    });

    // Material 2: Deep Obsidian Glass
    const obsidianPieceMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.6,
      roughness: 0.2,
    });

    // Helper: Create a stylized chess King / Piece
    const createKingPiece = (mat: THREE.Material, x: number, z: number, scale = 1) => {
      const piece = new THREE.Group();

      // Base
      const bGeo = new THREE.CylinderGeometry(0.55 * scale, 0.65 * scale, 0.35 * scale, 32);
      const bMesh = new THREE.Mesh(bGeo, mat);
      bMesh.position.y = 0.2 * scale;
      bMesh.castShadow = true;
      piece.add(bMesh);

      // Body column
      const cGeo = new THREE.CylinderGeometry(0.3 * scale, 0.5 * scale, 1.8 * scale, 32);
      const cMesh = new THREE.Mesh(cGeo, mat);
      cMesh.position.y = 1.1 * scale;
      cMesh.castShadow = true;
      piece.add(cMesh);

      // Crown collar
      const colGeo = new THREE.TorusGeometry(0.38 * scale, 0.08 * scale, 16, 32);
      const colMesh = new THREE.Mesh(colGeo, mat);
      colMesh.rotation.x = Math.PI / 2;
      colMesh.position.y = 2.0 * scale;
      piece.add(colMesh);

      // Crown head
      const hGeo = new THREE.SphereGeometry(0.35 * scale, 32, 16);
      const hMesh = new THREE.Mesh(hGeo, mat);
      hMesh.position.y = 2.3 * scale;
      hMesh.castShadow = true;
      piece.add(hMesh);

      // Cross on top
      const crossV = new THREE.BoxGeometry(0.08 * scale, 0.35 * scale, 0.08 * scale);
      const crossH = new THREE.BoxGeometry(0.24 * scale, 0.08 * scale, 0.08 * scale);
      const vMesh = new THREE.Mesh(crossV, mat);
      const hCrossMesh = new THREE.Mesh(crossH, mat);
      vMesh.position.y = 2.7 * scale;
      hCrossMesh.position.y = 2.75 * scale;
      piece.add(vMesh);
      piece.add(hCrossMesh);

      piece.position.set(x, 0.08, z);
      return piece;
    };

    // Helper: Stylized Knight Piece
    const createKnightPiece = (mat: THREE.Material, x: number, z: number, scale = 1) => {
      const piece = new THREE.Group();
      // Base
      const bGeo = new THREE.CylinderGeometry(0.5 * scale, 0.6 * scale, 0.35 * scale, 32);
      const bMesh = new THREE.Mesh(bGeo, mat);
      bMesh.position.y = 0.2 * scale;
      bMesh.castShadow = true;
      piece.add(bMesh);

      // Mane & Head
      const headGeo = new THREE.ConeGeometry(0.45 * scale, 1.6 * scale, 16);
      const headMesh = new THREE.Mesh(headGeo, mat);
      headMesh.position.set(0, 1.0 * scale, -0.1 * scale);
      headMesh.rotation.x = 0.25;
      headMesh.castShadow = true;
      piece.add(headMesh);

      // Snout
      const snoutGeo = new THREE.BoxGeometry(0.3 * scale, 0.4 * scale, 0.6 * scale);
      const snoutMesh = new THREE.Mesh(snoutGeo, mat);
      snoutMesh.position.set(0, 1.5 * scale, 0.3 * scale);
      snoutMesh.rotation.x = -0.3;
      piece.add(snoutMesh);

      piece.position.set(x, 0.08, z);
      return piece;
    };

    // Place Highlight Pieces on Board
    const heroKing = createKingPiece(goldPieceMat, 0.75, 0.75, 1.15); // e4 area
    boardGroup.add(heroKing);

    const opponentKing = createKingPiece(obsidianPieceMat, -2.25, -2.25, 1.1);
    boardGroup.add(opponentKing);

    const goldKnight = createKnightPiece(goldPieceMat, 2.25, -0.75, 1.0); // f3 outpost
    boardGroup.add(goldKnight);

    const blackKnight = createKnightPiece(obsidianPieceMat, -0.75, -2.25, 0.95);
    boardGroup.add(blackKnight);

    // 5. Floating Dust / Golden Stardust Particles
    const particleCount = 120;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 30;
      particlePositions[i + 1] = Math.random() * 20;
      particlePositions[i + 2] = (Math.random() - 0.5) * 30;
    }

    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xd4af37,
      size: 0.12,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // 6. Interactive Mouse Tracking
    let targetRotationX = 0.4;
    let targetRotationY = -0.6;
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      const rect = currentMount.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      mouseX = (x / rect.width) * 2 - 1;
      mouseY = -(y / rect.height) * 2 + 1;

      targetRotationY = -0.6 + mouseX * 0.45;
      targetRotationX = 0.4 + mouseY * 0.25;
    };

    window.addEventListener("mousemove", handleMouseMove);

    // 7. Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth board rotation following cursor
      boardGroup.rotation.y += (targetRotationY - boardGroup.rotation.y) * 0.05;
      boardGroup.rotation.x += (targetRotationX - boardGroup.rotation.x) * 0.05;

      // Gentle floating levitation
      boardGroup.position.y = Math.sin(elapsedTime * 1.5) * 0.35;

      // Subtle dynamic float on Hero King
      heroKing.position.y = 0.08 + Math.sin(elapsedTime * 2.5) * 0.1;
      heroKing.rotation.y = elapsedTime * 0.3;

      // Rotate particles slowly
      particles.rotation.y = elapsedTime * 0.03;

      renderer.render(scene, camera);
    };

    animate();

    // 8. Resize Handler
    const handleResize = () => {
      if (!currentMount) return;
      const newWidth = currentMount.clientWidth;
      const newHeight = currentMount.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      if (currentMount.contains(renderer.domElement)) {
        currentMount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-[450px] lg:h-[540px] flex items-center justify-center">
      {/* Glow Halo behind board */}
      <div className="absolute w-[360px] h-[360px] rounded-full bg-gradient-to-tr from-amber-500/15 via-blue-500/10 to-purple-500/10 blur-3xl pointer-events-none" />

      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Interactive Hint */}
      <div className="absolute bottom-2 right-4 px-3 py-1.5 rounded-full bg-black/40 border border-[rgba(245, 242, 235,0.06)] text-xs text-slate-400 backdrop-blur-md flex items-center gap-1.5 pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        Interactive 3D Board &bull; Move mouse to tilt
      </div>
    </div>
  );
};
