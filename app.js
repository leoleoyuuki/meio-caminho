// Meio do Caminho Application Logic

// DOM Elements
const inputA = document.getElementById('input-a');
const inputB = document.getElementById('input-b');
const btnCalculate = document.getElementById('btn-calculate');
const btnToggleSettings = document.getElementById('toggle-settings');
const advancedSettings = document.getElementById('advanced-settings');
const apiGoogleInput = document.getElementById('api-key-google');
const chips = document.querySelectorAll('.chip');
const loadingState = document.getElementById('loading-state');
const resultsSection = document.getElementById('results-section');
const midpointNeighborhood = document.getElementById('midpoint-neighborhood');
const midpointAddress = document.getElementById('midpoint-address');
const distA = document.getElementById('dist-a');
const distB = document.getElementById('dist-b');
const placesList = document.getElementById('places-list');

// App State
let selectedPlaceType = 'cafes, restaurantes';
let map = null;
let markers = [];
let routeLine = null;

// Initialize Leaflet Map
function initMap() {
    // Default coordinates: Sao Paulo (center)
    map = L.map('map', {
        zoomControl: true,
        attributionControl: false
    }).setView([-23.55052, -46.633308], 12);

    // Standard map tiles styled dark (using CSS filters defined in style.css)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
    }).addTo(map);
}

// Add markers and routing lines to Map
function updateMap(data) {
    // Clear previous markers & lines
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
    if (routeLine) {
        map.removeLayer(routeLine);
    }

    const { pointA, pointB, midpoint, establishments } = data;

    // Custom Marker Icons
    const iconA = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: #EF4444; width: 14px; height: 14px; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(239, 68, 68, 0.8);"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
    });

    const iconB = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: #3B82F6; width: 14px; height: 14px; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(59, 130, 246, 0.8);"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
    });

    const iconMid = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: #10B981; width: 22px; height: 22px; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 15px rgba(16, 185, 129, 0.8); display: flex; align-items: center; justify-content: center; color: white;"><i class="fa-solid fa-flag" style="font-size: 10px;"></i></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
    });

    // Add markers
    const markerA = L.marker([pointA.lat, pointA.lng], { icon: iconA })
        .bindPopup(`<b>Ponto A:</b> ${pointA.address}`)
        .addTo(map);
    
    const markerB = L.marker([pointB.lat, pointB.lng], { icon: iconB })
        .bindPopup(`<b>Ponto B:</b> ${pointB.address}`)
        .addTo(map);

    const markerMid = L.marker([midpoint.lat, midpoint.lng], { icon: iconMid })
        .bindPopup(`<b>Ponto Médio (Meio do Caminho):</b> ${midpoint.neighborhood}<br>${midpoint.formattedAddress}`)
        .addTo(map);

    markers.push(markerA, markerB, markerMid);

    // Draw route/line between A -> Mid -> B
    const latlngs = [
        [pointA.lat, pointA.lng],
        [midpoint.lat, midpoint.lng],
        [pointB.lat, pointB.lng]
    ];
    routeLine = L.polyline(latlngs, {
        color: '#6366F1',
        weight: 4,
        opacity: 0.6,
        dashArray: '10, 10',
        lineCap: 'round'
    }).addTo(map);

    // Add establishment markers
    establishments.forEach((est, index) => {
        const isSp = est.isSponsored;
        const color = isSp ? '#10B981' : '#8B5CF6';
        const innerHtml = isSp ? '<i class="fa-solid fa-star" style="font-size: 8px;"></i>' : index;

        const estIcon = L.divIcon({
            className: 'custom-div-icon',
            html: `<div style="background-color: ${color}; width: 18px; height: 18px; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 8px ${color}; display: flex; align-items: center; justify-content: center; color: white; font-size: 9px; font-weight: bold;">${innerHtml}</div>`,
            iconSize: [18, 18],
            iconAnchor: [9, 9]
        });

        const estMarker = L.marker([est.lat, est.lng], { icon: estIcon })
            .bindPopup(`<b>${isSp ? '[Patrocinado] ' : ''}${est.name}</b><br>${est.address}<br><i>${est.description}</i>`)
            .addTo(map);
        
        markers.push(estMarker);
    });

    // Zoom map to fit all markers
    const group = new L.featureGroup(markers);
    map.fitBounds(group.getBounds().pad(0.15));
}

// Setup Event Listeners
function setupEventListeners() {
    // Settings panel toggle
    btnToggleSettings.addEventListener('click', () => {
        advancedSettings.classList.toggle('hidden');
    });

    // Chips selection
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            chips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            selectedPlaceType = chip.getAttribute('data-place-type');
        });
    });

    // Calculate click
    btnCalculate.addEventListener('click', handleCalculation);

    // PIX copy listener
    const pixCard = document.getElementById('pix-copy-card');
    if (pixCard) {
        pixCard.addEventListener('click', handlePixCopy);
    }
}

// Helper: Copy PIX key to clipboard
async function handlePixCopy() {
    const pixKeyValue = document.getElementById('pix-key-value').textContent;
    const pixCard = document.getElementById('pix-copy-card');
    const pixCopyStatus = document.getElementById('pix-copy-status');
    const pixCopyIcon = document.getElementById('pix-copy-icon-symbol');

    try {
        await navigator.clipboard.writeText(pixKeyValue);
        
        // Add success class & change text/icon
        pixCard.classList.add('copied');
        pixCopyStatus.textContent = 'Chave copiada com sucesso!';
        if (pixCopyIcon) {
            pixCopyIcon.className = 'fa-solid fa-check';
        }

        // Reset after 2.5 seconds
        setTimeout(() => {
            pixCard.classList.remove('copied');
            pixCopyStatus.textContent = 'Clique para copiar a chave';
            if (pixCopyIcon) {
                pixCopyIcon.className = 'fa-regular fa-copy';
            }
        }, 2500);
    } catch (err) {
        console.error('Falha ao copiar texto: ', err);
        // Fallback: create temporary textarea
        const tempTextArea = document.createElement('textarea');
        tempTextArea.value = pixKeyValue;
        document.body.appendChild(tempTextArea);
        tempTextArea.select();
        try {
            document.execCommand('copy');
            pixCard.classList.add('copied');
            pixCopyStatus.textContent = 'Copiado!';
            setTimeout(() => {
                pixCard.classList.remove('copied');
                pixCopyStatus.textContent = 'Clique para copiar a chave';
            }, 2500);
        } catch (e) {
            alert('Não foi possível copiar automaticamente. A chave PIX é: ' + pixKeyValue);
        }
        document.body.removeChild(tempTextArea);
    }
}

// Helper: Check if string is CEP and resolve it
async function resolveInput(input) {
    const cleanInput = input.replace(/\s+/g, '');
    const cepRegex = /^(\d{5})-?(\d{3})$/;
    const match = cleanInput.match(cepRegex);
    
    if (match) {
        const cep = match[1] + match[2];
        try {
            const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await res.json();
            if (data.erro) {
                throw new Error('CEP não encontrado');
            }
            return `${data.logradouro || ''}, ${data.bairro || ''}, ${data.localidade || ''} - ${data.uf || ''}, Brasil`;
        } catch (e) {
            console.warn(`ViaCEP failed for ${cep}, using raw input`, e);
        }
    }
    return input;
}

// Helper: Geocode address to lat/lng using Nominatim with multiple fallbacks
async function fetchNominatim(query) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=br`;
    const res = await fetch(url, {
        headers: {
            'User-Agent': 'MeioDoCaminhoApp/1.0'
        }
    });
    const data = await res.json();
    if (data && data.length > 0) {
        return {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon),
            address: data[0].display_name
        };
    }
    throw new Error('Not found');
}

async function geocodeAddress(address, rawInput) {
    // Strategy 1: Search the full address resolved via ViaCEP
    try {
        return await fetchNominatim(address);
    } catch (e) {
        console.warn(`Nominatim Strategy 1 failed for: ${address}. Trying fallback strategies...`);
    }

    // Strategy 2: If the original input was a CEP, search the CEP directly
    const cleanInput = rawInput.replace(/\s+/g, '').replace('-', '');
    const cepRegex = /^\d{8}$/;
    if (cleanInput.match(cepRegex)) {
        try {
            const cepQuery = `${cleanInput.substring(0, 5)}-${cleanInput.substring(5)}, Brasil`;
            return await fetchNominatim(cepQuery);
        } catch (e) {
            console.warn(`Nominatim Strategy 2 (CEP query) failed for: ${cleanInput}`);
        }
    }

    // Strategy 3: Simplify address query by removing neighborhood name (bairro is index 1 in resolved address)
    // Resolved address format is: "logradouro, bairro, localidade - uf, Brasil"
    const parts = address.split(', ');
    if (parts.length >= 4) {
        const simplifiedQuery = [parts[0], ...parts.slice(2)].join(', ');
        try {
            return await fetchNominatim(simplifiedQuery);
        } catch (e) {
            console.warn(`Nominatim Strategy 3 (simplified address) failed for: ${simplifiedQuery}`);
        }
    }

    // Strategy 4: Search for the neighborhood + city directly
    if (parts.length >= 3) {
        const neighborhoodCityQuery = `${parts[1]}, ${parts[2]}`;
        try {
            return await fetchNominatim(neighborhoodCityQuery);
        } catch (e) {
            console.warn(`Nominatim Strategy 4 (neighborhood + city) failed for: ${neighborhoodCityQuery}`);
        }
    }

    throw new Error(`Não foi possível localizar o endereço "${rawInput}". Tente digitar um ponto de referência próximo ou simplificar a busca.`);
}

// Helper: Reverse geocode to find Bairro (neighborhood)
async function reverseGeocode(lat, lng) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'MeioDoCaminhoApp/1.0'
            }
        });
        const data = await res.json();
        if (data && data.address) {
            const addr = data.address;
            const neighborhood = addr.suburb || addr.neighbourhood || addr.quarter || addr.city_district || 'Desconhecido';
            const city = addr.city || addr.town || addr.municipality || '';
            const road = addr.road || '';
            return {
                neighborhood,
                city,
                state: addr.state || '',
                formattedAddress: `${road ? road + ', ' : ''}${neighborhood}, ${city}`
            };
        }
    } catch (e) {
        console.error('Reverse geocoding failed', e);
    }
    return {
        neighborhood: 'Desconhecido',
        city: '',
        state: '',
        formattedAddress: 'Ponto Médio Geográfico'
    };
}

// Helper: Haversine distance formula
function getHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Main Calculation flow calling secure backend API
async function handleCalculation() {
    const rawA = inputA.value.trim();
    const rawB = inputB.value.trim();

    if (!rawA || !rawB) {
        alert('Por favor, preencha os dois pontos de partida.');
        return;
    }

    // Enter Loading State
    loadingState.classList.remove('hidden');
    resultsSection.classList.add('hidden');
    btnCalculate.disabled = true;

    try {
        // Step 1: Resolve CEPs to formatted addresses
        const resolvedAddressA = await resolveInput(rawA);
        const resolvedAddressB = await resolveInput(rawB);

        // Step 2: Geocode both points
        const pointA = await geocodeAddress(resolvedAddressA, rawA);
        const pointB = await geocodeAddress(resolvedAddressB, rawB);

        // Step 3: Calculate midpoint coordinates
        const midLat = (pointA.lat + pointB.lat) / 2;
        const midLng = (pointA.lng + pointB.lng) / 2;

        // Step 4: Reverse geocode midpoint to get real neighborhood
        const midpointInfo = await reverseGeocode(midLat, midLng);
        const midpoint = {
            lat: midLat,
            lng: midLng,
            neighborhood: midpointInfo.neighborhood,
            city: midpointInfo.city,
            state: midpointInfo.state,
            formattedAddress: midpointInfo.formattedAddress
        };

        // Step 5: Distance calculation
        const distToA = getHaversineDistance(pointA.lat, pointA.lng, midLat, midLng);
        const distToB = getHaversineDistance(pointB.lat, pointB.lng, midLat, midLng);

        // Step 6: Use local backend endpoint which uses the server-side API key securely
        const response = await fetch('/api/calculate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                midpoint,
                selectedPlaceType
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro na API do Servidor: ${response.status} - ${errorText}`);
        }

        const result = await response.json();

        // Merge computed geo data with Gemini recommendations
        // Inject a simulated local sponsored café into the results
        const sponsoredPlace = {
            name: "Santo Grão Caffè",
            type: "Café",
            lat: midpoint.lat + 0.0015,
            lng: midpoint.lng - 0.0012,
            address: `Alameda das Flores, 850 - ${midpoint.neighborhood}`,
            description: "Destaque Parceiro: Ambiente incrível com Wi-Fi de alta velocidade, tomadas nas mesas e o melhor expresso artesanal da região. Perfeito para seu encontro!",
            averageRating: 4.9,
            isSponsored: true
        };

        const finalData = {
            pointA: { lat: pointA.lat, lng: pointA.lng, address: pointA.address },
            pointB: { lat: pointB.lat, lng: pointB.lng, address: pointB.address },
            midpoint,
            distanceKm: {
                aToMid: distToA,
                bToMid: distToB
            },
            establishments: [sponsoredPlace, ...result.establishments]
        };

        renderResults(finalData);
    } catch (error) {
        console.error('Calculation Error:', error);
        alert('Erro ao calcular o ponto médio. Por favor, verifique se os endereços/CEPs estão corretos ou tente novamente. Detalhes: ' + error.message);
    } finally {
        loadingState.classList.add('hidden');
        btnCalculate.disabled = false;
    }
}

// Render Results on UI
function renderResults(data) {
    // Update summary text
    midpointNeighborhood.textContent = `Bairro: ${data.midpoint.neighborhood}`;
    midpointAddress.textContent = `${data.midpoint.formattedAddress}`;
    distA.textContent = `${data.distanceKm.aToMid.toFixed(1)} km`;
    distB.textContent = `${data.distanceKm.bToMid.toFixed(1)} km`;

    // Clear and build establishments list
    placesList.innerHTML = '';
    
    data.establishments.forEach((est, index) => {
        const card = document.createElement('div');
        const isSp = est.isSponsored;
        card.className = isSp ? 'place-card sponsored' : 'place-card';
        
        let iconHtml = '<i class="fa-solid fa-mug-hot"></i>';
        if (selectedPlaceType.includes('shopping')) iconHtml = '<i class="fa-solid fa-bag-shopping"></i>';
        if (selectedPlaceType.includes('coworking')) iconHtml = '<i class="fa-solid fa-laptop-code"></i>';
        if (selectedPlaceType.includes('parque')) iconHtml = '<i class="fa-solid fa-tree"></i>';

        const labelHtml = isSp 
            ? `<span style="color: #10B981;"><i class="fa-solid fa-star"></i></span>` 
            : `${index}.`;

        card.innerHTML = `
            <div class="place-icon-container" style="${isSp ? 'background: rgba(16, 185, 129, 0.1); color: #10B981;' : ''}">
                ${isSp ? '<i class="fa-solid fa-store"></i>' : iconHtml}
            </div>
            <div class="place-info">
                <h4>${labelHtml} ${est.name} ${isSp ? '<span class="badge-sponsored">Patrocinado</span>' : ''}</h4>
                <p class="description">${est.description}</p>
                <div class="place-meta">
                    <span><i class="fa-solid fa-star" style="color: #FBBF24;"></i> ${est.averageRating || '4.5'}</span>
                    <span><i class="fa-solid fa-location-dot"></i> ${est.address}</span>
                </div>
            </div>
        `;

        // Click establishment card to zoom map
        card.addEventListener('click', () => {
            map.setView([est.lat, est.lng], 16);
            
            // Find marker to open its popup
            markers.forEach(m => {
                if (m.getLatLng().lat === est.lat && m.getLatLng().lng === est.lng) {
                    m.openPopup();
                }
            });
        });

        placesList.appendChild(card);
    });

    // Update map representation
    updateMap(data);

    // Show Results
    resultsSection.classList.remove('hidden');
}

// Initialize on Load
window.addEventListener('DOMContentLoaded', () => {
    initMap();
    setupEventListeners();
});
