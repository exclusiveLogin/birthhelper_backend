module.exports = {
  apps : [{
    name: 'BH_API',
    script: 'dist/out-tsc/server.js',

    // Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
    args: '',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '2G',
    wait_ready: true,
    listen_timeout: 10000,
    kill_timeout : 10000,
    env: {
        NODE_ENV: 'development',
        HOST: 'localhost'
    },
    env_local: {
      NODE_ENV: 'local',
      HOST: '185.178.46.248'
    }
  }],

  // deploy : {
  //   production : {
  //     user : 'node',
  //     host : '212.83.163.1',
  //     ref  : 'origin/master',
  //     repo : 'git@github.com:repo.git',
  //     path : '/var/www/production',
  //     'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env production'
  //   }
  // }
};
