import http from "k6/http";
import { check, group, sleep } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";

// ---------------------------------------------
// Config
// ---------------------------------------------
var BASE_URL = __ENV.BASE_URL || "http://localhost:8080";
var PROFILE = (__ENV.K6_PROFILE || "standard").toLowerCase();

function scenariosForProfile(profile) {
  if (profile === "smoke") {
    return {
      smoke: {
        executor: "constant-vus",
        vus: 1,
        duration: "45s",
        tags: { scenario: "smoke" },
      },
    };
  }

  if (profile === "full") {
    return {
      smoke: {
        executor: "constant-vus",
        vus: 1,
        duration: "45s",
        startTime: "0s",
        tags: { scenario: "smoke" },
      },
      load: {
        executor: "ramping-vus",
        startVUs: 0,
        stages: [
          { duration: "1m", target: 20 },
          { duration: "3m", target: 20 },
          { duration: "1m", target: 0 },
        ],
        startTime: "50s",
        tags: { scenario: "load" },
      },
      stress: {
        executor: "ramping-vus",
        startVUs: 0,
        stages: [
          { duration: "1m", target: 50 },
          { duration: "2m", target: 100 },
          { duration: "2m", target: 100 },
          { duration: "1m", target: 0 },
        ],
        startTime: "6m",
        tags: { scenario: "stress" },
      },
      spike: {
        executor: "ramping-vus",
        startVUs: 0,
        stages: [
          { duration: "10s", target: 180 },
          { duration: "30s", target: 180 },
          { duration: "10s", target: 0 },
        ],
        startTime: "13m",
        tags: { scenario: "spike" },
      },
    };
  }

  // standard
  return {
    smoke: {
      executor: "constant-vus",
      vus: 1,
      duration: "30s",
      startTime: "0s",
      tags: { scenario: "smoke" },
    },
    load: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "1m", target: 12 },
        { duration: "2m", target: 12 },
        { duration: "1m", target: 0 },
      ],
      startTime: "35s",
      tags: { scenario: "load" },
    },
  };
}

// ---------------------------------------------
// Metrics
// ---------------------------------------------
var contractChecks = new Rate("contract_checks");
var server5xx = new Counter("server_5xx");
var unexpected4xx = new Counter("unexpected_4xx");
var apiErrors = new Counter("api_errors");

var authDuration = new Trend("auth_duration");
var browseDuration = new Trend("browse_duration");
var causeOpsDuration = new Trend("cause_ops_duration");
var taskOpsDuration = new Trend("task_ops_duration");

export var options = {
  scenarios: scenariosForProfile(PROFILE),
  thresholds: {
    http_req_duration: ["p(95)<1200", "p(99)<2500"],
    http_req_failed: ["rate<0.02"],
    contract_checks: ["rate>0.98"],
    server_5xx: ["count<1"],
    unexpected_4xx: ["count<1"],
    auth_duration: ["p(95)<1200"],
    cause_ops_duration: ["p(95)<1500"],
    task_ops_duration: ["p(95)<1500"],
  },
};

// ---------------------------------------------
// Helpers
// ---------------------------------------------
function headers(token) {
  var h = { "Content-Type": "application/json" };
  if (token) {
    h.Authorization = "Bearer " + token;
  }
  return h;
}

function randomString(len) {
  var chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  var out = "";
  for (var i = 0; i < len; i++) {
    out += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return out;
}

function request(method, path, body, token, tags) {
  var params = {
    headers: headers(token),
    tags: tags || {},
  };

  if (method === "GET") {
    return http.get(BASE_URL + path, params);
  }
  if (method === "DELETE") {
    return http.del(BASE_URL + path, null, params);
  }
  if (method === "PATCH") {
    return http.patch(BASE_URL + path, body ? JSON.stringify(body) : null, params);
  }
  if (method === "PUT") {
    return http.put(BASE_URL + path, body ? JSON.stringify(body) : null, params);
  }
  return http.post(BASE_URL + path, body ? JSON.stringify(body) : null, params);
}

function parseJson(res) {
  try {
    return res.json();
  } catch (e) {
    return null;
  }
}

function expectStatus(res, expectedStatuses, label) {
  var ok = false;
  for (var i = 0; i < expectedStatuses.length; i++) {
    if (res.status === expectedStatuses[i]) {
      ok = true;
      break;
    }
  }

  contractChecks.add(ok ? 1 : 0);

  if (!ok) {
    if (res.status >= 500) {
      server5xx.add(1);
    } else if (res.status >= 400) {
      unexpected4xx.add(1);
    }

    apiErrors.add(1);
    console.warn(
      "FAIL [" + label + "] " + res.request.method + " " + res.url +
      " -> " + res.status + " | " + (res.body ? res.body.substring(0, 220) : "no body")
    );
  }

  return ok;
}

function expectJsonField(res, field, label) {
  var body = parseJson(res);
  var ok = !!(body && body[field] !== undefined && body[field] !== null);
  contractChecks.add(ok ? 1 : 0);
  if (!ok) {
    apiErrors.add(1);
    console.warn("FAIL [" + label + "] missing field: " + field);
  }
  return body;
}

function registerAndLogin(email, password, namePrefix) {
  var authStart = Date.now();

  var registerRes = request(
    "POST",
    "/api/auth/register",
    {
      name: namePrefix + " " + randomString(4),
      email: email,
      password: password,
    },
    null,
    { endpoint: "register" }
  );

  // If already exists, backend returns 409; login still valid path.
  expectStatus(registerRes, [200, 409], "Register");

  var loginRes = request(
    "POST",
    "/api/auth/login",
    { email: email, password: password },
    null,
    { endpoint: "login" }
  );
  authDuration.add(Date.now() - authStart);

  if (!expectStatus(loginRes, [200], "Login")) {
    return { token: null, user: null };
  }

  var loginBody = expectJsonField(loginRes, "token", "Login token");
  if (!loginBody || !loginBody.token || !loginBody.user || !loginBody.user.id) {
    return { token: null, user: null };
  }

  var meRes = request("GET", "/api/auth/me", null, loginBody.token, { endpoint: "auth_me" });
  expectStatus(meRes, [200], "Auth Me");

  return { token: loginBody.token, user: loginBody.user };
}

// ---------------------------------------------
// Setup shared data
// ---------------------------------------------
export function setup() {
  console.log("k6 profile=" + PROFILE + " base=" + BASE_URL);

  var setupEmail = "k6_setup_admin@gooddeeds.test";
  var setupPassword = "Test@12345";

  var setupAuth = registerAndLogin(setupEmail, setupPassword, "Setup Admin");
  if (!setupAuth.token) {
    return {
      setupToken: null,
      sharedOpenCauseId: null,
      sharedRestrictedCauseId: null,
      sharedGoalId: null,
      sharedTaskId: null,
      setupUserId: null,
    };
  }

  var sharedOpenCauseId = null;
  var sharedRestrictedCauseId = null;
  var sharedGoalId = null;
  var sharedTaskId = null;

  var openCauseRes = request(
    "POST",
    "/api/causes",
    {
      name: "K6 Shared Open Cause " + Date.now(),
      description: "Shared open cause for traffic generation",
      restricted: false,
    },
    setupAuth.token,
    { endpoint: "setup_create_open_cause" }
  );

  if (expectStatus(openCauseRes, [200], "Setup Create Open Cause")) {
    var openCause = parseJson(openCauseRes);
    sharedOpenCauseId = openCause ? openCause.id : null;
  }

  var restrictedCauseRes = request(
    "POST",
    "/api/causes",
    {
      name: "K6 Shared Restricted Cause " + Date.now(),
      description: "Shared restricted cause for membership flow",
      restricted: true,
    },
    setupAuth.token,
    { endpoint: "setup_create_restricted_cause" }
  );

  if (expectStatus(restrictedCauseRes, [200], "Setup Create Restricted Cause")) {
    var restrictedCause = parseJson(restrictedCauseRes);
    sharedRestrictedCauseId = restrictedCause ? restrictedCause.id : null;
  }

  if (sharedOpenCauseId) {
    var goalRes = request(
      "POST",
      "/api/goals",
      {
        causeId: sharedOpenCauseId,
        title: "K6 Shared Goal",
        description: "Shared goal for public + member reads",
      },
      setupAuth.token,
      { endpoint: "setup_create_goal" }
    );

    if (expectStatus(goalRes, [200], "Setup Create Goal")) {
      var goal = parseJson(goalRes);
      sharedGoalId = goal ? goal.id : null;
    }

    var taskRes = request(
      "POST",
      "/api/tasks",
      {
        title: "K6 Shared Task",
        description: "Shared task for member reads",
        status: "COMING_UP",
        causeId: sharedOpenCauseId,
        goalId: sharedGoalId,
        dueDate: null,
      },
      setupAuth.token,
      { endpoint: "setup_create_task" }
    );

    if (expectStatus(taskRes, [200], "Setup Create Task")) {
      var task = parseJson(taskRes);
      sharedTaskId = task ? task.id : null;
    }
  }

  return {
    setupToken: setupAuth.token,
    setupUserId: setupAuth.user.id,
    sharedOpenCauseId: sharedOpenCauseId,
    sharedRestrictedCauseId: sharedRestrictedCauseId,
    sharedGoalId: sharedGoalId,
    sharedTaskId: sharedTaskId,
  };
}

// ---------------------------------------------
// Main user journey (mirrors frontend usage)
// ---------------------------------------------
export default function (data) {
  var ts = Date.now();
  var email = "k6_vu" + __VU + "_it" + __ITER + "_" + randomString(4) + "@gooddeeds.test";
  var password = "StressPass123";

  // --------- Public browse flow (Landing/Explore/Cause detail)
  group("Public Browse", function () {
    var bStart = Date.now();

    var health = request("GET", "/api/health", null, null, { endpoint: "health" });
    expectStatus(health, [200], "Health");

    var causes = request("GET", "/api/causes?page=0&size=9", null, null, { endpoint: "causes_list" });
    expectStatus(causes, [200], "Causes List");

    var search = request("GET", "/api/causes/search?keyword=clean&page=0&size=9", null, null, { endpoint: "causes_search" });
    expectStatus(search, [200], "Causes Search");

    if (data.sharedOpenCauseId) {
      var causeById = request("GET", "/api/causes/" + data.sharedOpenCauseId, null, null, { endpoint: "cause_by_id" });
      expectStatus(causeById, [200], "Cause By ID");

      var goalsByCause = request("GET", "/api/goals/cause/" + data.sharedOpenCauseId + "?page=0&size=5", null, null, { endpoint: "goals_by_cause_public" });
      expectStatus(goalsByCause, [200], "Goals By Cause Public");
    }

    browseDuration.add(Date.now() - bStart);
    sleep(0.2);
  });

  // --------- Auth flow (Register/Login/Me)
  var auth = registerAndLogin(email, password, "VU User");
  if (!auth.token || !auth.user || !auth.user.id) {
    sleep(0.5);
    return;
  }

  // --------- Dashboard flow
  group("Dashboard", function () {
    var stats = request("GET", "/api/tasks/my/statistics", null, auth.token, { endpoint: "my_task_stats" });
    expectStatus(stats, [200], "My Task Statistics");

    var myCauses = request("GET", "/api/causes/my", null, auth.token, { endpoint: "my_causes" });
    expectStatus(myCauses, [200], "My Causes");

    var memberships = request("GET", "/api/memberships/my", null, auth.token, { endpoint: "my_memberships" });
    expectStatus(memberships, [200], "My Memberships");

    sleep(0.2);
  });

  // --------- Create cause + admin management flow (CreateCause/ManageCause pages)
  var myCauseId = null;
  var myGoalId = null;
  var myTaskId = null;

  group("Cause and Goal Management", function () {
    var cStart = Date.now();

    var createCause = request(
      "POST",
      "/api/causes",
      {
        name: "VU Cause " + __VU + "-" + __ITER + "-" + randomString(3),
        description: "Cause created by k6 user flow",
        restricted: __ITER % 2 === 0,
      },
      auth.token,
      { endpoint: "create_cause" }
    );

    if (expectStatus(createCause, [200], "Create Cause")) {
      var causeBody = parseJson(createCause);
      myCauseId = causeBody ? causeBody.id : null;
    }

    if (myCauseId) {
      var updateCause = request(
        "PUT",
        "/api/causes/" + myCauseId,
        {
          name: "Updated VU Cause " + __VU + "-" + __ITER,
          description: "Updated during k6 flow",
          restricted: false,
        },
        auth.token,
        { endpoint: "update_cause" }
      );
      expectStatus(updateCause, [200], "Update Cause");

      var createGoal = request(
        "POST",
        "/api/goals",
        {
          causeId: myCauseId,
          title: "VU Goal " + __VU + "-" + __ITER,
          description: "Goal created in manage flow",
        },
        auth.token,
        { endpoint: "create_goal" }
      );

      if (expectStatus(createGoal, [200], "Create Goal")) {
        var goalBody = parseJson(createGoal);
        myGoalId = goalBody ? goalBody.id : null;
      }

      if (myGoalId) {
        var updateGoal = request(
          "PUT",
          "/api/goals/" + myGoalId,
          {
            title: "Updated Goal " + __VU + "-" + __ITER,
            description: "Updated goal description",
          },
          auth.token,
          { endpoint: "update_goal" }
        );
        expectStatus(updateGoal, [200], "Update Goal");
      }

      var goalsByCauseAuthed = request(
        "GET",
        "/api/goals/cause/" + myCauseId + "?page=0&size=10",
        null,
        null,
        { endpoint: "goals_by_cause" }
      );
      expectStatus(goalsByCauseAuthed, [200], "Goals By Cause");
    }

    causeOpsDuration.add(Date.now() - cStart);
    sleep(0.2);
  });

  // --------- Task flow (MyTasks + ManageCause task operations)
  group("Task Management", function () {
    var tStart = Date.now();

    if (myCauseId) {
      var createTask = request(
        "POST",
        "/api/tasks",
        {
          title: "VU Task " + __VU + "-" + __ITER,
          description: "Task from k6 flow",
          status: "COMING_UP",
          causeId: myCauseId,
          goalId: myGoalId,
          dueDate: null,
        },
        auth.token,
        { endpoint: "create_task" }
      );

      if (expectStatus(createTask, [200], "Create Task")) {
        var taskBody = parseJson(createTask);
        myTaskId = taskBody ? taskBody.id : null;
      }

      if (myTaskId) {
        var getTask = request("GET", "/api/tasks/" + myTaskId, null, auth.token, { endpoint: "get_task" });
        expectStatus(getTask, [200], "Get Task");

        var updateTask = request(
          "PUT",
          "/api/tasks/" + myTaskId,
          {
            title: "Updated Task " + __VU + "-" + __ITER,
            description: "Updated task",
            status: "ONGOING",
            goalId: myGoalId,
            clearGoal: false,
            dueDate: null,
          },
          auth.token,
          { endpoint: "update_task" }
        );
        expectStatus(updateTask, [200], "Update Task");

        var patchTask = request(
          "PATCH",
          "/api/tasks/" + myTaskId + "/status?status=COMPLETED",
          null,
          auth.token,
          { endpoint: "update_task_status" }
        );
        expectStatus(patchTask, [200], "Patch Task Status");
      }

      var byCause = request(
        "GET",
        "/api/tasks/cause/" + myCauseId + "?page=0&size=10",
        null,
        auth.token,
        { endpoint: "tasks_by_cause" }
      );
      expectStatus(byCause, [200], "Tasks By Cause");

      if (myGoalId) {
        var byGoal = request(
          "GET",
          "/api/tasks/goal/" + myGoalId + "?page=0&size=10",
          null,
          auth.token,
          { endpoint: "tasks_by_goal" }
        );
        expectStatus(byGoal, [200], "Tasks By Goal");
      }

      var myTasks = request(
        "GET",
        "/api/tasks/my?page=0&size=10&causeId=" + myCauseId,
        null,
        auth.token,
        { endpoint: "my_tasks" }
      );
      expectStatus(myTasks, [200], "My Tasks");

      var myStatsCause = request(
        "GET",
        "/api/tasks/my/statistics?causeId=" + myCauseId,
        null,
        auth.token,
        { endpoint: "my_task_stats_cause" }
      );
      expectStatus(myStatsCause, [200], "My Task Statistics by Cause");

      if (myGoalId) {
        var myStatsGoal = request(
          "GET",
          "/api/tasks/my/statistics?goalId=" + myGoalId,
          null,
          auth.token,
          { endpoint: "my_task_stats_goal" }
        );
        expectStatus(myStatsGoal, [200], "My Task Statistics by Goal");
      }
    }

    taskOpsDuration.add(Date.now() - tStart);
    sleep(0.2);
  });

  // --------- Membership flow (CauseDetail page actions)
  group("Membership Flow", function () {
    if (data.sharedOpenCauseId) {
      var joinOpen = request(
        "POST",
        "/api/memberships/join?causeId=" + data.sharedOpenCauseId,
        null,
        auth.token,
        { endpoint: "join_open_cause" }
      );
      // 200 first time, 409 if this user already joined from previous retries.
      expectStatus(joinOpen, [200, 409], "Join Open Cause");

      var membersOpen = request(
        "GET",
        "/api/memberships/cause/" + data.sharedOpenCauseId,
        null,
        auth.token,
        { endpoint: "members_by_cause" }
      );
      expectStatus(membersOpen, [200], "Members By Cause");

      var leaveOpen = request(
        "DELETE",
        "/api/memberships/leave?causeId=" + data.sharedOpenCauseId,
        null,
        auth.token,
        { endpoint: "leave_open_cause" }
      );
      // If already removed in retry edge-case, allow 404 too.
      expectStatus(leaveOpen, [200, 404], "Leave Open Cause");
    }

    if (data.sharedRestrictedCauseId) {
      var joinRestricted = request(
        "POST",
        "/api/memberships/join?causeId=" + data.sharedRestrictedCauseId,
        null,
        auth.token,
        { endpoint: "join_restricted_cause" }
      );
      expectStatus(joinRestricted, [200, 409], "Join Restricted Cause");
    }

    sleep(0.2);
  });

  // --------- Profile flow
  group("Profile Flow", function () {
    var byEmail = request(
      "GET",
      "/api/users/by-email?email=" + encodeURIComponent(email),
      null,
      auth.token,
      { endpoint: "user_by_email" }
    );
    expectStatus(byEmail, [200], "User By Email");

    var profileName = "VU Updated " + __VU + "-" + __ITER;
    var updateProfile = request(
      "PUT",
      "/api/users/" + auth.user.id + "?name=" + encodeURIComponent(profileName) + "&email=" + encodeURIComponent(email),
      null,
      auth.token,
      { endpoint: "user_update" }
    );
    expectStatus(updateProfile, [200], "Update Profile");

    sleep(0.2);
  });

  // --------- Cleanup this VU data when possible
  group("Cleanup", function () {
    if (myTaskId) {
      var delTask = request("DELETE", "/api/tasks/" + myTaskId, null, auth.token, { endpoint: "delete_task" });
      expectStatus(delTask, [204], "Delete Task");
    }

    if (myGoalId) {
      var delGoal = request("DELETE", "/api/goals/" + myGoalId, null, auth.token, { endpoint: "delete_goal" });
      expectStatus(delGoal, [200], "Delete Goal");
    }

    if (myCauseId) {
      var delCause = request("DELETE", "/api/causes/" + myCauseId, null, auth.token, { endpoint: "delete_cause" });
      expectStatus(delCause, [200], "Delete Cause");
    }
  });

  // Realistic think time
  sleep(Math.random() * 0.8 + 0.2);

  // Keep linter-like check usage for k6 summary visibility
  check(ts, {
    "iteration completed": function () {
      return true;
    },
  });
}

// ---------------------------------------------
// Teardown
// ---------------------------------------------
export function teardown(data) {
  console.log("Stress test completed");
  console.log("  profile: " + PROFILE);
  console.log("  shared open cause: " + (data.sharedOpenCauseId || "N/A"));
  console.log("  shared restricted cause: " + (data.sharedRestrictedCauseId || "N/A"));
  console.log("  shared goal: " + (data.sharedGoalId || "N/A"));
  console.log("  shared task: " + (data.sharedTaskId || "N/A"));
}

// ---------------------------------------------
// Summary
// ---------------------------------------------
export function handleSummary(data) {
  function metricValue(name, key, fallback) {
    if (!data.metrics[name] || !data.metrics[name].values) return fallback;
    if (data.metrics[name].values[key] === undefined) return fallback;
    return data.metrics[name].values[key];
  }

  var reqCount = metricValue("http_reqs", "count", 0);
  var avg = metricValue("http_req_duration", "avg", null);
  var p95 = metricValue("http_req_duration", "p(95)", null);
  var p99 = metricValue("http_req_duration", "p(99)", null);
  var failedRate = metricValue("http_req_failed", "rate", null);
  var contracts = metricValue("contract_checks", "rate", null);
  var errCount = metricValue("api_errors", "count", 0);
  var c4xx = metricValue("unexpected_4xx", "count", 0);
  var c5xx = metricValue("server_5xx", "count", 0);

  function f(n) {
    return n === null || n === undefined ? "N/A" : Number(n).toFixed(2);
  }

  var divider = "============================================================";
  var output =
    "\n" + divider + "\n" +
    "  GOODDEEDS K6 SUMMARY\n" +
    divider + "\n" +
    "  Profile:            " + PROFILE + "\n" +
    "  Total Requests:     " + reqCount + "\n" +
    "  Avg Duration:       " + f(avg) + " ms\n" +
    "  P95 Duration:       " + f(p95) + " ms\n" +
    "  P99 Duration:       " + f(p99) + " ms\n" +
    "  HTTP Failed Rate:   " + (failedRate === null ? "N/A" : Number(failedRate).toFixed(4)) + "\n" +
    "  Contract Checks:    " + (contracts === null ? "N/A" : Number(contracts).toFixed(4)) + "\n" +
    "  API Errors:         " + errCount + "\n" +
    "  Unexpected 4xx:     " + c4xx + "\n" +
    "  Server 5xx:         " + c5xx + "\n" +
    divider + "\n";

  var summary = {
    timestamp: new Date().toISOString(),
    profile: PROFILE,
    baseUrl: BASE_URL,
    metrics: {
      http_reqs: reqCount,
      avg_duration_ms: f(avg),
      p95_duration_ms: f(p95),
      p99_duration_ms: f(p99),
      http_failed_rate: failedRate === null ? "N/A" : Number(failedRate).toFixed(4),
      contract_checks_rate: contracts === null ? "N/A" : Number(contracts).toFixed(4),
      api_errors: errCount,
      unexpected_4xx: c4xx,
      server_5xx: c5xx,
    },
  };

  return {
    stdout: output,
    "stress-test-results.json": JSON.stringify(summary, null, 2),
  };
}
