cd ./libs/user/"$1"
ts-node -P ./tsconfig.json -O '{"module": "commonjs", "experimentalDecorators": true}' -r tsconfig-paths/register ../../../node_modules/typeorm/cli.js --config ../../../ormconfig.json migration:generate -n "$2"