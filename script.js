const API_KEY = '834af70c';
const API_BASE_URL = 'https://www.omdbapi.com/';
const SERIE_TITLE = 'The Crown';

const elements = {
    searchInput: document.getElementById('searchInput'),
    searchBtn: document.getElementById('searchBtn'),
    loading: document.getElementById('loading'),
    errorMessage: document.getElementById('errorMessage'),
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
    noResults: document.getElementById('noResults')
};

let currentSeries = null;
let seasonsData = {};

// Event Listeners
elements.searchBtn.addEventListener('click', handleSearch);
elements.searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});

async function handleSearch() {
    const query = elements.searchInput.value.trim();

    if (API_KEY === 'TU_API_KEY_AQUI' || !API_KEY) {
        showError('Debes configurar tu API Key en el código JavaScript. Edita la constante API_KEY al inicio del script.');
        return;
    }

    if (!query) {
        showError('Por favor ingresa un título para buscar');
        return;
    }

    clearError();
    showLoading(true);
    hideSeriesInfo();

    try {
        const searchData = await fetchAPI({ s: query, type: 'series', apikey: API_KEY });
        
        if (searchData.Response === 'False' || !searchData.Search || searchData.Search.length === 0) {
            showNoResults();
            return;
        }

        const series = searchData.Search[0];
        const imdbID = series.imdbID;

        // VALIDACIÓN: SOLO PERMITIR "THE CROWN"
        const seriesTitle = series.Title.toLowerCase();
        if (!seriesTitle.includes('the crown') && !seriesTitle.includes('crown')) {
            showNoResults();
            return;
        }

        const seriesDetails = await fetchAPI({ i: imdbID, plot: 'full', apikey: API_KEY });
        
        if (seriesDetails.Response === 'False') {
            showError('No se pudieron obtener los detalles de la serie');
            return;
        }

        currentSeries = seriesDetails;
        
        const totalSeasons = parseInt(seriesDetails.totalSeasons) || 1;
        seasonsData = {};

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

        displaySeriesInfo(seriesDetails);
        displaySeasons(totalSeasons);

        if (totalSeasons > 0) {
            selectSeason(1);
        }

    } catch (error) {
        showError('Error al conectar con la API: ' + error.message);
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
    elements.seriesPoster.src = series.Poster !== 'N/A' ? series.Poster : 'https://via.placeholder.com/300x450?text=No+Poster';
    elements.seriesTitle.textContent = series.Title;
    elements.seriesYear.textContent = series.Year;
    elements.seriesRated.textContent = series.Rated;
    elements.seriesRuntime.textContent = series.Runtime;
    
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
    elements.noResults.style.display = 'none';
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
                    <span> ${released}</span>
                    <span> ${runtime}</span>
                    <span class="episode-rating"> ${rating}</span>
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
    hideSeriesInfo();
    elements.noResults.style.display = 'none';
}

function clearError() {
    elements.errorMessage.classList.remove('active');
    elements.errorMessage.textContent = '';
}

function showNoResults() {
    hideSeriesInfo();
    elements.noResults.style.display = 'block';
}

function hideSeriesInfo() {
    elements.seriesInfo.classList.remove('active');
    elements.seasonsTabs.innerHTML = '';
    elements.episodesContainer.innerHTML = '';
}

document.addEventListener('DOMContentLoaded', () => {
    elements.searchInput.disabled = false;
    elements.searchBtn.disabled = false;
    elements.searchInput.placeholder = 'The Crown';
    elements.searchInput.value = SERIE_TITLE;
    handleSearch();
});