// PM2 process definition. `current` is a symlink to the active release (see release.sh), and
// this file ships inside each release, so the process definition always matches its own code.
module.exports = {
  apps: [
    {
      name: "findingglobal",
      cwd: "/var/www/findingglobal/current/server", // server/.env (a link to shared/server.env) is read from here
      script: "src/index.js",
      exec_mode: "fork",
      instances: 1,
      max_memory_restart: "700M",
      time: true, // timestamp log lines
      env: {
        NODE_ENV: "production",
        PORT: 4000,
      },
    },
  ],
};
