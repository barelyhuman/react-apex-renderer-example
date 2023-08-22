import Chart from "chart.js/auto";
import { Apex } from "./Apex";
import debounce from "lodash.debounce";
import "./style.scss";

let chartRef = null;
let chartInstance = null;

export default function App() {
  return <Weather />;
}

const Weather = Apex(
  {
    forecast: {},
    locationSearchTerm: "",
    selectedLocation: {},
    locationList: [],
  },
  WeatherView
);

const debouncedSearch = debounce((value, data) => {
  fetchLocations(value).then((d) => {
    data.locationList = d;
  });
}, 350);

function WeatherView({ data }) {
  return (
    <>
      <p>
        Selected Location:{" "}
        {[data.selectedLocation.name, data.selectedLocation.country]
          .filter(Boolean)
          .join(",")}
      </p>
      <div class="autocomplete-wrapper">
        <input
          className="autocomplete-input"
          value={data.locationSearchTerm}
          onChange={async (e) => {
            data.locationSearchTerm = e.target.value;
            debouncedSearch(e.target.value, data);
          }}
        />
        <div class="autocomplete">
          {data.locationList.map((x) => {
            return (
              <LocationItem
                data={x}
                onClick={async (item) => {
                  onLocationSelect(item, data);
                }}
              />
            );
          })}
        </div>
      </div>
      <div class="mt-100px">
        <canvas
          ref={(node) => {
            if (node) {
              chartRef = node;
            }
          }}
        ></canvas>
      </div>{" "}
    </>
  );
}

function LocationItem({ data, onClick }) {
  return (
    <div class="autocomplete-item" onClick={() => onClick(data)}>
      {data.name},{data.country}
    </div>
  );
}

async function onLocationSelect(item, state) {
  state.selectedLocation = item;
  state.locationList = [];
  state.locationSearchTerm = "";
  const forecast = await getWeatherForecast(item);
  state.forecast = forecast;

  if (!chartInstance) {
    chartInstance = new Chart(chartRef, {
      type: "line",
      data: toChartJSConfig(forecast, state.selectedLocation),
      responsive: true,
    });
  } else {
    chartInstance.data = toChartJSConfig(forecast, state.selectedLocation);
    chartInstance.update();
  }
}

async function fetchLocations(searchTerm) {
  const locationData = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${searchTerm}&count=10&language=en&format=json`
  ).then((d) => d.json());

  return locationData.results || [];
}

async function getWeatherForecast(location) {
  const data = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&hourly=temperature_2m`
  ).then((d) => d.json());

  return (
    {
      ...data.hourly,
      temperatures: data.hourly.temperature_2m,
    } || {}
  );
}

function toChartJSConfig(forecast, location) {
  const data = {
    labels: forecast?.time?.map((x) => new Date(x).toLocaleDateString()) || [],
    datasets: [
      {
        label: [location.name, location.country].filter(Boolean).join(","),
        data: forecast.temperatures,
        borderColor: "#000",
        backgroundColor: "#181819",
        borderWidth: 2,
        borderRadius: Number.MAX_VALUE,
        borderSkipped: false,
      },
    ],
  };
  return data;
}
