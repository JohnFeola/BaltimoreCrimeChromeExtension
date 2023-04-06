document.addEventListener('DOMContentLoaded', () => {
document.getElementById('address-form').addEventListener('submit', async (e) => {
    e.preventDefault();
  


    const spinner = document.getElementById('loading-spinner');
    spinner.style.display = 'flex';
    

    const address = document.getElementById('address').value;
    if (!address) {
      alert('Please enter an address.');
      spinner.style.display = 'none';
      return;
    }


    try{
    // Convert address to coordinates using your preferred geocoding service.
    const {latitude, longitude} = await geocodeAddress(address);
  
    // Fetch crime data.
    const crimeData = await fetchCrimeData(latitude, longitude);
  
    // Display results.
    displayResults(crimeData);
    } catch(error){
        console.error(error);
        alert('An error occured')
    }finally{
        document.getElementById('loading-spinner').style.display = 'none';
    }
    }
  );
  

  //API KEY..... for Google Maps GeoCoding
  async function geocodeAddress(address) {
    // Implement this function using your preferred geocoding service, such as Google Maps Geocoding API or OpenStreetMap's Nominatim.
    const apiKey = process.env.GOOGLE_API_KEY;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
  
    const response = await fetch(url);
    const data = await response.json();
  
    if (data.status === 'OK') {
      const location = data.results[0].geometry.location;
      return {
        latitude: location.lat,
        longitude: location.lng,
      };
    } else {
      throw new Error('Unable to geocode the address');
    }
  }
  
  async function fetchCrimeData(latitude, longitude) {
    const apiUrl = `https://opendata.baltimorecity.gov/egis/rest/services/NonSpatialTables/part1_Crime_1/FeatureServer/0/query?outFields=*&where=1%3D1&f=geojson`;
    const radius = 2.4
    const url = 'https://opendata.baltimorecity.gov/egis/rest/services/NonSpatialTables/part1_Crime_1/FeatureServer/0/query?outFields=*&where=1%3D1&f=geojson';

    const response = await fetch(url);
    const data = await response.json();
    const crimeFeatures = data.features;
  
    // Filter crimes within the radius

    const timeframes = document.getElementsByName('timeframe');
  let selectedTimeframe;
  for (const timeframe of timeframes) {
    if (timeframe.checked) {
      selectedTimeframe = parseInt(timeframe.value);
      break;
    }
  }

  const currentDate = new Date();
  const pastDate = new Date(currentDate - selectedTimeframe * 24 * 60 * 60 * 1000);

    const filteredCrimes = crimeFeatures.filter((crime) => {
      const crimeLatitude = parseFloat(crime.properties.Latitude);
      const crimeLongitude = parseFloat(crime.properties.Longitude);
      const crimeDate = new Date(crime.properties.CrimeDateTime);

      if (!crimeLatitude || !crimeLongitude || !crimeDate) {
        return false;
      }
  
      const distance = haversineDistance(latitude, longitude, crimeLatitude, crimeLongitude);
      return distance <= radius && crimeDate >= pastDate;
    });
  
    // Map filtered crimes to a simpler object
    return filteredCrimes.map((crime) => ({
      description: crime.properties.Description,
      date: new Date(crime.properties.CrimeDateTime).toLocaleString(),
      location: crime.properties.Location,
    }));
    // Fetch data, filter by distance, and parse relevant information.
    //use Turf.js to accomplish this
  }

  function haversineDistance(lat1, lon1, lat2, lon2) {
    function toRad(value) {
      return (value * Math.PI) / 180;
    }
  
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
  
    return distance;
  }
  
  function displayResults(crimeData) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';
  
    if (crimeData.length === 0) {
      resultsDiv.innerHTML = 'No crimes found within a 2-mile radius of your address in the specified timeframe.';
    } else {
      const list = document.createElement('ul');
      crimeData.forEach(crime => {
        const listItem = document.createElement('li');
        const date = new Date(crime.date);
        const dateString = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
        listItem.textContent = `${crime.description.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} on ${dateString}`;
        list.appendChild(listItem);
      });
      resultsDiv.appendChild(list);
    }
  }
})




//   document.getElementById('save-address').addEventListener('click', () => {
//     const address = document.getElementById('address').value;
//     if (!address) {
//       alert('Please enter an address.');
//       return;
//     }
//     saveAddress(address);
//   });

//   // Saved Addresses button event listener
//   document.getElementById('saved-addresses').addEventListener('click', () => {
//     showSavedAddresses();
//   });

//   function saveAddress(address) {
//     let addresses = JSON.parse(localStorage.getItem('savedAddresses')) || [];
//     if (!addresses.includes(address)) {
//       addresses.push(address);
//       localStorage.setItem('savedAddresses', JSON.stringify(addresses));
//     }
//   }

//   function showSavedAddresses() {
//     const addresses = JSON.parse(localStorage.getItem('savedAddresses')) || [];
//     const listContainer = document.getElementById('saved-addresses-list');
//     listContainer.innerHTML = '';

//     if (addresses.length === 0) {
//       listContainer.innerHTML = 'No saved addresses.';
//     } else {
//       const list = document.createElement('ul');
//       addresses.forEach((address) => {
//         const listItem = document.createElement('li');
//         listItem.textContent = address;
//         listItem.style.cursor = 'pointer';
//         listItem.addEventListener('click', () => {
//           document.getElementById('address').value = address;
//         });
//         list.appendChild(listItem);
//       });
//       listContainer.appendChild(list);
//     }
//   }