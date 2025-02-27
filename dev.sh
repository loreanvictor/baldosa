#!/bin/bash

trap "kill 0" EXIT

serve_client() {
  npx serve &
}

run_publisher() {
  (
    cd publisher
    sqlx database create
    sqlx migrate run
    cargo watch -x run
  ) &
}

run_publisher
serve_client
wait
