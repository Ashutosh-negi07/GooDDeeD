import http from "k6/http";
import { check, sleep, group } from "k6";
import { Rate, Trend, Counter } from "k6/metrics";

// ──────────────────────────────────────────────
//  CONFIG
// ──────────────────────────────────────────────
var BASE_URL = __ENV.BASE_URL || "http://localhost:8080";

// Fixed email so setup user persists across runs
var SETUP_USER = {
  name: "Setup Admin",
  email: "k6_setup_admin@stresstest.com",
  password: "Test@12345",
};

// ──────────────────────────────────────────────
//  CUSTOM METRICS
// ──────────────────────────────────────────────
var loginSuccess = new Rate("login_success");
var registerSuccess = new Rate("register_success");
var apiErrors = new Counter("api_errors");
var causeCreation = new Trend("cause_creation_duration");
var taskCreation = new Trend("task_creation_duration");
var authDuration = new Trend("auth_duration");

// ──────────────────────────────────────────────
//  SCENARIOS
// ──────────────────────────────────────────────
export var options = {
  scenarios: {
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
        { duration: "1m", target: 20 },
        { duration: "3m", target: 20 },
        { duration: "1m", target: 0 },
      ],
      startTime: "35s",
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
        { duration: "10s", target: 200 },
        { duration: "30s", target: 200 },
        { duration: "10s", target: 0 },
      ],
      startTime: "13m",
      tags: { scenario: "spike" },
    },
  },

  thresholds: {
    http_req_duration: ["p(95)<500", "p(99)<1500"],
    http_req_failed: ["rate<0.05"],
    login_success: ["rate>0.95"],
    register_success: ["rate>0.90"],
    cause_creation_duration: ["p(95)<800"],
    task_creation_duration: ["p(95)<800"],
  },
};

// ──────────────────────────────────────────────
//  HELPERS
// ──────────────────────────────────────────────
function hdrs(token) {
  var h = { "Content-Type": "application/json" };
  if (token) h["Authorization"] = "Bearer " + token;
  return h;
}

function logFail(res, label) {
  if (res.status >= 400) {
    console.warn(
      "FAIL [" + label + "] " + res.request.method + " " + res.url +
      " -> " + res.status + " | " +
      (res.body ? res.body.substring(0, 200) : "no body")
    );
  }
}

function rndStr(len) {
  var c = "abcdefghijklmnopqrstuvwxyz0123456789";
  var o = "";
  for (var i = 0; i < len; i++) {
    o += c.charAt(Math.floor(Math.random() * c.length));
  }
  return o;
}

// ──────────────────────────────────────────────
//  SETUP — runs once, creates a shared cause
// ──────────────────────────────────────────────
export function setup() {
  console.log("Starting stress test against: " + BASE_URL);

  var token = null;
  var regRes = http.post(
    BASE_URL + "/api/auth/register",
    JSON.stringify(SETUP_USER),
    { headers: hdrs() }
  );

  if (regRes.status === 200) {
    try { token = regRes.json().token; } catch(e) { /* */ }
    console.log("Setup user registered");
  } else {
    var loginRes = http.post(
      BASE_URL + "/api/auth/login",
      JSON.stringify({ email: SETUP_USER.email, password: SETUP_USER.password }),
      { headers: hdrs() }
    );
    if (loginRes.status === 200) {
      try { token = loginRes.json().token; } catch(e) { /* */ }
      console.log("Setup user logged in (already existed)");
    } else {
      console.log("Setup FAILED: " + loginRes.status);
      return { sharedCauseId: null };
    }
  }

  var causeId = null;
  if (token) {
    var causeRes = http.post(
      BASE_URL + "/api/causes",
      JSON.stringify({
        name: "K6 Shared Cause " + Date.now(),
        description: "Shared cause for stress testing",
        restricted: false,
      }),
      { headers: hdrs(token) }
    );
    if (causeRes.status === 200) {
      try { causeId = causeRes.json().id; } catch(e) { /* */ }
      console.log("Shared cause created: " + causeId);
    }
  }

  return { sharedCauseId: causeId };
}

// ──────────────────────────────────────────────
//  MAIN — each VU registers its OWN user, joins
//  the shared cause, then runs all API tests
// ──────────────────────────────────────────────
export default function (data) {
  var sharedCauseId = data.sharedCauseId;
  var myToken = null;
  var myEmail = "vu" + __VU + "_" + __ITER + "_" + rndStr(5) + "@stress.com";
  var myPass = "StressPass123";

  // ─── Group 1: Auth ────────────────────────
  group("Auth - Register + Login + Me", function () {

    var regStart = Date.now();
    var regRes = http.post(
      BASE_URL + "/api/auth/register",
      JSON.stringify({ name: "VU " + __VU, email: myEmail, password: myPass }),
      { headers: hdrs(), tags: { endpoint: "register" } }
    );
    authDuration.add(Date.now() - regStart);
    logFail(regRes, "Register");

    var regOk = check(regRes, {
      "register: 200": function(r) { return r.status === 200; },
      "register: has token": function(r) {
        try { myToken = r.json().token; return myToken !== undefined; }
        catch(e) { return false; }
      },
    });
    registerSuccess.add(regOk ? 1 : 0);
    if (!regOk) apiErrors.add(1);

    sleep(0.3);

    var loginStart = Date.now();
    var loginRes = http.post(
      BASE_URL + "/api/auth/login",
      JSON.stringify({ email: myEmail, password: myPass }),
      { headers: hdrs(), tags: { endpoint: "login" } }
    );
    authDuration.add(Date.now() - loginStart);
    logFail(loginRes, "Login");

    var loginOk = check(loginRes, {
      "login: 200": function(r) { return r.status === 200; },
      "login: has token": function(r) {
        try { myToken = r.json().token; return myToken !== undefined; }
        catch(e) { return false; }
      },
    });
    loginSuccess.add(loginOk ? 1 : 0);
    if (!loginOk) apiErrors.add(1);

    sleep(0.3);

    if (myToken) {
      var meRes = http.get(BASE_URL + "/api/auth/me", {
        headers: hdrs(myToken),
        tags: { endpoint: "me" },
      });
      logFail(meRes, "Get Me");
      check(meRes, {
        "me: 200": function(r) { return r.status === 200; },
      });
    }

    sleep(0.5);
  });

  // If no token, skip remaining
  if (!myToken) return;

  // ─── Join shared cause so task/cause ops work ───
  if (sharedCauseId) {
    var joinRes = http.post(
      BASE_URL + "/api/memberships/join?causeId=" + sharedCauseId,
      null,
      { headers: hdrs(myToken), tags: { endpoint: "join_cause" } }
    );
    // 200 = joined, 400 = already member, both fine
    if (joinRes.status >= 500) {
      logFail(joinRes, "Join Shared Cause");
    }
    sleep(0.2);
  }

  // ─── Group 2: Causes ─────────────────────
  group("Causes - CRUD", function () {

    var listRes = http.get(BASE_URL + "/api/causes?page=0&size=5", {
      headers: hdrs(),
      tags: { endpoint: "list_causes" },
    });
    logFail(listRes, "List Causes");
    check(listRes, {
      "list causes: 200": function(r) { return r.status === 200; },
    });

    sleep(0.3);

    var searchRes = http.get(
      BASE_URL + "/api/causes/search?keyword=test&page=0&size=5",
      { headers: hdrs(), tags: { endpoint: "search_causes" } }
    );
    logFail(searchRes, "Search Causes");
    check(searchRes, {
      "search causes: 200": function(r) { return r.status === 200; },
    });

    sleep(0.3);

    // Create cause — this VU is the creator, so update will work
    var cStart = Date.now();
    var createRes = http.post(
      BASE_URL + "/api/causes",
      JSON.stringify({
        name: "Cause VU" + __VU + "-" + __ITER,
        description: "Created during stress test",
        restricted: false,
      }),
      { headers: hdrs(myToken), tags: { endpoint: "create_cause" } }
    );
    causeCreation.add(Date.now() - cStart);
    logFail(createRes, "Create Cause");

    var myCauseId = null;
    check(createRes, {
      "create cause: 200": function(r) { return r.status === 200; },
      "create cause: has id": function(r) {
        try { myCauseId = r.json().id; return myCauseId !== undefined; }
        catch(e) { return false; }
      },
    });

    sleep(0.3);

    // Update OWN cause (this VU created it → is a member)
    if (myCauseId) {
      var getRes = http.get(BASE_URL + "/api/causes/" + myCauseId, {
        headers: hdrs(),
        tags: { endpoint: "get_cause" },
      });
      logFail(getRes, "Get Cause");
      check(getRes, {
        "get cause: 200": function(r) { return r.status === 200; },
      });

      sleep(0.2);

      var updRes = http.put(
        BASE_URL + "/api/causes/" + myCauseId,
        JSON.stringify({
          name: "Updated VU" + __VU + "-" + __ITER,
          description: "Updated during stress test",
        }),
        { headers: hdrs(myToken), tags: { endpoint: "update_cause" } }
      );
      logFail(updRes, "Update Cause");
      check(updRes, {
        "update cause: 200": function(r) { return r.status === 200; },
      });
    }

    sleep(0.5);
  });

  // ─── Group 3: Memberships ────────────────
  group("Memberships", function () {

    var myRes = http.get(BASE_URL + "/api/memberships/my", {
      headers: hdrs(myToken),
      tags: { endpoint: "my_memberships" },
    });
    logFail(myRes, "My Memberships");
    check(myRes, {
      "my memberships: 200": function(r) { return r.status === 200; },
    });

    sleep(0.3);

    if (sharedCauseId) {
      var membersRes = http.get(
        BASE_URL + "/api/memberships/cause/" + sharedCauseId,
        { headers: hdrs(myToken), tags: { endpoint: "cause_members" } }
      );
      logFail(membersRes, "Cause Members");
      check(membersRes, {
        "cause members: 200": function(r) { return r.status === 200; },
      });
    }

    sleep(0.5);
  });

  // ─── Group 4: Goals ──────────────────────
  group("Goals - Read", function () {
    if (!sharedCauseId) return;

    var goalsRes = http.get(
      BASE_URL + "/api/goals/cause/" + sharedCauseId + "?page=0&size=5",
      { headers: hdrs(), tags: { endpoint: "list_goals" } }
    );
    logFail(goalsRes, "List Goals");
    check(goalsRes, {
      "list goals: 200": function(r) { return r.status === 200; },
    });

    sleep(0.5);
  });

  // ─── Group 5: Tasks (VU already joined shared cause) ──
  group("Tasks - CRUD", function () {
    if (!sharedCauseId) return;

    var tStart = Date.now();
    var taskRes = http.post(
      BASE_URL + "/api/tasks",
      JSON.stringify({
        title: "Task VU" + __VU + "-" + __ITER,
        description: "Task from stress test",
        causeId: sharedCauseId,
      }),
      { headers: hdrs(myToken), tags: { endpoint: "create_task" } }
    );
    taskCreation.add(Date.now() - tStart);
    logFail(taskRes, "Create Task");

    var taskId = null;
    check(taskRes, {
      "create task: 200": function(r) { return r.status === 200; },
      "create task: has id": function(r) {
        try { taskId = r.json().id; return taskId !== undefined; }
        catch(e) { return false; }
      },
    });

    sleep(0.3);

    if (taskId) {
      var getTaskRes = http.get(BASE_URL + "/api/tasks/" + taskId, {
        headers: hdrs(myToken),
        tags: { endpoint: "get_task" },
      });
      logFail(getTaskRes, "Get Task");
      check(getTaskRes, {
        "get task: 200": function(r) { return r.status === 200; },
      });

      sleep(0.2);

      var statusRes = http.patch(
        BASE_URL + "/api/tasks/" + taskId + "/status?status=IN_PROGRESS",
        null,
        { headers: hdrs(myToken), tags: { endpoint: "update_task_status" } }
      );
      logFail(statusRes, "Update Task Status");
      check(statusRes, {
        "update task status: 200": function(r) { return r.status === 200; },
      });
    }

    sleep(0.3);

    // Tasks by cause
    var causeTasks = http.get(
      BASE_URL + "/api/tasks/cause/" + sharedCauseId + "?page=0&size=5",
      { headers: hdrs(myToken), tags: { endpoint: "tasks_by_cause" } }
    );
    logFail(causeTasks, "Tasks By Cause");
    check(causeTasks, {
      "tasks by cause: 200": function(r) { return r.status === 200; },
    });

    sleep(0.3);

    // My tasks
    var myTasks = http.get(BASE_URL + "/api/tasks/my?page=0&size=5", {
      headers: hdrs(myToken),
      tags: { endpoint: "my_tasks" },
    });
    logFail(myTasks, "My Tasks");
    check(myTasks, {
      "my tasks: 200": function(r) { return r.status === 200; },
    });

    sleep(0.3);

    // Task statistics
    var statsRes = http.get(BASE_URL + "/api/tasks/my/statistics", {
      headers: hdrs(myToken),
      tags: { endpoint: "task_stats" },
    });
    logFail(statsRes, "Task Stats");
    check(statsRes, {
      "task statistics: 200": function(r) { return r.status === 200; },
    });

    sleep(0.5);
  });

  // ─── Group 6: Users — look up OWN email ──
  group("Users - Read", function () {
    var userRes = http.get(
      BASE_URL + "/api/users/by-email?email=" + encodeURIComponent(myEmail),
      { headers: hdrs(myToken), tags: { endpoint: "user_by_email" } }
    );
    logFail(userRes, "User By Email");
    check(userRes, {
      "user by email: 200": function(r) { return r.status === 200; },
    });

    sleep(0.5);
  });

  // ─── Group 7: Batch reads ────────────────
  group("Mixed Read Load", function () {
    var reqs = [
      { method: "GET", url: BASE_URL + "/api/causes?page=0&size=10",
        body: null, params: { headers: hdrs(), tags: { endpoint: "batch_read" } } },
      { method: "GET", url: BASE_URL + "/api/causes/search?keyword=stress&page=0&size=5",
        body: null, params: { headers: hdrs(), tags: { endpoint: "batch_read" } } },
      { method: "GET", url: BASE_URL + "/api/tasks/my?page=0&size=5",
        body: null, params: { headers: hdrs(myToken), tags: { endpoint: "batch_read" } } },
      { method: "GET", url: BASE_URL + "/api/memberships/my",
        body: null, params: { headers: hdrs(myToken), tags: { endpoint: "batch_read" } } },
      { method: "GET", url: BASE_URL + "/api/tasks/my/statistics",
        body: null, params: { headers: hdrs(myToken), tags: { endpoint: "batch_read" } } },
    ];

    if (sharedCauseId) {
      reqs.push({
        method: "GET",
        url: BASE_URL + "/api/goals/cause/" + sharedCauseId + "?page=0&size=5",
        body: null,
        params: { headers: hdrs(), tags: { endpoint: "batch_read" } },
      });
    }

    var responses = http.batch(reqs);

    for (var i = 0; i < responses.length; i++) {
      if (responses[i].status !== 200) {
        apiErrors.add(1);
        console.warn("FAIL [Batch " + i + "] -> " + responses[i].status);
      }
    }

    check(responses[0], {
      "batch: first ok": function(r) { return r.status === 200; },
    });

    sleep(1);
  });

  sleep(0.5);
}

// ──────────────────────────────────────────────
//  TEARDOWN
// ──────────────────────────────────────────────
export function teardown(data) {
  console.log("Stress test completed");
  console.log("  Shared cause ID: " + (data.sharedCauseId || "N/A"));
}

// ──────────────────────────────────────────────
//  HANDLE SUMMARY
// ──────────────────────────────────────────────
export function handleSummary(data) {
  var httpReqs = 0;
  var avgDur = "N/A";
  var p95Dur = "N/A";
  var p99Dur = "N/A";
  var failRate = "N/A";
  var loginRate = "N/A";
  var regRate = "N/A";
  var errCount = 0;

  if (data.metrics.http_reqs && data.metrics.http_reqs.values) {
    httpReqs = data.metrics.http_reqs.values.count || 0;
  }
  if (data.metrics.http_req_duration && data.metrics.http_req_duration.values) {
    var d = data.metrics.http_req_duration.values;
    if (d.avg !== undefined) avgDur = d.avg.toFixed(2);
    if (d["p(95)"] !== undefined) p95Dur = d["p(95)"].toFixed(2);
    if (d["p(99)"] !== undefined) p99Dur = d["p(99)"].toFixed(2);
  }
  if (data.metrics.http_req_failed && data.metrics.http_req_failed.values) {
    if (data.metrics.http_req_failed.values.rate !== undefined)
      failRate = data.metrics.http_req_failed.values.rate.toFixed(4);
  }
  if (data.metrics.login_success && data.metrics.login_success.values) {
    if (data.metrics.login_success.values.rate !== undefined)
      loginRate = data.metrics.login_success.values.rate.toFixed(4);
  }
  if (data.metrics.register_success && data.metrics.register_success.values) {
    if (data.metrics.register_success.values.rate !== undefined)
      regRate = data.metrics.register_success.values.rate.toFixed(4);
  }
  if (data.metrics.api_errors && data.metrics.api_errors.values) {
    errCount = data.metrics.api_errors.values.count || 0;
  }

  var line = "============================================================";
  var out =
    "\n" + line + "\n" +
    "  K6 STRESS TEST SUMMARY\n" +
    line + "\n" +
    "  Total Requests:     " + httpReqs + "\n" +
    "  Avg Duration:       " + avgDur + " ms\n" +
    "  P95 Duration:       " + p95Dur + " ms\n" +
    "  P99 Duration:       " + p99Dur + " ms\n" +
    "  Error Rate:         " + failRate + "\n" +
    "  Login Success:      " + loginRate + "\n" +
    "  Register Success:   " + regRate + "\n" +
    "  API Errors:         " + errCount + "\n" +
    line + "\n";

  var summary = {
    timestamp: new Date().toISOString(),
    scenarios: ["smoke", "load", "stress", "spike"],
    metrics: {
      http_reqs: httpReqs,
      avg_duration_ms: avgDur,
      p95_duration_ms: p95Dur,
      p99_duration_ms: p99Dur,
      error_rate: failRate,
      login_success: loginRate,
      register_success: regRate,
      api_errors: errCount,
    },
  };

  return {
    stdout: out,
    "stress-test-results.json": JSON.stringify(summary, null, 2),
  };
}
