import { OpenWrtClient } from '~/tools/server/sdk/openwrt/openwrt';
import { getConfig } from '~/tools/config/getConfig';
import { checkIntegrationsType, findAppProperty } from '~/tools/client/app-properties';

export class OpenWrtSingleton {
  private static _instances: Record<string, OpenWrtClient> = {};

  public static getOrSet(configName: string, appId: string): OpenWrtClient {
    const key = `${configName}-${appId}`;
    let client = this._instances[key];

    if (client) {
      return client;
    }

    const config = getConfig(configName);

    const app = config.apps.find((x) => x.id === appId);

    if (!app || !checkIntegrationsType(app.integration, ['openwrt'])) {
      throw new Error(`Openwrt App with ID "${appId}" could not be found.`);
    }

    client = new OpenWrtClient(
      app.url,
      findAppProperty(app, 'username'),
      findAppProperty(app, 'password')
    );

    this._instances[key] = client;

    return client;
  }

  public static clear(configName: string) {
    Object.keys(this._instances).forEach((key) => {
      if (key.startsWith(configName)) {
        delete this._instances[key];
      }
    });
  }
}
