cd ./lib/user/"$1"
ts-node -P ./tsconfig.json -O '{"module": "commonjs", "experimentalDecorators": true}' -r tsconfig-paths/register ../../node_modules/typeorm/cli.js --config ormconfig.cli.js migration:generate -n "$2"