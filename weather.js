// =======================================
// DOM 요소 선택
// =======================================
const inputForm = document.getElementById("input-form");
const cityInput = document.getElementById("city-input");
const weatherResult = document.getElementById("weather-result");

// =======================================
// 1. 지역 검색 함수 (Geocoding API)
// =======================================
async function getLocation(cityName) {
  // 1) 특별시, 광역시 등을 영문으로 안전하게 변환해 주는 맵 (기존 유지)
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

  // 검색 시도할 쿼리 목록을 담을 배열
  let searchQueries = [];

  // 만약 cityMap에 있는 특별시/광역시라면 그 값을 최우선으로 넣음
  if (cityMap[cityName]) {
    searchQueries.push(cityMap[cityName]);
  }

  // 입력어 자체를 다음 순서로 추가
  searchQueries.push(cityName);

  // 만약 입력어에 이미 행정구역 접미사가 없다면 '시'를 붙인 버전도 검색 후보에 추가
  const suffixes = ["시", "군", "구", "도", "특별시", "광역시"];
  const hasSuffix = suffixes.some((suffix) => cityName.endsWith(suffix));

  if (!hasSuffix && !cityMap[cityName]) {
    searchQueries.push(cityName + "시");
  }

  let locationData = null;

  // 준비된 검색어들로 순서대로 API 요청 시도 (중복 제거)
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
      break; // 찾으면 바로 반복문 탈출
    }
  }

  if (!locationData) {
    throw new Error("검색 결과가 없습니다.");
  }

  return locationData;
}

// =======================================
// 2. 날씨 정보 조회 함수 (Forecast API)
// =======================================
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

// =======================================
// 3. 화면 출력 함수
// =======================================
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

// =======================================
// 4. 이벤트 리스너 등록
// =======================================
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
