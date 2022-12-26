const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "covid19India.db");
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB:Error ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

// GET states API 1

const convertStateObjToStateRes = (dbOb) => {
  return {
    stateId: dbOb.state_id,
    stateName: dbOb.state_name,
    population: dbOb.population,
  };
};

app.get("/states/", async (request, response) => {
  const getStatesQuery = `
        SELECT 
        *
        FROM 
        state;
    `;
  const dbRes = await db.all(getStatesQuery);
  response.send(dbRes.map((eachState) => convertStateObjToStateRes(eachState)));
});

// GET state API 2

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
    SELECT 
    *
    FROM 
    state 
    WHERE 
    state_id=${stateId};
    `;
  const dbResponse = await db.get(getStateQuery);
  response.send(convertStateObjToStateRes(dbResponse));
});

// ADD district API 3
app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const addDistrictQuery = `
    INSERT INTO 
    district(district_name,state_id,cases,cured,active,deaths)
    VALUES
    (
        '${districtName}',
        ${stateId},
        ${cases},
        ${cured},
        ${active},
        ${deaths}
    );
    `;
  await db.run(addDistrictQuery);
  response.send("District Successfully Added");
});

// GET district API 4

const convertDistObjToDistRes = (dbObj) => {
  return {
    districtId: dbObj.district_id,
    districtName: dbObj.district_name,
    stateId: dbObj.state_id,
    cases: dbObj.cases,
    cured: dbObj.cured,
    active: dbObj.active,
    deaths: dbObj.deaths,
  };
};

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT 
    *
    FROM 
    district 
    WHERE 
    district_id=${districtId};
    `;
  const dbRes = await db.get(getDistrictQuery);
  response.send(convertDistObjToDistRes(dbRes));
});

// DELETE district API 5

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
  DELETE FROM
    district
  WHERE
    district_id = ${districtId};`;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

// UPDATE district API 6

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updateDistrictQuery = `
    UPDATE
    district 
    SET 
    district_name='${districtName}',
    state_id=${stateId},
    cases=${cases},
    cured=${cured},
    active=${active},
    deaths=${deaths}
    WHERE 
    district_id=${districtId};
    `;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

// GET stats of total cases API 7

const convertObjToRes = (dbObj) => {
  return {
    totalCases: dbObj.total_cases,
    totalCured: dbObj.total_cured,
    totalActive: dbObj.total_active,
    totalDeaths: dbObj.total_deaths,
  };
};

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStatsQuery = `
     SELECT 
     SUM(district.cases) AS total_cases,
     SUM(district.cured) AS total_cured,
     SUM(district.active) AS total_active,
     SUM(district.deaths) AS total_deaths
     FROM district
     WHERE 
     state_id=${stateId};
     `;
  const stats = await db.get(getStatsQuery);
  response.send(convertObjToRes(stats));
});

//GET state name of district ID API 8

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictIdQuery = `select state_id from district where district_id = ${districtId};`;
  const getDistrictIdQueryResponse = await db.get(getDistrictIdQuery);
  //console.log(typeof getDistrictIdQueryResponse.state_id);
  const getStateNameQuery = `select state_name as stateName from state where 
  state_id = ${getDistrictIdQueryResponse.state_id}`;
  const getStateNameQueryResponse = await db.get(getStateNameQuery);
  response.send(getStateNameQueryResponse);
});

module.exports = app;
