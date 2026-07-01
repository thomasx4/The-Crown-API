const API_KEY = '834af70c';
const API_BASE_URL = 'https://www.omdbapi.com/';

const elements = {
    searchInput: document.getElementById('searchInput'),
    searchBtn: document.getElementById('searchBtn'),
    loading: document.getElementById('loading'),
    errorMessage: document.getElementById('errorMessage'),
    resultsContainer: document.getElementById('resultsContainer'),
    seriesInfo: document.getElementById('seriesInfo'),
    seriesPoster: document.getElementById('seriesPoster'),
    seriesTitle: document.getElementById('seriesTitle'),
    seriesYear: document.getElementById('seriesYear'),
    seriesRated: document.getElementById('seriesRated'),
    seriesRuntime: document.getElementById('seriesRuntime'),
    seriesImdbRating: document.getElementById('seriesImdbRating'),
    seriesPlot: document.getElementById('seriesPlot'),
    seriesGenre: document.getElementById('seriesGenre'),
    seriesActors: document.getElementById('seriesActors'),
    seriesDirector: document.getElementById('seriesDirector'),
    seriesCountry: document.getElementById('seriesCountry'),
    seriesLanguage: document.getElementById('seriesLanguage'),
    seriesAwards: document.getElementById('seriesAwards'),
    seasonsTabs: document.getElementById('seasonsTabs'),
    episodesContainer: document.getElementById('episodesContainer'),
    noResults: document.getElementById('noResults'),
    backToResults: document.getElementById('backToResults'),
    filterAll: document.getElementById('filterAll'),
    filterSeries: document.getElementById('filterSeries'),
    filterMovies: document.getElementById('filterMovies')
};

let currentResults = [];
let currentFilter = 'all';
let currentQuery = '';
let currentSeries = null;
let seasonsData = {};

// Variables para paginación
let allSeriesResults = [];
let allMovieResults = [];
let currentPage = 1;
let totalSeriesResults = 0;
let totalMovieResults = 0;
let isLoadingMore = false;

// Event Listeners
elements.searchBtn.addEventListener('click', () => {
    currentPage = 1;
    allSeriesResults = [];
    allMovieResults = [];
    handleSearch();
});

elements.searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        currentPage = 1;
        allSeriesResults = [];
        allMovieResults = [];
        handleSearch();
    }
});

// Filtros
elements.filterAll.addEventListener('click', () => {
    currentFilter = 'all';
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === 'all');
    });
    applyFilter();
});

elements.filterSeries.addEventListener('click', () => {
    currentFilter = 'series';
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === 'series');
    });
    applyFilter();
});

elements.filterMovies.addEventListener('click', () => {
    currentFilter = 'movie';
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === 'movie');
    });
    applyFilter();
});

// Botón volver
elements.backToResults.addEventListener('click', () => {
    elements.seriesInfo.classList.remove('active');
    elements.resultsContainer.style.display = 'block';
    elements.backToResults.style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

async function handleSearch() {
    const query = elements.searchInput.value.trim();

    if (!query) {
        showError('Por favor ingresa un título para buscar');
        return;
    }

    // Validación: Solo permitir búsquedas con "Crown"
    const queryLower = query.toLowerCase();
    if (!queryLower.includes('crown')) {
        showError('Solo se permiten búsquedas relacionadas con "Crown"');
        elements.noResults.style.display = 'none';
        hideResults();
        hideSeriesInfo();
        return;
    }

    currentQuery = query;
    clearError();
    showLoading(true);
    hideSeriesInfo();
    hideResults();
    elements.noResults.style.display = 'none';

    try {
        // Buscar primera página de series y películas
        const seriesData = await fetchAPI({ s: query, type: 'series', page: currentPage, apikey: API_KEY });
        const movieData = await fetchAPI({ s: query, type: 'movie', page: currentPage, apikey: API_KEY });
        
        // Guardar resultados y totales
        if (seriesData.Response === 'True' && seriesData.Search) {
            allSeriesResults = seriesData.Search;
            totalSeriesResults = parseInt(seriesData.totalResults) || 0;
        }

        if (movieData.Response === 'True' && movieData.Search) {
            allMovieResults = movieData.Search;
            totalMovieResults = parseInt(movieData.totalResults) || 0;
        }

        // Combinar resultados
        let results = [];
        if (allSeriesResults.length > 0) {
            results = results.concat(allSeriesResults);
        }
        if (allMovieResults.length > 0) {
            results = results.concat(allMovieResults);
        }

        if (results.length === 0) {
            elements.noResults.style.display = 'block';
            return;
        }

        currentResults = results;
        applyFilter();

    } catch (error) {
        showError('Error al conectar con la API: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// FUNCIÓN PARA CARGAR MÁS RESULTADOS
async function loadMoreResults() {
    if (isLoadingMore) return;
    isLoadingMore = true;

    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.textContent = 'Cargando...';
        loadMoreBtn.disabled = true;
    }

    try {
        currentPage++;
        
        // Buscar siguiente página de series y películas
        const seriesData = await fetchAPI({ s: currentQuery, type: 'series', page: currentPage, apikey: API_KEY });
        const movieData = await fetchAPI({ s: currentQuery, type: 'movie', page: currentPage, apikey: API_KEY });
        
        let newResults = [];

        if (seriesData.Response === 'True' && seriesData.Search) {
            allSeriesResults = allSeriesResults.concat(seriesData.Search);
            newResults = newResults.concat(seriesData.Search);
        }

        if (movieData.Response === 'True' && movieData.Search) {
            allMovieResults = allMovieResults.concat(movieData.Search);
            newResults = newResults.concat(movieData.Search);
        }

        if (newResults.length === 0) {
            if (loadMoreBtn) {
                loadMoreBtn.textContent = 'No hay más resultados';
                loadMoreBtn.disabled = true;
            }
            isLoadingMore = false;
            return;
        }

        currentResults = [...allSeriesResults, ...allMovieResults];
        applyFilter();

        // Verificar si hay más resultados
        const totalLoaded = allSeriesResults.length + allMovieResults.length;
        const totalAvailable = totalSeriesResults + totalMovieResults;

        if (totalLoaded >= totalAvailable) {
            if (loadMoreBtn) {
                loadMoreBtn.textContent = 'No hay más resultados';
                loadMoreBtn.disabled = true;
            }
        } else {
            if (loadMoreBtn) {
                loadMoreBtn.textContent = `Cargar más (${totalLoaded}/${totalAvailable})`;
                loadMoreBtn.disabled = false;
            }
        }

    } catch (error) {
        showError('Error al cargar más resultados: ' + error.message);
    } finally {
        isLoadingMore = false;
    }
}

function applyFilter() {
    let filtered = currentResults;

    if (currentFilter === 'series') {
        filtered = currentResults.filter(item => item.Type === 'series');
    } else if (currentFilter === 'movie') {
        filtered = currentResults.filter(item => item.Type === 'movie');
    }

    if (filtered.length === 0) {
        elements.noResults.style.display = 'block';
        hideResults();
        return;
    }

    elements.noResults.style.display = 'none';
    renderResults(filtered);
}

function renderResults(results) {
    const seriesCount = results.filter(item => item.Type === 'series').length;
    const movieCount = results.filter(item => item.Type === 'movie').length;
    const totalLoaded = allSeriesResults.length + allMovieResults.length;
    const totalAvailable = totalSeriesResults + totalMovieResults;
    const hasMore = totalLoaded < totalAvailable;

    let html = `
        <div class="results-list">
            <div class="results-header">
                <h3>Resultados (${results.length})</h3>
                <div class="results-stats">
                    <span class="stat-badge series">Series: ${seriesCount}</span>
                    <span class="stat-badge movie">Películas: ${movieCount}</span>
                    <span class="stat-badge total">Total: ${totalAvailable}</span>
                </div>
            </div>
            <div class="results-grid">
    `;

    results.forEach((item) => {
        const typeClass = item.Type === 'series' ? 'series' : 'movie';
        const posterUrl = item.Poster !== 'N/A' ? item.Poster : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="150"%3E%3Crect width="100" height="150" fill="%232a2420"/%3E%3C/svg%3E';
        
        html += `
            <div class="result-card ${typeClass}" onclick="selectResult('${item.imdbID}')">
                <img src="${posterUrl}" alt="${item.Title}" loading="lazy">
                <div class="result-info">
                    <h4>${item.Title}</h4>
                    <div class="result-meta">
                        <span class="result-year">${item.Year}</span>
                        <span class="result-type ${typeClass}">${item.Type}</span>
                    </div>
                </div>
            </div>
        `;
    });

    html += '</div>';

    // Botón de "Cargar más"
    if (hasMore) {
        html += `
            <div class="load-more-container">
                <button id="loadMoreBtn" class="load-more-btn" onclick="loadMoreResults()">
                    Cargar más resultados (${totalLoaded}/${totalAvailable})
                </button>
            </div>
        `;
    } else if (totalLoaded > 0) {
        html += `
            <div class="load-more-container">
                <button class="load-more-btn" disabled style="opacity:0.4;cursor:not-allowed;">
                    Todos los resultados cargados (${totalLoaded})
                </button>
            </div>
        `;
    }

    html += '</div>';

    elements.resultsContainer.innerHTML = html;
    elements.resultsContainer.style.display = 'block';
}

function hideResults() {
    elements.resultsContainer.style.display = 'none';
}

async function selectResult(imdbID) {
    showLoading(true);
    hideResults();
    elements.backToResults.style.display = 'inline-block';

    try {
        const details = await fetchAPI({ i: imdbID, plot: 'full', apikey: API_KEY });
        
        if (details.Response === 'False') {
            showError('No se pudieron obtener los detalles');
            return;
        }

        currentSeries = details;
        
        const totalSeasons = parseInt(details.totalSeasons) || 0;
        seasonsData = {};

        if (totalSeasons > 0) {
            const seasonPromises = [];
            for (let i = 1; i <= totalSeasons; i++) {
                seasonPromises.push(
                    fetchAPI({ i: imdbID, Season: i, apikey: API_KEY })
                        .then(data => {
                            if (data.Response === 'True') {
                                seasonsData[i] = data;
                            }
                        })
                        .catch(() => {})
                );
            }
            await Promise.all(seasonPromises);
        }

        displaySeriesInfo(details);
        
        if (totalSeasons > 0) {
            displaySeasons(totalSeasons);
            selectSeason(1);
        } else {
            elements.seasonsTabs.innerHTML = '';
            elements.episodesContainer.innerHTML = `
                <div class="no-results" style="padding: 30px;">
                    Esta es una película, no tiene temporadas
                </div>
            `;
        }

        elements.seriesInfo.scrollIntoView({ behavior: 'smooth', block: 'start' });

    } catch (error) {
        showError('Error al obtener detalles: ' + error.message);
    } finally {
        showLoading(false);
    }
}

async function fetchAPI(params) {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}?${queryString}`);
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
}

function displaySeriesInfo(series) {
    const posterUrl = series.Poster !== 'N/A' ? series.Poster : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="450"%3E%3Crect width="300" height="450" fill="%232a2420"/%3E%3C/svg%3E';
    
    elements.seriesPoster.src = posterUrl;
    elements.seriesTitle.textContent = series.Title;
    elements.seriesYear.textContent = series.Year;
    elements.seriesRated.textContent = series.Rated || 'N/A';
    elements.seriesRuntime.textContent = series.Runtime || 'N/A';
    
    const imdbRating = series.imdbRating !== 'N/A' ? ` ${series.imdbRating}/10` : 'Sin rating';
    elements.seriesImdbRating.textContent = imdbRating;
    
    elements.seriesPlot.textContent = series.Plot !== 'N/A' ? series.Plot : 'Sin descripción disponible';
    elements.seriesGenre.textContent = series.Genre || 'N/A';
    elements.seriesActors.textContent = series.Actors || 'N/A';
    elements.seriesDirector.textContent = series.Director || 'N/A';
    elements.seriesCountry.textContent = series.Country || 'N/A';
    elements.seriesLanguage.textContent = series.Language || 'N/A';
    elements.seriesAwards.textContent = series.Awards || 'N/A';

    elements.seriesInfo.classList.add('active');
}

function displaySeasons(totalSeasons) {
    elements.seasonsTabs.innerHTML = '';
    
    for (let i = 1; i <= totalSeasons; i++) {
        const tab = document.createElement('button');
        tab.className = 'season-tab';
        tab.textContent = `Temporada ${i}`;
        tab.dataset.season = i;
        tab.addEventListener('click', () => selectSeason(i));
        elements.seasonsTabs.appendChild(tab);
    }
}

function selectSeason(seasonNum) {
    document.querySelectorAll('.season-tab').forEach(tab => {
        tab.classList.toggle('active', parseInt(tab.dataset.season) === seasonNum);
    });
    displayEpisodes(seasonNum);
}

function displayEpisodes(seasonNum) {
    const seasonData = seasonsData[seasonNum];
    
    if (!seasonData || !seasonData.Episodes) {
        elements.episodesContainer.innerHTML = '<div class="no-results">No hay información disponible para esta temporada</div>';
        return;
    }

    const episodes = seasonData.Episodes;
    
    let html = '<div class="episodes-container active"><div class="episodes-grid">';
    
    episodes.forEach((episode) => {
        const rating = episode.imdbRating !== 'N/A' ? episode.imdbRating : 'N/A';
        const plot = episode.Plot !== 'N/A' ? episode.Plot : 'Sin descripción disponible';
        const runtime = episode.Runtime !== 'N/A' ? episode.Runtime : 'Duración no disponible';
        const released = episode.Released !== 'N/A' ? episode.Released : 'Fecha no disponible';
        
        html += `
            <div class="episode-card" onclick="togglePlot(this)">
                <div class="episode-number">${episode.Episode}</div>
                <div class="episode-title">${episode.Title}</div>
                <div class="episode-meta">
                    <span>${released}</span>
                    <span>${runtime}</span>
                    <span class="episode-rating">${rating}</span>
                </div>
                <div class="episode-plot">${plot}</div>
                <span class="toggle-plot">Ver más ↓</span>
            </div>
        `;
    });
    
    html += '</div></div>';
    elements.episodesContainer.innerHTML = html;
}

function togglePlot(card) {
    card.classList.toggle('expanded');
    const toggle = card.querySelector('.toggle-plot');
    toggle.textContent = card.classList.contains('expanded') ? 'Ver menos ↑' : 'Ver más ↓';
}

function showLoading(show) {
    elements.loading.classList.toggle('active', show);
    elements.searchBtn.disabled = show;
}

function showError(message) {
    elements.errorMessage.textContent = message;
    elements.errorMessage.classList.add('active');
    elements.noResults.style.display = 'none';
}

function clearError() {
    elements.errorMessage.classList.remove('active');
    elements.errorMessage.textContent = '';
}

function hideSeriesInfo() {
    elements.seriesInfo.classList.remove('active');
    elements.seasonsTabs.innerHTML = '';
    elements.episodesContainer.innerHTML = '';
}

// Carga automática al iniciar
document.addEventListener('DOMContentLoaded', () => {
    elements.searchInput.value = 'Crown';
    currentPage = 1;
    allSeriesResults = [];
    allMovieResults = [];
    handleSearch();
});