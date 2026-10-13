/**
 * Portafolio Didáctico - Lógica de Interacción y Renderizado
 * Especialidad en Estudios Sociales y Educación Cívica - MEP Costa Rica
 * 
 * Separa por completo el comportamiento JavaScript de la estructura HTML y estilos CSS.
 */

(function () {
    'use strict';

    // Constantes de configuración de categorías visuales
    const CATEGORIAS = {
        historia: {
            label: '📜 Historia (Profesor)',
            short: 'Historia',
            color: '#f97316',
            badge: 'text-orange-400',
            bgBadge: 'bg-orange-500/10 text-orange-400 border-orange-500/30'
        },
        geografia: {
            label: '🌍 Geografía (Profesor)',
            short: 'Geografía',
            color: '#10b981',
            badge: 'text-emerald-400',
            bgBadge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
        },
        civica: {
            label: '⚖️ Cívica (Profesor)',
            short: 'Cívica',
            color: '#06b6d4',
            badge: 'text-cyan-400',
            bgBadge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
        },
        pares: {
            label: '👥 Transversal (Pares)',
            short: 'Transversal',
            color: '#ec4899',
            badge: 'text-pink-400',
            bgBadge: 'bg-pink-500/10 text-pink-400 border-pink-500/30'
        }
    };

    let currentSlideIndex = 0;
    let currentFilter = 'all';
    let tecnicasData = [];

    /* ==========================================================================
       Utilidades
       ========================================================================== */

    function resolverCategoria(categoriaTexto) {
        const t = (categoriaTexto || '').toLowerCase();
        if (t.includes('historia')) return 'historia';
        if (t.includes('geograf')) return 'geografia';
        if (t.includes('cívica') || t.includes('civica')) return 'civica';
        return 'pares';
    }

    function escapeHTML(str) {
        if (typeof str !== 'string') return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function formatTextWithMarkdown(text) {
        if (!text) return '';
        return escapeHTML(text)
            .replace(/\*([^*]+)\*/g, '<em>$1</em>')
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="underline hover:text-zinc-100">$1</a>');
    }

    /**
     * Sincroniza la carga y detención de reproducción de iframes interactivos
     * (YouTube, Edpuzzle, Educaplay). Solo la diapositiva activa tiene src asignado;
     * las inactivas se descargan a about:blank para cortar audio/video de inmediato.
     * Además gestiona el fundido de entrada (.is-loaded) del marco embebido.
     */
    function syncActiveIframes(containerSelector) {
        const container = document.querySelector(containerSelector);
        if (!container) return;

        const slides = container.querySelectorAll('.carousel-slide');
        slides.forEach(slide => {
            const isActive = slide.classList.contains('active');
            const iframes = slide.querySelectorAll('iframe[data-src]');
            iframes.forEach(iframe => {
                const targetSrc = iframe.getAttribute('data-src');
                const frame = iframe.closest('.embed-frame');
                if (isActive) {
                    if (iframe.getAttribute('src') !== targetSrc) {
                        iframe.setAttribute('src', targetSrc);
                        if (frame) {
                            frame.classList.remove('is-loaded');
                            iframe.addEventListener('load', function onEmbedLoad() {
                                if (iframe.getAttribute('src') === targetSrc) {
                                    frame.classList.add('is-loaded');
                                }
                            }, { once: true });
                            // Red de seguridad: si el evento load nunca llega,
                            // mostrar el iframe de todas formas
                            clearTimeout(iframe._embedFallback);
                            iframe._embedFallback = setTimeout(() => {
                                frame.classList.add('is-loaded');
                            }, 6000);
                        }
                    }
                } else {
                    if (iframe.getAttribute('src') !== 'about:blank') {
                        iframe.setAttribute('src', 'about:blank');
                    }
                    clearTimeout(iframe._embedFallback);
                    if (frame) frame.classList.remove('is-loaded');
                }
            });
        });
    }

    /* ==========================================================================
       Renderizado de Componentes
       ========================================================================== */

    /**
     * Renderiza la retícula de selección rápida (Matriz de 16 técnicas)
     */
    function renderMatriz(tecnicas) {
        const container = document.getElementById('panal-index');
        if (!container) return;
        container.innerHTML = '';

        tecnicas.forEach((t, i) => {
            const catKey = resolverCategoria(t.categoria);
            const catInfo = CATEGORIAS[catKey];

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.dataset.slide = String(i);
            btn.dataset.category = catKey;
            btn.dataset.catkey = catKey;   // ← usado por CSS para hover cromático
            btn.className = 'grid-cell p-3 text-left w-full border border-zinc-900 focus:outline-none';
            btn.setAttribute('aria-label', `Seleccionar técnica ${t.numero}: ${t.nombre}`);

            btn.innerHTML = `
                <div class="flex items-center justify-between">
                    <span class="text-xs font-mono font-bold ${catInfo.badge}">${String(t.numero).padStart(2, '0')}</span>
                    <span class="text-[9px] font-mono uppercase text-zinc-500">${catInfo.short}</span>
                </div>
                <span class="text-[11px] font-bold text-zinc-200 block mt-1.5 leading-snug line-clamp-2">${escapeHTML(t.nombre)}</span>
            `;

            btn.addEventListener('click', () => goToSlide(i, true));
            container.appendChild(btn);
        });
    }

    /**
     * Renderiza los botones de filtrado por categoría temática
     */
    function renderFiltros(tecnicas) {
        const container = document.getElementById('filtros-container');
        if (!container) return;
        container.innerHTML = '';

        const counts = { all: tecnicas.length, historia: 0, geografia: 0, civica: 0, pares: 0 };
        tecnicas.forEach(t => counts[resolverCategoria(t.categoria)]++);

        const filtros = [
            { key: 'all', label: `Todas (${counts.all})` },
            { key: 'historia', label: `Historia (${counts.historia})` },
            { key: 'geografia', label: `Geografía (${counts.geografia})` },
            { key: 'civica', label: `Cívica (${counts.civica})` },
            { key: 'pares', label: `Transversal (${counts.pares})` }
        ];

        filtros.forEach(f => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.id = `filter-${f.key}`;
            btn.dataset.filter = f.key;
            btn.dataset.catkey = f.key;   // ← usado por CSS para el color de categoría
            btn.className = `filter-btn px-4 py-1.5 text-xs font-mono uppercase tracking-wider transition-colors duration-200 ${
                f.key === currentFilter
                    ? 'bg-zinc-100 text-zinc-950 font-bold'
                    : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
            }`;
            btn.textContent = f.label;
            btn.addEventListener('click', () => filterCategory(f.key));
            container.appendChild(btn);
        });
    }

    /**
     * Renderiza las diapositivas detalladas dentro del escenario del carrusel
     */
    function renderSlides(tecnicas) {
        const stage = document.getElementById('carousel-stage');
        if (!stage) return;
        stage.innerHTML = '';

        tecnicas.forEach((t, i) => {
            const catKey = resolverCategoria(t.categoria);
            const catInfo = CATEGORIAS[catKey];
            const color = catInfo.color;

            // Formatear bloque de modelaje didáctico
            const modelaje = t['Modelaje / Ejemplo de aplicación'] || t['Modelaje / Ejemplo de application'] || '';
            let modelajeHTML = '';

            if (modelaje && typeof modelaje === 'object') {
                const items = [];
                if (modelaje.tema) items.push(`<li><strong class="text-zinc-200 font-semibold">Tema:</strong> ${escapeHTML(modelaje.tema)}</li>`);
                if (modelaje.nivel) items.push(`<li><strong class="text-zinc-200 font-semibold">Nivel:</strong> ${escapeHTML(modelaje.nivel)}</li>`);
                if (modelaje.objetivo) items.push(`<li><strong class="text-zinc-200 font-semibold">Objetivo:</strong> ${escapeHTML(modelaje.objetivo)}</li>`);
                if (modelaje.instrucciones) items.push(`<li><strong class="text-zinc-200 font-semibold">Instrucciones:</strong> ${escapeHTML(modelaje.instrucciones)}</li>`);
                if (modelaje.procedimiento) items.push(`<li><strong class="text-zinc-200 font-semibold">Procedimiento:</strong> ${escapeHTML(modelaje.procedimiento)}</li>`);
                if (modelaje.producto_esperado) items.push(`<li><strong class="text-zinc-200 font-semibold">Producto esperado:</strong> ${escapeHTML(modelaje.producto_esperado)}</li>`);
                if (modelaje.evaluación) items.push(`<li><strong class="text-zinc-200 font-semibold">Evaluación:</strong> ${escapeHTML(modelaje.evaluación)}</li>`);

                modelajeHTML = `<ul class="list-disc pl-5 space-y-1.5 text-zinc-300 text-xs sm:text-sm">${items.join('')}</ul>`;
            } else if (typeof modelaje === 'string' && modelaje.trim()) {
                modelajeHTML = `<p class="text-zinc-300 text-xs sm:text-sm whitespace-pre-line leading-relaxed">${escapeHTML(modelaje)}</p>`;
            } else {
                modelajeHTML = `<p class="text-zinc-500 italic text-xs">[Modelaje pedagógico en desarrollo]</p>`;
            }

            // Formatear pasos de aplicación
            let aplicacionHTML = '';
            const aplicacion = t['Aplicación de la técnica'];
            if (Array.isArray(aplicacion)) {
                aplicacionHTML = `
                    <ol class="list-decimal pl-5 space-y-1.5 text-zinc-300 text-xs sm:text-sm">
                        ${aplicacion.map(paso => `<li class="leading-relaxed">${escapeHTML(paso)}</li>`).join('')}
                    </ol>
                `;
            } else if (typeof aplicacion === 'string' && aplicacion.trim()) {
                aplicacionHTML = `<p class="text-zinc-300 text-xs sm:text-sm leading-relaxed">${escapeHTML(aplicacion)}</p>`;
            }

            // Insumo PDF, Video Embed y Evidencia Visual
            const pdfUrl = t['Insumo PDF'] ? encodeURI(t['Insumo PDF']) : null;
            let rawVideoEmbed = t['Video Embed'] || (t['Video YouTube'] ? `<iframe width="560" height="315" src="${t['Video YouTube']}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>` : null);
            const edpuzzleLink = (rawVideoEmbed && rawVideoEmbed.includes('edpuzzle.com/embed/media/')) ? 'https://edpuzzle.com/media/6abf0cfbdd19aa0f5be1e36e' : (t['Enlace Directo'] || null);
            const youtubeDirectLink = (rawVideoEmbed && rawVideoEmbed.includes('youtube.com/embed/WV-7bUgqios')) ? 'https://youtu.be/WV-7bUgqios' : null;
            const directLink = edpuzzleLink || youtubeDirectLink;
            const textoEvidencia = (t['Evidencia visual'] || '').replace(/\[RECORDATORIO DOCENTE:[^\]]*\]/gi, '').trim();

            // Transformar iframe para control activo de reproducción
            const videoEmbedHTML = rawVideoEmbed ? rawVideoEmbed.replace(/<iframe\b([^>]*?)\bsrc=(['"])(.*?)\2/i, '<iframe$1data-src="$3" src="about:blank"') : null;

            const evidenciaVisualHTML = `
                <div class="space-y-3 md:col-span-2 bg-zinc-950 p-5 border border-zinc-800">
                    <div class="flex items-center justify-between flex-wrap gap-2 border-b border-zinc-900 pb-3">
                        <div class="flex items-center space-x-2">
                            <span class="font-mono uppercase tracking-wider text-xs block font-bold" style="color: ${color}">// Evidencia visual e Insumo Didáctico</span>
                            ${pdfUrl ? `<span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono px-2 py-0.5 uppercase">PDF Adjunto</span>` : ''}
                            ${videoEmbedHTML ? `<span class="bg-purple-500/10 text-purple-400 border border-purple-500/30 text-[10px] font-mono px-2 py-0.5 uppercase">▶ Recurso Interactivo</span>` : ''}
                        </div>
                        <div class="flex items-center space-x-2 flex-wrap gap-2">
                            ${pdfUrl ? `
                                <a href="${pdfUrl}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center space-x-1.5 text-xs font-mono text-zinc-200 hover:text-white bg-zinc-900 hover:bg-zinc-800 px-3 py-1.5 border border-zinc-700 transition-colors">
                                    <span>📄 Abrir Insumo PDF en pestaña nueva ↗</span>
                                </a>
                            ` : ''}
                            ${directLink ? `
                                <a href="${directLink}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center space-x-1.5 text-xs font-mono text-purple-300 hover:text-white bg-purple-950/60 hover:bg-purple-900 px-3 py-1.5 border border-purple-700/50 transition-colors">
                                    <span>🔗 ${edpuzzleLink ? 'Abrir Edpuzzle' : 'Abrir Video'} en pestaña nueva ↗</span>
                                </a>
                            ` : ''}
                        </div>
                    </div>

                    ${textoEvidencia ? `
                        <p class="text-zinc-400 text-xs sm:text-sm leading-relaxed italic">
                            ${escapeHTML(textoEvidencia)}
                        </p>
                    ` : ''}

                    ${pdfUrl ? `
                        <div class="w-full mt-3 border border-zinc-800 bg-zinc-900 overflow-hidden shadow-2xl">
                            <iframe src="${pdfUrl}#toolbar=1&navpanes=0" class="w-full h-80 sm:h-[500px] border-0" title="Insumo PDF: ${escapeHTML(t.nombre)}">
                                <div class="p-4 text-xs text-zinc-400">
                                    Tu navegador no soporta vista previa integrada de PDF. 
                                    <a href="${pdfUrl}" target="_blank" class="underline text-zinc-200 font-bold">Haz clic aquí para abrir o descargar el archivo PDF</a>.
                                </div>
                            </iframe>
                        </div>
                    ` : ''}

                    ${videoEmbedHTML ? `
                        <div class="w-full mt-4 border border-zinc-800 bg-zinc-900 overflow-hidden shadow-2xl">
                            <div class="flex items-center justify-between px-4 py-2 border-b border-zinc-800 flex-wrap gap-2">
                                <div class="flex items-center space-x-2">
                                    <span class="text-purple-400 text-sm">▶</span>
                                    <span class="font-mono text-xs text-zinc-400 uppercase tracking-wider">Recurso Audiovisual / Interactivo</span>
                                </div>
                                ${directLink ? `
                                    <a href="${directLink}" target="_blank" rel="noopener noreferrer" class="text-xs font-mono text-purple-400 hover:text-purple-300 underline">
                                        Abrir enlace directo ↗
                                    </a>
                                ` : ''}
                            </div>
                            <div class="embed-frame w-full flex justify-center bg-black p-2 sm:p-4 overflow-hidden responsive-embed">
                                <div class="embed-loading" aria-hidden="true">Cargando video</div>
                                ${videoEmbedHTML}
                            </div>
                            ${edpuzzleLink ? `
                                <div class="p-3 text-center border-t border-zinc-800 bg-zinc-950/80">
                                    <a href="${edpuzzleLink}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center space-x-2 text-xs font-mono text-purple-400 hover:text-purple-300 underline font-semibold">
                                        <span>🔗 Enlace directo a Edpuzzle: https://edpuzzle.com/media/6abf0cfbdd19aa0f5be1e36e ↗</span>
                                    </a>
                                </div>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>
            `;


            const article = document.createElement('article');
            article.className = `carousel-slide tech-card space-y-6 ${i === currentSlideIndex ? 'active' : ''}`;
            article.dataset.index = String(i);
            article.dataset.category = catKey;
            article.setAttribute('aria-hidden', i === currentSlideIndex ? 'false' : 'true');

            article.innerHTML = `
                <div class="border-b border-zinc-900 pb-4 space-y-1">
                    <span class="text-xs font-mono uppercase tracking-wider block" style="color: ${color}">// ${escapeHTML(t.categoria)}</span>
                    <h4 class="text-2xl sm:text-3xl font-extrabold text-white uppercase tracking-tight">
                        ${t.numero}. ${escapeHTML(t.nombre)}
                    </h4>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs sm:text-sm">
                    <div class="space-y-2 md:col-span-2">
                        <span class="font-mono uppercase tracking-wider text-xs block font-bold" style="color: ${color}">// Descripción</span>
                        <p class="text-zinc-300 leading-relaxed text-justify">${escapeHTML(t['Descripción'] || '')}</p>
                    </div>

                    <div class="space-y-2 md:col-span-2">
                        <span class="font-mono uppercase tracking-wider text-xs block font-bold" style="color: ${color}">// Aplicación de la técnica</span>
                        ${aplicacionHTML}
                    </div>

                    <div class="space-y-2 md:col-span-2">
                        <span class="font-mono uppercase tracking-wider text-xs block font-bold" style="color: ${color}">// Recomendaciones para su ejecución</span>
                        <p class="text-zinc-400 leading-relaxed">${escapeHTML(t['Recomendaciones para su ejecución'] || '')}</p>
                    </div>

                    <div class="space-y-2 bg-zinc-900/40 p-4 border border-zinc-900">
                        <span class="font-mono uppercase tracking-wider text-xs block font-bold" style="color: ${color}">// Habilidades desarrolladas</span>
                        <p class="text-zinc-300 leading-relaxed">${escapeHTML(t['Habilidades o competencias que desarrolla'] || '')}</p>
                    </div>

                    <div class="space-y-2 bg-zinc-900/40 p-4 border border-zinc-900">
                        <span class="font-mono uppercase tracking-wider text-xs block font-bold" style="color: ${color}">// Contenido curricular (MEP)</span>
                        <p class="text-zinc-300 leading-relaxed">${escapeHTML(t['Contenido de Estudios Sociales o Cívica'] || '')}</p>
                    </div>

                    <div class="space-y-3 md:col-span-2 bg-zinc-950 p-5 border border-zinc-800">
                        <span class="font-mono uppercase tracking-wider text-xs block font-bold" style="color: ${color}">// Modelaje del recurso para el aula</span>
                        ${modelajeHTML}
                    </div>

                    <div class="space-y-2 md:col-span-2">
                        <span class="font-mono uppercase tracking-wider text-xs block font-bold" style="color: ${color}">// Recurso didáctico</span>
                        <p class="text-zinc-400 leading-relaxed">${escapeHTML(t['Recurso didáctico'] || '')}</p>
                    </div>

                    ${evidenciaVisualHTML}

                    <div class="space-y-2 md:col-span-2 pt-4 border-t border-zinc-900">
                        <span class="font-mono uppercase tracking-wider text-xs block font-bold" style="color: ${color}">// Referencias de la técnica</span>
                        <p class="text-zinc-500 text-xs font-mono leading-relaxed">${escapeHTML((t['Referencias utilizadas para la técnica'] || '').trim())}</p>
                    </div>
                </div>
            `;

            stage.appendChild(article);
        });
    }

    /**
     * Renderiza los indicadores de puntos (dots) debajo del carrusel
     */
    function renderIndicators() {
        const container = document.getElementById('slide-indicators');
        if (!container || !tecnicasData.length) return;
        container.innerHTML = '';

        tecnicasData.forEach((t, i) => {
            const catKey = resolverCategoria(t.categoria);
            const catInfo = CATEGORIAS[catKey];

            const dot = document.createElement('button');
            dot.type = 'button';
            dot.setAttribute('role', 'tab');
            dot.setAttribute('aria-label', `Ir a técnica ${i + 1}: ${t.nombre}`);
            dot.setAttribute('aria-selected', i === currentSlideIndex ? 'true' : 'false');

            if (i === currentSlideIndex) {
                dot.className = 'h-1.5 w-6 transition-all duration-300 focus:outline-none';
                dot.style.backgroundColor = catInfo.color || '#ffffff';
            } else {
                dot.className = 'h-1.5 w-1.5 bg-zinc-800 hover:bg-zinc-600 transition-all duration-300 focus:outline-none';
            }

            dot.addEventListener('click', () => goToSlide(i, false));
            container.appendChild(dot);
        });
    }

    /**
     * Renderiza las conclusiones clave en el Apartado D
     */
    function renderConclusiones(conclusiones) {
        const container = document.getElementById('conclusiones-container');
        if (!container || !Array.isArray(conclusiones)) return;
        container.innerHTML = '';

        const colores = ['text-orange-400', 'text-emerald-400', 'text-cyan-400'];

        conclusiones.forEach((c, i) => {
            const div = document.createElement('div');
            div.className = 'space-y-3 bg-zinc-950 p-6 border border-zinc-900 flex flex-col justify-between';
            const titulo = c.titulo || `Aprendizaje ${i + 1}`;
            const texto = c.texto || '';

            div.innerHTML = `
                <div class="space-y-2">
                    <span class="font-mono font-bold ${colores[i % colores.length]} text-xs uppercase tracking-wider block">
                        0${i + 1} / ${escapeHTML(titulo)}
                    </span>
                    <p class="text-xs sm:text-sm text-zinc-300 leading-relaxed text-justify">
                        ${escapeHTML(texto)}
                    </p>
                </div>
            `;
            container.appendChild(div);
        });
    }

    /**
     * Renderiza las referencias bibliográficas en el Apartado E
     */
    function renderReferencias(referencias) {
        const ul = document.getElementById('referencias-list');
        if (!ul || !Array.isArray(referencias)) return;
        ul.innerHTML = '';

        referencias.forEach(ref => {
            const li = document.createElement('li');
            li.className = 'leading-relaxed';
            li.innerHTML = formatTextWithMarkdown(ref);
            ul.appendChild(li);
        });
    }

    /* ==========================================================================
       Control y Navegación del Carrusel
       ========================================================================== */

    function updateCarouselView() {
        const slides = document.querySelectorAll('#carousel-stage .carousel-slide');
        if (!slides.length) return;

        slides.forEach((slide, i) => {
            const isActive = (i === currentSlideIndex);
            slide.classList.toggle('active', isActive);
            slide.setAttribute('aria-hidden', isActive ? 'false' : 'true');
        });

        const activeSlide = slides[currentSlideIndex];
        if (activeSlide && tecnicasData[currentSlideIndex]) {
            const currentTecnica = tecnicasData[currentSlideIndex];
            const catKey = resolverCategoria(currentTecnica.categoria);
            const catInfo = CATEGORIAS[catKey];

            // Actualizar contador
            const counter = document.getElementById('slide-counter');
            if (counter) {
                counter.textContent = `Técnica ${currentSlideIndex + 1} de ${slides.length}`;
            }

            // Actualizar etiqueta de categoría
            const label = document.getElementById('slide-category-label');
            if (label) {
                label.textContent = `• ${catInfo.label}`;
                label.style.color = catInfo.color;
            }

            // Actualizar resaltado en la matriz de botones
            document.querySelectorAll('#panal-index .grid-cell').forEach((cell, idx) => {
                if (idx === currentSlideIndex) {
                    cell.classList.add('active', 'border-zinc-500');
                    cell.classList.remove('border-zinc-900');
                } else {
                    cell.classList.remove('active', 'border-zinc-500');
                    cell.classList.add('border-zinc-900');
                }
            });
        }

        renderIndicators();
        syncActiveIframes('#carousel-stage');
    }

    function goToSlide(index, scroll = false) {
        const slides = document.querySelectorAll('#carousel-stage .carousel-slide');
        if (!slides.length) return;

        if (index >= 0 && index < slides.length) {
            currentSlideIndex = index;
            updateCarouselView();

            if (scroll) {
                const carouselContainer = document.getElementById('carousel-container');
                if (carouselContainer) {
                    carouselContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            }
        }
    }

    function nextSlide() {
        if (!tecnicasData.length) return;
        currentSlideIndex = (currentSlideIndex + 1) % tecnicasData.length;
        updateCarouselView();
    }

    function prevSlide() {
        if (!tecnicasData.length) return;
        currentSlideIndex = (currentSlideIndex - 1 + tecnicasData.length) % tecnicasData.length;
        updateCarouselView();
    }

    function filterCategory(category) {
        currentFilter = category;

        // Actualizar apariencia de botones de filtro
        document.querySelectorAll('.filter-btn').forEach(btn => {
            const isTarget = btn.dataset.filter === category;
            btn.classList.toggle('bg-zinc-100', isTarget);
            btn.classList.toggle('text-zinc-950', isTarget);
            btn.classList.toggle('font-bold', isTarget);
            btn.classList.toggle('bg-zinc-900', !isTarget);
            btn.classList.toggle('text-zinc-300', !isTarget);
        });

        // Filtrar visualmente la matriz de técnicas sin romper la retícula
        document.querySelectorAll('#panal-index .grid-cell').forEach(cell => {
            const cellCategory = cell.dataset.category;
            const matches = (category === 'all' || cellCategory === category);
            cell.style.opacity = matches ? '1' : '0.25';
            cell.style.pointerEvents = matches ? 'auto' : 'none';
        });

        // Navegar a la primera técnica de la categoría seleccionada
        if (category === 'all') {
            goToSlide(0);
        } else {
            const firstIndex = tecnicasData.findIndex(t => resolverCategoria(t.categoria) === category);
            if (firstIndex !== -1) {
                goToSlide(firstIndex);
            }
        }
    }

    /* ==========================================================================
       Sección Juegos Interactivos
       ========================================================================== */

    let currentJuegoIndex = 0;
    let juegosData = [];

    function renderJuegosSelector(juegos) {
        const container = document.getElementById('juegos-selector');
        if (!container || !Array.isArray(juegos)) return;
        container.innerHTML = '';

        juegos.forEach((j, i) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.dataset.juego = String(i);
            btn.dataset.catkey = 'juego';   // ← usado por CSS para hover cromático
            btn.className = 'grid-cell p-4 text-left w-full border border-zinc-900 focus:outline-none transition-all';
            btn.setAttribute('aria-label', `Seleccionar juego ${j.numero}: ${j.titulo}`);

            btn.innerHTML = `
                <div class="flex items-center justify-between">
                    <span class="text-xs font-mono font-bold text-amber-400">JUEGO 0${j.numero}</span>
                    <span class="text-[9px] font-mono uppercase text-zinc-500">Educaplay</span>
                </div>
                <span class="text-sm font-bold text-zinc-100 block mt-2 leading-snug">${escapeHTML(j.titulo)}</span>
            `;

            btn.addEventListener('click', () => goToJuego(i, true));
            container.appendChild(btn);
        });
    }

    function renderJuegosSlides(juegos) {
        const stage = document.getElementById('juegos-stage');
        if (!stage || !Array.isArray(juegos)) return;
        stage.innerHTML = '';

        juegos.forEach((j, i) => {
            const article = document.createElement('article');
            article.className = `carousel-slide tech-card space-y-6 ${i === currentJuegoIndex ? 'active' : ''}`;
            article.dataset.index = String(i);
            article.setAttribute('aria-hidden', i === currentJuegoIndex ? 'false' : 'true');

            const advertenciaAWSD = (j.numero === 2) ? `
                <div class="flex items-center space-x-3 bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-none text-amber-300 text-xs sm:text-sm font-mono">
                    <span class="text-base sm:text-lg">🕹️</span>
                    <div>
                        <strong class="font-bold text-amber-200 uppercase tracking-wider block">Instrucción de control (Mover nave):</strong>
                        <span>Este juego se controla usando las teclas <kbd class="px-1.5 py-0.5 bg-zinc-900 border border-amber-500/40 text-white font-bold rounded">W</kbd> (arriba), <kbd class="px-1.5 py-0.5 bg-zinc-900 border border-amber-500/40 text-white font-bold rounded">A</kbd> (izquierda), <kbd class="px-1.5 py-0.5 bg-zinc-900 border border-amber-500/40 text-white font-bold rounded">S</kbd> (abajo) y <kbd class="px-1.5 py-0.5 bg-zinc-900 border border-amber-500/40 text-white font-bold rounded">D</kbd> (derecha).</span>
                    </div>
                </div>
            ` : '';

            article.innerHTML = `
                <div class="border-b border-zinc-900 pb-4 space-y-1">
                    <span class="text-xs font-mono uppercase tracking-wider block text-amber-400">// Actividad Lúdica 0${j.numero}</span>
                    <h4 class="text-2xl sm:text-3xl font-extrabold text-white uppercase tracking-tight">
                        ${escapeHTML(j.titulo)}
                    </h4>
                </div>

                <div class="space-y-4">
                    ${advertenciaAWSD}
                    <div class="space-y-3 bg-zinc-950 p-5 border border-zinc-800">
                        <div class="flex items-center justify-between flex-wrap gap-2 border-b border-zinc-900 pb-3">
                            <div class="flex items-center space-x-2">
                                <span class="font-mono uppercase tracking-wider text-xs block font-bold text-amber-400">// Plataforma Educaplay</span>
                                <span class="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-mono px-2 py-0.5 uppercase">Juego Interactivo</span>
                            </div>
                            <a href="${escapeHTML(j.url)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center space-x-1.5 text-xs font-mono text-amber-300 hover:text-white bg-amber-950/60 hover:bg-amber-900 px-3 py-1.5 border border-amber-700/50 transition-colors">
                                <span>🔗 Abrir en Educaplay en pestaña nueva ↗</span>
                            </a>
                        </div>

                        <div class="w-full mt-3 border border-zinc-800 bg-zinc-900 overflow-hidden shadow-2xl">
                            <div class="embed-frame w-full flex justify-center bg-black p-2 sm:p-4 overflow-hidden responsive-embed">
                                <div class="embed-loading" aria-hidden="true">Cargando juego</div>
                                <div class="game-scale">
                                    <iframe
                                        data-src="${escapeHTML(j.url)}"
                                        src="about:blank"
                                        class="game-iframe"
                                        allow="fullscreen; autoplay"
                                        allowfullscreen
                                        loading="lazy"
                                        title="${escapeHTML(j.titulo)}">
                                    </iframe>
                                </div>
                            </div>
                            <div class="p-3 text-center border-t border-zinc-800 bg-zinc-950/80">
                                <a href="${escapeHTML(j.url)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center space-x-2 text-xs font-mono text-amber-400 hover:text-amber-300 underline font-semibold">
                                    <span>🔗 Acceso directo: ${escapeHTML(j.url)} ↗</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            stage.appendChild(article);
        });
    }

    function renderJuegosIndicators() {
        const container = document.getElementById('juegos-indicators');
        if (!container || !juegosData.length) return;
        container.innerHTML = '';

        juegosData.forEach((j, i) => {
            const dot = document.createElement('button');
            dot.type = 'button';
            dot.setAttribute('role', 'tab');
            dot.setAttribute('aria-label', `Ir a juego ${i + 1}: ${j.titulo}`);
            dot.setAttribute('aria-selected', i === currentJuegoIndex ? 'true' : 'false');

            if (i === currentJuegoIndex) {
                dot.className = 'h-1.5 w-6 transition-all duration-300 focus:outline-none bg-amber-400';
            } else {
                dot.className = 'h-1.5 w-1.5 bg-zinc-800 hover:bg-zinc-600 transition-all duration-300 focus:outline-none';
            }

            dot.addEventListener('click', () => goToJuego(i, false));
            container.appendChild(dot);
        });
    }

    function updateJuegosView() {
        const slides = document.querySelectorAll('#juegos-stage .carousel-slide');
        if (!slides.length) return;

        slides.forEach((slide, i) => {
            const isActive = (i === currentJuegoIndex);
            slide.classList.toggle('active', isActive);
            slide.setAttribute('aria-hidden', isActive ? 'false' : 'true');
        });

        const activeJuego = juegosData[currentJuegoIndex];
        if (activeJuego) {
            const counter = document.getElementById('juegos-slide-counter');
            if (counter) {
                counter.textContent = `Juego ${currentJuegoIndex + 1} de ${juegosData.length}`;
            }

            const label = document.getElementById('juegos-title-label');
            if (label) {
                label.textContent = `• ${activeJuego.titulo}`;
                label.style.color = '#fbbf24';
            }

            // Resaltar en el selector de juegos
            document.querySelectorAll('#juegos-selector .grid-cell').forEach((cell, idx) => {
                if (idx === currentJuegoIndex) {
                    cell.classList.add('active', 'border-amber-500/60');
                    cell.classList.remove('border-zinc-900');
                } else {
                    cell.classList.remove('active', 'border-amber-500/60');
                    cell.classList.add('border-zinc-900');
                }
            });

            // Control de estado habilitado/deshabilitado en navegación no circular
            const prevBtn = document.getElementById('juegos-prev-btn');
            const nextBtn = document.getElementById('juegos-next-btn');
            if (prevBtn) {
                prevBtn.disabled = (currentJuegoIndex === 0);
            }
            if (nextBtn) {
                nextBtn.disabled = (currentJuegoIndex >= juegosData.length - 1);
            }
        }

        renderJuegosIndicators();
        syncActiveIframes('#juegos-stage');
    }

    function goToJuego(index, scroll = false) {
        if (!juegosData.length) return;
        if (index >= 0 && index < juegosData.length) {
            currentJuegoIndex = index;
            updateJuegosView();

            if (scroll) {
                const container = document.getElementById('juegos-carousel-container');
                if (container) {
                    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            }
        }
    }

    function nextJuego() {
        if (!juegosData.length) return;
        // Navegación no circular estricta
        if (currentJuegoIndex < juegosData.length - 1) {
            currentJuegoIndex++;
            updateJuegosView();
        }
    }

    function prevJuego() {
        if (!juegosData.length) return;
        // Navegación no circular estricta
        if (currentJuegoIndex > 0) {
            currentJuegoIndex--;
            updateJuegosView();
        }
    }

    /* ==========================================================================
       Escalado de los juegos embebidos (Educaplay)
       --------------------------------------------------------------------------
       El juego se renderiza a su tamaño de diseño (795×690) dentro de
       .game-scale, cuya altura ya reserva el espacio proporcional vía CSS
       (aspect-ratio). Aquí solo se calcula el factor de escala para que el
       juego quepa COMPLETO en el ancho disponible, sin recortes.
       ========================================================================== */
    function initEscaladoJuegos() {
        const frames = Array.from(document.querySelectorAll('.embed-frame'));
        const escaladores = Array.from(document.querySelectorAll('.game-scale'));
        if (!frames.length || !escaladores.length) return;

        const ajustar = () => {
            escaladores.forEach(wrap => {
                const iframe = wrap.querySelector('.game-iframe');
                if (!iframe) return;
                const ancho = wrap.clientWidth;
                if (!ancho) return;
                // Como máximo 1: si hay más espacio que el diseño, no agrandar
                const escala = Math.min(ancho / 795, 1);
                iframe.style.transform = 'scale(' + escala + ')';
            });
        };

        ajustar();

        if ('ResizeObserver' in window) {
            const observer = new ResizeObserver(ajustar);
            frames.forEach(frame => observer.observe(frame));
        }
        window.addEventListener('orientationchange', ajustar);
    }

    /* ==========================================================================
       Navegación: resaltar el enlace de la sección visible (scroll spy)
       --------------------------------------------------------------------------
       Recorre las secciones al hacer scroll (con rAF para no saturar) y marca
       el enlace cuyo ancla haya cruzado la franja superior de la pantalla.
       En móvil además centra el chip activo dentro de la barra deslizable.
       ========================================================================== */
    function initNavScrollSpy() {
        const links = Array.from(document.querySelectorAll('.nav-link'));
        if (!links.length) return;

        const secciones = links
            .map(l => {
                const id = (l.getAttribute('href') || '').replace('#', '');
                const el = id ? document.getElementById(id) : null;
                return { id, el };
            })
            .filter(s => s.el);

        if (!secciones.length) return;

        let ticking = false;

        function actualizar() {
            const franjaY = window.innerHeight * 0.3;
            let actual = null;
            for (const s of secciones) {
                // Ignorar secciones colapsadas: sin rectángulos visibles
                if (s.el.getClientRects().length === 0) continue;
                if (s.el.getBoundingClientRect().top <= franjaY) actual = s.id;
            }
            // Si todo quedó oculto (raro), mantener el primero disponible
            if (!actual) actual = secciones.find(s => s.el.getClientRects().length > 0)?.id || secciones[0].id;
            let activo = null;
            links.forEach(l => {
                const esActivo = l.getAttribute('href') === '#' + actual;
                l.classList.toggle('is-active', esActivo);
                if (esActivo) activo = l;
            });

            // Móvil: centrar el chip activo en la barra de scroll horizontal
            if (activo && window.matchMedia('(max-width: 639px)').matches) {
                const barra = activo.closest('.overflow-x-auto');
                if (barra) {
                    const a = activo.getBoundingClientRect();
                    const b = barra.getBoundingClientRect();
                    barra.scrollBy({
                        left: (a.left + a.width / 2) - (b.left + b.width / 2),
                        behavior: 'smooth'
                    });
                }
            }
            ticking = false;
        }

        function onScroll() {
            if (!ticking) {
                ticking = true;
                requestAnimationFrame(actualizar);
            }
        }

        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll, { passive: true });
        actualizar();
    }

    /* ==========================================================================
       Gestos táctiles en los carruseles (móvil)
       --------------------------------------------------------------------------
       - Deslizar el dedo a izquierda/derecha sobre el escenario cambia de
         diapositiva (el gesto natural en un carrusel).
       - Doble toque rápido sobre el escenario avanza a la siguiente.
       - No se interceptan los toques sobre enlaces, botones ni iframes
         (PDF/video), que conservan su comportamiento propio.
       ========================================================================== */

    function initSwipeGestures(stageSelector, goNext, goPrev) {
        const stage = document.querySelector(stageSelector);
        if (!stage) return;

        let startX = 0;
        let startY = 0;
        let startTime = 0;
        let lastTap = 0;

        stage.addEventListener('touchstart', (e) => {
            if (e.touches.length !== 1) return;
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            startTime = Date.now();
        }, { passive: true });

        stage.addEventListener('touchend', (e) => {
            // No interferir con controles propios de la diapositiva
            if (e.target.closest('a, button, iframe, input, textarea, select')) return;

            const t = e.changedTouches[0];
            const dx = t.clientX - startX;
            const dy = t.clientY - startY;
            const dt = Date.now() - startTime;

            // 1) Swipe horizontal claro (más largo que alto y rápido)
            if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5 && dt < 800) {
                if (dx < 0) goNext(); else goPrev();
                return;
            }

            // 2) Doble toque casi inmóvil → avanzar
            if (Math.abs(dx) < 12 && Math.abs(dy) < 12 && dt < 250) {
                const now = Date.now();
                if (now - lastTap < 300) {
                    goNext();
                    lastTap = 0;
                } else {
                    lastTap = now;
                }
            }
        }, { passive: true });
    }

    /* ==========================================================================
       Interruptor de Tema Oscuro / Claro
       ========================================================================== */

    function initThemeToggle() {
        const btn = document.getElementById('theme-toggle-btn');
        if (!btn) return;

        // Los iconos 🌙/☀️ se animan por CSS (html.light .theme-icon-*),
        // por lo que aquí solo se sincroniza el estado accesible.
        function applyThemeUI(isLight) {
            btn.setAttribute('aria-checked', isLight ? 'true' : 'false');
        }

        // Sincronizar UI con el estado actual del DOM (ya aplicado por el script anti-parpadeo del <head>)
        const isLight = document.documentElement.classList.contains('light');
        applyThemeUI(isLight);

        btn.addEventListener('click', () => {
            const nowLight = document.documentElement.classList.toggle('light');
            applyThemeUI(nowLight);
            try {
                localStorage.setItem('portafolio_theme', nowLight ? 'light' : 'dark');
            } catch (e) { /* localStorage bloqueado */ }
        });
    }

    /* ==========================================================================
       Secciones Colapsables (Ocultar / Mostrar)
       ========================================================================== */

    const COLLAPSE_KEY = 'portafolio_collapsed_sections';

    // Secciones que inician colapsadas para visitantes nuevos.
    // El usuario puede abrirlas y su elección queda guardada en localStorage.
    const SECCIONES_OCULTAS_POR_DEFECTO = ['juegos-content'];

    function getSavedCollapsedSections() {
        try {
            const raw = localStorage.getItem(COLLAPSE_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch (e) { return {}; }
    }

    function saveCollapsedSections(map) {
        try {
            localStorage.setItem(COLLAPSE_KEY, JSON.stringify(map));
        } catch (e) { /* localStorage bloqueado */ }
    }

    function initSectionCollapseButtons() {
        const collapsedMap = getSavedCollapsedSections();

        document.querySelectorAll('.section-collapse-btn').forEach(btn => {
            const targetId = btn.getAttribute('data-target');
            if (!targetId) return;

            const body = document.getElementById(targetId);
            if (!body) return;

            // Estado guardado del usuario; si es su primera visita,
            // se aplica el estado por defecto de cada sección
            const tieneEstadoGuardado = Object.prototype.hasOwnProperty.call(collapsedMap, targetId);
            const isCollapsed = tieneEstadoGuardado
                ? collapsedMap[targetId] === true
                : SECCIONES_OCULTAS_POR_DEFECTO.includes(targetId);
            if (isCollapsed) {
                body.classList.add('is-collapsed');
                btn.setAttribute('aria-expanded', 'false');
                _updateCollapseLabel(btn, true);

                // Si esta sección tiene iframes activos, descargarlos
                body.querySelectorAll('iframe[data-src]').forEach(iframe => {
                    if (iframe.getAttribute('src') !== 'about:blank') {
                        iframe.setAttribute('src', 'about:blank');
                    }
                });
            }

            btn.addEventListener('click', () => {
                const nowCollapsed = !body.classList.contains('is-collapsed');
                aplicarColapsado(body, nowCollapsed);
            });
        });
    }

    /**
     * Navegar desde el menú a una sección colapsada la expande primero,
     * para que el usuario nunca llegue a un área invisible.
     */
    function initNavAutoExpand() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                const id = (link.getAttribute('href') || '').replace('#', '');
                const section = id ? document.getElementById(id) : null;
                if (!section) return;
                // El cuerpo colapsable es descendiente de la sección:
                // se localiza mediante el botón que lo controla
                const btn = section.querySelector('.section-collapse-btn');
                if (!btn) return;
                const body = document.getElementById(btn.getAttribute('data-target'));
                if (body && body.classList.contains('is-collapsed')) {
                    aplicarColapsado(body, false);
                }
            });
        });
    }

    function _updateCollapseLabel(btn, isCollapsed) {
        const iconEl = btn.querySelector('.collapse-icon');
        const textEl = btn.querySelector('.collapse-text');
        if (iconEl) iconEl.textContent = isCollapsed ? '👁️‍🗨️' : '👁️';
        if (textEl) textEl.textContent = isCollapsed ? 'Mostrar' : 'Ocultar';
    }

    /**
     * Aplica (o quita) el estado colapsado de una sección: clase CSS,
     * etiqueta del botón, persistencia en localStorage y descarga o
     * reactivación de los iframes del carrusel que contiene.
     */
    function aplicarColapsado(body, colapsar) {
        body.classList.toggle('is-collapsed', colapsar);

        // Persistir la elección del usuario
        const map = getSavedCollapsedSections();
        map[body.id] = colapsar;
        saveCollapsedSections(map);

        // Sincronizar el botón que controla esta sección
        const btn = document.querySelector('.section-collapse-btn[data-target="' + body.id + '"]');
        if (btn) {
            btn.setAttribute('aria-expanded', colapsar ? 'false' : 'true');
            _updateCollapseLabel(btn, colapsar);
        }

        if (colapsar) {
            // Descargar iframes activos para detener audio/video de inmediato
            body.querySelectorAll('iframe[data-src]').forEach(iframe => {
                if (iframe.getAttribute('src') !== 'about:blank') {
                    iframe.setAttribute('src', 'about:blank');
                }
            });
        } else {
            // Al expandir, resincronizar los iframes activos
            const stage = body.querySelector('#carousel-stage, #juegos-stage');
            if (stage) {
                syncActiveIframes('#' + stage.id);
            }
        }
    }

    /* ==========================================================================
       Inicialización de la Aplicación
       ========================================================================== */

    function init() {
        if (typeof PORTAFOLIO_DATA === 'undefined' || !PORTAFOLIO_DATA.tecnicas) {
            console.error('Error: No se encontró PORTAFOLIO_DATA en js/data.js.');
            return;
        }

        tecnicasData = PORTAFOLIO_DATA.tecnicas;
        juegosData = PORTAFOLIO_DATA.juegos || [];

        // 1. Renderizar contenido dinámico de Técnicas
        renderMatriz(tecnicasData);
        renderFiltros(tecnicasData);
        renderSlides(tecnicasData);
        renderConclusiones(PORTAFOLIO_DATA.conclusiones || []);
        renderReferencias(PORTAFOLIO_DATA.referencias_generales || []);

        // 2. Asociar controles del carrusel de Técnicas
        document.querySelector('[data-action="prev"]')?.addEventListener('click', prevSlide);
        document.querySelector('[data-action="next"]')?.addEventListener('click', nextSlide);

        // 3. Renderizar y asociar controles de Juegos Interactivos
        if (juegosData.length) {
            renderJuegosSelector(juegosData);
            renderJuegosSlides(juegosData);
            document.getElementById('juegos-prev-btn')?.addEventListener('click', prevJuego);
            document.getElementById('juegos-next-btn')?.addEventListener('click', nextJuego);
            updateJuegosView();
        }

        // 4. Soporte para navegación con teclado en técnicas
        document.addEventListener('keydown', (e) => {
            // Evitar interferir con campos de entrada de texto si existieran
            if (['input', 'textarea'].includes(document.activeElement?.tagName?.toLowerCase())) return;

            if (e.key === 'ArrowRight') {
                nextSlide();
            } else if (e.key === 'ArrowLeft') {
                prevSlide();
            }
        });

        // 5. Mostrar estado inicial
        updateCarouselView();

        // 5b. Gestos táctiles (móvil): deslizar y doble toque en ambos carruseles
        initSwipeGestures('#carousel-stage', nextSlide, prevSlide);
        initSwipeGestures('#juegos-stage', nextJuego, prevJuego);

        // 5c. Escalar los juegos de Educaplay al ancho disponible (sin recortes)
        initEscaladoJuegos();

        // 6. Interruptor de tema oscuro/claro
        initThemeToggle();

        // 6b. Secciones colapsables (antes del scroll spy, para que la
        //     navegación ignore correctamente las secciones ocultas)
        initSectionCollapseButtons();

        // 6b2. Expandir secciones colapsadas al navegar a ellas
        initNavAutoExpand();

        // 6c. Resaltar la sección visible en la barra de navegación
        initNavScrollSpy();

        // 8. Detener reproducción cuando la sección sale de la pantalla o la pestaña se oculta
        if ('IntersectionObserver' in window) {
            const sectionObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    const targetId = entry.target.id;
                    const stageSelector = (targetId === 'desarrollo') ? '#carousel-stage' : '#juegos-stage';
                    if (!entry.isIntersecting) {
                        // Sección fuera de pantalla: descargar todos los iframes de esa sección
                        document.querySelectorAll(`${stageSelector} iframe[data-src]`).forEach(iframe => {
                            if (iframe.getAttribute('src') !== 'about:blank') {
                                iframe.setAttribute('src', 'about:blank');
                            }
                        });
                    } else {
                        // Sección visible: sincronizar y cargar únicamente el elemento activo
                        syncActiveIframes(stageSelector);
                    }
                });
            }, { threshold: 0.1 });

            const secDesarrollo = document.getElementById('desarrollo');
            const secJuegos = document.getElementById('juegos');
            if (secDesarrollo) sectionObserver.observe(secDesarrollo);
            if (secJuegos) sectionObserver.observe(secJuegos);
        }

        // Si el usuario cambia de pestaña del navegador, pausar de inmediato
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                document.querySelectorAll('#carousel-stage iframe[data-src], #juegos-stage iframe[data-src]').forEach(iframe => {
                    if (iframe.getAttribute('src') !== 'about:blank') {
                        iframe.setAttribute('src', 'about:blank');
                    }
                });
            } else {
                syncActiveIframes('#carousel-stage');
                syncActiveIframes('#juegos-stage');
            }
        });
    }

    // Ejecutar cuando el DOM esté completamente cargado
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

