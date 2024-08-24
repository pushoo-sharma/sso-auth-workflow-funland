module.exports = {
    apps: [
      {
        name: 'identity-server',
        script: 'identity-server.js',
        node_args: '--inspect',
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',
      },
      {
        name: 'main-server',
        script: 'main-server.js',
        node_args: '--inspect',
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',
      }
    ]
  };
  