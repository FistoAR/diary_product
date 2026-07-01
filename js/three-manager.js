/**
 * ThreeManager - Manages the Three.js 3D scene, procedural models, lighting, and scroll-triggered animations.
 */
class ThreeManager {
    constructor() {
        this.canvas = document.getElementById('three-product-canvas');
        if (!this.canvas) return;

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        
        // Product Groups
        this.milkGroup = null;
        this.yogurtGroup = null;
        this.gheeGroup = null;
        this.mainGroup = null; // Holds all products
        
        // Lighting
        this.lights = {};
        
        // Interaction state
        this.mouse = { x: 0, y: 0 };
        this.targetMouse = { x: 0, y: 0 };
        
        this.init();
    }

    init() {
        // 1. Setup Scene, Camera, and Renderer
        this.scene = new THREE.Scene();
        
        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;
        
        this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
        this.camera.position.set(0, 0, 10);
        
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;

        // Parent group for all meshes
        this.mainGroup = new THREE.Group();
        this.scene.add(this.mainGroup);

        // 2. Setup Lighting
        this.setupLights();
        
        // 3. Build Procedural Products
        this.buildMilkBottle();
        this.buildYogurtTub();
        this.buildGheeJar();
        
        // Position groups initially
        this.milkGroup.position.set(0, -0.6, 0);
        this.yogurtGroup.position.set(4, -0.5, -3);
        this.gheeGroup.position.set(4, -0.5, -3);
        
        // Scale initial state
        this.yogurtGroup.scale.set(0.001, 0.001, 0.001);
        this.gheeGroup.scale.set(0.001, 0.001, 0.001);

        // 4. Setup Events
        window.addEventListener('resize', () => this.onWindowResize());
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        
        // 5. Setup GSAP ScrollTrigger Animations
        this.setupScrollAnimations();
        
        // 6. Start Render Loop
        this.animate();
        
        // Trigger initial resize to fit perfectly
        this.onWindowResize();
    }

    setupLights() {
        // Soft ambient
        this.lights.ambient = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(this.lights.ambient);
        
        // Key light (soft blue-white from top-left)
        this.lights.key = new THREE.DirectionalLight(0xe0f2fe, 1.5);
        this.lights.key.position.set(-5, 8, 5);
        this.scene.add(this.lights.key);
        
        // Fill light (warm golden reflection from right)
        this.lights.fill = new THREE.DirectionalLight(0xfef3c7, 0.8);
        this.lights.fill.position.set(6, 3, 2);
        this.scene.add(this.lights.fill);
        
        // Back light (blue highlight for glass refraction and outlines)
        this.lights.back = new THREE.PointLight(0x2a6cb8, 2.5, 20);
        this.lights.back.position.set(2, -2, -4);
        this.scene.add(this.lights.back);
        
        // Studio rim light
        this.lights.rim = new THREE.PointLight(0xffffff, 1.2, 10);
        this.lights.rim.position.set(0, 5, -2);
        this.scene.add(this.lights.rim);
    }

    // Helper: Dynamic Label Canvas Texture
    createLabelTexture(options) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        // Background fill
        ctx.fillStyle = options.bgColor || '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Border bands
        ctx.fillStyle = options.accentColor || '#2a6cb8';
        ctx.fillRect(0, 0, canvas.width, 10);
        ctx.fillRect(0, canvas.height - 10, canvas.width, 10);
        
        // Sub border band
        ctx.fillStyle = options.accentColor || '#2a6cb8';
        ctx.fillRect(0, 20, canvas.width, 2);
        ctx.fillRect(0, canvas.height - 22, canvas.width, 2);
        
        // Logo details
        ctx.fillStyle = options.accentColor || '#2a6cb8';
        ctx.font = 'bold 16px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.letterSpacing = '4px';
        ctx.fillText('BORCELLE DAIRY', canvas.width / 2, 45);
        
        // Main Title
        ctx.fillStyle = '#0a2540';
        ctx.font = 'bold 32px Playfair Display, serif';
        ctx.fillText(options.title || 'FRESH MILK', canvas.width / 2, 105);
        
        // Subtitle
        ctx.fillStyle = options.textColor || '#64748b';
        ctx.font = '16px Outfit, sans-serif';
        ctx.fillText(options.subtitle || '100% Organic • Grass Fed', canvas.width / 2, 135);
        
        // Decorative Cow SVG Outline or simple drawing
        ctx.strokeStyle = options.accentColor || '#2a6cb8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        // Simple artistic abstract mountain/field curve
        ctx.moveTo(150, 190);
        ctx.bezierCurveTo(200, 160, 312, 160, 362, 190);
        ctx.stroke();
        
        ctx.fillStyle = options.accentColor || '#2a6cb8';
        ctx.font = 'bold 12px Outfit, sans-serif';
        ctx.fillText('PASTURE FRESH', canvas.width / 2, 210);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.repeat.x = 1.0;
        return texture;
    }

    buildMilkBottle() {
        this.milkGroup = new THREE.Group();
        this.mainGroup.add(this.milkGroup);

        // Glass bottle profile using Lathe
        const bottlePoints = [];
        // Base width to height
        bottlePoints.push(new THREE.Vector2(0, 0));
        bottlePoints.push(new THREE.Vector2(1.1, 0));
        bottlePoints.push(new THREE.Vector2(1.15, 0.15));
        bottlePoints.push(new THREE.Vector2(1.15, 2.5));
        bottlePoints.push(new THREE.Vector2(0.55, 3.8));
        bottlePoints.push(new THREE.Vector2(0.55, 4.4));
        bottlePoints.push(new THREE.Vector2(0.62, 4.5));
        bottlePoints.push(new THREE.Vector2(0.62, 4.65));
        bottlePoints.push(new THREE.Vector2(0.0, 4.65));

        const bottleGeometry = new THREE.LatheGeometry(bottlePoints, 32);
        
        // Outer bottle Glass material
        const glassMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.6,
            transmission: 0.9,
            roughness: 0.05,
            metalness: 0.05,
            ior: 1.5,
            thickness: 0.15,
            side: THREE.DoubleSide
        });
        
        const bottleMesh = new THREE.Mesh(bottleGeometry, glassMaterial);
        bottleMesh.castShadow = true;
        bottleMesh.receiveShadow = true;
        this.milkGroup.add(bottleMesh);

        // Inside Milk geometry (slightly smaller)
        const milkPoints = [];
        milkPoints.push(new THREE.Vector2(0, 0.05));
        milkPoints.push(new THREE.Vector2(1.08, 0.05));
        milkPoints.push(new THREE.Vector2(1.08, 2.45));
        milkPoints.push(new THREE.Vector2(0.52, 3.75));
        milkPoints.push(new THREE.Vector2(0, 3.75));

        const milkGeometry = new THREE.LatheGeometry(milkPoints, 32);
        const milkMaterial = new THREE.MeshStandardMaterial({
            color: 0xfbf9f4, // Cream milk white
            roughness: 0.5,
            metalness: 0.0
        });
        const milkMesh = new THREE.Mesh(milkGeometry, milkMaterial);
        this.milkGroup.add(milkMesh);

        // Label Panel (Cylinder wrapped around body)
        const labelGeom = new THREE.CylinderGeometry(1.16, 1.16, 1.2, 32, 1, true);
        const labelTex = this.createLabelTexture({
            title: 'PURE MILK',
            subtitle: '100% Fresh • Grass Fed',
            bgColor: '#ffffff',
            accentColor: '#2a6cb8'
        });
        const labelMat = new THREE.MeshStandardMaterial({
            map: labelTex,
            roughness: 0.4,
            side: THREE.DoubleSide
        });
        const labelMesh = new THREE.Mesh(labelGeom, labelMat);
        labelMesh.position.y = 1.25;
        // Rotate so logo faces camera
        labelMesh.rotation.y = -Math.PI / 2;
        this.milkGroup.add(labelMesh);

        // Cap (metallic cap)
        const capGeom = new THREE.CylinderGeometry(0.64, 0.64, 0.25, 32);
        const capMat = new THREE.MeshStandardMaterial({
            color: 0x2a6cb8,
            metalness: 0.8,
            roughness: 0.2
        });
        const capMesh = new THREE.Mesh(capGeom, capMat);
        capMesh.position.y = 4.75;
        this.milkGroup.add(capMesh);
    }

    buildYogurtTub() {
        this.yogurtGroup = new THREE.Group();
        this.mainGroup.add(this.yogurtGroup);

        // Tapered Tub Geometry
        const tubGeom = new THREE.CylinderGeometry(1.2, 0.9, 1.8, 32, 1, false);
        
        // Yogurt Label Texture
        const labelTex = this.createLabelTexture({
            title: 'GREEK YOGURT',
            subtitle: 'Creamy Probiotics • Sugar Free',
            bgColor: '#fcfaf5',
            accentColor: '#7b4b9b' // Purple yogurt theme
        });

        // Glossy White Plastic Material for Tub
        const tubMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.1,
            metalness: 0.0,
            map: labelTex
        });
        
        const tubMesh = new THREE.Mesh(tubGeom, tubMat);
        tubMesh.castShadow = true;
        tubMesh.receiveShadow = true;
        // Rotate texture to face camera
        tubMesh.rotation.y = -Math.PI / 2;
        this.yogurtGroup.add(tubMesh);

        // Foil Lid (thin flat cylinder at the top)
        const lidGeom = new THREE.CylinderGeometry(1.26, 1.26, 0.08, 32);
        const lidMat = new THREE.MeshStandardMaterial({
            color: 0x7b4b9b, // Purple theme
            metalness: 0.9,
            roughness: 0.15
        });
        const lidMesh = new THREE.Mesh(lidGeom, lidMat);
        lidMesh.position.y = 0.94;
        this.yogurtGroup.add(lidMesh);
        
        // Lid rim lip
        const rimGeom = new THREE.TorusGeometry(1.25, 0.04, 8, 32);
        const rimMesh = new THREE.Mesh(rimGeom, lidMat);
        rimMesh.rotation.x = Math.PI / 2;
        rimMesh.position.y = 0.9;
        this.yogurtGroup.add(rimMesh);
    }

    buildGheeJar() {
        this.gheeGroup = new THREE.Group();
        this.mainGroup.add(this.gheeGroup);

        // Ghee Glass Jar Profile
        const jarPoints = [];
        jarPoints.push(new THREE.Vector2(0, 0));
        jarPoints.push(new THREE.Vector2(1.2, 0));
        jarPoints.push(new THREE.Vector2(1.25, 0.15));
        jarPoints.push(new THREE.Vector2(1.25, 1.8));
        jarPoints.push(new THREE.Vector2(0.95, 2.1));
        jarPoints.push(new THREE.Vector2(0.95, 2.25));
        jarPoints.push(new THREE.Vector2(0, 2.25));

        const jarGeometry = new THREE.LatheGeometry(jarPoints, 32);
        const jarMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.5,
            transmission: 0.9,
            roughness: 0.08,
            metalness: 0.1,
            ior: 1.5,
            thickness: 0.12,
            side: THREE.DoubleSide
        });
        const jarMesh = new THREE.Mesh(jarGeometry, jarMaterial);
        jarMesh.castShadow = true;
        jarMesh.receiveShadow = true;
        this.gheeGroup.add(jarMesh);

        // Inner Ghee Liquid (Golden Semi-Translucent)
        const liquidPoints = [];
        liquidPoints.push(new THREE.Vector2(0, 0.05));
        liquidPoints.push(new THREE.Vector2(1.18, 0.05));
        liquidPoints.push(new THREE.Vector2(1.18, 1.75));
        liquidPoints.push(new THREE.Vector2(0.92, 1.95));
        liquidPoints.push(new THREE.Vector2(0, 1.95));

        const liquidGeometry = new THREE.LatheGeometry(liquidPoints, 32);
        const liquidMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xffcc22, // Rich Ghee yellow gold
            roughness: 0.15,
            metalness: 0.1,
            transmission: 0.7,
            thickness: 0.4,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1
        });
        const liquidMesh = new THREE.Mesh(liquidGeometry, liquidMaterial);
        this.gheeGroup.add(liquidMesh);

        // Golden Metal Lid
        const lidGeom = new THREE.CylinderGeometry(1.0, 1.0, 0.25, 32);
        const lidMat = new THREE.MeshStandardMaterial({
            color: 0xc99324, // Warm gold
            metalness: 0.95,
            roughness: 0.1
        });
        const lidMesh = new THREE.Mesh(lidGeom, lidMat);
        lidMesh.position.y = 2.35;
        this.gheeGroup.add(lidMesh);

        // Label wrapped around body
        const labelGeom = new THREE.CylinderGeometry(1.26, 1.26, 0.8, 32, 1, true);
        const labelTex = this.createLabelTexture({
            title: 'PURE GHEE',
            subtitle: 'Slow-Cooked Clarified Butter',
            bgColor: '#fffcf6',
            accentColor: '#c99324' // Gold theme
        });
        const labelMat = new THREE.MeshStandardMaterial({
            map: labelTex,
            roughness: 0.35,
            side: THREE.DoubleSide
        });
        const labelMesh = new THREE.Mesh(labelGeom, labelMat);
        labelMesh.position.y = 0.9;
        labelMesh.rotation.y = -Math.PI / 2;
        this.gheeGroup.add(labelMesh);
    }

    setupScrollAnimations() {
        // Register ScrollTrigger with GSAP
        gsap.registerPlugin(ScrollTrigger);
        
        // Pinned timeline for the product scroll section
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: '#product-scroll',
                start: 'top top',
                end: 'bottom bottom',
                scrub: 1.2,
                pin: '.scroll-canvas-container',
                invalidateOnRefresh: true
            }
        });

        // 1. Initial State: Milk Bottle in view
        // 2. Animate: Milk Bottle exits, Yogurt Tub enters
        tl.to(this.milkGroup.position, {
            x: -4,
            y: 2,
            z: -4,
            ease: 'power2.inOut'
        }, 'milk-to-yogurt');
        
        tl.to(this.milkGroup.rotation, {
            y: Math.PI * 1.5,
            z: -0.4,
            ease: 'power2.inOut'
        }, 'milk-to-yogurt');
        
        tl.to(this.milkGroup.scale, {
            x: 0.001,
            y: 0.001,
            z: 0.001,
            ease: 'power2.inOut'
        }, 'milk-to-yogurt');

        // Yogurt Tub moves to center
        tl.fromTo(this.yogurtGroup.scale, 
            { x: 0.001, y: 0.001, z: 0.001 },
            { x: 1.4, y: 1.4, z: 1.4, ease: 'power2.inOut' }, 
            'milk-to-yogurt'
        );
        tl.fromTo(this.yogurtGroup.position,
            { x: 4, y: -2, z: -3 },
            { x: 0, y: -0.4, z: 0, ease: 'power2.inOut' },
            'milk-to-yogurt'
        );
        tl.fromTo(this.yogurtGroup.rotation,
            { x: 0.2, y: 0, z: -0.2 },
            { x: 0, y: Math.PI * 2.5, z: 0, ease: 'power2.inOut' },
            'milk-to-yogurt'
        );

        // 3. Animate: Yogurt Tub exits, Ghee Jar enters
        tl.to(this.yogurtGroup.position, {
            x: -4,
            y: 2,
            z: -4,
            ease: 'power2.inOut'
        }, 'yogurt-to-ghee');
        
        tl.to(this.yogurtGroup.rotation, {
            y: Math.PI * 4,
            z: -0.3,
            ease: 'power2.inOut'
        }, 'yogurt-to-ghee');
        
        tl.to(this.yogurtGroup.scale, {
            x: 0.001,
            y: 0.001,
            z: 0.001,
            ease: 'power2.inOut'
        }, 'yogurt-to-ghee');

        // Ghee Jar moves to center
        tl.fromTo(this.gheeGroup.scale,
            { x: 0.001, y: 0.001, z: 0.001 },
            { x: 1.3, y: 1.3, z: 1.3, ease: 'power2.inOut' },
            'yogurt-to-ghee'
        );
        tl.fromTo(this.gheeGroup.position,
            { x: 4, y: -2, z: -3 },
            { x: 0, y: -0.5, z: 0, ease: 'power2.inOut' },
            'yogurt-to-ghee'
        );
        tl.fromTo(this.gheeGroup.rotation,
            { x: -0.2, y: 0, z: 0.2 },
            { x: 0.1, y: Math.PI * 2, z: 0, ease: 'power2.inOut' },
            'yogurt-to-ghee'
        );
        
        // Extra scroll trigger: change background colors of panels on scroll
        const panels = document.querySelectorAll('.scroll-panel');
        const sections = document.querySelector('.product-scroll-section');
        
        // Transition colors
        const colors = [
            '#ffffff', // milk panel background color
            '#faf5ff', // yogurt panel background color
            '#fffdf5'  // ghee panel background color
        ];
        
        panels.forEach((panel, i) => {
            if (i === 0) return; // Skip first
            
            ScrollTrigger.create({
                trigger: panel,
                start: 'top 50%',
                end: 'bottom 50%',
                onEnter: () => {
                    gsap.to(sections, { backgroundColor: colors[i], duration: 0.8 });
                },
                onLeaveBack: () => {
                    gsap.to(sections, { backgroundColor: colors[i-1], duration: 0.8 });
                }
            });
        });
    }

    onMouseMove(e) {
        // Map mouse coordinates to range [-0.5, 0.5]
        this.targetMouse.x = (e.clientX / window.innerWidth) - 0.5;
        this.targetMouse.y = (e.clientY / window.innerHeight) - 0.5;
    }

    onWindowResize() {
        if (!this.canvas || !this.camera || !this.renderer) return;
        
        const width = this.canvas.parentElement.clientWidth;
        const height = this.canvas.parentElement.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(width, height);
        
        // Adjust model scale & camera position for smaller viewports (mobile responsiveness)
        if (window.innerWidth < 968) {
            this.camera.position.set(0, 0, 8);
            this.mainGroup.scale.set(0.8, 0.8, 0.8);
            this.milkGroup.position.set(0, -0.3, 0);
        } else {
            this.camera.position.set(0, 0, 10);
            this.mainGroup.scale.set(1.0, 1.0, 1.0);
            this.milkGroup.position.set(0, -0.6, 0);
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Smoothly interpolate mouse movement for interactive parallax sway
        this.mouse.x += (this.targetMouse.x - this.mouse.x) * 0.05;
        this.mouse.y += (this.targetMouse.y - this.mouse.y) * 0.05;
        
        // Apply micro-sway to the main group
        this.mainGroup.rotation.y = this.mouse.x * 0.25;
        this.mainGroup.rotation.x = this.mouse.y * 0.15;
        
        // Add a gentle floating animation to the active item in group
        const time = Date.now() * 0.0015;
        const floatY = Math.sin(time) * 0.1;
        
        // Only float the active ones depending on positions
        if (this.milkGroup.scale.x > 0.5) {
            this.milkGroup.position.y = -0.6 + floatY;
            this.milkGroup.rotation.y += 0.005; // slow idle spin
        }
        if (this.yogurtGroup.scale.x > 0.5) {
            this.yogurtGroup.position.y = -0.4 + floatY;
            this.yogurtGroup.rotation.y += 0.005; // slow idle spin
        }
        if (this.gheeGroup.scale.x > 0.5) {
            this.gheeGroup.position.y = -0.5 + floatY;
            this.gheeGroup.rotation.y += 0.005; // slow idle spin
        }
        
        this.renderer.render(this.scene, this.camera);
    }
}

// Make globally available
window.ThreeManager = ThreeManager;
