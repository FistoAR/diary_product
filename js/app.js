/**
 * App - Main coordinator for the website. Handles loading assets, initializing
 * paper/three engines, triggering page scroll animations, and UI event listeners.
 */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Lucide Icons
    if (window.lucide) {
        window.lucide.createIcons();
    }
    
    // 2. Class Instance References
    let paperManager = null;
    let threeManager = null;
    
    // 3. Cart State
    let cartCount = 0;
    const cartBtnSpan = document.querySelector('.cart-btn span');
    
    // 4. Asset Preloading System
    const preloader = document.getElementById('preloader');
    const progressEl = document.getElementById('loader-progress');
    const percentEl = document.getElementById('loader-percentage');
    
    const assetsToLoad = [];
    let loadedCount = 0;
    
    // Find all images and videos to preload
    const images = Array.from(document.querySelectorAll('img'));
    const videos = Array.from(document.querySelectorAll('video'));
    
    images.forEach(img => {
        if (img.src) assetsToLoad.push({ type: 'image', url: img.src, element: img });
    });
    
    // Preload milk pouring animation frames
    for (let i = 2; i <= 9; i++) {
        const frameUrl = `assets/Frames/section2/frame_00${i}.webp`;
        assetsToLoad.push({ type: 'image', url: frameUrl });
    }
    
    videos.forEach(vid => {
        if (vid.src || vid.querySelector('source')) {
            const src = vid.src || vid.querySelector('source').src;
            assetsToLoad.push({ type: 'video', url: src, element: vid });
        }
    });
    
    const totalAssets = assetsToLoad.length;
    
    function updateProgress() {
        loadedCount++;
        const percentage = totalAssets > 0 ? Math.round((loadedCount / totalAssets) * 100) : 100;
        
        // Update loader DOM
        if (progressEl) progressEl.style.width = percentage + '%';
        if (percentEl) percentEl.textContent = percentage + '%';
        
        if (loadedCount >= totalAssets) {
            setTimeout(revealSite, 800); // Small buffer for visual polish
        }
    }
    
    // Preloader fallback in case of loading issues
    const loadingFallback = setTimeout(() => {
        if (preloader && preloader.style.display !== 'none') {
            console.warn('Loading timed out. Proceeding to reveal.');
            revealSite();
        }
    }, 10000); // 10 seconds max loading wait
    
    if (totalAssets === 0) {
        updateProgress();
    } else {
        assetsToLoad.forEach(asset => {
            if (asset.type === 'image') {
                const img = new Image();
                img.onload = updateProgress;
                img.onerror = updateProgress;
                img.src = asset.url;
            } else if (asset.type === 'video') {
                // For videos, check if we can start playing
                asset.element.addEventListener('canplaythrough', updateProgress, { once: true });
                asset.element.addEventListener('error', updateProgress, { once: true });
                // Force load video
                asset.element.load();
            }
        });
    }
    
    // Start Paper preloader custom loop immediately
    if (window.PaperManager) {
        paperManager = new window.PaperManager();
    }
    
    function revealSite() {
        clearTimeout(loadingFallback);
        
        if (!preloader) return;
        
        // Initialize Three.js after preload is complete so WebGL can render smoothly
        if (window.ThreeManager) {
            threeManager = new window.ThreeManager();
        }
        
        // GSAP transition to hide preloader
        const tl = gsap.timeline({
            onComplete: () => {
                preloader.style.display = 'none';
                // Trigger scroll trigger refresh after layout is fully rendered with a small delay
                setTimeout(() => {
                    ScrollTrigger.refresh();
                }, 200);
            }
        });
        
        tl.to('.preloader-content', {
            y: -50,
            opacity: 0,
            duration: 0.6,
            ease: 'power3.in'
        });
        
        tl.to(preloader, {
            opacity: 0,
            duration: 0.8,
            ease: 'power3.inOut'
        }, '-=0.2');
        
        // Animate Hero entrance
        tl.from('.navbar', {
            y: -80,
            opacity: 0,
            duration: 1,
            ease: 'power4.out'
        }, '-=0.4');
        
        tl.from('.hero-content .hero-tagline', {
            x: -30,
            opacity: 0,
            duration: 0.8,
            ease: 'power3.out'
        }, '-=0.6');
        
        tl.from('.hero-content .hero-title', {
            y: 50,
            opacity: 0,
            duration: 1,
            ease: 'power4.out'
        }, '-=0.7');
        
        tl.from('.hero-content .hero-description', {
            y: 30,
            opacity: 0,
            duration: 0.8,
            ease: 'power3.out'
        }, '-=0.8');
        
        tl.from('.hero-content .hero-buttons', {
            y: 20,
            opacity: 0,
            duration: 0.8,
            ease: 'power3.out'
        }, '-=0.8');
        
        tl.from('.hero-video-bg', {
            scale: 1.08,
            opacity: 0,
            duration: 1.5,
            ease: 'power2.out'
        }, '-=1.2');

        tl.from('.hero-product-overlay', {
            y: 35,
            opacity: 0,
            duration: 1.2,
            ease: 'power3.out'
        }, '-=1.0');

        tl.from('.hero-features-bar', {
            y: 40,
            opacity: 0,
            duration: 1.0,
            ease: 'power3.out'
        }, '-=0.8');
    }
    
    // 5. Scroll and Sticky Nav Logic
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
    
    // 6. GSAP Page Reveals (ScrollTrigger)
    gsap.registerPlugin(ScrollTrigger);
    
    // Milk Pouring Scroll Frame Animation
    const pourFrame = document.getElementById('pour-frame');
    if (pourFrame) {
        const frameObj = { frame: 1 };
        
        const pourTimeline = gsap.timeline({
            scrollTrigger: {
                trigger: '#milk-pour',
                start: 'top top',
                end: 'bottom bottom',
                scrub: 0.5,
                pin: '.milk-pour-wrapper',
                invalidateOnRefresh: true,
            }
        });
        
        // 1. Play frames 1 to 3 in first 50% (first 100vh) - keeps yPercent at 0 (jar view)
        pourTimeline.to(frameObj, {
            frame: 3,
            roundProps: 'frame',
            ease: 'none',
            duration: 1.0,
            onUpdate: () => {
                const f = Math.round(frameObj.frame);
                pourFrame.src = `assets/Frames/section2/frame_00${f}.webp`;
            }
        }, 0);
        
        // 2. Play frames 3 to 9 in second 50% (second 100vh)
        pourTimeline.to(frameObj, {
            frame: 9,
            roundProps: 'frame',
            ease: 'none',
            duration: 1.0,
            onUpdate: () => {
                const f = Math.round(frameObj.frame);
                pourFrame.src = `assets/Frames/section2/frame_00${f}.webp`;
            }
        }, 1.0);
        
        // 3. Pan the 200vh image 100vh upwards slowly over the entire scroll duration (reveal tumbler)
        pourTimeline.to(pourFrame, {
            yPercent: -50,
            ease: 'none',
            duration: 2.0
        }, 0);
        
        // 4. Subtle camera zoom on frame image over scroll
        pourTimeline.fromTo(pourFrame,
            { scale: 1.0 },
            { scale: 1.06, ease: 'none', duration: 2.0 },
            0
        );
        
        // 4. Text Overlays Timeline Animations (synchronized with frames)
        // Header starts visible (opacity: 1) and fades out by time 0.4 (scroll 20%)
        pourTimeline.fromTo('.pour-header', 
            { opacity: 1, y: 0 }, 
            { opacity: 0, y: -20, duration: 0.4, ease: 'power2.inOut' }, 
            0
        );
        
        // Point 1 fades in from 0.3 to 0.6, holds, then fades out from 0.8 to 1.0
        pourTimeline.fromTo('#pour-point-1', 
            { opacity: 0, y: 30 }, 
            { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }, 
            0.3
        );
        pourTimeline.to('#pour-point-1', 
            { opacity: 0, y: -30, duration: 0.2, ease: 'power2.in' }, 
            0.8
        );
        
        // Point 2 fades in from 0.9 to 1.2, holds, then fades out from 1.4 to 1.6
        pourTimeline.fromTo('#pour-point-2', 
            { opacity: 0, y: 30 }, 
            { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }, 
            0.9
        );
        pourTimeline.to('#pour-point-2', 
            { opacity: 0, y: -30, duration: 0.2, ease: 'power2.in' }, 
            1.4
        );
        
        // Point 3 fades in from 1.3 to 1.6, holds, then fades out from 1.7 to 1.85
        pourTimeline.fromTo('#pour-point-3', 
            { opacity: 0, y: 30 }, 
            { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }, 
            1.3
        );
        pourTimeline.to('#pour-point-3', 
            { opacity: 0, y: -30, duration: 0.15, ease: 'power2.in' }, 
            1.7
        );
        
        // Bottom Features fade in from 1.75 to 2.0 and stay visible
        pourTimeline.fromTo('#pour-bottom-features', 
            { opacity: 0, y: 35 }, 
            { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out' }, 
            1.75
        );
    }
    
    // About Section reveal
    gsap.from('.about-visuals', {
        x: -80,
        opacity: 0,
        duration: 1.2,
        ease: 'power3.out',
        scrollTrigger: {
            trigger: '.about-section',
            start: 'top 75%',
            end: 'top 40%',
            scrub: false,
            toggleActions: 'play none none reverse'
        }
    });
    
    gsap.from('.about-content', {
        x: 80,
        opacity: 0,
        duration: 1.2,
        ease: 'power3.out',
        scrollTrigger: {
            trigger: '.about-section',
            start: 'top 75%',
            end: 'top 40%',
            scrub: false,
            toggleActions: 'play none none reverse'
        }
    });
    
    // Products Grid Stagger Reveal
    gsap.from('.product-card', {
        y: 60,
        opacity: 0,
        scale: 0.95,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power3.out',
        scrollTrigger: {
            trigger: '.products-section',
            start: 'top 85%',
            toggleActions: 'play none none reverse'
        }
    });
    
    // Horizontal Gallery Slider Scroll
    const gallerySlider = document.getElementById('gallery-slider');
    if (gallerySlider) {
        gsap.to(gallerySlider, {
            x: () => -(gallerySlider.scrollWidth - window.innerWidth + 100),
            ease: 'none',
            scrollTrigger: {
                trigger: '#gallery',
                start: 'top top',
                end: () => '+=' + (gallerySlider.scrollWidth - window.innerWidth + 200),
                scrub: 1.0,
                pin: true,
                invalidateOnRefresh: true,
                anticipatePin: 1
            }
        });
    }
    
    // Contact Info & Form Reveal
    gsap.from('.contact-info', {
        x: -50,
        opacity: 0,
        duration: 1.0,
        ease: 'power3.out',
        scrollTrigger: {
            trigger: '.contact-section',
            start: 'top 75%',
            toggleActions: 'play none none reverse'
        }
    });
    
    gsap.from('.contact-form-container', {
        x: 50,
        opacity: 0,
        duration: 1.0,
        ease: 'power3.out',
        scrollTrigger: {
            trigger: '.contact-section',
            start: 'top 75%',
            toggleActions: 'play none none reverse'
        }
    });
    
    // 7. Interactive Magnetic Buttons Effect
    const magneticBtns = document.querySelectorAll('.magnetic-btn');
    magneticBtns.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - (rect.width / 2);
            const y = e.clientY - rect.top - (rect.height / 2);
            
            gsap.to(btn, {
                x: x * 0.35,
                y: y * 0.35,
                duration: 0.3,
                ease: 'power2.out'
            });
            
            // Move inside text slightly more for depth
            const innerSpan = btn.querySelector('span');
            if (innerSpan) {
                gsap.to(innerSpan, {
                    x: x * 0.15,
                    y: y * 0.15,
                    duration: 0.3,
                    ease: 'power2.out'
                });
            }
        });
        
        btn.addEventListener('mouseleave', () => {
            gsap.to(btn, {
                x: 0,
                y: 0,
                duration: 0.5,
                ease: 'elastic.out(1, 0.3)'
            });
            
            const innerSpan = btn.querySelector('span');
            if (innerSpan) {
                gsap.to(innerSpan, {
                    x: 0,
                    y: 0,
                    duration: 0.5,
                    ease: 'elastic.out(1, 0.3)'
                });
            }
        });
    });
    
    // 8. Video Modal Handlers
    const playVideoTrigger = document.getElementById('play-video-trigger');
    const videoModal = document.getElementById('video-modal');
    const modalVideo = document.getElementById('modal-video');
    const closeModalElements = document.querySelectorAll('#video-modal-close, #video-modal-close-btn');
    
    if (playVideoTrigger && videoModal && modalVideo) {
        playVideoTrigger.addEventListener('click', () => {
            videoModal.classList.add('active');
            modalVideo.play();
        });
        
        closeModalElements.forEach(el => {
            el.addEventListener('click', () => {
                videoModal.classList.remove('active');
                modalVideo.pause();
                modalVideo.currentTime = 0;
            });
        });
    }
    
    // 9. Mobile Navbar Toggle Drawer
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('active');
            
            // Toggle dropdown drawer
            if (navLinks.style.display === 'flex') {
                // Animate close
                gsap.to(navLinks, {
                    y: -50,
                    opacity: 0,
                    duration: 0.3,
                    onComplete: () => {
                        navLinks.style.display = '';
                    }
                });
            } else {
                // Animate open
                navLinks.style.display = 'flex';
                gsap.fromTo(navLinks, 
                    { y: -50, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out' }
                );
            }
        });
        
        // Close menu on link click
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 1024) {
                    menuToggle.classList.remove('active');
                    navLinks.style.display = '';
                }
            });
        });
    }
    
    // 10. Cart Counter & Toast Notification
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-message');
    const buyButtons = document.querySelectorAll('.panel-buy-btn, .btn-add-cart');
    
    buyButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const product = btn.getAttribute('data-product') || 'Item';
            cartCount++;
            
            // Update cart text
            if (cartBtnSpan) {
                cartBtnSpan.textContent = `Cart (${cartCount})`;
            }
            
            // Pop button animation
            gsap.fromTo(btn, 
                { scale: 0.9 },
                { scale: 1, duration: 0.4, ease: 'elastic.out(1.2, 0.4)' }
            );
            
            // Show toast
            if (toast && toastMsg) {
                toastMsg.textContent = `Added ${product} to your cart!`;
                toast.classList.add('show');
                
                // Hide after 3 seconds
                setTimeout(() => {
                    toast.classList.remove('show');
                }, 3000);
            }
        });
    });

    // Refresh ScrollTrigger on window load to ensure all dynamic heights are correctly updated
    window.addEventListener('load', () => {
        setTimeout(() => {
            ScrollTrigger.refresh();
        }, 500);
    });
});
