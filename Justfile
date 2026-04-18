set shell := ["bash", "-uc"]

default:
    @just --list

dev:
    bun run dev

check:
    bun run check

build:
    bun run build

backup:
    bun backup.ts "backup-$(date +%Y.%m.%d-%H.%M.%S).json"
