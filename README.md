```
▗▄▄▖ ▗▖ ▗▖▗▖  ▗▖ ▗▄▖ ▗▖   ▗▖   
▐▌ ▐▌▐▌ ▐▌▐▛▚▖▐▌▐▌ ▐▌▐▌   ▐▌   
▐▛▀▚▖▐▌ ▐▌▐▌ ▝▜▌▐▛▀▜▌▐▌   ▐▌   
▐▌ ▐▌▝▚▄▞▘▐▌  ▐▌▐▌ ▐▌▐▙▄▄▖▐▙▄▄▖                       
```
![Version](https://img.shields.io/github/v/release/pillbugin/runall?style=flat-square)
![License](https://img.shields.io/github/license/pillbugin/runall?style=flat-square)

**Runall** is a simple utility designed to help developers run multiple commands simultaneously, simplifying workflows for applications that depend on several services or scripts running in parallel.

It opens a window with multiple tabs — one for each command — plus a dedicated tab that consolidates the logs from all commands in one place. Each command can also be started or stopped individually through the interface. 🧩

---

## Features ✨

- 🧵 Run multiple commands at once
- 🪟 GUI window with one tab per command
- 📜 Global log tab combining all outputs
- 🛑▶️ Start/stop individual commands
- ⚙️ Configuration via CLI or config file (YAML/JSON)

---

## Usage 🧪

### Using `npx`

You can run Runall directly with `npx` (no installation required):

```bash
npx runall apps/api@"go run main.go" apps/queue@"node queue.js" apps/web@"npm run dev"
```

Each argument should follow the format:
```
<path>@"<command>"
```

### Binary Executable 💾

You can also download a prebuilt binary to run Runall without using Node.js. Visit the [Releases](https://github.com/pillbugin/runall/releases) section of this repository to get the latest version for your OS.

---

## Using a Config File 🗂️

You can use a config file instead of passing commands through the CLI.

Runall supports:
- `runall.config.yaml`
- `runall.config.yml`
- `runall.config.json`

By default, it looks for one of these files in the current working directory. You can also explicitly specify the file path:

```bash
npx runall --config ./my-config.yaml
# or
npx runall -c ./my-config.yaml
```

#### Configuration Format 🧾

A config file should export an **array of command objects**, each having:

- `path` *(required)*: the working directory for the command
- `cmd` *(required)*: the command to run
- `name` *(optional)*: a label for the tab/command

Example (YAML):

```yaml
- name: API Server
  path: ./apps/api
  cmd: go run main.go

- name: Queue Worker
  path: ./apps/queue
  cmd: node worker.js

- name: Web App
  path: ./apps/web
  cmd: npm run dev
```

The order of the array determines the order of the tabs.

---

## License 📄

MIT License

