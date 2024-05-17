import { CatalogClient } from '@backstage/catalog-client';
import { Router } from 'express';
import type { PluginEnvironment } from '../types';
import { ScmIntegrations } from '@backstage/integration';
import { createBuiltinActions, createRouter } from '@backstage/plugin-scaffolder-backend';
import { createQuarkusApp, cloneQuarkusQuickstart } from '@qshift/plugin-quarkus-backend';

function extractVersionFromKey(
    streamKey: string,
): string {
  if (!streamKey) {
    throw new Error(`StreamKey to be processed cannot be empty`);
  }

  const streamKeyArr = streamKey.split(":")
  if (streamKeyArr.length < 2) {
    throw new Error(`The streamKey is not formatted as: io.quarkus.platform:\<version\>`);
  } else {
    return streamKeyArr[1]
  }
}

export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {
  const catalogClient = new CatalogClient({
    discoveryApi: env.discovery,
  });
  const integrations = ScmIntegrations.fromConfig(env.config);

  const builtInActions = createBuiltinActions({
    integrations,
    catalogClient,
    config: env.config,
    reader: env.reader,
  });

  const actions = [
    ...builtInActions,
    createQuarkusApp(),
    cloneQuarkusQuickstart()
  ];

  return await createRouter({
    actions,
    logger: env.logger,
    config: env.config,
    database: env.database,
    reader: env.reader,
    catalogClient,
    identity: env.identity,
    permissions: env.permissions,
    additionalTemplateFilters: {
      extractKey: (streamKey) => extractVersionFromKey(streamKey as string)
    }
  });
}
