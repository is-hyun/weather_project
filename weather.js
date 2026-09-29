// =======================================
// DOM 요소 선택
// =======================================
const inputForm = document.getElementById("input-form");
const cityInput = document.getElementById("city-input");
const weatherResult = document.getElementById("weather-result");

async function getLocation(cityName) {
  const cityMap = {
    서울: "seoul",
    울산: "ulsan",
    부산: "busan",
    대구: "daegu",
    인천: "incheon",
    광주: "gwangju",
    대전: "daejeon",
    제주: "jeju",
    전주: "jeonju",
  };

  let searchQueries = [];

  if (cityMap[cityName]) {
    searchQueries.push(cityMap[cityName]);
  }

  searchQueries.push(cityName);

  const suffixes = ["시", "군", "구", "도", "특별시", "광역시"];
  const hasSuffix = suffixes.some((suffix) => cityName.endsWith(suffix));

  if (!hasSuffix && !cityMap[cityName]) {
    searchQueries.push(cityName + "시");
  }

  let locationData = null;

  const uniqueQueries = [...new Set(searchQueries)];

  for (const query of uniqueQueries) {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=ko&format=json`;
    const response = await fetch(url);

    if (!response.ok) {
      continue;
    }

    const data = await response.json();

    if (data.results && data.results.length > 0) {
      locationData = data.results[0];
      break;
    }
  }

  if (!locationData) {
    throw new Error("검색 결과가 없습니다.");
  }

  return locationData;
}

async function getWeather(latitude, longitude) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,precipitation_probability,wind_speed_10m&timezone=auto`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`날씨 조회 실패 (상태 코드: ${response.status})`);
  }

  const data = await response.json();

  if (!data.current) {
    throw new Error("현재 날씨 데이터를 찾을 수 없습니다.");
  }

  return data.current;
}

function DisplayResult(location, weather) {
  weatherResult.innerHTML = `
    <h3>${location.name} (${location.country || ""})</h3>
    <ul>
      <li>현재 기온: <strong>${weather.temperature_2m}℃</strong></li>
      <li>체감 온도: <strong>${weather.apparent_temperature}℃</strong></li>
      <li>강수 확률: <strong>${weather.precipitation_probability}%</strong></li>
      <li>풍속: <strong>${weather.wind_speed_10m} m/s</strong></li>
    </ul>
  `;
}

inputForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const cityName = cityInput.value.trim();

  if (!cityName) {
    weatherResult.textContent = "도시 이름을 입력해주세요!";
    return;
  }

  weatherResult.textContent = "Loading (날씨 정보 조회 중) ······";

  try {
    // 1) 위치 정보 가져오기
    const location = await getLocation(cityName);

    // 2) 날씨 정보 가져오기
    const weather = await getWeather(location.latitude, location.longitude);

    // 3) 화면 출력 함수 호출
    DisplayResult(location, weather);
  } catch (error) {
    console.error(error);
    weatherResult.textContent = "요청 실패 : " + error.message;
  }
});
