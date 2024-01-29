import { GraphQLFederationDefinitionsFactory } from '@nestjs/graphql';
const readdirp = require('readdirp');

const OUTPUT_FILE_NAME = 'types.generated.ts';
const BASE_FOLDER = 'apps/api-hub/src/';
const FILE_EXTENSION = '*.graphql';

// Print out all JS files within the given folder & subfolders.
readdirp(BASE_FOLDER, { fileFilter: FILE_EXTENSION, alwaysStat: false })
  .on('data', (entry) => {
    const { fullPath, basename } = entry;
    console.log(`Generating typings for schema file: ${fullPath}`);
    generateTypings(fullPath, basename);
  })
  .on('warn', (error) => console.error('non-fatal error', error))
  .on('error', (error) => console.error('fatal error', error));

const definitionsFactory = new GraphQLFederationDefinitionsFactory();
const generateTypings = (path: string, filename: string) => {
  definitionsFactory.generate({
    typePaths: [path],
    path: path.replace(filename, OUTPUT_FILE_NAME),
    outputAs: 'class',
  });
};
