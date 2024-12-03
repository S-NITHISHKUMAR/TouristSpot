import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap CSS

const TouristSpotFinder = () => {
  const [city, setCity] = useState("");
  const [touristSpots, setTouristSpots] = useState([]);
  const [error, setError] = useState("");

  // Geoapify API key
  const geoapifyApiKey = "56f1d3b1d8d141ad8dc89f9d569afeec"; 
  // Unsplash API key
  const unsplashAccessKey = "Qyr37XFaUExgRwo0LhosrXuWCosSSjt1mXXm-WBx0as"; 
  // Default image URL
  const defaultImageUrl = 'https://southafricatoday.net/travel/wp-content/uploads/2018/03/481.jpg'; 

  useEffect(() => {
    const storedCity = localStorage.getItem("lastSearchedCity");
    const storedSpots = localStorage.getItem("lastSearchedSpots");

    if (storedCity) {
      setCity(storedCity);
    }

    if (storedSpots) {
      setTouristSpots(JSON.parse(storedSpots));
    }
  }, []);

  const fetchUnsplashPhoto = async (placeName) => {
    try {
      const response = await axios.get(
        `https://api.unsplash.com/search/photos?query=${placeName}&client_id=${unsplashAccessKey}&per_page=1`
      );
      if (response.data.results.length > 0) {
        return response.data.results[0].urls.small;
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error fetching Unsplash photo:", error);
      return null;
    }
  };

  const fetchTouristSpots = async (cityName) => {
    try {
      const geoResponse = await axios.get(
        `https://api.geoapify.com/v1/geocode/search?text=${cityName}&apiKey=${geoapifyApiKey}`
      );

      if (geoResponse.data.features.length === 0) {
        setError("City not found.");
        setTouristSpots([]);
        return;
      }

      const { lat, lon } = geoResponse.data.features[0].properties;

      const response = await axios.get(
        `https://api.geoapify.com/v2/places?categories=tourism.sights&filter=circle:${lon},${lat},10000&limit=10&apiKey=${geoapifyApiKey}`
      );

      const spots = response.data.features;

      const spotsWithImages = await Promise.all(spots.map(async (spot) => {
        const photoUrl = await fetchUnsplashPhoto(spot.properties.name);
        return { ...spot, photoUrl: photoUrl || defaultImageUrl };
      }));

      setTouristSpots(spotsWithImages);
      setError("");

      localStorage.setItem("lastSearchedCity", cityName);
      localStorage.setItem("lastSearchedSpots", JSON.stringify(spotsWithImages));
    } catch (error) {
      console.error("Error fetching tourist spots:", error);
      setError("Could not fetch tourist spots. Please try again.");
      setTouristSpots([]);
    }
  };

  const handleMapNavigation = (lat, lon) => {
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
    window.open(googleMapsUrl, '_blank'); // Open Google Maps in a new tab
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (city.trim() !== "") {
      fetchTouristSpots(city);
    }
  };

  return (
    <div className="container mt-4">
      <h1 className="text-center mb-4">Tourist Spot Finder</h1>
      <form onSubmit={handleSubmit} className="d-flex justify-content-center mb-4">
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Enter city"
          className="form-control me-2"
          style={{ maxWidth: "400px" }}
        />
        <button type="submit" className="btn btn-primary">Find Tourist Spots</button>
      </form>

      {error && <p className="text-center text-danger">{error}</p>}

      {touristSpots.length > 0 && (
        <div>
          <h3 className="text-center">Top Tourist Spots in {city}</h3>
          <div className="row row-cols-1 row-cols-md-2 g-4">
            {touristSpots.map((spot, index) => (
              <div key={index} className="col">
                <div className="card h-100">
                  <img
                    src={spot.photoUrl}
                    alt={spot.properties.name}
                    className="card-img-top"
                    style={{ height: "250px", objectFit: "cover" }} // Adjusting image size
                  />
                  <div className="card-body">
                    <h5 className="card-title">{spot.properties.name}</h5>
                    <button
                      onClick={() => handleMapNavigation(spot.properties.lat, spot.properties.lon)}
                      className="btn btn-success"
                    >
                      Navigate to Map
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TouristSpotFinder;
