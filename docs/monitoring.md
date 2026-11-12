# WEB1 Social Media Monitoring

## Open Kibana on this PC

1. Open the [WEB1 Social Media Monitoring dashboard](http://127.0.0.1:5601/app/dashboards#/view/web1-app-monitoring).
2. Sign in as `elastic`. In PowerShell, copy the local password to your clipboard.

   ```powershell
   $stack = Join-Path $env:LOCALAPPDATA 'WEB1Social\stack'
   $login = Import-Clixml (Join-Path $stack 'elastic-credential.xml')
   $login.GetNetworkCredential().Password | Set-Clipboard
   ```

3. Run `npm run dev` from the WEB1 project and browse the app. The dashboard refreshes every 15 seconds. Use the time picker to change the range or refresh interval.

If the services have been stopped, run each command in its own PowerShell window. Wait for Elasticsearch to start before launching Kibana. Kibana can take several minutes to initialize on Windows. Both services bind to loopback. The local Elasticsearch node uses free-space watermarks of 15 GiB for allocation, 10 GiB for relocation, and 5 GiB for read-only protection.

```powershell
$stack = Join-Path $env:LOCALAPPDATA 'WEB1Social\stack'
& "$stack\elasticsearch-9.5.6\bin\elasticsearch.bat"
```

```powershell
$stack = Join-Path $env:LOCALAPPDATA 'WEB1Social\stack'
& "$stack\kibana-9.5.6\bin\kibana.bat"
```

## What the dashboard shows

| Panel | Signal |
| --- | --- |
| HTTP | Request volume, 4xx and 5xx responses, disconnects, p50 and p95 latency, busiest routes, and recent failures |
| Application | Server lifecycle events, application log levels and action codes, and Next.js request errors |
| Database | Prisma query durations and error events |
| Node.js | Process CPU, RSS, heap usage, and event-loop delay |

An HTTP response includes a generated `X-Request-Id`. To look up its HTTP, application, and Prisma events, switch Discover to ES|QL and run the query below with that ID.

```esql
FROM logs-web1.monitoring-default
| WHERE request_id == "<request ID>"
| SORT @timestamp ASC
```

The dashboard defaults to the last hour. Use `environment: "production"` in Kibana to filter to production events when sharing a stack.

Indexed HTTP data contains route templates, method, status, duration, and request ID. Application logs contribute fixed action codes and levels. Prisma contributes timings and error counts. This keeps request contents, exception messages, SQL and credentials out of Elasticsearch. Next.js internal assets and the favicon are skipped. Coverage is server-side, and Socket.IO is currently a placeholder in the custom server.

## Provision another Elastic deployment

Use Elasticsearch and Kibana 9.5 with matching versions. The setup command installs the index template and 30-day data stream, creates or updates the version-controlled dashboard, and saves a write-only API key in the gitignored app `.env` when one is missing. Rerunning setup reapplies the repository's dashboard definition.

```powershell
$env:ELASTICSEARCH_URL = '<Elasticsearch base URL>'
$env:KIBANA_URL = '<Kibana base URL>'
$login = Get-Credential -UserName elastic -Message 'Elastic setup credentials'
$env:ELASTIC_SETUP_USERNAME = $login.UserName
$env:ELASTIC_SETUP_PASSWORD = $login.GetNetworkCredential().Password
try {
    npm run monitoring:setup
} finally {
    Remove-Item Env:ELASTIC_SETUP_PASSWORD
}
```

The setup command defaults to the local HTTP endpoints when the URLs are omitted. Use HTTPS for a remote deployment. For a private CA, set `NODE_EXTRA_CA_CERTS` to its certificate file before running setup or starting Node.js. When deploying the app on Railway, set `ELASTICSEARCH_URL` and the generated `ELASTICSEARCH_API_KEY` as service variables. The app enables telemetry at startup when both are set. It batches delivery in memory, retries temporary failures, and drops events if the buffer fills.

The integration uses the documented APIs for dashboard creation, event storage, and application instrumentation. [Kibana Dashboards API](https://dashboardsapispec.kibana.dev/dashboards), [Elasticsearch data streams](https://www.elastic.co/docs/manage-data/data-store/data-streams), [Next.js custom server](https://nextjs.org/docs/app/guides/custom-server), [Next.js instrumentation](https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation), [Prisma Client logging](https://www.prisma.io/docs/orm/v7/reference/prisma-client-reference#log).
