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

            // Insumo PDF y Evidencia Visual
            const pdfUrl = t['Insumo PDF'] ? encodeURI(t['Insumo PDF']) : null;
            const youtubeUrl = t['Video YouTube'] || null;
            const textoEvidencia = (t['Evidencia visual'] || '').replace(/\[RECORDATORIO DOCENTE:[^\]]*\]/gi, '').trim();
            const evidenciaVisualHTML = `
                <div class="space-y-3 md:col-span-2 bg-zinc-950 p-5 border border-zinc-800">
                    <div class="flex items-center justify-between flex-wrap gap-2 border-b border-zinc-900 pb-3">
                        <div class="flex items-center space-x-2">
                            <span class="font-mono uppercase tracking-wider text-xs block font-bold" style="color: ${color}">// Evidencia visual e Insumo Didáctico</span>
                            ${pdfUrl ? `<span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono px-2 py-0.5 uppercase">PDF Adjunto</span>` : ''}
                            ${youtubeUrl ? `<span class="bg-red-500/10 text-red-400 border border-red-500/30 text-[10px] font-mono px-2 py-0.5 uppercase">▶ Video</span>` : ''}
                        </div>
                        ${pdfUrl ? `
                            <a href="${pdfUrl}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center space-x-1.5 text-xs font-mono text-zinc-200 hover:text-white bg-zinc-900 hover:bg-zinc-800 px-3 py-1.5 border border-zinc-700 transition-colors">
                                <span>📄 Abrir Insumo PDF en pestaña nueva ↗</span>
                            </a>
                        ` : ''}
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

                    ${youtubeUrl ? (() => {
                        const videoId = youtubeUrl.split('/embed/')[1]?.split('?')[0] || '';
                        const thumbUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                        const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
                        return `
                        <div class="w-full mt-4 border border-zinc-800 bg-zinc-900 overflow-hidden shadow-2xl">
                            <div class="flex items-center space-x-2 px-4 py-2 border-b border-zinc-800">
                                <span class="text-red-500 text-sm">▶</span>
                                <span class="font-mono text-xs text-zinc-400 uppercase tracking-wider">Video de la canción</span>
                            </div>
                            <a href="${watchUrl}" target="_blank" rel="noopener noreferrer" class="block relative group cursor-pointer">
                                <img src="${thumbUrl}" alt="Miniatura del video" class="w-full object-cover" style="max-height:320px; object-fit:cover;">
                                <div class="absolute inset-0 bg-black/50 flex flex-col items-center justify-center group-hover:bg-black/30 transition-all">
                                    <div class="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                                        <svg viewBox="0 0 24 24" fill="white" class="w-8 h-8 ml-1"><path d="M8 5v14l11-7z"/></svg>
                                    </div>
                                    <span class="mt-3 text-white font-mono text-xs uppercase tracking-wider bg-black/60 px-3 py-1">Abrir en YouTube ↗</span>
                                </div>
                            </a>
                        </div>`;
                    })() : ''}
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
        const slides = document.querySelectorAll('.carousel-slide');
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
    }

    function goToSlide(index, scroll = false) {
        const slides = document.querySelectorAll('.carousel-slide');
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
       Inicialización de la Aplicación
       ========================================================================== */

    function init() {
        if (typeof PORTAFOLIO_DATA === 'undefined' || !PORTAFOLIO_DATA.tecnicas) {
            console.error('Error: No se encontró PORTAFOLIO_DATA en js/data.js.');
            return;
        }

        tecnicasData = PORTAFOLIO_DATA.tecnicas;

        // 1. Renderizar contenido dinámico
        renderMatriz(tecnicasData);
        renderFiltros(tecnicasData);
        renderSlides(tecnicasData);
        renderConclusiones(PORTAFOLIO_DATA.conclusiones || []);
        renderReferencias(PORTAFOLIO_DATA.referencias_generales || []);

        // 2. Asociar controles del carrusel
        document.querySelector('[data-action="prev"]')?.addEventListener('click', prevSlide);
        document.querySelector('[data-action="next"]')?.addEventListener('click', nextSlide);

        // 3. Soporte para navegación con teclado (flechas izquierda/derecha)
        document.addEventListener('keydown', (e) => {
            // Evitar interferir con campos de entrada de texto si existieran
            if (['input', 'textarea'].includes(document.activeElement?.tagName?.toLowerCase())) return;

            if (e.key === 'ArrowRight') {
                nextSlide();
            } else if (e.key === 'ArrowLeft') {
                prevSlide();
            }
        });

        // 4. Mostrar estado inicial
        updateCarouselView();
    }

    // Ejecutar cuando el DOM esté completamente cargado
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
