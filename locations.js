 /**
     * ============================================================
     * SISTEMA DE GEOLOCALIZAÇÃO E BUSCA DE LOJAS REAIS
     * Usando OpenStreetMap Overpass API - Sem necessidade de API Key
     * ============================================================
     */

    // Configurações
    const CONFIG = {
        SEARCH_RADIUS_METERS: 3000,  // 3km de raio
        CACHE_TIME_MS: 5 * 60 * 1000, // 5 minutos de cache
        OVERPASS_URL: 'https://overpass-api.de/api/interpreter'
    };

    // Elementos DOM
    let modalOverlay, btnCloseModal, btnRetryGeo, manualInput, resultsList;
    let statePrompt, stateLoading, stateError, errMsgText;
    let userCoords = null;
    let debounceTimer = null;

    // ============================================================
    // INICIALIZAÇÃO
    // ============================================================
    document.addEventListener("DOMContentLoaded", () => {
        // Elementos do modal
        modalOverlay = document.getElementById('storeModal');
        btnCloseModal = document.getElementById('closeModalBtn');
        btnRetryGeo = document.getElementById('btnRetryGeolocation');
        manualInput = document.getElementById('manualSearchInput');
        resultsList = document.getElementById('storeResultsList');
        statePrompt = document.getElementById('statePrompt');
        stateLoading = document.getElementById('stateLoading');
        stateError = document.getElementById('stateError');
        errMsgText = document.getElementById('errorMessage');

        // Event listeners
        const btnLocations = document.getElementById('btn-locations');
        if (btnLocations) {
            btnLocations.addEventListener('click', (e) => {
                e.preventDefault();
                openModal();
            });
        }

        if (btnCloseModal) btnCloseModal.addEventListener('click', closeModal);
        if (modalOverlay) modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeModal();
        });

        if (btnRetryGeo) btnRetryGeo.addEventListener('click', () => {
            userCoords = null;
            requestGeolocation();
        });

        // Busca manual com debounce
        if (manualInput) {
            manualInput.addEventListener('input', (e) => {
                clearTimeout(debounceTimer);
                const query = e.target.value.trim();
                if (query.length >= 3) {
                    debounceTimer = setTimeout(() => searchByAddress(query), 800);
                }
            });
        }

        // Botão de retry no estado de erro
        const btnErrorRetry = document.getElementById('btnErrorRetry');
        if (btnErrorRetry) {
            btnErrorRetry.addEventListener('click', () => {
                if (userCoords) {
                    findRealStores(userCoords.lat, userCoords.lng);
                } else {
                    requestGeolocation();
                }
            });
        }

        // Fechar com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modalOverlay?.classList.contains('is-active')) {
                closeModal();
            }
        });
    });

    // ============================================================
    // CONTROLE DO MODAL
    // ============================================================
    function openModal() {
        if (!modalOverlay) return;
        modalOverlay.classList.add('is-active');
        modalOverlay.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';

        // Se não tiver coordenadas, solicita geolocalização
        if (!userCoords) {
            requestGeolocation();
        } else {
            findRealStores(userCoords.lat, userCoords.lng);
        }
    }

    function closeModal() {
        if (modalOverlay) {
            modalOverlay.classList.remove('is-active');
            modalOverlay.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        }
    }

    function setUIState(state) {
        statePrompt?.classList.add('d-none');
        stateLoading?.classList.add('d-none');
        stateError?.classList.add('d-none');
        resultsList?.classList.add('d-none');

        if (state === 'prompt') statePrompt?.classList.remove('d-none');
        if (state === 'loading') stateLoading?.classList.remove('d-none');
        if (state === 'error') stateError?.classList.remove('d-none');
        if (state === 'results') resultsList?.classList.remove('d-none');
    }

    // ============================================================
    // GEOLOCALIZAÇÃO REAL
    // ============================================================
    function requestGeolocation() {
        setUIState('loading');

        if (!navigator.geolocation) {
            showError("Seu navegador não suporta geolocalização. Digite sua cidade no campo acima.");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                userCoords = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                findRealStores(userCoords.lat, userCoords.lng);
            },
            (error) => {
                console.warn("Erro na geolocalização:", error);
                let msg = "Não foi possível acessar sua localização. ";
                if (error.code === 1) msg += "Permita o acesso à localização no seu navegador.";
                else if (error.code === 2) msg += "Sinal de GPS indisponível.";
                else msg += "Digite sua cidade no campo acima.";
                showError(msg);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    }

    // ============================================================
    // BUSCA POR ENDEREÇO (NOMINATIM - OPENSTREETMAP)
    // ============================================================
    async function searchByAddress(query) {
        setUIState('loading');
        
        try {
            const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&addressdetails=1`;
            const response = await fetch(geoUrl, {
                headers: { 'User-Agent': 'FantaLocator/1.0' }
            });
            const data = await response.json();

            if (data && data.length > 0) {
                userCoords = {
                    lat: parseFloat(data[0].lat),
                    lng: parseFloat(data[0].lon)
                };
                findRealStores(userCoords.lat, userCoords.lng);
            } else {
                showError("Endereço não encontrado. Tente um nome de cidade ou rua mais específico.");
            }
        } catch (error) {
            console.error("Erro na busca por endereço:", error);
            showError("Erro ao buscar endereço. Verifique sua conexão e tente novamente.");
        }
    }

    // ============================================================
    // BUSCA REAL DE LOJAS - OVERPASS API (OpenStreetMap)
    // ============================================================
    async function findRealStores(lat, lng) {
        setUIState('loading');

        // Verificar cache
        const cacheKey = `fanta_stores_${lat.toFixed(5)}_${lng.toFixed(5)}`;
        const cached = getCachedData(cacheKey);
        if (cached) {
            renderStoresList(cached);
            return;
        }

        try {
            // Query Overpass para buscar supermercados, lojas de conveniência e distribuidoras
            // Raio de aproximadamente 3km (0.027 graus ~ 3km no equador)
            const radiusDeg = 0.027;
            const minLat = lat - radiusDeg;
            const maxLat = lat + radiusDeg;
            const minLon = lng - radiusDeg;
            const maxLon = lng + radiusDeg;

            const overpassQuery = `
                [out:json];
                (
                    node["shop"="supermarket"](${minLat},${minLon},${maxLat},${maxLon});
                    node["shop"="convenience"](${minLat},${minLon},${maxLat},${maxLon});
                    node["amenity"="marketplace"](${minLat},${minLon},${maxLat},${maxLon});
                    node["shop"="alcohol"](${minLat},${minLon},${maxLat},${maxLon});
                    node["shop"="beverages"](${minLat},${minLon},${maxLat},${maxLon});
                    way["shop"="supermarket"](${minLat},${minLon},${maxLat},${maxLon});
                    way["shop"="convenience"](${minLat},${minLon},${maxLat},${maxLon});
                );
                out body;
                >;
                out skel qt;
            `;

            const response = await fetch(CONFIG.OVERPASS_URL, {
                method: 'POST',
                body: overpassQuery,
                headers: { 'Content-Type': 'text/plain' }
            });

            if (!response.ok) throw new Error('Falha na API de mapas');

            const data = await response.json();
            
            if (!data.elements || data.elements.length === 0) {
                showError("Nenhum ponto de venda encontrado próximo. Tente ampliar sua busca ou digitar outra cidade.");
                return;
            }

            // Processar resultados
            const stores = [];
            const seenNames = new Set();

            for (const element of data.elements) {
                // Extrair nome
                let name = element.tags?.name || element.tags?.brand || 
                          (element.tags?.shop === 'supermarket' ? 'Supermercado Local' :
                           element.tags?.shop === 'convenience' ? 'Loja de Conveniência' : 'Ponto de Venda Parceiro');
                
                // Evitar duplicatas de nome aproximado
                const cleanName = name.toLowerCase().replace(/[^a-z]/g, '');
                if (seenNames.has(cleanName) && stores.length > 0) continue;
                seenNames.add(cleanName);

                // Extrair endereço
                let address = '';
                if (element.tags) {
                    const parts = [];
                    if (element.tags['addr:street']) parts.push(element.tags['addr:street']);
                    if (element.tags['addr:city']) parts.push(element.tags['addr:city']);
                    if (element.tags['addr:district']) parts.push(element.tags['addr:district']);
                    address = parts.join(', ') || 'Endereço disponível no Maps';
                }

                const storeLat = element.lat || (element.center?.lat);
                const storeLon = element.lon || (element.center?.lon);
                
                if (!storeLat || !storeLon) continue;

                const distance = calculateDistance(lat, lng, storeLat, storeLon);
                
                if (distance <= CONFIG.SEARCH_RADIUS_METERS) {
                    stores.push({
                        name: name.length > 35 ? name.substring(0, 35) : name,
                        address: address || `Região central, próximo ao ponto ${Math.floor(distance)}m`,
                        distance: distance,
                        lat: storeLat,
                        lng: storeLon
                    });
                }
            }

            // Ordenar por distância e limitar a 12 resultados
            stores.sort((a, b) => a.distance - b.distance);
            const topStores = stores.slice(0, 12);

            if (topStores.length === 0) {
                showError("Nenhum estabelecimento parceiro encontrado nos arredores. Tente outra localização.");
                return;
            }

            // Salvar em cache
            setCachedData(cacheKey, topStores);
            renderStoresList(topStores);

        } catch (error) {
            console.error("Erro ao buscar lojas:", error);
            showError("Erro ao carregar pontos de venda. Verifique sua conexão com a internet.");
        }
    }

    // ============================================================
    // CÁLCULO DE DISTÂNCIA (Haversine)
    // ============================================================
    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371000;
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        return R * c;
    }

    // ============================================================
    // RENDERIZAÇÃO DOS RESULTADOS
    // ============================================================
    function renderStoresList(stores) {
        if (!resultsList) return;
        
        resultsList.innerHTML = '';
        setUIState('results');

        stores.forEach(store => {
            const distanceText = store.distance < 1000 
                ? `${Math.round(store.distance)}m` 
                : `${(store.distance / 1000).toFixed(1)}km`;

            const li = document.createElement('li');
            li.className = 'store-item';
            
            const mapsRouteUrl = `https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lng}&travelmode=driving`;
            const mapsViewUrl = `https://www.google.com/maps/search/?api=1&query=${store.lat},${store.lng}`;

            li.innerHTML = `
                <div class="store-info-top">
                    <span class="store-name">${escapeHtml(store.name)}</span>
                    <span class="store-distance">📏 ${distanceText}</span>
                </div>
                <p class="store-address">📍 ${escapeHtml(store.address)}</p>
                <div class="store-actions">
                    <a href="${mapsRouteUrl}" target="_blank" rel="noopener noreferrer" class="btn-store-action btn-route">
                        🚗 Ver Rota
                    </a>
                    <a href="${mapsViewUrl}" target="_blank" rel="noopener noreferrer" class="btn-store-action btn-maps">
                        🗺️ Abrir no Maps
                    </a>
                </div>
            `;
            resultsList.appendChild(li);
        });
    }

    function showError(message) {
        if (errMsgText) errMsgText.textContent = message;
        setUIState('error');
    }

    // ============================================================
    // SISTEMA DE CACHE LOCALSTORAGE
    // ============================================================
    function getCachedData(key) {
        const cached = localStorage.getItem(key);
        if (!cached) return null;
        
        try {
            const parsed = JSON.parse(cached);
            if (Date.now() - parsed.timestamp < CONFIG.CACHE_TIME_MS) {
                return parsed.data;
            }
            localStorage.removeItem(key);
        } catch (e) {
            localStorage.removeItem(key);
        }
        return null;
    }

    function setCachedData(key, data) {
        const cacheObj = {
            timestamp: Date.now(),
            data: data
        };
        localStorage.setItem(key, JSON.stringify(cacheObj));
    }

    // ============================================================
    // UTILITÁRIOS
    // ============================================================
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }