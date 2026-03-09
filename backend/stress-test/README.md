# K6 Stress Test for GoodDeeds Backend

## Install k6

```bash
# macOS
brew install k6

# or via Docker
docker pull grafana/k6
```

## Run Tests

### Full stress test (all 4 scenarios ~ 14 min)
```bash
k6 run stress-test/k6-stress-test.js
```

### Against a specific URL
```bash
k6 run -e BASE_URL=https://your-app.onrender.com stress-test/k6-stress-test.js
```

### Quick smoke test only (30s)
```bash
k6 run --scenario smoke stress-test/k6-stress-test.js
```

### Load test only
```bash
k6 run --scenario load stress-test/k6-stress-test.js
```

### Stress test only
```bash
k6 run --scenario stress stress-test/k6-stress-test.js
```

### Spike test only
```bash
k6 run --scenario spike stress-test/k6-stress-test.js
```

## Scenarios

| Scenario | VUs     | Duration | Purpose                       |
|----------|---------|----------|-------------------------------|
| smoke    | 1       | 30s      | Basic sanity check            |
| load     | 0→20    | 5m       | Normal expected traffic       |
| stress   | 0→100   | 6m       | Find breaking point           |
| spike    | 0→200   | 50s      | Sudden burst handling         |

## Thresholds

- **P95 response time** < 500ms
- **P99 response time** < 1500ms
- **Error rate** < 5%
- **Login success** > 95%
- **Register success** > 90%

## Output

Results are printed to stdout and saved to `stress-test-results.json`.
