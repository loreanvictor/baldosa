#!/bin/bash

set -e

if [ $# -lt 1 ]; then
  echo "Usage: $0 {new|up} [args...]"
  exit 1
fi

# Assign the command and any additional arguments
COMMAND=$1
shift # Shift arguments to process additional ones

case $COMMAND in
  new)
    # Create a new migration
    if [ $# -lt 1 ]; then
      echo "Usage: $0 new <migration_name>"
      exit 1
    fi
    migrate create -dir internal/storage/migrations --seq --digits 2 -ext sql "$1"
    ;;

  up)
    # Run the migration (example placeholder, replace with actual command)
    echo "Running migrations..."
    migrate -path internal/storage/migrations -database "sqlite3:///Users/amirehsandar/Work/baldosa/baldosa.db" up
    ;;

  *)
    # Invalid command
    echo "Invalid command: $COMMAND"
    echo "Usage: $0 {new|up} [args...]"
    exit
esac
