/**
 * PaperManager - Manages all Paper.js organic vector and liquid animations.
 */
class PaperManager {
    constructor() {
        this.bgCanvas = document.getElementById('liquid-bg-canvas');
        this.bannerBg = document.getElementById('banner-liquid');
        this.preloaderCanvas = document.getElementById('preloader-canvas');
        
        this.blobs = [];
        this.mousePos = { x: 0, y: 0 };
        this.targetMousePos = { x: 0, y: 0 };
        
        // Initialize mouse pos to center
        this.mousePos.x = window.innerWidth / 2;
        this.mousePos.y = window.innerHeight / 2;
        this.targetMousePos.x = this.mousePos.x;
        this.targetMousePos.y = this.mousePos.y;
        
        this.init();
    }

    init() {
        // Load Paper.js in global scope on canvases
        paper.install(window);
        
        // 1. Setup Background Canvas
        if (this.bgCanvas) {
            paper.setup(this.bgCanvas);
            this.createBackgroundBlobs();
            this.createCursorTrail();
            
            // Mouse Move Event Listener
            window.addEventListener('mousemove', (e) => {
                this.targetMousePos.x = e.clientX;
                this.targetMousePos.y = e.clientY;
            });
            
            // Window resize handler
            window.addEventListener('resize', () => {
                this.resizeCanvas();
            });
        }
        
        // 2. Setup Preloader Canvas (Simple morphing milk drop/blob)
        if (this.preloaderCanvas) {
            this.initPreloaderBlob();
        }
        
        // Hook into paper view render loop
        paper.view.onFrame = (event) => {
            this.animate(event);
        };
    }
    
    resizeCanvas() {
        if (paper.view) {
            paper.view.viewSize = new paper.Size(window.innerWidth, window.innerHeight);
        }
    }

    createBackgroundBlobs() {
        // Create 2 large morphing background blobs
        const count = 2;
        const colors = [
            new paper.Color('rgba(42, 108, 184, 0.05)'),   // Soft Blue
            new paper.Color('rgba(201, 147, 36, 0.03)'),   // Soft Gold
        ];
        
        const sizes = [
            Math.min(window.innerWidth, window.innerHeight) * 0.45,
            Math.min(window.innerWidth, window.innerHeight) * 0.35
        ];

        for (let i = 0; i < count; i++) {
            const center = new paper.Point(
                window.innerWidth * (i === 0 ? 0.2 : 0.8),
                window.innerHeight * (i === 0 ? 0.3 : 0.7)
            );
            
            const numPoints = 8;
            const radius = sizes[i];
            const path = new paper.Path();
            path.fillColor = colors[i];
            path.closed = true;
            
            // Create points in circle
            for (let j = 0; j < numPoints; j++) {
                const delta = (j / numPoints) * Math.PI * 2;
                const point = new paper.Point(
                    center.x + Math.cos(delta) * radius,
                    center.y + Math.sin(delta) * radius
                );
                path.add(point);
            }
            
            path.smooth({ type: 'catmull-rom' });
            
            // Store original coordinates
            const originalPoints = [];
            for (let j = 0; j < numPoints; j++) {
                originalPoints.push(path.segments[j].point.clone());
            }
            
            this.blobs.push({
                path: path,
                center: center,
                radius: radius,
                originalPoints: originalPoints,
                numPoints: numPoints,
                speedMultiplier: i === 0 ? 1.0 : 0.7,
                phase: i * Math.PI
            });
        }
    }
    
    createCursorTrail() {
        // Milk Drip Cursor Trail
        this.trailPoints = 12;
        this.trailPath = new paper.Path({
            strokeColor: 'rgba(255, 255, 255, 0.7)',
            strokeWidth: 10,
            strokeCap: 'round',
            strokeJoin: 'round',
            closed: false
        });
        
        // Hide outline, we can fill it or draw liquid circles instead
        this.trailPath.visible = false; 
        
        // We will create individual dripping circles that fade out
        this.milkDrops = [];
    }

    initPreloaderBlob() {
        // Make sure preloader canvas matches its parent element size
        const parent = this.preloaderCanvas.parentElement;
        this.preloaderCanvas.width = parent.clientWidth;
        this.preloaderCanvas.height = parent.clientHeight;
        
        // Create context
        const ctx = this.preloaderCanvas.getContext('2d');
        if (!ctx) return;
        
        this.preloaderBlob = {
            ctx: ctx,
            width: parent.clientWidth,
            height: parent.clientHeight,
            points: [],
            numPoints: 10,
            radius: 120,
            centerX: parent.clientWidth / 2,
            centerY: parent.clientHeight / 2 - 40,
            morphSpeed: 0.05,
            phase: 0
        };
        
        // Initialize points
        for (let i = 0; i < this.preloaderBlob.numPoints; i++) {
            const angle = (i / this.preloaderBlob.numPoints) * Math.PI * 2;
            this.preloaderBlob.points.push({
                angle: angle,
                baseRadius: this.preloaderBlob.radius,
                currentRadius: this.preloaderBlob.radius,
                offset: Math.random() * 100
            });
        }
    }

    // Custom animation for HTML5 2D canvas preloader (drawn manually in loop)
    drawPreloader(time) {
        if (!this.preloaderBlob) return;
        
        const b = this.preloaderBlob;
        const ctx = b.ctx;
        
        ctx.clearRect(0, 0, b.width, b.height);
        
        // Draw organic morphing white shape (milk splash background)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.beginPath();
        
        b.phase += b.morphSpeed;
        
        const renderPoints = [];
        for (let i = 0; i < b.numPoints; i++) {
            const p = b.points[i];
            const wave = Math.sin(b.phase + p.offset) * 15;
            const r = p.baseRadius + wave;
            
            const x = b.centerX + Math.cos(p.angle) * r;
            const y = b.centerY + Math.sin(p.angle) * r;
            renderPoints.push({ x: x, y: y });
        }
        
        // Draw curve through points
        ctx.moveTo(renderPoints[0].x, renderPoints[0].y);
        for (let i = 0; i < b.numPoints; i++) {
            const nextIdx = (i + 1) % b.numPoints;
            const xc = (renderPoints[i].x + renderPoints[nextIdx].x) / 2;
            const yc = (renderPoints[i].y + renderPoints[nextIdx].y) / 2;
            ctx.quadraticCurveTo(renderPoints[i].x, renderPoints[i].y, xc, yc);
        }
        ctx.closePath();
        ctx.fill();
    }

    animate(event) {
        const time = event.time;
        
        // 1. Draw Preloader manual blob
        if (this.preloaderCanvas && this.preloaderCanvas.parentElement.style.display !== 'none') {
            this.drawPreloader(time);
        }
        
        // 2. Animate Background Blobs (reacting to mouse & time)
        // Interpolate mouse position for smooth lagging trail
        this.mousePos.x += (this.targetMousePos.x - this.mousePos.x) * 0.08;
        this.mousePos.y += (this.targetMousePos.y - this.mousePos.y) * 0.08;
        
        this.blobs.forEach((blob) => {
            const path = blob.path;
            
            for (let i = 0; i < blob.numPoints; i++) {
                const segment = path.segments[i];
                const originalPoint = blob.originalPoints[i];
                const angle = (i / blob.numPoints) * Math.PI * 2;
                
                // Slow organic ripple
                const speed = time * 1.5 * blob.speedMultiplier;
                const ripple = Math.sin(speed + i * 1.2 + blob.phase) * 15;
                const noise = Math.cos(speed * 0.8 + i * 0.7) * 10;
                
                // Vector towards mouse
                const mousePoint = new paper.Point(this.mousePos.x, this.mousePos.y);
                const distance = originalPoint.getDistance(mousePoint);
                let pushX = 0;
                let pushY = 0;
                
                // Push/Pull reaction when close
                if (distance < 250) {
                    const factor = (250 - distance) / 250;
                    const force = factor * 40; // max push
                    const direction = originalPoint.subtract(mousePoint).normalize();
                    pushX = direction.x * force;
                    pushY = direction.y * force;
                }
                
                segment.point.x = originalPoint.x + Math.cos(angle) * ripple + pushX;
                segment.point.y = originalPoint.y + Math.sin(angle) * noise + pushY;
            }
            path.smooth({ type: 'catmull-rom' });
        });
        
        // 3. Render Cursor Liquid drops
        // Every frame, if mouse is moving fast, spawn a milk drop
        const dx = this.targetMousePos.x - this.mousePos.x;
        const dy = this.targetMousePos.y - this.mousePos.y;
        const speed = Math.sqrt(dx * dx + dy * dy);
        
        if (speed > 8 && Math.random() < 0.3) {
            // Spawn milk drop
            const drop = new paper.Path.Circle({
                center: new paper.Point(this.targetMousePos.x, this.targetMousePos.y),
                radius: Math.random() * 4 + 2,
                fillColor: 'rgba(255, 255, 255, 0.45)',
                strokeColor: 'rgba(42, 108, 184, 0.1)',
                strokeWidth: 1
            });
            
            this.milkDrops.push({
                path: drop,
                velocity: new paper.Point(
                    (Math.random() - 0.5) * 2 - (dx * 0.05),
                    Math.random() * 2 + 1 + (dy * 0.05) // Drips down
                ),
                alpha: 1.0,
                scaleSpeed: 0.96
            });
        }
        
        // Update milk drops
        for (let i = this.milkDrops.length - 1; i >= 0; i--) {
            const drop = this.milkDrops[i];
            drop.path.position = drop.path.position.add(drop.velocity);
            
            // Gravity effect
            drop.velocity.y += 0.05;
            
            // Fade out
            drop.alpha -= 0.015;
            drop.path.scale(drop.scaleSpeed);
            drop.path.opacity = drop.alpha;
            
            if (drop.alpha <= 0 || drop.path.bounds.width < 0.1) {
                drop.path.remove();
                this.milkDrops.splice(i, 1);
            }
        }
    }
}

// Make globally available
window.PaperManager = PaperManager;
