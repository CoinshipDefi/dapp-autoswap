// Generic Agoric Dapp contract deployment script
// NOTE: YOUR CONTRACT-SPECIFIC INITIALIZATION is in install-*.js
import fs from 'fs';

// This javascript source file uses the "tildot" syntax (foo~.bar()) for
// eventual sends. Tildot is standards track with TC39, the JavaScript standards
// committee.
// TODO: improve this comment. https://github.com/Agoric/agoric-sdk/issues/608

const DAPP_NAME = "autoswap";

export default async function deployContract(homeP, { bundleSource, pathResolve },
  CONTRACT_NAME = DAPP_NAME) {

  const [
    { source, moduleFormat },
    contractBundle,
  ] = await Promise.all([
    bundleSource(pathResolve(`./install-${CONTRACT_NAME}.js`)),
    bundleSource(pathResolve(`./${CONTRACT_NAME}.js`)),
  ]);

  const wallet = homeP~.wallet;
  const zoe = homeP~.zoe;
  const registrar = homeP~.registrar;

  const installerInstall = homeP~.spawner~.install(source, moduleFormat);
  const installer = installerInstall~.spawn({ wallet, zoe, registrar });

  const { instanceId } = await installer~.initInstance(CONTRACT_NAME, contractBundle);

  console.log('- instance made', CONTRACT_NAME, '=>', instanceId);

  // Save the instanceId somewhere where the UI can find it.
  const dappConstants = {
    BRIDGE_URL: 'agoric-lookup:https://local.agoric.com?append=/bridge',
    API_URL: '/',
    CONTRACT_ID: instanceId,
  };
  const dc = 'dappConstants.js';
  console.log('writing', dc);
  await fs.promises.writeFile(dc, `globalThis.__DAPP_CONSTANTS__ = ${JSON.stringify(dappConstants, undefined, 2)}`);

  // Now add URLs so that development functions without internet access.
  dappConstants.BRIDGE_URL = "http://127.0.0.1:8000";
  dappConstants.API_URL = "http://127.0.0.1:8000";
  const envFile = pathResolve(`../ui/.env.local`);
  console.log('writing', envFile);
  const envContents = `\
REACT_APP_DAPP_CONSTANTS_JSON='${JSON.stringify(dappConstants)}'
`;
  await fs.promises.writeFile(envFile, envContents);
}
